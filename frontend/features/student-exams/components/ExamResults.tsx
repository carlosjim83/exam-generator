/**
 * ExamResults Component
 *
 * Displays graded exam results with question-by-question breakdown
 */

'use client';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle, ArrowLeft, AlertCircle, Trophy, Target, Clock } from 'lucide-react';
import { useExamResults } from '../hooks';
import type { Question, StudentAnswer } from '../types';
import { cn } from '@/lib/utils';

interface ExamResultsProps {
  assignmentId: string;
  onBack?: () => void;
}

export function ExamResults({ assignmentId, onBack }: ExamResultsProps) {
  const { t } = useTranslation('student');
  const { results, loading, error, score, maxScore, percentage, status, refetch } =
    useExamResults(assignmentId);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!results?.answers) return { correct: 0, incorrect: 0 };

    const correct = results.answers.filter((a) => a.isCorrect).length;
    const incorrect = results.answers.filter((a) => !a.isCorrect).length;

    return { correct, incorrect };
  }, [results]);

  // Get answer for a specific question
  const getAnswerForQuestion = (questionId: string): StudentAnswer | undefined => {
    return results?.answers?.find((a) => a.questionId === questionId);
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6" data-testid="exam-results-loading">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-6 w-3/4 mb-4" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-16 w-16 text-red-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('results.errorLoading')}</h3>
          <p className="text-gray-600 mb-6 text-center max-w-sm">{error.message}</p>
          <Button onClick={refetch} variant="outline">
            {t('errors.retry')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show grading in progress for SUBMITTED status
  if (status === 'SUBMITTED') {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle className="text-2xl">
                  {results?.exam?.title || t('results.title')}
                </CardTitle>
                <CardDescription className="mt-1">{t('results.title')}</CardDescription>
              </div>
              {onBack && (
                <Button variant="outline" onClick={onBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t('examList.actions.backToExams')}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-16 w-16 text-amber-500 mb-4 animate-pulse" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {t('results.gradingInProgressTitle')}
            </h3>
            <p className="text-gray-600 text-center max-w-sm">
              {t('results.gradingInProgressMessage')}
            </p>
            {results?.assignment?.submittedAt && (
              <p className="text-sm text-gray-500 mt-4">
                {t('results.submittedOn')}:{' '}
                {new Date(results.assignment.submittedAt).toLocaleDateString()}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!results) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('results.noResults')}</h3>
          <p className="text-gray-600 text-center max-w-sm">{t('results.noResults')}</p>
        </CardContent>
      </Card>
    );
  }

  const isGoodScore = (percentage ?? 0) >= 70;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Results Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-2xl">{results.exam.title}</CardTitle>
              <CardDescription className="mt-1">{t('results.title')}</CardDescription>
            </div>
            {onBack && (
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('examList.actions.backToExams')}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Score Display */}
          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-primary">
                {score}/{maxScore}
              </div>
              <div className="text-gray-500 mt-1">{t('results.score')}</div>
            </div>
            <div className="text-center">
              <div
                className={cn(
                  'text-5xl font-bold',
                  isGoodScore ? 'text-green-600' : 'text-amber-600'
                )}
              >
                {percentage}%
              </div>
              <div className="text-gray-500 mt-1">{t('results.percentage')}</div>
            </div>
          </div>

          {/* Progress Bar */}
          <Progress value={percentage ?? 0} className="h-3" />

          {/* Message */}
          <div
            className={cn(
              'flex items-center justify-center gap-2 p-4 rounded-lg',
              isGoodScore ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
            )}
          >
            {isGoodScore ? (
              <>
                <Trophy className="h-5 w-5" />
                <span className="font-medium">{t('results.passed')}</span>
              </>
            ) : (
              <>
                <Target className="h-5 w-5" />
                <span className="font-medium">{t('results.failed')}</span>
              </>
            )}
          </div>

          {/* Statistics */}
          <div className="flex justify-center gap-6">
            <Badge variant="secondary" className="text-base px-4 py-2">
              <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
              {stats.correct} {t('results.correctCount')}
            </Badge>
            <Badge variant="secondary" className="text-base px-4 py-2">
              <XCircle className="h-4 w-4 mr-2 text-red-600" />
              {stats.incorrect} {t('results.incorrectCount')}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Question-by-Question Breakdown */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">{t('results.questionBreakdown')}</h3>

        {results.exam.questions.map((question: Question, index: number) => {
          const answer = getAnswerForQuestion(question.id);
          const isCorrect = answer?.isCorrect ?? false;

          return (
            <Card
              key={question.id}
              className={cn('border-l-4', isCorrect ? 'border-l-green-500' : 'border-l-red-500')}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base font-medium">
                      {t('results.question')} {index + 1}
                    </CardTitle>
                    <CardDescription className="mt-1 text-gray-900">
                      {question.text}
                    </CardDescription>
                  </div>
                  {isCorrect ? (
                    <CheckCircle2
                      data-testid="correct-icon"
                      className="h-6 w-6 text-green-600 flex-shrink-0"
                    />
                  ) : (
                    <XCircle
                      data-testid="incorrect-icon"
                      className="h-6 w-6 text-red-600 flex-shrink-0"
                    />
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-500">
                    {t('results.yourAnswer')}:
                  </span>
                  <p
                    className={cn(
                      'mt-1 p-3 rounded-md',
                      isCorrect ? 'bg-green-50 text-green-900' : 'bg-red-50 text-red-900'
                    )}
                  >
                    {answer?.answer ?? t('results.noAnswerProvided')}
                  </p>
                </div>
                {answer?.feedback && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">
                      {t('results.feedback')}:
                    </span>
                    <p className="mt-1 p-3 bg-gray-50 rounded-md text-gray-700">
                      {answer.feedback}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
