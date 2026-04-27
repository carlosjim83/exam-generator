'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui-custom/PageHeader';
import { ClassCard, type ClassCardData } from '@/features/classes/components/ClassCardUnified';
import { CreateClassForm } from '@/features/classes/components/CreateClassForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, GraduationCap } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { listClasses } from '@/features/classes/services/classes-api';
import { useAuth } from '@/features/auth/context/AuthContext';
import { SubscriptionBanner } from '@/features/subscription/components/SubscriptionBanner';

export default function ClassesPage() {
  const { t } = useTranslation('classes');
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const result = await listClasses();
      const transformedClasses: ClassCardData[] = result.classes.map((cls) => ({
        id: cls.id,
        name: cls.name,
        code: cls.code,
        description: cls.description ?? null,
        studentCount: cls.studentCount,
        documentCount: cls.documentCount,
        examCount: cls.examCount,
        color: cls.color ?? null,
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

  const filteredClasses = classes.filter(
    (classItem) =>
      classItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      classItem.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

        {/* Subscription Banner */}
        <SubscriptionBanner limitType="classes" />

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Classes Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={`class-skeleton-${i}`} className="h-64 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="bg-muted p-4 rounded-full mb-4">
              <GraduationCap className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {searchTerm ? t('noResults') : t('noClasses')}
            </h3>
            <p className="text-muted-foreground max-w-md mb-6">
              {searchTerm ? t('noSearchResults') : t('createFirstClassDescription')}
            </p>
            {!searchTerm && (
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t('createClass')}
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClasses.map((classItem) => (
              <ClassCard
                key={classItem.id}
                classData={classItem}
                href={`/dashboard/classes/${classItem.id}`}
                actionLabel={t('classCard.manage')}
                role="teacher"
              />
            ))}
          </div>
        )}

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('createForm.title')}</DialogTitle>
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
