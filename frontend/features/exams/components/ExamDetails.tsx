/**
 * ExamDetails Component
 * Shows full exam with all questions
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Calendar, Layers, Download, Printer, CheckCircle2 } from 'lucide-react';
import { ApiExamService, type ExamDetailsResponse } from '@/lib/services/api-exam.service';
import { useTranslation } from 'react-i18next';

const examService = new ApiExamService();

interface ExamDetailsProps {
  examId: string;
}

export function ExamDetails({ examId }: ExamDetailsProps) {
  const [exam, setExam] = useState<ExamDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation('exams');

  useEffect(() => {
    loadExam();
  }, [examId]);

  const loadExam = async () => {
    try {
      setLoading(true);
      const result = await examService.getExam(examId);
      setExam(result);
    } catch (error) {
      console.error('Failed to load exam:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportJSON = () => {
    if (!exam) return;
    const json = JSON.stringify(exam, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exam.exam.title.replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!exam) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t('examDetails.notFound')}</h3>
          <p className="text-muted-foreground">{t('examDetails.notFoundDescription')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-2">{exam.exam.title}</h1>
          {exam.exam.description && (
            <p className="text-muted-foreground">{exam.exam.description}</p>
          )}
          <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>
                {exam.exam.questionCount} {t('questions', { count: exam.exam.questionCount })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              <span>
                {exam.exam.documentCount} {t('document', { count: exam.exam.documentCount })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>
                {t('examDetails.created')} {new Date(exam.exam.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 print:hidden">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            {t('examDetails.print')}
          </Button>
          <Button variant="outline" onClick={handleExportJSON}>
            <Download className="h-4 w-4 mr-2" />
            {t('examDetails.exportJson')}
          </Button>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {exam.questions.map((question, index) => (
          <Card key={question.id}>
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-semibold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg font-medium mb-2">
                    {question.questionText}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="secondary">{question.type.replace('_', ' ')}</Badge>
                    <Badge
                      variant={
                        question.difficulty === 'EASY'
                          ? 'default'
                          : question.difficulty === 'MEDIUM'
                            ? 'secondary'
                            : 'destructive'
                      }
                    >
                      {question.difficulty}
                    </Badge>
                    <Badge variant="outline">
                      {question.points} {t('examDetails.point', { count: question.points })}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Options for Multiple Choice */}
              {question.type === 'MULTIPLE_CHOICE' && question.options && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('examDetails.options')}
                  </p>
                  <div className="space-y-2">
                    {question.options.map((option, i) => (
                      <div
                        key={`option-${option}`}
                        className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                          option === question.correctAnswer
                            ? 'border-green-500 bg-green-500/10 dark:bg-green-500/20'
                            : 'border-border bg-card'
                        }`}
                      >
                        <span className="font-mono font-medium text-muted-foreground">
                          {String.fromCharCode(65 + i)}.
                        </span>
                        <span className="flex-1">{option}</span>
                        {option === question.correctAnswer && (
                          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Correct Answer for True/False */}
              {question.type === 'TRUE_FALSE' && (
                <div className="bg-green-500/10 dark:bg-green-500/20 border border-green-500/50 rounded-lg p-4">
                  <p className="text-sm font-medium text-green-800 dark:text-green-300">
                    {t('examDetails.correctAnswer')}{' '}
                    <span className="font-bold">{question.correctAnswer}</span>
                  </p>
                </div>
              )}

              {/* Sample Answer for Short Answer */}
              {question.type === 'SHORT_ANSWER' && (
                <div className="bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/50 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                    {t('examDetails.sampleAnswer')}
                  </p>
                  <p className="text-sm text-blue-900 dark:text-blue-200">
                    {question.correctAnswer}
                  </p>
                </div>
              )}

              {/* Explanation */}
              {question.explanation && (
                <div className="bg-muted/50 rounded-lg p-4 border border-border">
                  <p className="text-sm font-medium text-foreground mb-2">
                    {t('examDetails.explanation')}
                  </p>
                  <p className="text-sm text-muted-foreground">{question.explanation}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stats */}
      <Card className="print:hidden">
        <CardHeader>
          <CardTitle>{t('examDetails.statistics')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{t('examDetails.totalQuestions')}</p>
              <p className="text-2xl font-bold">{exam.questions.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('examDetails.totalPoints')}</p>
              <p className="text-2xl font-bold">
                {exam.questions.reduce((sum, q) => sum + q.points, 0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('examDetails.easyQuestions')}</p>
              <p className="text-2xl font-bold">
                {exam.questions.filter((q) => q.difficulty === 'EASY').length}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('examDetails.hardQuestions')}</p>
              <p className="text-2xl font-bold">
                {exam.questions.filter((q) => q.difficulty === 'HARD').length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
