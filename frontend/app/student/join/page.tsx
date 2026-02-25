'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, Loader2, BookOpen, XCircle } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui-custom/PageHeader';
import { useAuth } from '@/features/auth/context/AuthContext';

export default function JoinClassPage() {
  const { t } = useTranslation('student');
  const { user } = useAuth();
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [classInfo, setClassInfo] = useState<{ id: string; name: string; teacher: string } | null>(
    null
  );
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const validateCode = async () => {
    if (!code.trim()) {
      setError(t('joinClass.errors.emptyCode'));
      return;
    }

    setValidating(true);
    setError('');

    try {
      const data = await apiClient.publicRequest<{ id: string; name: string; teacherName: string }>(
        `/api/classes/code/${encodeURIComponent(code.trim())}`
      );
      setClassInfo({
        id: data.id,
        name: data.name,
        teacher: data.teacherName,
      });
    } catch (err) {
      setError(t('joinClass.errors.notFound'));
      setClassInfo(null);
    } finally {
      setValidating(false);
    }
  };

  const joinClass = async () => {
    if (!classInfo) return;

    setLoading(true);
    setError('');

    try {
      await apiClient.post(`/api/classes/${classInfo.id}/join`, {});
      setSuccess(true);
      setCode('');
      setClassInfo(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('joinClass.errors.failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (classInfo) {
        joinClass();
      } else {
        validateCode();
      }
    }
  };

  if (success) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6">
          <PageHeader
            title={t('joinClass.title')}
            subtitle={t('joinClass.subtitle')}
            name={user?.firstName}
          />
          <div className="flex items-center justify-center min-h-[50vh] px-4">
            <Card className="w-full max-w-md">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl mb-2">{t('joinClass.success.title')}</CardTitle>
                    <CardDescription>{t('joinClass.success.message')}</CardDescription>
                  </div>
                  <Button onClick={() => router.push('/student/classes')} className="w-full">
                    {t('joinClass.success.goToDashboard')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <PageHeader
          title={t('joinClass.title')}
          subtitle={t('joinClass.subtitle')}
          name={user?.firstName}
        />
        <div className="flex items-center justify-center min-h-[50vh] px-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="h-12 w-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <CardDescription>{t('joinClass.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">{t('joinClass.codeLabel')}</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder={t('joinClass.codePlaceholder')}
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                  className="font-mono text-center text-lg"
                  maxLength={10}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                  <XCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {!classInfo ? (
                <Button
                  onClick={validateCode}
                  disabled={!code.trim() || validating}
                  className="w-full"
                >
                  {validating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('joinClass.validating')}
                    </>
                  ) : (
                    t('joinClass.validateButton')
                  )}
                </Button>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                    <CheckCircle className="h-4 w-4 flex-shrink-0" />
                    <span>
                      {t('joinClass.classFound')}: <strong>{classInfo.name}</strong>
                    </span>
                  </div>

                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <div className="text-sm">
                      <span className="text-muted-foreground">{t('joinClass.teacher')}:</span>{' '}
                      <span className="font-medium">{classInfo.teacher}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setClassInfo(null);
                        setError('');
                      }}
                      disabled={loading}
                      className="flex-1"
                    >
                      {t('joinClass.cancel')}
                    </Button>
                    <Button onClick={joinClass} disabled={loading} className="flex-1">
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t('joinClass.joining')}
                        </>
                      ) : (
                        t('joinClass.joinButton')
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
