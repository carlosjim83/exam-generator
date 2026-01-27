'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sparkles, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    const handleCallback = () => {
      try {
        console.log('[OAuth Callback] Starting...');
        console.log('[OAuth Callback] SearchParams:', searchParams.toString());

        // Extract tokens and user data from URL params
        const accessToken = searchParams.get('accessToken');
        const refreshToken = searchParams.get('refreshToken');
        const userId = searchParams.get('userId');
        const email = searchParams.get('email');
        const firstName = searchParams.get('firstName');
        const lastName = searchParams.get('lastName');
        const role = searchParams.get('role') as 'TEACHER' | 'STUDENT';
        const provider = searchParams.get('provider');

        console.log('[OAuth Callback] Extracted data:', {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          userId,
          email,
          firstName,
          lastName,
          role,
          provider,
        });

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

        console.log('[OAuth Callback] Storing tokens...');
        // Store tokens in localStorage (using correct keys)
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);

        console.log('[OAuth Callback] Updating auth context...');
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

        console.log('[OAuth Callback] Success! Redirecting to dashboard...');
        setStatus('success');
        setMessage(`Welcome, ${firstName}!`);

        // Redirect to dashboard after 1.5 seconds
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      } catch (error: any) {
        console.error('[OAuth Callback] Error:', error);
        setStatus('error');
        setMessage(error.message || 'Authentication failed. Please try again.');

        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, setUser, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary">
            <Sparkles className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold">ExamGen SaaS</h1>
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
