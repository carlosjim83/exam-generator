'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClipboardCheck } from 'lucide-react';
import { useDashboardContext } from '../context/DashboardContext';
import { Skeleton } from '@/components/ui/skeleton';
import type { ClassExam } from '@/lib/types/dashboard.types';

function ClassExamCard({ exam }: { exam: ClassExam }) {
  const { t } = useTranslation();
  const isPublished = exam.isPublished;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <Badge
            variant={isPublished ? 'default' : 'secondary'}
            className="uppercase text-xs font-bold"
          >
            {t(
              isPublished
                ? 'dashboard:recentClassExams.published'
                : 'dashboard:recentClassExams.draft'
            )}
          </Badge>
          <span className="text-xs text-muted-foreground italic">
            {t(isPublished ? 'dashboard.status.published' : 'dashboard.status.draft')}
          </span>
        </div>

        <h3 className="font-semibold text-lg mb-2">{exam.examTitle}</h3>

        <p className="text-sm text-muted-foreground mb-2">
          {t('dashboard:recentClassExams.assignedTo', { className: exam.className })}
        </p>

        <p className="text-sm text-muted-foreground">
          {exam.questionCount} {t('dashboard:recentClassExams.questions')}
          {exam.submittedCount > 0 &&
            ` • ${exam.submittedCount} ${t('dashboard:recentClassExams.submitted')}`}
          {exam.dueDate &&
            ` • ${t('dashboard:recentClassExams.due')}: ${new Date(exam.dueDate).toLocaleDateString()}`}
        </p>
      </CardContent>

      <CardFooter className="p-6 pt-0 flex gap-2">
        <Link href={`/dashboard/exams/${exam.examId}`} className="flex-1">
          <Button className="w-full">
            {t(
              isPublished
                ? 'dashboard:recentClassExams.viewExam'
                : 'dashboard:recentClassExams.editDraft'
            )}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

function ExamCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-6 w-full mb-3" />
        <Skeleton className="h-4 w-32" />
      </CardContent>
      <CardFooter className="p-6 pt-0 flex gap-2">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 flex-1" />
      </CardFooter>
    </Card>
  );
}

export function RecentExams() {
  const { t } = useTranslation();
  const { classExams, classExamsLoading: loading, classExamsError: error } = useDashboardContext();

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">{t('dashboard:recentClassExams.title')}</h2>
        <Link href="/dashboard/exams">
          <Button variant="link" className="text-primary">
            {t('dashboard:recentClassExams.viewAll')}
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {loading && (
          <>
            <ExamCardSkeleton />
            <ExamCardSkeleton />
          </>
        )}

        {error && (
          <Card className="col-span-2">
            <CardContent className="p-6">
              <p className="text-sm text-destructive">{t('common:error')}</p>
              <p className="text-xs text-muted-foreground mt-1">{error.message}</p>
            </CardContent>
          </Card>
        )}

        {!loading && !error && classExams.length === 0 && (
          <Card className="col-span-2">
            <CardContent className="p-6 text-center">
              <ClipboardCheck className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t('noContent.noExams')}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('dashboard.createFirstExam')}</p>
            </CardContent>
          </Card>
        )}

        {!loading &&
          !error &&
          classExams.map((exam) => <ClassExamCard key={exam.id} exam={exam} />)}
      </div>
    </div>
  );
}
