'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui-custom/PageHeader';
import { ClassCard, type ClassCardData } from '@/features/classes/components/ClassCardUnified';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/context/AuthContext';
import { toast } from 'sonner';
import { Plus, GraduationCap } from 'lucide-react';
import { getMyClasses } from '@/features/classes/services/classes-api';

export default function StudentClassesPage() {
  const { t } = useTranslation('classes');
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [classes, setClasses] = useState<ClassCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadClasses();
    }
  }, [isAuthenticated]);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const data = await getMyClasses();
      const transformedClasses: ClassCardData[] = data.map((cls) => ({
        id: cls.id,
        name: cls.name,
        code: cls.code,
        description: cls.description ?? null,
        studentCount: cls.studentCount || 0,
        color: cls.color ?? null,
        // TODO: Add documentCount and examCount from backend
        documentCount: 0,
        examCount: 0,
      }));
      setClasses(transformedClasses);
    } catch (err) {
      console.error('Failed to load classes:', err);
      setError(t('classDetails.errors.loadDocumentsFailed'));
      toast.error(t('classDetails.errors.loadDocumentsFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6">
          <PageHeader title={t('title')} subtitle={t('subtitle')} name={user?.firstName} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6">
          <PageHeader title={t('title')} subtitle={t('subtitle')} name={user?.firstName} />
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={loadClasses}>{t('errors.retry')}</Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <PageHeader
          title={t('title')}
          subtitle={t('subtitle')}
          name={user?.firstName}
          action={
            <Link href="/student/join">
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                {t('createClass')}
              </Button>
            </Link>
          }
        />

        {classes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="bg-muted p-4 rounded-full mb-4">
              <GraduationCap className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{t('noClasses')}</h3>
            <p className="text-muted-foreground max-w-md mb-6">
              {t('createFirstClassDescription')}
            </p>
            <Link href="/student/join">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t('createClass')}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((classItem) => (
              <ClassCard
                key={classItem.id}
                classData={classItem}
                href={`/student/classes/${classItem.id}`}
                actionLabel={t('classCard.viewClass')}
                role="student"
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
