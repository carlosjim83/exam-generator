'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { LanguageSelector } from '@/features/settings/components/LanguageSelector';
import { ThemeSelector } from '@/features/settings/components/ThemeSelector';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Settings as SettingsIcon, User, Bell, Shield, Palette } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const { t } = useTranslation('settings');

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="mb-2 text-4xl font-bold tracking-tight">
              <span suppressHydrationWarning>{t('title')}</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              <span suppressHydrationWarning>{t('subtitle')}</span>
            </p>
          </div>

          {/* Settings Sections */}
          <div className="mx-auto max-w-4xl space-y-6">
            {/* Profile Section */}
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-card-foreground">
                    <span suppressHydrationWarning>{t('profile.title')}</span>
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    <span suppressHydrationWarning>{t('profile.subtitle')}</span>
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-card-foreground">
                    <span suppressHydrationWarning>{t('profile.name')}</span>
                  </label>
                  <input
                    type="text"
                    value={`${user?.firstName} ${user?.lastName}`}
                    disabled
                    className="block w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-card-foreground">
                    <span suppressHydrationWarning>{t('profile.email')}</span>
                  </label>
                  <input
                    type="email"
                    value={user?.email}
                    disabled
                    className="block w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground"
                  />
                </div>
              </div>
            </div>

            {/* Preferences Section */}
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Palette className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-card-foreground">
                    <span suppressHydrationWarning>{t('preferences.title')}</span>
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    <span suppressHydrationWarning>{t('preferences.subtitle')}</span>
                  </p>
                </div>
              </div>
              <div className="space-y-6">
                {/* Language */}
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-card-foreground">
                    <span suppressHydrationWarning>{t('preferences.language.title')}</span>
                  </h3>
                  <p className="mb-3 text-sm text-muted-foreground">
                    <span suppressHydrationWarning>{t('preferences.language.subtitle')}</span>
                  </p>
                  <LanguageSelector />
                </div>

                {/* Theme */}
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-card-foreground">
                    <span suppressHydrationWarning>{t('preferences.theme.title')}</span>
                  </h3>
                  <p className="mb-3 text-sm text-muted-foreground">
                    <span suppressHydrationWarning>{t('preferences.theme.subtitle')}</span>
                  </p>
                  <ThemeSelector />
                </div>
              </div>
            </div>

            {/* Notifications Section - Placeholder */}
            <div className="rounded-lg border border-border bg-card p-6 opacity-50">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-lg bg-muted p-2">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-muted-foreground">
                    <span suppressHydrationWarning>{t('notifications.title')}</span>
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    <span suppressHydrationWarning>{t('notifications.subtitle')}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Security Section - Placeholder */}
            <div className="rounded-lg border border-border bg-card p-6 opacity-50">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-lg bg-muted p-2">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-muted-foreground">
                    <span suppressHydrationWarning>{t('security.title')}</span>
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    <span suppressHydrationWarning>{t('security.subtitle')}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
