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
import {
  ArrowLeft,
  FileText,
  Calendar,
  Layers,
  Download,
  Printer,
  CheckCircle2,
} from 'lucide-react';
import { ApiExamService, type ExamDetailsResponse } from '@/lib/services/api-exam.service';
import Link from 'next/link';

const examService = new ApiExamService();

interface ExamDetailsProps {
  examId: string;
}

export function ExamDetails({ examId }: ExamDetailsProps) {
  const [exam, setExam] = useState<ExamDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);

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
          <FileText className="h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Exam not found</h3>
          <p className="text-gray-600 mb-6">
            The exam you're looking for doesn't exist or you don't have access to it.
          </p>
          <Link href="/dashboard/exams">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Exams
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Link href="/dashboard/exams">
            <Button variant="ghost" size="sm" className="mb-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Exams
            </Button>
          </Link>
          <h1 className="text-3xl font-bold mb-2">{exam.exam.title}</h1>
          {exam.exam.description && <p className="text-gray-600">{exam.exam.description}</p>}
          <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>{exam.exam.questionCount} questions</span>
            </div>
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              <span>
                {exam.exam.documentCount} document{exam.exam.documentCount !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Created {new Date(exam.exam.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 print:hidden">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" onClick={handleExportJSON}>
            <Download className="h-4 w-4 mr-2" />
            Export JSON
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
                      {question.points} point{question.points !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Options for Multiple Choice */}
              {question.type === 'MULTIPLE_CHOICE' && question.options && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Options:</p>
                  <div className="space-y-2">
                    {question.options.map((option, i) => (
                      <div
                        key={i}
                        className={`flex items-start gap-3 p-3 rounded-lg border ${
                          option === question.correctAnswer
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <span className="font-mono font-medium text-gray-600">
                          {String.fromCharCode(65 + i)}.
                        </span>
                        <span className="flex-1">{option}</span>
                        {option === question.correctAnswer && (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Correct Answer for True/False */}
              {question.type === 'TRUE_FALSE' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-green-800">
                    Correct Answer: <span className="font-bold">{question.correctAnswer}</span>
                  </p>
                </div>
              )}

              {/* Sample Answer for Short Answer */}
              {question.type === 'SHORT_ANSWER' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-800 mb-2">Sample Answer:</p>
                  <p className="text-sm text-blue-900">{question.correctAnswer}</p>
                </div>
              )}

              {/* Explanation */}
              {question.explanation && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Explanation:</p>
                  <p className="text-sm text-gray-600">{question.explanation}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stats */}
      <Card className="print:hidden">
        <CardHeader>
          <CardTitle>Exam Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Questions</p>
              <p className="text-2xl font-bold">{exam.questions.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Points</p>
              <p className="text-2xl font-bold">
                {exam.questions.reduce((sum, q) => sum + q.points, 0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Easy Questions</p>
              <p className="text-2xl font-bold">
                {exam.questions.filter((q) => q.difficulty === 'EASY').length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Hard Questions</p>
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
