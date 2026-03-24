'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Users, Trophy, Target, Clock, CheckCircle2, AlertCircle, Minus } from 'lucide-react';
import { toast } from 'sonner';
import {
  getClassExamResults,
  type ClassExamResultsResponse,
  type StudentExamResult,
} from '@/lib/services/api-class-exams.service';
import { cn } from '@/lib/utils';

interface ClassExamResultsProps {
  classId: string;
  classExamId: string;
}

export function ClassExamResults({ classId, classExamId }: ClassExamResultsProps) {
  const { t } = useTranslation('classes');
  const [results, setResults] = useState<ClassExamResultsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResults();
  }, [classId, classExamId]);

  const loadResults = async () => {
    try {
      setLoading(true);
      const data = await getClassExamResults(classId, classExamId);
      setResults(data);
    } catch (error) {
      console.error('Failed to load class exam results:', error);
      toast.error(t('classExamResults.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return '-';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString();
  };

  const getStatusBadge = (status: StudentExamResult['status']) => {
    switch (status) {
      case 'GRADED':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            {t('classExamResults.status.graded')}
          </Badge>
        );
      case 'SUBMITTED':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            {t('classExamResults.status.submitted')}
          </Badge>
        );
      case 'IN_PROGRESS':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            {t('classExamResults.status.inProgress')}
          </Badge>
        );
      case 'NOT_STARTED':
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            {t('classExamResults.status.notStarted')}
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
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!results) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-16 w-16 text-red-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t('classExamResults.errorLoading')}
          </h3>
          <Button onClick={loadResults} variant="outline">
            {t('errors.retry')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { statistics } = results;
  const hasScores = statistics.averageScore !== null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{results.examTitle}</CardTitle>
              <CardDescription>{t('classExamResults.subtitle')}</CardDescription>
            </div>
            <Button variant="outline" onClick={loadResults}>
              {t('classExamResults.refresh')}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t('classExamResults.stats.totalStudents')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{statistics.totalStudents}</div>
            <div className="text-sm text-muted-foreground mt-1">
              {statistics.startedCount} {t('classExamResults.stats.started')}
            </div>
          </CardContent>
        </Card>

        {/* Submission Rate */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              {t('classExamResults.stats.submissionRate')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {Math.round((statistics.submittedCount / statistics.totalStudents) * 100) || 0}%
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {statistics.submittedCount} {t('classExamResults.stats.submitted')}
            </div>
          </CardContent>
        </Card>

        {/* Average Score */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              {t('classExamResults.stats.averageScore')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {hasScores ? `${statistics.averageScore}%` : '-'}
            </div>
            {hasScores && (
              <div className="text-sm text-muted-foreground mt-1">
                {statistics.gradedCount} {t('classExamResults.stats.graded')}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Score Range */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              {t('classExamResults.stats.scoreRange')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasScores ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">
                      {t('classExamResults.stats.lowest')}
                    </div>
                    <div className="text-xl font-bold text-red-600">{statistics.lowestScore}%</div>
                  </div>
                  <Minus className="h-4 w-4 text-muted-foreground" />
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">
                      {t('classExamResults.stats.highest')}
                    </div>
                    <div className="text-xl font-bold text-green-600">
                      {statistics.highestScore}%
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-3xl font-bold">-</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Results List */}
      <Card>
        <CardHeader>
          <CardTitle>{t('classExamResults.studentResults')}</CardTitle>
          <CardDescription>{t('classExamResults.studentResultsDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          {results.results.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="mx-auto h-12 w-12 opacity-50 mb-4" />
              <p>{t('classExamResults.noResults')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Header Row */}
              <div className="hidden md:grid md:grid-cols-6 gap-4 text-sm font-medium text-muted-foreground border-b pb-2">
                <div className="col-span-2">{t('classExamResults.table.student')}</div>
                <div>{t('classExamResults.table.status')}</div>
                <div>{t('classExamResults.table.started')}</div>
                <div>{t('classExamResults.table.timeTaken')}</div>
                <div>{t('classExamResults.table.score')}</div>
              </div>

              {/* Student Rows */}
              {results.results.map((result) => (
                <div
                  key={result.studentId}
                  className="grid grid-cols-1 md:grid-cols-6 gap-4 py-4 border-b last:border-0 items-center"
                >
                  <div className="col-span-2">
                    <div className="font-medium">{result.studentName}</div>
                    <div className="text-sm text-muted-foreground truncate">
                      {result.studentEmail}
                    </div>
                  </div>

                  <div>{getStatusBadge(result.status)}</div>

                  <div className="text-sm text-muted-foreground">
                    {formatDate(result.startedAt)}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {formatTime(result.timeTaken)}
                  </div>

                  <div>
                    {result.score !== null ? (
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            'font-bold',
                            result.score >= 70
                              ? 'text-green-600'
                              : result.score >= 50
                                ? 'text-amber-600'
                                : 'text-red-600'
                          )}
                        >
                          {result.score}%
                        </span>
                        <Progress value={result.score} className="w-20 h-2" />
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
