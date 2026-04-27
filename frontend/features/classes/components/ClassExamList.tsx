'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { FileQuestion, Eye, Trash2, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import {
  getClassExams,
  publishClassExam,
  deleteClassExam,
  type ClassExam,
} from '@/lib/services/api-class-exams.service';

interface ClassExamListProps {
  classId: string;
  onViewResults?: (classExamId: string) => void;
}

export function ClassExamList({ classId, onViewResults }: ClassExamListProps) {
  const { t } = useTranslation('classes');
  const [exams, setExams] = useState<ClassExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadExams();
  }, [classId]);

  const loadExams = async () => {
    try {
      setLoading(true);
      const result = await getClassExams(classId);
      setExams(result.exams || []);
    } catch (error) {
      console.error('Failed to load class exams:', error);
      toast.error(t('classExams.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(dateStr));
  };

  const formatTimeLimit = (minutes: number | null) => {
    if (!minutes) return t('classExams.unlimited');
    return t('classExams.timeLimit', { minutes });
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={`class-exam-skeleton-${i}`}>
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

  if (exams.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileQuestion className="mx-auto mb-2 h-8 w-8 opacity-50" />
        <p className="text-sm">{t('classExams.noExams')}</p>
        <p className="text-xs mt-1">{t('classExams.noExamsHint')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {exams.map((exam) => {
        const isPublishing = publishingId === exam.id;
        const isDeleting = deletingId === exam.id;
        const dueDate = formatDate(exam.dueDate);

        return (
          <Card key={exam.id} className="transition-shadow hover:shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-100">
                  <FileQuestion className="h-5 w-5 text-purple-600" />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="truncate font-medium text-sm">{exam.examTitle}</h4>
                    {exam.isPublished ? (
                      <Badge
                        variant="outline"
                        className="text-xs bg-green-50 text-green-700 border-green-200"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        {t('classExams.status.published')}
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-xs bg-amber-50 text-amber-700 border-amber-200"
                      >
                        {t('classExams.status.draft')}
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                    <span>
                      {exam.questionCount}{' '}
                      {t('classExams.questions', { count: exam.questionCount })}
                    </span>
                    <span>{formatTimeLimit(exam.timeLimit)}</span>
                    {dueDate && (
                      <span>
                        {t('classExams.dueDate')}: {dueDate}
                      </span>
                    )}
                  </div>

                  {/* Stats for published exams */}
                  {exam.isPublished && (
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                      <span>
                        {exam.startedCount ?? 0}/{exam.assignedCount}{' '}
                        {t('classExams.stats.started')}
                      </span>
                      <span>
                        {exam.submittedCount ?? 0}/{exam.assignedCount}{' '}
                        {t('classExams.stats.submitted')}
                      </span>
                      {(exam.gradedCount ?? 0) > 0 && (
                        <span>
                          {exam.gradedCount} {t('classExams.stats.graded')}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {/* View Results - only for published exams with submissions */}
                  {exam.isPublished &&
                    ((exam.submittedCount ?? 0) > 0 || (exam.gradedCount ?? 0) > 0) &&
                    onViewResults && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewResults(exam.id)}
                        className="text-purple-600 hover:text-purple-700"
                      >
                        <BarChart3 className="h-4 w-4 mr-1" />
                        {t('classExams.actions.viewResults')}
                      </Button>
                    )}

                  {/* Publish/Unpublish */}
                  <PublishDialog
                    exam={exam}
                    onPublishingChange={(publishing) => {
                      if (publishing) setPublishingId(exam.id);
                    }}
                    onConfirm={async (published) => {
                      setPublishingId(exam.id);
                      try {
                        await publishClassExam(classId, exam.id, published);
                        setExams((prev) =>
                          prev.map((e) => (e.id === exam.id ? { ...e, isPublished: published } : e))
                        );
                        toast.success(
                          published ? t('classExams.published') : t('classExams.unpublished')
                        );
                      } catch (error) {
                        console.error('Failed to toggle publish:', error);
                        toast.error(
                          published
                            ? t('classExams.errors.publishFailed')
                            : t('classExams.errors.unpublishFailed')
                        );
                      } finally {
                        setPublishingId(null);
                      }
                    }}
                    disabled={isPublishing || isDeleting}
                  />

                  {/* Delete */}
                  <DeleteDialog
                    exam={exam}
                    onDeletingChange={(deleting) => {
                      if (deleting) setDeletingId(exam.id);
                    }}
                    onConfirm={async () => {
                      setDeletingId(exam.id);
                      try {
                        await deleteClassExam(classId, exam.id);
                        setExams((prev) => prev.filter((e) => e.id !== exam.id));
                        toast.success(t('classExams.removed'));
                      } catch (error) {
                        console.error('Failed to delete exam:', error);
                        toast.error(t('classExams.errors.removeFailed'));
                      } finally {
                        setDeletingId(null);
                      }
                    }}
                    disabled={isPublishing || isDeleting}
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

// Helper component for publish/unpublish confirmation
function PublishDialog({
  exam,
  onConfirm,
  onPublishingChange,
  disabled,
}: {
  exam: ClassExam;
  onConfirm: (published: boolean) => Promise<void>;
  onPublishingChange: (publishing: boolean) => void;
  disabled: boolean;
}) {
  const { t } = useTranslation('classes');
  const [open, setOpen] = useState(false);

  const newStatus = !exam.isPublished;
  const handleConfirm = () => {
    setOpen(false);
    onPublishingChange(true);
    onConfirm(newStatus);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled} onClick={() => setOpen(true)}>
          {exam.isPublished ? (
            <>
              <Eye className="h-4 w-4 mr-1" />
              {t('classExams.actions.unpublish')}
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-1" />
              {t('classExams.actions.publish')}
            </>
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {newStatus ? t('classExams.publishConfirm') : t('classExams.unpublishConfirm')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {newStatus
              ? t('classExams.publishConfirmDescription')
              : t('classExams.unpublishConfirmDescription')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common:cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            {newStatus ? t('classExams.actions.publish') : t('classExams.actions.unpublish')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Helper component for delete confirmation
function DeleteDialog({
  exam,
  onConfirm,
  onDeletingChange,
  disabled,
}: {
  exam: ClassExam;
  onConfirm: () => Promise<void>;
  onDeletingChange: (deleting: boolean) => void;
  disabled: boolean;
}) {
  const { t } = useTranslation('classes');
  const [open, setOpen] = useState(false);

  const handleConfirm = () => {
    setOpen(false);
    onDeletingChange(true);
    onConfirm();
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
          <AlertDialogTitle>
            {t('classExams.removeConfirm', { title: exam.examTitle })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('classExams.removeConfirmDescription')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common:cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {t('classExams.actions.remove')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
