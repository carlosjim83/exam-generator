'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  FileText,
  Search,
  Trash2,
  Download,
  MoreVertical,
  RefreshCw,
  Share2,
  Loader2,
} from 'lucide-react';
import { documentService } from '@/lib/services/api-document.service';
import {
  getDocumentShares,
  type DocumentSharedWith,
} from '@/lib/services/api-class-documents.service';
import type { Document } from '@/lib/types/dashboard.types';
import { Skeleton } from '@/components/ui/skeleton';
import { DocumentIcon } from '@/components/ui-custom/DocumentIcon';
import { DocumentStatusBadge } from '@/components/ui-custom/DocumentStatusBadge';
import { DeleteDocumentDialog } from './DeleteDocumentDialog';
import { ShareDocumentModal } from './ShareDocumentModal';

export function DocumentLibrary() {
  const { t, i18n } = useTranslation();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<{ id: string; title: string } | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  // Download loading state
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());

  // Share modal state
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [documentToShare, setDocumentToShare] = useState<{ id: string; title: string } | null>(
    null
  );
  const [documentShares, setDocumentShares] = useState<Map<string, DocumentSharedWith[]>>(
    new Map()
  );

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const docs = await documentService.listDocuments();
      setDocuments(docs);
      // Load shares for completed documents
      loadDocumentShares(docs);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDocumentShares = async (docs: Document[]) => {
    // Only load shares for completed documents
    const completedDocs = docs.filter((doc) => doc.status === 'COMPLETED');
    const sharesMap = new Map<string, DocumentSharedWith[]>();

    await Promise.all(
      completedDocs.map(async (doc) => {
        try {
          const result = await getDocumentShares(doc.id);
          if (result) {
            sharesMap.set(doc.id, result.sharedWith);
          }
        } catch {
          // Ignore errors - shares just won't be loaded
        }
      })
    );

    setDocumentShares(sharesMap);
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Auto-refresh if there are processing documents
  useEffect(() => {
    const hasProcessing = documents.some(
      (doc) => doc.status === 'PROCESSING' || doc.status === 'PENDING'
    );

    if (!hasProcessing) return;

    const interval = setInterval(fetchDocuments, 5000);
    return () => clearInterval(interval);
  }, [documents]);

  const handleRetry = async (documentId: string) => {
    try {
      await documentService.reprocessDocument(documentId);
      fetchDocuments();
    } catch (error) {
      console.error('Failed to retry document:', error);
    }
  };

  const handleDelete = async (documentId: string, title: string) => {
    setDocumentToDelete({ id: documentId, title });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!documentToDelete) return;

    setIsDeleting(true);
    try {
      await documentService.deleteDocument(documentToDelete.id);
      toast.success(t('documents:deleteSuccess'));
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
      fetchDocuments();
    } catch (error) {
      console.error('Failed to delete document:', error);
      toast.error(t('documents:deleteFailed'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownload = async (documentId: string, filename: string) => {
    setDownloadingIds((prev) => new Set(prev).add(documentId));
    try {
      await documentService.downloadDocumentAsFile(documentId, filename);
      toast.success(t('documents:downloadSuccess'));
    } catch (error) {
      console.error('Failed to download document:', error);
      toast.error(t('documents:downloadFailed'));
    } finally {
      setDownloadingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(documentId);
        return newSet;
      });
    }
  };

  const handleShare = async (documentId: string, title: string) => {
    setDocumentToShare({ id: documentId, title });
    setShareModalOpen(true);
  };

  const handleShareSuccess = async () => {
    // Refresh documents to update share counts
    await fetchDocuments();
  };

  const filteredDocuments = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={`doc-skeleton-${i}`}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-64" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-9 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t('documents:searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="sm" onClick={fetchDocuments}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {t('documents:refresh')}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{documents.length}</div>
              <div className="text-sm text-muted-foreground">{t('documents:totalDocuments')}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {documents.filter((d) => d.status === 'COMPLETED').length}
              </div>
              <div className="text-sm text-muted-foreground">{t('documents:ready')}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {documents.filter((d) => d.status === 'PROCESSING').length}
              </div>
              <div className="text-sm text-muted-foreground">{t('documents:processing')}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {documents.filter((d) => d.status === 'FAILED').length}
              </div>
              <div className="text-sm text-muted-foreground">{t('documents:failed')}</div>
            </CardContent>
          </Card>
        </div>

        {/* Documents List */}
        {filteredDocuments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">{t('documents:noDocumentsFound')}</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? t('documents:adjustSearch') : t('documents:noDocumentsDescription')}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredDocuments.map((doc) => {
              const fileSize = (doc.fileSize / (1024 * 1024)).toFixed(1) + ' MB';
              const uploadDate = new Intl.DateTimeFormat(i18n.language, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              }).format(new Date(doc.uploadedAt));

              const timeSinceUpload = Date.now() - new Date(doc.uploadedAt).getTime();
              const minutesSinceUpload = Math.floor(timeSinceUpload / 60000);

              return (
                <Card key={doc.id} className="transition-shadow hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <DocumentIcon mimeType={doc.mimeType} size="lg" />

                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <h3 className="truncate text-base font-semibold">{doc.title}</h3>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-md">{doc.title}</p>
                            </TooltipContent>
                          </Tooltip>
                          <DocumentStatusBadge status={doc.status} />
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{fileSize}</span>
                          <span>•</span>
                          <span>
                            {t('documents:uploadedAt')} {uploadDate}
                          </span>
                          {doc.status === 'PROCESSING' && minutesSinceUpload > 0 && (
                            <>
                              <span>•</span>
                              <span>
                                {t('documents:processingFor', { minutes: minutesSinceUpload })}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {(doc.status === 'FAILED' ||
                          (doc.status === 'PROCESSING' && minutesSinceUpload > 5)) && (
                          <Button variant="outline" size="sm" onClick={() => handleRetry(doc.id)}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            {t('documents:retry')}
                          </Button>
                        )}
                        {doc.status === 'COMPLETED' && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleShare(doc.id, doc.title)}
                              >
                                <Share2 className="mr-2 h-4 w-4" />
                                {documentShares.get(doc.id)?.length ? (
                                  <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                                    {documentShares.get(doc.id)?.length}
                                  </Badge>
                                ) : null}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{t('documents:share.title')}</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDownload(doc.id, doc.filename)}
                              disabled={downloadingIds.has(doc.id)}
                            >
                              {downloadingIds.has(doc.id) ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Download className="h-4 w-4" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent suppressHydrationWarning>
                            <p>
                              {downloadingIds.has(doc.id)
                                ? t('documents:downloading')
                                : t('documents:download')}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(doc.id, doc.title)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent suppressHydrationWarning>
                            <p>{t('documents:delete')}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <DeleteDocumentDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={confirmDelete}
          documentTitle={documentToDelete?.title || ''}
          isDeleting={isDeleting}
        />

        {/* Share Document Modal */}
        {documentToShare && (
          <ShareDocumentModal
            open={shareModalOpen}
            onOpenChange={setShareModalOpen}
            documentId={documentToShare.id}
            documentTitle={documentToShare.title}
            onSuccess={handleShareSuccess}
          />
        )}
      </div>
    </TooltipProvider>
  );
}
