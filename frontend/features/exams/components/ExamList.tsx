/**
 * ExamList Component
 * Displays all exams created by the user
 */

'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Calendar, Layers, Plus, Eye, Trash2, Download } from 'lucide-react';
import { examService, type ExamListItem } from '@/lib/services/api-exam.service';
import { DeleteExamDialog } from './DeleteExamDialog';
import { toast } from 'sonner';
import Link from 'next/link';

export function ExamList() {
  const { t, i18n } = useTranslation();
  const [exams, setExams] = useState<ExamListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [examToDelete, setExamToDelete] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      setLoading(true);
      const result = await examService.listExams();
      setExams(result.exams);
      setTotal(result.total);
    } catch (error) {
      console.error('Failed to load exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    setExamToDelete({ id, title });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!examToDelete) return;

    setIsDeleting(true);
    try {
      await examService.deleteExam(examToDelete.id);
      toast.success(t('exams:deleteSuccess'));
      setDeleteDialogOpen(false);
      setExamToDelete(null);
      await loadExams(); // Reload list
    } catch (error) {
      console.error('Failed to delete exam:', error);
      toast.error(t('exams:deleteFailed'));
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={`exam-skeleton-${i}`}>
            <CardContent className="p-6">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (exams.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">{t('exams:noExams')}</h3>
          <p className="text-muted-foreground mb-6 text-center max-w-sm">
            {t('exams:noExamsDescription')}
          </p>
          <Link href="/dashboard/exams/generate">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t('exams:generateFirst')}
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Removed duplicate header - already in page.tsx */}

      <div className="grid gap-4">
        {exams.map((exam) => (
          <Card key={exam.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-xl mb-2">{exam.title}</CardTitle>
                  {exam.description && (
                    <CardDescription className="line-clamp-2">{exam.description}</CardDescription>
                  )}
                </div>
                <div className="flex gap-2">
                  <Link href={`/dashboard/exams/${exam.id}`}>
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(exam.id, exam.title)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>
                    {exam.questionCount} {t('exams:questions')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  <span>
                    {exam.documentCount} {t('exams:document', { count: exam.documentCount })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(exam.createdAt).toLocaleDateString(i18n.language)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteExamDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        examTitle={examToDelete?.title || ''}
        isDeleting={isDeleting}
      />
    </div>
  );
}
