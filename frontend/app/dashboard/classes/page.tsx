'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui-custom/PageHeader';
import { ClassList } from '@/features/classes/components/ClassList';
import { CreateClassForm } from '@/features/classes/components/CreateClassForm';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { listClasses, type Class } from '@/features/classes/services/classes-api';
import { useAuth } from '@/features/auth/context/AuthContext';
import type { ClassSummary } from '@/features/classes/types';

export default function ClassesPage() {
  const { t } = useTranslation('classes');
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const result = await listClasses();
      const transformedClasses: ClassSummary[] = result.classes.map((cls) => ({
        id: cls.id,
        name: cls.name,
        code: cls.code,
        description: cls.description ?? null,
        studentCount: cls.studentCount,
        color: cls.color ?? null,
        createdAt: new Date(cls.createdAt),
      }));
      setClasses(transformedClasses);
    } catch (error) {
      console.error('Failed to load classes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  const handleClassCreated = () => {
    loadClasses();
    setCreateDialogOpen(false);
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <PageHeader
          title={t('title')}
          subtitle={t('subtitle')}
          name={user?.firstName}
          action={
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('createClass')}
            </Button>
          }
        />

        <ClassList classes={classes} loading={loading} onRefresh={loadClasses} />

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('createClassForm.title')}</DialogTitle>
            </DialogHeader>
            <CreateClassForm
              onSuccess={handleClassCreated}
              onCancel={() => setCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
