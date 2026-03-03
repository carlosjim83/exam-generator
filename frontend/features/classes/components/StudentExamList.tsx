'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, FileQuestion, Loader2, Play, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  getStudentClassExams,
  type StudentClassExam,
} from '@/lib/services/api-class-exams.service';

interface StudentExamListProps {
  classId: string;
}

export function StudentExamList({ classId }: StudentExamListProps) {
  const { t } = useTranslation('student');
  const router = useRouter();
  const [exams, setExams] = useState<StudentClassExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingId, setStartingId] = useState<string | null>(null);

  useEffect(() => {
    loadExams();
  }, [classId]);

  const loadExams = async () => {
    try {
      setLoading(true);
      const result = await getStudentClassExams(classId);
      setExams(result.exams || []);
    } catch (error) {
      console.error('Failed to load student exams:', error);
      toast.error(t('classExams.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = async (classExamId: string) => {
    // Navigate to exam taking page
    setStartingId(classExamId);
    router.push(`/student/exams/${classExamId}/take`);
  };

  const handleViewResults = (classExamId: string) => {
    router.push(`/student/exams/${classExamId}/results`);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr));
  };

  const formatTimeLimit = (minutes: number | null) => {
    if (!minutes) return t('classExams.unlimited');
    return t('classExams.timeLimit', { minutes });
  };

  const getStatusBadge = (status: StudentClassExam['status']) => {
    switch (status) {
      case 'NOT_STARTED':
        return (
          <Badge variant="outline" className="text-xs bg-gray-50 text-gray-700 border-gray-200">
            {t('classExams.status.NOT_STARTED')}
          </Badge>
        );
      case 'IN_PROGRESS':
        return (
          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
            {t('classExams.status.IN_PROGRESS')}
          </Badge>
        );
      case 'SUBMITTED':
        return (
          <Badge
            variant="outline"
            className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200"
          >
            {t('classExams.status.SUBMITTED')}
          </Badge>
        );
      case 'GRADED':
        return (
          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            {t('classExams.status.GRADED')}
          </Badge>
        );
      default:
        return null;
    }
  };

  const getActionButton = (exam: StudentClassExam) => {
    const isStarting = startingId === exam.id;

    switch (exam.status) {
      case 'NOT_STARTED':
        return (
          <Button size="sm" onClick={() => handleStartExam(exam.id)} disabled={isStarting}>
            {isStarting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Play className="h-4 w-4 mr-1" />
                {t('classExams.actions.startExam')}
              </>
            )}
          </Button>
        );
      case 'IN_PROGRESS':
        return (
          <Button size="sm" onClick={() => handleStartExam(exam.id)} disabled={isStarting}>
            {t('classExams.actions.continue')}
          </Button>
        );
      case 'GRADED':
        return (
          <Button variant="outline" size="sm" onClick={() => handleViewResults(exam.id)}>
            {t('classExams.actions.viewResults')}
          </Button>
        );
      case 'SUBMITTED':
        return (
          <Button variant="outline" size="sm" disabled>
            {t('classExams.status.SUBMITTED')}
          </Button>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
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
        const dueDate = formatDate(exam.dueDate);
        const availableFrom = formatDate(exam.availableAt);
        const isPastDue = exam.dueDate && new Date(exam.dueDate) < new Date();

        return (
          <Card
            key={exam.id}
            className={`transition-shadow hover:shadow-sm ${
              isPastDue && exam.status === 'NOT_STARTED' ? 'opacity-60' : ''
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-100">
                  <FileQuestion className="h-5 w-5 text-purple-600" />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm">{exam.examTitle}</h4>
                      {getStatusBadge(exam.status)}
                    </div>
                    {exam.status === 'GRADED' && exam.score !== null && (
                      <Badge variant="secondary" className="text-sm">
                        {exam.score.toFixed(1)}%
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                    <span>
                      {exam.questionCount}{' '}
                      {t('classExams.questions', { count: exam.questionCount })}
                    </span>
                    {exam.timeLimit && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimeLimit(exam.timeLimit)}
                      </span>
                    )}
                    {dueDate && (
                      <span className={isPastDue ? 'text-red-500 font-medium' : ''}>
                        {t('classExams.dueDate')}: {dueDate}
                      </span>
                    )}
                    {availableFrom && exam.status === 'NOT_STARTED' && (
                      <span>
                        {t('classExams.availableFrom')}: {availableFrom}
                      </span>
                    )}
                  </div>

                  {/* Remaining attempts */}
                  {exam.status === 'NOT_STARTED' && exam.remainingAttempts > 1 && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {t('classExams.remainingAttempts', {
                        count: exam.remainingAttempts,
                      })}
                    </div>
                  )}
                </div>

                {/* Action */}
                <div className="shrink-0">{getActionButton(exam)}</div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
