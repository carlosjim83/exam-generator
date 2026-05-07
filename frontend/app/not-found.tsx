'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  const { t } = useTranslation('common');

  return (
    <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
        <h2 className="text-2xl font-semibold">{t('notFoundTitle')}</h2>
        <p className="text-muted-foreground">{t('unexpectedError')}</p>
        <Button asChild>
          <Link href="/">{t('goHome')}</Link>
        </Button>
      </div>
    </div>
  );
}
