/**
 * ExamTaking Component
 *
 * Main component for the exam-taking experience
 * Displays questions, handles answers, and manages navigation
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
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
  token: string;
  onComplete?: () => void;
}

export function ExamTaking({ assignmentId, token, onComplete }: ExamTakingProps) {
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
  } = useExamAssignment(assignmentId, token);

  const {
    answers,
    answeredCount,
    isSubmittingAnswer,
    isSubmittingExam,
    isExamSubmitted,
    submissionError,
    submitAnswer,
    submitExam,
    getAnswerForQuestion,
  } = useExamSubmission(assignmentId, token);

  const [currentAnswer, setCurrentAnswer] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Load existing answer when question changes
  useEffect(() => {
    if (currentQuestion) {
      const existingAnswer = getAnswerForQuestion(currentQuestion.id);
      setCurrentAnswer(existingAnswer?.answer ?? '');
    }
  }, [currentQuestion, getAnswerForQuestion]);

  // Call onComplete when exam is submitted
  useEffect(() => {
    if (isExamSubmitted && onComplete) {
      onComplete();
    }
  }, [isExamSubmitted, onComplete]);

  const handleSaveAnswer = useCallback(async () => {
    if (currentQuestion && currentAnswer.trim()) {
      await submitAnswer(currentQuestion.id, currentAnswer);
    }
  }, [currentQuestion, currentAnswer, submitAnswer]);

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
          <h2 className="text-2xl font-bold mb-2">Exam Submitted Successfully!</h2>
          <p className="text-gray-600 text-center">
            Your answers have been recorded. You can view your results once they are graded.
          </p>
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
              <AlertCircle className="h-16 w-16 text-red-400 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
              <p className="text-gray-600 mb-6 text-center">{examError.message}</p>
              <Button onClick={startExam}>Try Again</Button>
            </>
          ) : (
            <>
              <Play className="h-16 w-16 text-primary mb-4" />
              <h2 className="text-2xl font-bold mb-2">Ready to Start?</h2>
              <p className="text-gray-600 text-center mb-6">
                Once you start the exam, the timer will begin. Make sure you&apos;re ready!
              </p>
              <Button onClick={startExam} disabled={isStarting} size="lg">
                {isStarting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Starting Exam...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Start Exam
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
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </CardDescription>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-600">
                {answeredCount} of {totalQuestions} answered
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Question Navigation Dots */}
      <div className="flex justify-center gap-2 flex-wrap">
        {exam.questions.map((q, idx) => {
          const isAnswered = answers[q.id] !== undefined;
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
                  : 'bg-white border-gray-300 text-gray-600'
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
            <Label htmlFor="answer">Your Answer</Label>
            <Textarea
              id="answer"
              placeholder="Type your answer here..."
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              className="min-h-[150px] resize-none"
              aria-label="Your Answer"
            />
          </div>

          {submissionError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{submissionError.message}</p>
            </div>
          )}

          <div className="flex justify-between items-center pt-4">
            <Button variant="outline" onClick={previousQuestion} disabled={isFirstQuestion}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>

            <Button
              variant="secondary"
              onClick={handleSaveAnswer}
              disabled={isSubmittingAnswer || !currentAnswer.trim()}
            >
              {isSubmittingAnswer ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Answer
                </>
              )}
            </Button>

            {isLastQuestion ? (
              <Button onClick={handleSubmitExam} disabled={isSubmittingExam}>
                {isSubmittingExam ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Exam
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={nextQuestion}>
                Next
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
            <AlertDialogTitle>Are you sure you want to submit?</AlertDialogTitle>
            <AlertDialogDescription>
              You have answered {answeredCount} of {totalQuestions} questions.
              {answeredCount < totalQuestions && (
                <span className="block mt-2 text-amber-600 font-medium">
                  Warning: You have {totalQuestions - answeredCount} unanswered questions.
                </span>
              )}
              <span className="block mt-2">This action cannot be undone.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSubmit}>Submit Exam</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
