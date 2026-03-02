'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, BookOpen, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { ClassDocuments } from '@/features/classes/components/ClassDocuments';
import { StudentExamList } from '@/features/classes/components/StudentExamList';

interface StudentClassDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

interface ClassDetails {
  id: string;
  name: string;
  code: string;
  description?: string;
  color?: string;
  teacherName: string;
  studentCount: number;
}

export default function StudentClassDetailPage({ params }: StudentClassDetailPageProps) {
  const { id: classId } = use(params);
  const router = useRouter();
  const { t } = useTranslation('student');
  const [classData, setClassData] = useState<ClassDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClassData();
  }, [classId]);

  const loadClassData = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get<ClassDetails>(`/api/classes/${classId}`);
      setClassData(data);
    } catch (error) {
      console.error('Failed to load class data:', error);
      toast.error(t('classDetails.errors.loadFailed'));
      router.push('/student/classes');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="h-8 w-64 bg-muted rounded animate-pulse" />
            <Card>
              <CardHeader>
                <div className="h-6 w-48 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-4 w-full bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!classData) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">{t('classDetails.notFound')}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push('/student/classes')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('classDetails.backToClasses')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.push('/student/classes')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{classData.name}</h1>
              <p className="text-muted-foreground">
                {t('classDetails.teacher')}: {classData.teacherName}
              </p>
            </div>
          </div>

          {/* Class Info Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{t('classDetails.title')}</CardTitle>
                  <CardDescription>{t('classDetails.subtitle')}</CardDescription>
                </div>
                <div
                  className="h-12 w-12 rounded-full flex items-center justify-center text-lg font-bold"
                  style={{ backgroundColor: classData.color || '#6366f1', color: '#fff' }}
                >
                  {classData.name.charAt(0).toUpperCase()}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {classData.description && (
                <p className="text-sm text-muted-foreground">{classData.description}</p>
              )}

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{t('classDetails.code')}:</span>
                <Badge variant="secondary">{classData.code}</Badge>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>
                    {classData.studentCount} {t('classDetails.students')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Placeholder for future content */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  {t('classDetails.upcomingExams')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <StudentExamList classId={classId} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {t('classDetails.materials')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ClassDocuments classId={classId} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
