'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { LanguageSelector } from '@/features/settings/components/LanguageSelector';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Settings as SettingsIcon, User, Bell, Shield } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="mb-2 text-4xl font-bold tracking-tight">Settings</h1>
            <p className="text-lg text-muted-foreground">
              Manage your account settings and preferences
            </p>
          </div>

          {/* Settings Sections */}
          <div className="mx-auto max-w-4xl space-y-6">
            {/* Profile Section */}
            <div className="rounded-lg border bg-white p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-2">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Profile</h2>
                  <p className="text-sm text-gray-500">Your personal information</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={`${user?.firstName} ${user?.lastName}`}
                    disabled
                    className="block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={user?.email}
                    disabled
                    className="block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Language Section */}
            <div className="rounded-lg border bg-white p-6">
              <div className="mb-4">
                <h2 className="text-xl font-bold">Language & Region</h2>
                <p className="text-sm text-gray-500">Choose your preferred language</p>
              </div>
              <LanguageSelector />
            </div>

            {/* Notifications Section - Placeholder */}
            <div className="rounded-lg border bg-white p-6 opacity-50">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-lg bg-gray-100 p-2">
                  <Bell className="h-5 w-5 text-gray-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-400">Notifications</h2>
                  <p className="text-sm text-gray-400">Coming soon</p>
                </div>
              </div>
            </div>

            {/* Security Section - Placeholder */}
            <div className="rounded-lg border bg-white p-6 opacity-50">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-lg bg-gray-100 p-2">
                  <Shield className="h-5 w-5 text-gray-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-400">Security</h2>
                  <p className="text-sm text-gray-400">Coming soon</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
