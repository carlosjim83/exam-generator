'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Chrome } from 'lucide-react';
import { RoleSelectionModal } from './RoleSelectionModal';

interface OAuthButtonsProps {
  mode: 'login' | 'register';
  role?: 'TEACHER' | 'STUDENT'; // Role for register mode (optional)
  disabled?: boolean;
}

export function OAuthButtons({ mode, role, disabled = false }: OAuthButtonsProps) {
  const { t } = useTranslation('common');
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Check if mock OAuth is enabled via environment variable
  const useMock = process.env.NEXT_PUBLIC_USE_MOCK_OAUTH === 'true';
  const oauthEndpoint = useMock ? '/api/auth/google/mock' : '/api/auth/google';

  const handleGoogleClick = () => {
    // If in register mode with a pre-selected role, use it directly
    if (mode === 'register' && role) {
      redirectToOAuth(role);
    } else {
      // Otherwise, open modal to select role
      setIsModalOpen(true);
    }
  };

  const redirectToOAuth = (selectedRole: 'TEACHER' | 'STUDENT') => {
    const url = new URL(`${API_URL}${oauthEndpoint}`);
    url.searchParams.set('role', selectedRole);
    window.location.href = url.toString();
  };

  const actionText = mode === 'login' ? t('auth.signIn') : t('auth.signUp');

  return (
    <>
      <div className="space-y-3">
        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              {t('auth.orContinueWith')}
            </span>
          </div>
        </div>

        {/* OAuth Button */}
        <Button
          type="button"
          variant="outline"
          onClick={handleGoogleClick}
          disabled={disabled}
          className="w-full"
        >
          <Chrome className="mr-2 h-4 w-4" />
          {actionText} {t('common.withGoogle')}
          {useMock && <span className="ml-2 text-xs text-muted-foreground">(Mock)</span>}
        </Button>
      </div>

      {/* Role Selection Modal */}
      <RoleSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectRole={redirectToOAuth}
      />
    </>
  );
}
