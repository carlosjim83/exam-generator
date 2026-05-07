'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';

function AuthCallbackContent() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authentication...');
  const { t } = useTranslation('common');

  useEffect(() => {
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    const handleCallback = async () => {
      try {
        // Backend sets httpOnly cookies during OAuth redirect.
        // Call /api/auth/me to get user data using the secure cookie.
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/me`,
          {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          }
        );

        if (!response.ok) {
          throw new Error('Authentication failed');
        }

        const data = await response.json();

        // Update auth context
        setUser({
          id: data.id,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          role: data.role,
          provider: data.provider || 'GOOGLE',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });

        setStatus('success');
        setMessage(`Welcome, ${data.firstName}!`);

        // Redirect to dashboard after 1.5 seconds
        timeouts.push(
          setTimeout(() => {
            router.push('/dashboard');
          }, 1500)
        );
      } catch (error: unknown) {
        console.error('[OAuth Callback] Error:', error);
        setStatus('error');
        setMessage(
          error instanceof Error ? error.message : 'Authentication failed. Please try again.'
        );

        // Redirect to login after 3 seconds
        timeouts.push(
          setTimeout(() => {
            router.push('/login');
          }, 3000)
        );
      }
    };

    handleCallback();

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [setUser, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Image
            src="/logo.png"
            alt={t('common:appName')}
            className="h-12 w-12 rounded-xl object-cover"
            width={48}
            height={48}
          />
          <h1 className="text-3xl font-bold">{t('common:appName')}</h1>
        </div>

        <Card className="shadow-xl">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              {/* Status Icon */}
              {status === 'loading' && <Loader2 className="h-16 w-16 text-primary animate-spin" />}
              {status === 'success' && <CheckCircle className="h-16 w-16 text-green-600" />}
              {status === 'error' && <XCircle className="h-16 w-16 text-destructive" />}

              {/* Status Message */}
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-semibold">
                  {status === 'loading' && 'Authenticating...'}
                  {status === 'success' && 'Success!'}
                  {status === 'error' && 'Authentication Failed'}
                </h2>
                <p className="text-muted-foreground">{message}</p>
              </div>

              {/* Progress Indicator */}
              {status === 'loading' && (
                <div className="w-full max-w-xs">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary animate-pulse" style={{ width: '60%' }} />
                  </div>
                </div>
              )}

              {/* Auto-redirect Message */}
              {status !== 'loading' && (
                <p className="text-xs text-muted-foreground">Redirecting in a moment...</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <Loader2 className="h-16 w-16 text-primary animate-spin" />
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
