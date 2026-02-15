/**
 * StudentExamList Component
 *
 * Displays a list of exams assigned to the student with status badges and actions
 */

'use client';

import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Clock, CheckCircle, AlertCircle, PlayCircle, Eye } from 'lucide-react';
import { useStudentExams } from '../hooks';
import type { StudentExamListItem, ExamAssignmentStatus } from '../types';

interface StudentExamListProps {
  token: string;
  onExamSelect?: (exam: StudentExamListItem) => void;
}

const statusConfig: Record<
  ExamAssignmentStatus,
  {
    labelKey: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    icon: typeof Clock;
  }
> = {
  PENDING: { labelKey: 'examList.status.PENDING', variant: 'secondary', icon: Clock },
  IN_PROGRESS: { labelKey: 'examList.status.IN_PROGRESS', variant: 'default', icon: PlayCircle },
  SUBMITTED: { labelKey: 'examList.status.SUBMITTED', variant: 'outline', icon: CheckCircle },
  GRADED: { labelKey: 'examList.status.GRADED', variant: 'default', icon: CheckCircle },
};

export function StudentExamList({ token, onExamSelect }: StudentExamListProps) {
  const { t } = useTranslation('student');
  const { exams, loading, error, refetch } = useStudentExams(token);

  if (loading) {
    return (
      <div className="space-y-4" data-testid="student-exam-list-loading">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-16 w-16 text-red-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('examList.errorLoading')}</h3>
          <p className="text-gray-600 mb-6 text-center max-w-sm">{error.message}</p>
          <Button onClick={refetch} variant="outline">
            {t('errors.retry')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (exams.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('examList.noExams')}</h3>
          <p className="text-gray-600 text-center max-w-sm">{t('dashboard.noExams')}</p>
        </CardContent>
      </Card>
    );
  }

  const getActionButton = (exam: StudentExamListItem) => {
    switch (exam.status) {
      case 'PENDING':
        return (
          <Button onClick={() => onExamSelect?.(exam)} size="sm">
            <PlayCircle className="h-4 w-4 mr-2" />
            {t('examList.actions.start')}
          </Button>
        );
      case 'IN_PROGRESS':
        return (
          <Button onClick={() => onExamSelect?.(exam)} size="sm" variant="secondary">
            <PlayCircle className="h-4 w-4 mr-2" />
            {t('examList.actions.continue')} Exam
          </Button>
        );
      case 'SUBMITTED':
        return (
          <Button onClick={() => onExamSelect?.(exam)} size="sm" variant="outline" disabled>
            <Clock className="h-4 w-4 mr-2" />
            {t('examList.status.SUBMITTED')}
          </Button>
        );
      case 'GRADED':
        return (
          <Button onClick={() => onExamSelect?.(exam)} size="sm" variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            {t('examList.actions.viewResults')}
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {exams.map((exam) => {
        const status = statusConfig[exam.status];
        const StatusIcon = status.icon;

        return (
          <Card key={exam.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-xl">{exam.examTitle}</CardTitle>
                    <Badge variant={status.variant}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {t(status.labelKey)}
                    </Badge>
                  </div>
                  {exam.examDescription && (
                    <CardDescription className="line-clamp-2">
                      {exam.examDescription}
                    </CardDescription>
                  )}
                </div>
                <div className="flex gap-2">{getActionButton(exam)}</div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>
                    {exam.questionCount} {t('examList.questions')}
                  </span>
                </div>
                {exam.status === 'GRADED' && exam.score !== null && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="font-medium">
                      {t('results.score')}: {exam.score}/{exam.maxScore}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>
                    {t('examList.assigned')}: {new Date(exam.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
