'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClipboardCheck } from 'lucide-react';
import { useDashboardContext } from '../context/DashboardContext';
import { Skeleton } from '@/components/ui/skeleton';
import type { Exam } from '@/lib/types/dashboard.types';

function ExamCard({ exam }: { exam: Exam }) {
  const { t } = useTranslation();
  const isDraft = exam.status === 'draft';
  const isPublished = exam.status === 'published';

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <Badge
            variant={isPublished ? 'default' : 'secondary'}
            className="uppercase text-xs font-bold"
          >
            {t(isDraft ? 'dashboard:recentExams.draft' : 'dashboard:recentExams.published')}
          </Badge>
          <span className="text-xs text-muted-foreground italic">
            {isDraft ? 'Unpublished' : 'Ready'}
          </span>
        </div>

        <h3 className="font-semibold text-lg mb-3">{exam.title}</h3>

        <p className="text-sm text-muted-foreground">
          {exam.questionsCount} {t('dashboard:recentExams.questions')} • {exam.gradeLevel}
        </p>
      </CardContent>

      <CardFooter className="p-6 pt-0 flex gap-2">
        <Link href={`/dashboard/exams/${exam.id}`} className="flex-1">
          <Button className="w-full">
            {t(isPublished ? 'dashboard:recentExams.viewExam' : 'dashboard:recentExams.editDraft')}
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
  const { exams, examsLoading: loading, examsError: error } = useDashboardContext();

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">{t('dashboard:recentExams.title')}</h2>
        <Link href="/dashboard/exams">
          <Button variant="link" className="text-primary">
            {t('dashboard:recentExams.viewAll')}
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

        {!loading && !error && exams.length === 0 && (
          <Card className="col-span-2">
            <CardContent className="p-6 text-center">
              <ClipboardCheck className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No exams yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Create your first exam from a document
              </p>
            </CardContent>
          </Card>
        )}

        {!loading && !error && exams.map((exam) => <ExamCard key={exam.id} exam={exam} />)}
      </div>
    </div>
  );
}
