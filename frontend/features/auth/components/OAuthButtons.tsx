'use client';

import { Button } from '@/components/ui/button';
import { Chrome, Github } from 'lucide-react';

interface OAuthButtonsProps {
  mode: 'login' | 'register';
  disabled?: boolean;
}

export function OAuthButtons({ mode, disabled = false }: OAuthButtonsProps) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const handleGoogleLogin = () => {
    // Redirect to backend Google OAuth flow
    window.location.href = `${API_URL}/auth/google`;
  };

  const handleGithubLogin = () => {
    // Redirect to backend GitHub OAuth flow
    window.location.href = `${API_URL}/auth/github`;
  };

  const handleMicrosoftLogin = () => {
    // Redirect to backend Microsoft OAuth flow
    window.location.href = `${API_URL}/auth/microsoft`;
  };

  const actionText = mode === 'login' ? 'Sign in' : 'Sign up';

  return (
    <div className="space-y-3">
      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>

      {/* OAuth Buttons */}
      <div className="grid gap-2">
        {/* Google */}
        <Button
          type="button"
          variant="outline"
          onClick={handleGoogleLogin}
          disabled={disabled}
          className="w-full"
        >
          <Chrome className="mr-2 h-4 w-4" />
          {actionText} with Google
        </Button>

        {/* GitHub */}
        <Button
          type="button"
          variant="outline"
          onClick={handleGithubLogin}
          disabled={disabled}
          className="w-full"
        >
          <Github className="mr-2 h-4 w-4" />
          {actionText} with GitHub
        </Button>

        {/* Microsoft */}
        <Button
          type="button"
          variant="outline"
          onClick={handleMicrosoftLogin}
          disabled={disabled}
          className="w-full"
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z" />
          </svg>
          {actionText} with Microsoft
        </Button>
      </div>
    </div>
  );
}
