'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { FileText, Download, Loader2, Eye, EyeOff, Trash2, FileIcon } from 'lucide-react';
import { toast } from 'sonner';
import {
  getClassDocumentsForTeacher,
  updateDocumentVisibility,
  unshareDocument,
  type TeacherClassDocument,
} from '@/lib/services/api-class-documents.service';
import { ApiDocumentService } from '@/lib/services/api-document.service';

interface TeacherClassDocumentsProps {
  classId: string;
}

// Helper component for remove document confirmation
function RemoveDialog({
  id,
  title,
  onRemove,
  disabled,
}: {
  id: string;
  title: string;
  onRemove: () => Promise<void>;
  disabled: boolean;
}) {
  const { t } = useTranslation('classes');
  const [open, setOpen] = useState(false);

  const handleConfirm = () => {
    setOpen(false);
    onRemove();
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={disabled}
          onClick={() => setOpen(true)}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('classDetails.removeDocumentConfirm', { title })}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('classDetails.removeDocumentConfirmDescription')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common:cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {t('common:actions.remove')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
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

export function TeacherClassDocuments({ classId }: TeacherClassDocumentsProps) {
  const { t } = useTranslation('classes');
  const [documents, setDocuments] = useState<TeacherClassDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
  const [updatingVisibility, setUpdatingVisibility] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [documentService] = useState(() => new ApiDocumentService());

  useEffect(() => {
    loadDocuments();
  }, [classId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const result = await getClassDocumentsForTeacher(classId);
      setDocuments(result.documents);
    } catch (error) {
      console.error('Failed to load class documents:', error);
      toast.error(t('classDetails.errors.loadDocumentsFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (doc: TeacherClassDocument) => {
    setDownloadingIds((prev) => new Set(prev).add(doc.documentId));
    try {
      await documentService.downloadDocumentAsFile(doc.documentId, doc.filename);
      toast.success(t('classDetails.downloadSuccess'));
    } catch (error) {
      console.error('Failed to download document:', error);
      toast.error(t('classDetails.downloadFailed'));
    } finally {
      setDownloadingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(doc.documentId);
        return newSet;
      });
    }
  };

  const handleToggleVisibility = async (doc: TeacherClassDocument) => {
    setUpdatingVisibility(doc.id);
    try {
      const newVisibility = !doc.isVisible;
      await updateDocumentVisibility(doc.documentId, classId, newVisibility);

      setDocuments((prev) =>
        prev.map((d) =>
          d.id === doc.id
            ? {
                ...d,
                isVisible: newVisibility,
                publishedAt: newVisibility ? new Date().toISOString() : null,
              }
            : d
        )
      );

      toast.success(
        newVisibility
          ? t('classDetails.visibility.published')
          : t('classDetails.visibility.unpublished')
      );
    } catch (error) {
      console.error('Failed to update visibility:', error);
      toast.error(t('classDetails.errors.visibilityFailed'));
    } finally {
      setUpdatingVisibility(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    if (mb < 1) {
      return `${(bytes / 1024).toFixed(0)} KB`;
    }
    return `${mb.toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(dateStr));
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
                {/* Skeleton for remove button */}
                <div className="h-8 w-8 bg-muted rounded animate-pulse" />
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
        <p className="text-sm">{t('classDetails.noDocuments')}</p>
        <p className="text-xs mt-1">{t('classDetails.noDocumentsHint')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((doc) => {
        const publishedDate = formatDate(doc.publishedAt);
        const isUpdating = updatingVisibility === doc.id;
        const isDownloading = downloadingIds.has(doc.documentId);

        return (
          <Card key={doc.id} className="transition-shadow hover:shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <DocumentTypeIcon mimeType={doc.mimeType} />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="truncate font-medium text-sm">{doc.title}</h4>
                    {doc.isVisible ? (
                      <Badge
                        variant="outline"
                        className="text-xs bg-green-50 text-green-700 border-green-200"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        {t('classDetails.visibility.published')}
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-xs bg-amber-50 text-amber-700 border-amber-200"
                      >
                        <EyeOff className="h-3 w-3 mr-1" />
                        {t('classDetails.visibility.draft')}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
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

                <div className="flex items-center gap-2">
                  {/* Visibility Toggle */}
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={doc.isVisible}
                      onCheckedChange={() => handleToggleVisibility(doc)}
                      disabled={isUpdating}
                    />
                  </div>

                  {/* Download Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDownload(doc)}
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </Button>

                  {/* Remove Dialog */}
                  <RemoveDialog
                    id={doc.id}
                    title={doc.title}
                    onRemove={async () => {
                      setRemovingId(doc.id);
                      try {
                        await unshareDocument(doc.documentId, classId);
                        setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
                        toast.success(t('classDetails.documentRemoved'));
                      } catch (error) {
                        console.error('Failed to remove document:', error);
                        toast.error(t('classDetails.errors.removeDocumentFailed'));
                      } finally {
                        setRemovingId(null);
                      }
                    }}
                    disabled={removingId === doc.id || updatingVisibility === doc.id}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
