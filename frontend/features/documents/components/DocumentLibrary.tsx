'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { ApiDocumentService } from '@/lib/services/api-document.service';
import type { Document } from '@/lib/types/dashboard.types';
import { Skeleton } from '@/components/ui/skeleton';

function DocumentIcon({ mimeType }: { mimeType: string }) {
  if (mimeType === 'application/pdf') {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100">
        <svg className="h-6 w-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
      <FileText className="h-6 w-6 text-blue-600" />
    </div>
  );
}

function DocumentStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();

  switch (status) {
    case 'COMPLETED':
      return (
        <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          {t('documents:ready')}
        </Badge>
      );
    case 'PROCESSING':
      return (
        <Badge variant="default" className="bg-blue-100 text-blue-700 hover:bg-blue-100">
          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          {t('documents:processing')}
        </Badge>
      );
    case 'PENDING':
      return (
        <Badge variant="default" className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
          <Clock className="mr-1 h-3 w-3" />
          {t('documents:pending')}
        </Badge>
      );
    case 'FAILED':
      return (
        <Badge variant="destructive">
          <XCircle className="mr-1 h-3 w-3" />
          {t('documents:failed')}
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function DocumentLibrary() {
  const { t } = useTranslation();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [documentService] = useState(() => new ApiDocumentService());

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const docs = await documentService.listDocuments();
      setDocuments(docs);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
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

  const filteredDocuments = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i}>
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
    <div className="space-y-6">
      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
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
            <FileText className="mb-4 h-12 w-12 text-gray-400" />
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
            const uploadDate = new Intl.DateTimeFormat('en-US', {
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
                    <DocumentIcon mimeType={doc.mimeType} />

                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <h3 className="truncate text-base font-semibold">{doc.title}</h3>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-md">{doc.title}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
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
                      <Button variant="ghost" size="icon">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
