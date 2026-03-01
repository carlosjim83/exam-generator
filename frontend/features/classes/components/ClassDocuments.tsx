'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Loader2, FileIcon } from 'lucide-react';
import { toast } from 'sonner';
import { getClassDocuments, type SharedDocument } from '@/lib/services/api-class-documents.service';
import { ApiDocumentService } from '@/lib/services/api-document.service';

interface ClassDocumentsProps {
  classId: string;
}

function DocumentTypeIcon({ mimeType }: { mimeType: string }) {
  if (mimeType === 'application/pdf') {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
        <FileText className="h-5 w-5 text-red-600" />
      </div>
    );
  }
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
      <FileIcon className="h-5 w-5 text-blue-600" />
    </div>
  );
}

export function ClassDocuments({ classId }: ClassDocumentsProps) {
  const { t } = useTranslation('student');
  const [documents, setDocuments] = useState<SharedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
  const [documentService] = useState(() => new ApiDocumentService());

  useEffect(() => {
    loadDocuments();
  }, [classId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const result = await getClassDocuments(classId);
      setDocuments(result.documents);
    } catch (error) {
      console.error('Failed to load class documents:', error);
      toast.error(t('classDetails.errors.loadDocumentsFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (documentId: string, filename: string) => {
    setDownloadingIds((prev) => new Set(prev).add(documentId));
    try {
      await documentService.downloadDocumentAsFile(documentId, filename);
      toast.success(t('classDetails.downloadSuccess'));
    } catch (error) {
      console.error('Failed to download document:', error);
      toast.error(t('classDetails.downloadFailed'));
    } finally {
      setDownloadingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(documentId);
        return newSet;
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    if (mb < 1) {
      return `${(bytes / 1024).toFixed(0)} KB`;
    }
    return `${mb.toFixed(1)} MB`;
  };

  const formatDate = (date: string | null) => {
    if (!date) return null;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(date));
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-muted rounded-lg animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="mx-auto mb-2 h-8 w-8 opacity-50" />
        <p className="text-sm">{t('classDetails.noMaterials')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((doc) => {
        const publishedDate = formatDate(doc.publishedAt);

        return (
          <Card key={doc.id} className="transition-shadow hover:shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <DocumentTypeIcon mimeType={doc.mimeType} />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="truncate font-medium text-sm">{doc.title}</h4>
                    {doc.isVisible && publishedDate && (
                      <Badge variant="outline" className="text-xs">
                        {t('classDetails.published')}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatFileSize(doc.fileSize)}</span>
                    {publishedDate && (
                      <>
                        <span>•</span>
                        <span>
                          {t('classDetails.publishedOn')} {publishedDate}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDownload(doc.documentId, doc.filename)}
                  disabled={downloadingIds.has(doc.documentId)}
                >
                  {downloadingIds.has(doc.documentId) ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
