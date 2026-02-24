'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { GraduationCap, Plus, Users, BookOpen, ArrowRight } from 'lucide-react';
import { getMyClasses, type Class } from '@/features/classes/services/classes-api';

export default function StudentClassesPage() {
  const { t } = useTranslation('student');
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const data = await getMyClasses();
      setClasses(data);
    } catch (err) {
      console.error('Failed to load classes:', err);
      setError(t('classes.errors.loadFailed'));
      toast.error(t('classes.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">{t('classes.title')}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-4 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">{t('classes.title')}</h1>
        <Card className="p-6 text-center">
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={loadClasses}>{t('errors.retry')}</Button>
        </Card>
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{t('classes.title')}</h1>
          <Link href="/student/join">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t('classes.joinClass')}
            </Button>
          </Link>
        </div>
        <Card className="p-12 text-center">
          <GraduationCap className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t('classes.noClasses')}</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            {t('classes.noClassesDescription')}
          </p>
          <Link href="/student/join">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t('classes.joinClass')}
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('classes.title')}</h1>
        <Link href="/student/join">
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            {t('classes.joinClass')}
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map((cls) => (
          <Card key={cls.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{cls.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Code: <Badge variant="secondary">{cls.code}</Badge>
                  </p>
                </div>
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ backgroundColor: cls.color || '#6366f1', color: '#fff' }}
                >
                  {cls.name.charAt(0).toUpperCase()}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {cls.description && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{cls.description}</p>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{cls.studentCount || 0}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    <span>{t('classes.exams')}</span>
                  </div>
                </div>
                <Link href={`/student/classes/${cls.id}`}>
                  <Button size="sm" variant="ghost">
                    {t('classes.view')}
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
