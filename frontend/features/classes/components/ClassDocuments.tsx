'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getClassDocuments, type SharedDocument } from '@/lib/services/api-class-documents.service';
import { documentService } from '@/lib/services/api-document.service';
import { DocumentIcon } from '@/components/ui-custom/DocumentIcon';

interface ClassDocumentsProps {
  classId: string;
}

export function ClassDocuments({ classId }: ClassDocumentsProps) {
  const { t, i18n } = useTranslation('student');
  const [documents, setDocuments] = useState<SharedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
  // Uses singleton documentService

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
    return new Intl.DateTimeFormat(i18n.language, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(date));
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={`class-doc-skeleton-${i}`}>
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
                <DocumentIcon mimeType={doc.mimeType} icon="fileIcon" />

                <div className="min-w-0 flex-1">
                  <h4 className="truncate font-medium text-sm">{doc.title}</h4>
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
