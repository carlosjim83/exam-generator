'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';

function AuthCallbackContent() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    const handleCallback = () => {
      try {
        // Extract tokens and user data from URL hash fragment
        const hash = window.location.hash.slice(1); // Remove leading '#'
        const params = new URLSearchParams(hash);

        const accessToken = params.get('accessToken');
        const refreshToken = params.get('refreshToken');
        const userId = params.get('userId');
        const email = params.get('email');
        const firstName = params.get('firstName');
        const lastName = params.get('lastName');
        const role = params.get('role') as 'TEACHER' | 'STUDENT';
        const provider = params.get('provider');

        // Validate required params
        if (
          !accessToken ||
          !refreshToken ||
          !userId ||
          !email ||
          !firstName ||
          !lastName ||
          !role
        ) {
          throw new Error('Missing required authentication parameters');
        }

        // Store tokens in localStorage
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);

        // Update auth context
        setUser({
          id: userId,
          email,
          firstName,
          lastName,
          role,
          provider: provider || 'GOOGLE',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        setStatus('success');
        setMessage(`Welcome, ${firstName}!`);

        // Redirect to dashboard after 1.5 seconds
        timeouts.push(
          setTimeout(() => {
            router.push('/dashboard');
          }, 1500)
        );
      } catch (error: any) {
        console.error('[OAuth Callback] Error:', error);
        setStatus('error');
        setMessage(error.message || 'Authentication failed. Please try again.');

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
            alt="Formydable"
            className="h-12 w-12 rounded-xl object-cover"
            width={48}
            height={48}
          />
          <h1 className="text-3xl font-bold">Formydable</h1>
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
