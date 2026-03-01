'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StudentList } from '@/features/classes/components/StudentList';
import { TeacherClassDocuments } from '@/features/classes/components/TeacherClassDocuments';
import { InviteStudentsDialog } from '@/features/classes/components/InviteStudentsDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, ArrowLeft, Users, FileText, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import {
  getClassById,
  listClassStudents,
  removeStudentFromClass,
  createInvitations,
  importStudentsFromCsv,
  type ClassDetails,
  type CreateInvitationsResponse,
} from '@/features/classes/services/classes-api';

interface ClassDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

// Helper to safely format dates
function formatDate(dateString: string | undefined): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString();
}

export default function ClassDetailPage({ params }: ClassDetailPageProps) {
  const { id: classId } = use(params);
  const router = useRouter();
  const { t } = useTranslation('classes');
  const [classData, setClassData] = useState<ClassDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<ClassDetails['students']>([]);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('students');

  const loadClassData = async () => {
    try {
      setLoading(true);
      const [cls, studentsData] = await Promise.all([
        getClassById(classId),
        listClassStudents(classId),
      ]);
      setClassData(cls);
      setStudents(studentsData.students);
    } catch (error) {
      console.error('Failed to load class data:', error);
      toast.error(t('classDetails.loadError'));
      router.push('/dashboard/classes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClassData();
  }, [classId]);

  const copyCode = async () => {
    if (!classData) return;
    try {
      await navigator.clipboard.writeText(classData.code);
      toast.success(t('classDetails.copyCodeSuccess'));
    } catch {
      toast.error(t('classDetails.copyCodeError'));
    }
  };

  const handleInvite = async (emails: string[]): Promise<CreateInvitationsResponse> => {
    return createInvitations(classId, { emails });
  };

  const handleUploadCsv = async (file: File): Promise<void> => {
    await importStudentsFromCsv(classId, file);
  };

  const handleRemoveStudent = async (studentId: string): Promise<void> => {
    await removeStudentFromClass(classId, studentId);
    loadClassData();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="px-8 py-8">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="h-8 w-64 bg-muted rounded animate-pulse" />
            <Card>
              <CardHeader>
                <div className="h-6 w-1/2 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-4 w-1/3 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!classData) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="px-8 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => router.push('/dashboard/classes')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('classDetails.backToClasses')}
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-2xl mb-2">{classData.name}</CardTitle>
                  {classData.description && (
                    <CardDescription className="text-base">{classData.description}</CardDescription>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={copyCode} disabled={!classData?.code}>
                    <Copy className="mr-2 h-4 w-4" />
                    {t('classDetails.copyCode')}
                  </Button>
                  <Badge variant="outline" className="font-mono text-lg px-4 py-1">
                    {classData?.code || '------'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>
                    {classData.studentCount}{' '}
                    {t('classCard.students', { count: classData.studentCount })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span>
                    {formatDate(classData?.createdAt)
                      ? `${t('classDetails.created')} ${formatDate(classData.createdAt)}`
                      : t('classDetails.created')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="students" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                {t('classDetails.tabs.students')}
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {t('classDetails.tabs.documents')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="students" className="mt-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{t('classDetails.studentsSection.title')}</CardTitle>
                      <CardDescription>
                        {t('classDetails.studentsSection.description')}
                      </CardDescription>
                    </div>
                    <Button onClick={() => setInviteDialogOpen(true)}>
                      <UserPlus className="mr-2 h-4 w-4" />
                      {t('classDetails.inviteStudents')}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <StudentList students={students} onRemoveStudent={handleRemoveStudent} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('classDetails.documentsSection.title')}</CardTitle>
                  <CardDescription>
                    {t('classDetails.documentsSection.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TeacherClassDocuments classId={classId} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <InviteStudentsDialog
            open={inviteDialogOpen}
            onOpenChange={setInviteDialogOpen}
            onInvite={handleInvite}
            onUploadCsv={handleUploadCsv}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
