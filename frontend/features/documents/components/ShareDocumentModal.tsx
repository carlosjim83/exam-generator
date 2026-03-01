'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
} from '@/components/ui/alert-dialog';
import { Loader2, Share2, Users, Eye, EyeOff, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { listClasses, type Class } from '@/features/classes/services/classes-api';
import {
  shareDocument,
  unshareDocument,
  getDocumentShares,
  updateDocumentVisibility,
  type DocumentSharedWith,
} from '@/lib/services/api-class-documents.service';

interface ShareDocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  documentTitle: string;
  onSuccess?: () => void;
}

interface SharedClassInfo {
  classId: string;
  className: string;
  classCode: string;
  studentCount: number;
  isVisible: boolean;
  publishedAt: string | null;
}

export function ShareDocumentModal({
  open,
  onOpenChange,
  documentId,
  documentTitle,
  onSuccess,
}: ShareDocumentModalProps) {
  const { t } = useTranslation('documents');

  // State
  const [allClasses, setAllClasses] = useState<Class[]>([]);
  const [sharedClasses, setSharedClasses] = useState<SharedClassInfo[]>([]);
  const [selectedNewClasses, setSelectedNewClasses] = useState<Set<string>>(new Set());
  const [makeVisibleForNew, setMakeVisibleForNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);

  // Unshare dialog state
  const [unshareDialog, setUnshareDialog] = useState<{
    open: boolean;
    classInfo: SharedClassInfo | null;
  }>({ open: false, classInfo: null });
  const [removing, setRemoving] = useState(false);

  // Visibility update state
  const [updatingVisibility, setUpdatingVisibility] = useState<string | null>(null);

  // Load data when modal opens
  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, documentId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch both teacher's classes and document shares in parallel
      const [classesResult, sharesResult] = await Promise.all([
        listClasses(1, 100),
        getDocumentShares(documentId),
      ]);

      setAllClasses(classesResult.classes);

      // Build shared classes info
      if (sharesResult) {
        const shared: SharedClassInfo[] = sharesResult.sharedWith.map((share) => {
          // Find class details from allClasses
          const classDetails = classesResult.classes.find((c) => c.id === share.classId);
          return {
            classId: share.classId,
            className: share.className,
            classCode: classDetails?.code || 'N/A',
            studentCount: classDetails?.studentCount || 0,
            isVisible: share.isVisible,
            publishedAt: share.publishedAt,
          };
        });
        setSharedClasses(shared);
      } else {
        setSharedClasses([]);
      }

      // Reset selection for new classes
      setSelectedNewClasses(new Set());
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error(t('share.errors.loadSharesFailed'));
    } finally {
      setLoading(false);
    }
  };

  const toggleNewClass = (classId: string) => {
    setSelectedNewClasses((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(classId)) {
        newSelected.delete(classId);
      } else {
        newSelected.add(classId);
      }
      return newSelected;
    });
  };

  const handleShare = async () => {
    if (selectedNewClasses.size === 0) {
      toast.error(t('share.errors.noClassesSelected'));
      return;
    }

    setSharing(true);
    try {
      const result = await shareDocument(documentId, {
        classIds: Array.from(selectedNewClasses),
        isVisible: makeVisibleForNew,
      });

      const sharedCount = result.sharedWith.length;
      toast.success(t('share.success', { count: sharedCount }));

      // Refresh data to show updated shares
      await loadData();

      // Call onSuccess callback
      onSuccess?.();
    } catch (error) {
      console.error('Failed to share document:', error);
      toast.error(t('share.errors.shareFailed'));
    } finally {
      setSharing(false);
    }
  };

  const handleToggleVisibility = async (classInfo: SharedClassInfo) => {
    setUpdatingVisibility(classInfo.classId);
    try {
      const newVisibility = !classInfo.isVisible;
      await updateDocumentVisibility(documentId, classInfo.classId, newVisibility);

      // Update local state only - no need to refetch everything for a simple visibility toggle
      setSharedClasses((prev) =>
        prev.map((sc) =>
          sc.classId === classInfo.classId
            ? {
                ...sc,
                isVisible: newVisibility,
                publishedAt: newVisibility ? new Date().toISOString() : null,
              }
            : sc
        )
      );

      toast.success(t('share.visibilitySuccess'));
      // Don't call onSuccess here - visibility change doesn't affect the document list
    } catch (error) {
      console.error('Failed to update visibility:', error);
      toast.error(t('share.errors.visibilityFailed'));
    } finally {
      setUpdatingVisibility(null);
    }
  };

  const handleRemoveClick = (classInfo: SharedClassInfo) => {
    setUnshareDialog({ open: true, classInfo });
  };

  const handleUnshareConfirm = async () => {
    if (!unshareDialog.classInfo) return;

    setRemoving(true);
    try {
      await unshareDocument(documentId, unshareDialog.classInfo.classId);

      // Remove from local state
      setSharedClasses((prev) =>
        prev.filter((sc) => sc.classId !== unshareDialog.classInfo!.classId)
      );

      toast.success(t('share.removeSuccess'));
      onSuccess?.();

      // Close dialog
      setUnshareDialog({ open: false, classInfo: null });
    } catch (error) {
      console.error('Failed to unshare document:', error);
      toast.error(t('share.errors.removeFailed'));
    } finally {
      setRemoving(false);
    }
  };

  // Get classes that are not yet shared
  const availableClasses = allClasses.filter(
    (cls) => !sharedClasses.some((sc) => sc.classId === cls.id)
  );

  // Format date
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              {t('share.title')}
            </DialogTitle>
            <DialogDescription>
              {t('share.description', { title: documentTitle })}
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto pr-2 space-y-6">
              {/* Shared Classes Section */}
              {sharedClasses.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    {t('share.sections.sharedClasses')}
                    <Badge variant="secondary">{sharedClasses.length}</Badge>
                  </h3>
                  <div className="space-y-2">
                    {sharedClasses.map((classInfo) => (
                      <div
                        key={classInfo.classId}
                        className="flex items-center justify-between rounded-lg border p-3 bg-muted/30"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{classInfo.className}</span>
                            <Badge variant="outline" className="text-xs">
                              {classInfo.classCode}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span>
                              {classInfo.studentCount} {t('share.students')}
                            </span>
                            {classInfo.isVisible ? (
                              <span className="flex items-center gap-1 text-green-600">
                                <Eye className="h-3 w-3" />
                                {t('share.status.published')}
                                {classInfo.publishedAt && (
                                  <span>- {formatDate(classInfo.publishedAt)}</span>
                                )}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-amber-600">
                                <EyeOff className="h-3 w-3" />
                                {t('share.status.draft')}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Visibility Toggle */}
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={classInfo.isVisible}
                              onCheckedChange={() => handleToggleVisibility(classInfo)}
                              disabled={updatingVisibility === classInfo.classId}
                            />
                            <span className="text-xs text-muted-foreground w-16">
                              {classInfo.isVisible
                                ? t('share.status.published')
                                : t('share.status.draft')}
                            </span>
                          </div>

                          {/* Remove Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveClick(classInfo)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Available Classes Section */}
              {availableClasses.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">
                    {t('share.sections.newClassesHint')}
                  </h3>
                  <div className="max-h-[200px] overflow-y-auto space-y-2">
                    {availableClasses.map((cls) => {
                      const isSelected = selectedNewClasses.has(cls.id);

                      return (
                        <div
                          key={cls.id}
                          className={`flex items-start gap-3 rounded-lg border p-3 transition-colors cursor-pointer ${
                            isSelected
                              ? 'border-primary bg-primary/5'
                              : 'hover:border-muted-foreground/25'
                          }`}
                          onClick={() => toggleNewClass(cls.id)}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleNewClass(cls.id)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <span className="font-medium truncate">{cls.name}</span>
                            {cls.description && (
                              <p className="text-sm text-muted-foreground truncate">
                                {cls.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <Badge variant="outline" className="text-xs">
                                {cls.code}
                              </Badge>
                              <span>
                                {cls.studentCount} {t('share.students')}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Visibility option for new classes */}
                  <div className="flex items-center space-x-2 pt-4 mt-4 border-t">
                    <input
                      type="checkbox"
                      id="visible-new"
                      checked={makeVisibleForNew}
                      onChange={(e) => setMakeVisibleForNew(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <label
                      htmlFor="visible-new"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {t('share.makeVisible')}
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground ml-6">{t('share.visibleHint')}</p>
                </div>
              )}

              {/* Empty States */}
              {sharedClasses.length === 0 && availableClasses.length === 0 && (
                <div className="py-8 text-center text-muted-foreground">
                  <Users className="mx-auto mb-2 h-8 w-8 opacity-50" />
                  <p>{t('share.noClasses')}</p>
                </div>
              )}

              {sharedClasses.length === 0 && availableClasses.length > 0 && (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  {t('share.sections.noSharedClasses')}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 border-t pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t('share.cancel')}
            </Button>
            <Button
              onClick={handleShare}
              disabled={sharing || selectedNewClasses.size === 0 || availableClasses.length === 0}
            >
              {sharing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('share.shareButton', { count: selectedNewClasses.size })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unshare Confirmation Dialog */}
      <AlertDialog
        open={unshareDialog.open}
        onOpenChange={(open) =>
          setUnshareDialog({ open, classInfo: open ? unshareDialog.classInfo : null })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('share.actions.removeConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('share.actions.removeConfirmDescription', {
                title: documentTitle,
                className: unshareDialog.classInfo?.className || '',
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogDescription className="text-sm text-muted-foreground">
            {t('share.actions.removeConfirmWarning')}
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('share.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnshareConfirm}
              disabled={removing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('share.actions.removing')}
                </>
              ) : (
                t('share.actions.removeButton')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
