'use client';

import { useState, useEffect } from 'react';
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
import { Loader2, Share2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { listClasses, type Class } from '@/features/classes/services/classes-api';
import { shareDocument } from '@/lib/services/api-class-documents.service';

interface ShareDocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  documentTitle: string;
  alreadySharedWith?: string[]; // Class IDs already shared with
  onSuccess?: () => void;
}

export function ShareDocumentModal({
  open,
  onOpenChange,
  documentId,
  documentTitle,
  alreadySharedWith = [],
  onSuccess,
}: ShareDocumentModalProps) {
  const { t } = useTranslation('documents');
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<Set<string>>(new Set());
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);

  // Load teacher's classes
  useEffect(() => {
    if (open) {
      loadClasses();
    }
  }, [open]);

  const loadClasses = async () => {
    setLoading(true);
    try {
      const result = await listClasses(1, 100);
      setClasses(result.classes);
      // Initialize with already shared classes
      setSelectedClasses(new Set(alreadySharedWith));
    } catch (error) {
      console.error('Failed to load classes:', error);
      toast.error(t('share.errors.loadClassesFailed'));
    } finally {
      setLoading(false);
    }
  };

  const toggleClass = (classId: string) => {
    setSelectedClasses((prev) => {
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
    if (selectedClasses.size === 0) {
      toast.error(t('share.errors.noClassesSelected'));
      return;
    }

    setSharing(true);
    try {
      const result = await shareDocument(documentId, {
        classIds: Array.from(selectedClasses),
        isVisible,
      });

      const sharedCount = result.sharedWith.length;
      toast.success(t('share.success', { count: sharedCount }));

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to share document:', error);
      toast.error(t('share.errors.shareFailed'));
    } finally {
      setSharing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            {t('share.title')}
          </DialogTitle>
          <DialogDescription>{t('share.description', { title: documentTitle })}</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : classes.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <Users className="mx-auto mb-2 h-8 w-8 opacity-50" />
            <p>{t('share.noClasses')}</p>
          </div>
        ) : (
          <>
            <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3">
              {classes.map((cls) => {
                const isAlreadyShared = alreadySharedWith.includes(cls.id);
                const isSelected = selectedClasses.has(cls.id);

                return (
                  <div
                    key={cls.id}
                    className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
                      isAlreadyShared
                        ? 'border-muted bg-muted/50 cursor-not-allowed opacity-60'
                        : isSelected
                          ? 'border-primary bg-primary/5 cursor-pointer'
                          : 'hover:border-muted-foreground/25 cursor-pointer'
                    }`}
                    onClick={() => !isAlreadyShared && toggleClass(cls.id)}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={isAlreadyShared}
                      onChange={() => !isAlreadyShared && toggleClass(cls.id)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{cls.name}</span>
                        {isAlreadyShared && (
                          <Badge variant="secondary" className="text-xs">
                            {t('share.alreadyShared')}
                          </Badge>
                        )}
                      </div>
                      {cls.description && (
                        <p className="text-sm text-muted-foreground truncate">{cls.description}</p>
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

            <div className="flex items-center space-x-2 pt-4 border-t mt-4">
              <input
                type="checkbox"
                id="visible"
                checked={isVisible}
                onChange={(e) => setIsVisible(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <label
                htmlFor="visible"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {t('share.makeVisible')}
              </label>
            </div>
            <p className="text-xs text-muted-foreground">{t('share.visibleHint')}</p>
          </>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('share.cancel')}
          </Button>
          <Button
            onClick={handleShare}
            disabled={sharing || selectedClasses.size === 0 || classes.length === 0}
          >
            {sharing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('share.shareButton', { count: selectedClasses.size })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
