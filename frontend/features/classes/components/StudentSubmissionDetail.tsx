'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  User,
  FileText,
  Award,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  getStudentSubmissionDetail,
  type StudentSubmissionDetailResponse,
  type QuestionResult,
} from '@/lib/services/api-class-exams.service';
import { cn } from '@/lib/utils';

interface StudentSubmissionDetailProps {
  classId: string;
  classExamId: string;
  studentId: string;
  onBack?: () => void;
}

export function StudentSubmissionDetail({
  classId,
  classExamId,
  studentId,
  onBack,
}: StudentSubmissionDetailProps) {
  const { t } = useTranslation('classes');
  const [data, setData] = useState<StudentSubmissionDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubmissionDetail();
  }, [classId, classExamId, studentId]);

  const loadSubmissionDetail = async () => {
    try {
      setLoading(true);
      const result = await getStudentSubmissionDetail(classId, classExamId, studentId);
      setData(result);
    } catch (error) {
      console.error('Failed to load student submission detail:', error);
      toast.error(t('studentSubmissionDetail.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString();
  };

  const getQuestionTypeIcon = (type: QuestionResult['questionType'], isCorrect: boolean | null) => {
    if (isCorrect === null) return <HelpCircle className="h-5 w-5 text-gray-400" />;
    return isCorrect ? (
      <CheckCircle2 className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  const getQuestionTypeLabel = (type: QuestionResult['questionType']) => {
    switch (type) {
      case 'MULTIPLE_CHOICE':
        return t('studentSubmissionDetail.questionTypes.multipleChoice');
      case 'TRUE_FALSE':
        return t('studentSubmissionDetail.questionTypes.trueFalse');
      case 'SHORT_ANSWER':
        return t('studentSubmissionDetail.questionTypes.shortAnswer');
      default:
        return type;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'GRADED':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            {t('studentSubmissionDetail.status.graded')}
          </Badge>
        );
      case 'SUBMITTED':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            {t('studentSubmissionDetail.status.submitted')}
          </Badge>
        );
      case 'IN_PROGRESS':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            {t('studentSubmissionDetail.status.inProgress')}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            {t('studentSubmissionDetail.status.notStarted')}
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </CardHeader>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-32" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-32" />
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-96" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-16 w-16 text-red-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t('studentSubmissionDetail.errorLoading')}
          </h3>
          <div className="flex gap-3">
            {onBack && (
              <Button onClick={onBack} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('studentSubmissionDetail.backToResults')}
              </Button>
            )}
            <Button onClick={loadSubmissionDetail} variant="outline">
              {t('errors.retry')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { student, exam, assignment, questions, totalScore, maxScore, percentage } = data;

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('studentSubmissionDetail.backToResults')}
          </Button>
        )}
      </div>

      {/* Exam Title */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <FileText className="h-6 w-6" />
            {exam.title}
          </CardTitle>
          {exam.description && <CardDescription>{exam.description}</CardDescription>}
        </CardHeader>
      </Card>

      {/* Student Info and Score Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Student Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              {t('studentSubmissionDetail.studentInfo')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">
                {t('studentSubmissionDetail.name')}
              </div>
              <div className="font-medium text-lg">{student.name}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">
                {t('studentSubmissionDetail.email')}
              </div>
              <div className="font-medium">{student.email}</div>
            </div>
            <div className="h-px bg-gray-200 my-4" />
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {t('studentSubmissionDetail.status')}
              </div>
              {getStatusBadge(assignment.status)}
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">
                  {t('studentSubmissionDetail.startedAt')}
                </div>
                <div>{formatDate(assignment.startedAt)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">
                  {t('studentSubmissionDetail.submittedAt')}
                </div>
                <div>{formatDate(assignment.submittedAt)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Score Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="h-5 w-5" />
              {t('studentSubmissionDetail.scoreSummary')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-5xl font-bold">
                {percentage !== null ? `${percentage}%` : '-'}
              </div>
              <div className="text-muted-foreground mt-2">
                {totalScore} / {maxScore} {t('studentSubmissionDetail.points')}
              </div>
            </div>
            <Progress
              value={percentage ?? 0}
              className={cn(
                'h-3',
                percentage && percentage >= 70
                  ? 'bg-green-100'
                  : percentage && percentage >= 50
                    ? 'bg-amber-100'
                    : 'bg-red-100'
              )}
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                {t('studentSubmissionDetail.correctAnswers')}:{' '}
                {questions.filter((q) => q.isCorrect === true).length}
              </span>
              <span>
                {t('studentSubmissionDetail.totalQuestions')}: {questions.length}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Questions Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>{t('studentSubmissionDetail.questionsBreakdown')}</CardTitle>
          <CardDescription>{t('studentSubmissionDetail.questionsDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {questions.map((question, index) => (
              <div
                key={question.questionId}
                className={cn(
                  'border rounded-lg p-4',
                  question.isCorrect === true
                    ? 'border-green-200 bg-green-50/50'
                    : question.isCorrect === false
                      ? 'border-red-200 bg-red-50/50'
                      : 'border-gray-200'
                )}
              >
                {/* Question Header */}
                <div className="flex items-start gap-3 mb-4">
                  {getQuestionTypeIcon(question.questionType, question.isCorrect)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">
                        {t('studentSubmissionDetail.question')} {index + 1}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {getQuestionTypeLabel(question.questionType)}
                      </Badge>
                      <span className="text-sm text-muted-foreground ml-auto">
                        {question.pointsEarned} / {question.maxPoints}{' '}
                        {t('studentSubmissionDetail.points')}
                      </span>
                    </div>
                    <p className="text-gray-900">{question.questionText}</p>
                  </div>
                </div>

                {/* Options (for multiple choice) */}
                {question.options && question.options.length > 0 && (
                  <div className="ml-8 mb-4 space-y-2">
                    {question.options.map((option, optIndex) => (
                      <div
                        key={optIndex}
                        className={cn(
                          'p-2 rounded text-sm',
                          option === question.correctAnswer
                            ? 'bg-green-100 text-green-800'
                            : option === question.studentAnswer && option !== question.correctAnswer
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-50'
                        )}
                      >
                        <span className="font-medium">{String.fromCharCode(65 + optIndex)}.</span>{' '}
                        {option}
                        {option === question.correctAnswer && (
                          <span className="ml-2 text-green-600 font-medium">
                            ({t('studentSubmissionDetail.correct')})
                          </span>
                        )}
                        {option === question.studentAnswer && option !== question.correctAnswer && (
                          <span className="ml-2 text-red-600 font-medium">
                            ({t('studentSubmissionDetail.studentAnswer')})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Answers Comparison */}
                <div className="ml-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Student's Answer */}
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      {t('studentSubmissionDetail.studentAnswer')}
                    </div>
                    <div
                      className={cn(
                        'p-3 rounded text-sm',
                        question.isCorrect === true
                          ? 'bg-green-100 text-green-800'
                          : question.isCorrect === false
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100'
                      )}
                    >
                      {question.studentAnswer || (
                        <span className="italic text-muted-foreground">
                          {t('studentSubmissionDetail.noAnswer')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Correct Answer */}
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      {t('studentSubmissionDetail.correctAnswer')}
                    </div>
                    <div className="p-3 rounded text-sm bg-green-100 text-green-800">
                      {question.correctAnswer || (
                        <span className="italic">
                          {t('studentSubmissionDetail.anyReasonableAnswer')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Feedback (for AI-graded questions) */}
                {question.feedback && (
                  <div className="ml-8 mt-4">
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      {t('studentSubmissionDetail.feedback')}
                    </div>
                    <div className="p-3 rounded text-sm bg-blue-50 text-blue-800 border border-blue-100">
                      {question.feedback}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
