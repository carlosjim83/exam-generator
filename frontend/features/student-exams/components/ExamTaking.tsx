/**
 * ExamTaking Component
 *
 * Main component for the exam-taking experience
 * Displays questions, handles answers, and manages navigation
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ChevronLeft,
  ChevronRight,
  Send,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  Play,
} from 'lucide-react';
import { useExamAssignment, useExamSubmission } from '../hooks';
import { cn } from '@/lib/utils';

interface ExamTakingProps {
  assignmentId: string;
  onComplete?: () => void;
}

export function ExamTaking({ assignmentId, onComplete }: ExamTakingProps) {
  const { t } = useTranslation('student');
  const {
    assignment,
    exam,
    currentQuestionIndex,
    currentQuestion,
    totalQuestions,
    isFirstQuestion,
    isLastQuestion,
    isStarting,
    error: examError,
    startExam,
    nextQuestion,
    previousQuestion,
    goToQuestion,
  } = useExamAssignment(assignmentId);

  const {
    savedAnswers,
    answeredCount,
    isSavingAnswer,
    isSubmittingExam,
    isExamSubmitted,
    submissionError,
    saveAnswer,
    submitExam,
    getAnswerForQuestion,
  } = useExamSubmission(assignmentId);

  const [currentAnswer, setCurrentAnswer] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Load existing answer when question changes
  useEffect(() => {
    if (currentQuestion) {
      const existingAnswer = getAnswerForQuestion(currentQuestion.id);
      setCurrentAnswer(existingAnswer ?? '');
    }
  }, [currentQuestion]); // eslint-disable-line react-hooks/exhaustive-deps

  // Call onComplete when exam is submitted
  useEffect(() => {
    if (isExamSubmitted && onComplete) {
      onComplete();
    }
  }, [isExamSubmitted, onComplete]);

  const handleSaveAnswer = useCallback(async () => {
    if (currentQuestion && currentAnswer.trim()) {
      await saveAnswer(currentQuestion.id, currentAnswer);
    }
  }, [currentQuestion, currentAnswer, saveAnswer]);

  const handleSubmitExam = useCallback(() => {
    setShowConfirmDialog(true);
  }, []);

  const handleConfirmSubmit = useCallback(async () => {
    setShowConfirmDialog(false);
    await submitExam();
  }, [submitExam]);

  // Exam submitted success state
  if (isExamSubmitted) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">{t('examTaking.success.title')}</h2>
          <p className="text-muted-foreground text-center">{t('examTaking.success.message')}</p>
        </CardContent>
      </Card>
    );
  }

  // Pre-start state
  if (!exam) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-12">
          {examError ? (
            <>
              <AlertCircle className="h-16 w-16 text-destructive mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">
                {t('examTaking.error.title')}
              </h2>
              <p className="text-muted-foreground mb-6 text-center">{examError.message}</p>
              <Button onClick={startExam}>{t('examTaking.error.tryAgain')}</Button>
            </>
          ) : (
            <>
              <Play className="h-16 w-16 text-primary mb-4" />
              <h2 className="text-2xl font-bold mb-2">{t('examTaking.ready')}</h2>
              <p className="text-muted-foreground text-center mb-6">
                {t('examTaking.readyDescription')}
              </p>
              <Button onClick={startExam} disabled={isStarting} size="lg">
                {isStarting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('examTaking.starting')}
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    {t('examTaking.startButton')}
                  </>
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  // Main exam-taking UI
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{exam.title}</CardTitle>
              <CardDescription className="mt-1">
                {t('examTaking.question')} {currentQuestionIndex + 1} {t('examTaking.of')}{' '}
                {totalQuestions}
              </CardDescription>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-muted-foreground">
                {answeredCount} {t('examTaking.of')} {totalQuestions} {t('examList.answered')}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Question Navigation Dots */}
      <div className="flex justify-center gap-2 flex-wrap">
        {exam.questions.map((q, idx) => {
          const isAnswered = savedAnswers[q.id] !== undefined;
          const isCurrent = idx === currentQuestionIndex;

          return (
            <button
              key={q.id}
              data-testid={`question-dot-${idx}`}
              onClick={() => goToQuestion(idx)}
              className={cn(
                'w-8 h-8 rounded-full text-sm font-medium transition-all',
                'border-2 hover:scale-110',
                isCurrent && 'ring-2 ring-primary ring-offset-2',
                isAnswered
                  ? 'bg-green-500 border-green-500 text-white answered'
                  : 'bg-white border-gray-300 text-muted-foreground'
              )}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {/* Question Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">{currentQuestion?.text}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t('examTaking.yourAnswer')}</Label>
            {currentQuestion?.type === 'SHORT_ANSWER' ? (
              <Textarea
                id="answer"
                placeholder={t('examTaking.yourAnswer')}
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                className="min-h-[150px] resize-none"
                aria-label={t('examTaking.yourAnswer')}
              />
            ) : (
              <div className="space-y-3">
                {currentQuestion?.options?.map((option, idx) => (
                  <label
                    key={idx}
                    className={cn(
                      'flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all',
                      currentAnswer === option
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestion.id}`}
                      value={option}
                      checked={currentAnswer === option}
                      onChange={(e) => setCurrentAnswer(e.target.value)}
                      className="w-4 h-4 text-primary"
                    />
                    <span className="flex-1">{option}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {submissionError && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{submissionError.message}</p>
            </div>
          )}

          <div className="flex justify-between items-center pt-4">
            <Button variant="outline" onClick={previousQuestion} disabled={isFirstQuestion}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              {t('examTaking.previousQuestion')}
            </Button>

            <Button
              variant="secondary"
              onClick={handleSaveAnswer}
              disabled={isSavingAnswer || !currentAnswer}
            >
              {isSavingAnswer ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('examTaking.saving')}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {t('examTaking.saveAnswer')}
                </>
              )}
            </Button>

            {isLastQuestion ? (
              <Button onClick={handleSubmitExam} disabled={isSubmittingExam}>
                {isSubmittingExam ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('examTaking.submitting')}
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    {t('examTaking.submitExam')}
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={nextQuestion}>
                {t('examTaking.nextQuestion')}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('examTaking.confirmSubmit')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('examTaking.question')} {answeredCount} / {totalQuestions}
              {answeredCount < totalQuestions && (
                <span className="block mt-2 text-amber-600 font-medium">
                  {t('examTaking.confirmSubmitWarning')}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('examTaking.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSubmit}>
              {t('examTaking.submitExam')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
