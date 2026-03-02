'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileQuestion, Loader2, Eye, EyeOff, Trash2, BarChart3 } from 'lucide-react';
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

  const handleTogglePublish = async (exam: ClassExam) => {
    const newStatus = !exam.isPublished;
    const actionText = newStatus
      ? t('classExams.actions.publish')
      : t('classExams.actions.unpublish');

    if (newStatus) {
      // Publishing - show confirmation
      if (
        !confirm(
          t('classExams.publishConfirm') + '\n\n' + t('classExams.publishConfirmDescription')
        )
      ) {
        return;
      }
    } else {
      // Unpublishing - show confirmation
      if (
        !confirm(
          t('classExams.unpublishConfirm') + '\n\n' + t('classExams.unpublishConfirmDescription')
        )
      ) {
        return;
      }
    }

    setPublishingId(exam.id);
    try {
      await publishClassExam(classId, exam.id, newStatus);
      setExams((prev) =>
        prev.map((e) => (e.id === exam.id ? { ...e, isPublished: newStatus } : e))
      );
      toast.success(newStatus ? t('classExams.published') : t('classExams.unpublished'));
    } catch (error) {
      console.error('Failed to toggle publish:', error);
      toast.error(
        newStatus ? t('classExams.errors.publishFailed') : t('classExams.errors.unpublishFailed')
      );
    } finally {
      setPublishingId(null);
    }
  };

  const handleDelete = async (exam: ClassExam) => {
    if (
      !confirm(
        t('classExams.removeConfirm', { title: exam.examTitle }) +
          '\n\n' +
          t('classExams.removeConfirmDescription')
      )
    ) {
      return;
    }

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
                        <EyeOff className="h-3 w-3 mr-1" />
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
                        {exam.startedCount ?? 0}/{exam.assignedStudents}{' '}
                        {t('classExams.stats.started')}
                      </span>
                      <span>
                        {exam.submittedCount ?? 0}/{exam.assignedStudents}{' '}
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
                  {exam.isPublished && (exam.submittedCount ?? 0) > 0 && onViewResults && (
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTogglePublish(exam)}
                    disabled={isPublishing || isDeleting}
                  >
                    {isPublishing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : exam.isPublished ? (
                      t('classExams.actions.unpublish')
                    ) : (
                      t('classExams.actions.publish')
                    )}
                  </Button>

                  {/* Delete */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(exam)}
                    disabled={isPublishing || isDeleting}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
