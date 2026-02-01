/**
 * ExamList Component
 * Displays all exams created by the user
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Calendar, Layers, Plus, Eye, Trash2, Download } from 'lucide-react';
import { ApiExamService, type ExamListItem } from '@/lib/services/api-exam.service';
import Link from 'next/link';

const examService = new ApiExamService();

export function ExamList() {
  const [exams, setExams] = useState<ExamListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      setLoading(true);
      const result = await examService.listExams();
      setExams(result.exams);
      setTotal(result.total);
    } catch (error) {
      console.error('Failed to load exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this exam?')) return;

    try {
      await examService.deleteExam(id);
      await loadExams(); // Reload list
    } catch (error) {
      console.error('Failed to delete exam:', error);
      alert('Failed to delete exam');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
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

  if (exams.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No exams yet</h3>
          <p className="text-gray-600 mb-6 text-center max-w-sm">
            Start by generating your first exam from your documents
          </p>
          <Link href="/dashboard/exams/generate">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Generate Your First Exam
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Your Exams</h2>
          <p className="text-gray-600">
            {total} exam{total !== 1 ? 's' : ''} total
          </p>
        </div>
        <Link href="/dashboard/exams/generate">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Generate New Exam
          </Button>
        </Link>
      </div>

      <div className="grid gap-4">
        {exams.map((exam) => (
          <Card key={exam.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-xl mb-2">{exam.title}</CardTitle>
                  {exam.description && (
                    <CardDescription className="line-clamp-2">{exam.description}</CardDescription>
                  )}
                </div>
                <div className="flex gap-2">
                  <Link href={`/dashboard/exams/${exam.id}`}>
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(exam.id)}>
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>{exam.questionCount} questions</span>
                </div>
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  <span>
                    {exam.documentCount} document{exam.documentCount !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(exam.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
