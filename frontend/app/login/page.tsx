'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function LoginPageContent() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sessionExpired, setSessionExpired] = useState(false);
  const { t } = useTranslation('common');

  useEffect(() => {
    // Redirect to dashboard if already authenticated
    if (!isLoading && user) {
      router.push('/dashboard');
    }

    // Check for session expired error
    const error = searchParams.get('error');
    if (error === 'session_expired') {
      setSessionExpired(true);
    }
  }, [user, isLoading, router, searchParams]);

  // Show nothing while checking auth or redirecting
  if (isLoading || user) {
    return null;
  }

  return (
    <div className="space-y-4">
      {sessionExpired && (
        <Alert variant="destructive" className="max-w-sm mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{t('sessionExpired')}</AlertDescription>
        </Alert>
      )}
      <LoginForm />
    </div>
  );
}

export default function LoginPage() {
  const { t } = useTranslation('common');
  return (
    <Suspense fallback={<div className="max-w-sm mx-auto">{t('loading')}</div>}>
      <LoginPageContent />
    </Suspense>
  );
}
