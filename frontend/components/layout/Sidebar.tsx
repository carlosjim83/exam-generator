'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useAuth } from '@/features/auth/context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  ClipboardList,
  Upload,
  Settings,
  LogOut,
  GraduationCap,
  Users,
} from 'lucide-react';

interface NavItem {
  labelKey: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: Array<'TEACHER' | 'STUDENT'>; // If specified, only show for these roles
}

// Teacher navigation
const teacherNavigation: NavItem[] = [
  {
    labelKey: 'dashboard:navigation.dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    labelKey: 'common:navigation.myClasses',
    href: '/dashboard/classes',
    icon: Users,
  },
  {
    labelKey: 'dashboard:navigation.myLibrary',
    href: '/dashboard/documents',
    icon: FileText,
  },
  {
    labelKey: 'dashboard:navigation.myExams',
    href: '/dashboard/exams',
    icon: ClipboardList,
  },
  {
    labelKey: 'dashboard:navigation.uploadDocument',
    href: '/dashboard/upload',
    icon: Upload,
  },
];

// Student navigation
const studentNavigation: NavItem[] = [
  {
    labelKey: 'common:navigation.dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['STUDENT'],
  },
  {
    labelKey: 'common:navigation.myClasses',
    href: '/student/classes',
    icon: Users,
    roles: ['STUDENT'],
  },
  {
    labelKey: 'common:navigation.myExams',
    href: '/student/exams',
    icon: GraduationCap,
    roles: ['STUDENT'],
  },
  {
    labelKey: 'common:navigation.joinClass',
    href: '/student/join',
    icon: GraduationCap,
    roles: ['STUDENT'],
  },
];

const secondaryNavigation: NavItem[] = [
  {
    labelKey: 'dashboard:navigation.settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useTranslation(['common', 'student']);
  const { user, logout } = useAuth();

  // Get navigation based on user role
  const getNavigation = () => {
    if (!user) return teacherNavigation;
    return user.role === 'STUDENT' ? studentNavigation : teacherNavigation;
  };

  const navigation = getNavigation();

  // Filter items by role if specified
  const canShowItem = (item: NavItem) => {
    if (!item.roles) return true;
    if (!user) return false;
    return item.roles.includes(user.role);
  };

  const getUserInitials = () => {
    if (!user) return '??';
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  };

  const getUserDisplayName = () => {
    if (!user) return t('sidebar.guest');
    return `${user.firstName} ${user.lastName}`;
  };

  const getLogoLink = () => {
    if (!user) return '/dashboard';
    return user.role === 'STUDENT' ? '/student/exams' : '/dashboard';
  };

  const isActive = (href: string) => {
    if (href === '/dashboard' || href === '/student/exams') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="flex h-screen w-64 flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-border px-6">
        <Link href={getLogoLink()} className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
            <svg
              className="h-5 w-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-card-foreground">ExamForge</h1>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {/* Primary Navigation - filtered by role */}
        <div className="space-y-1">
          {navigation.filter(canShowItem).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                <span suppressHydrationWarning>{t(item.labelKey)}</span>
              </Link>
            );
          })}
        </div>

        {/* Divider */}
        <div className="my-4 border-t border-border" />

        {/* Secondary Navigation */}
        <div className="space-y-1">
          {secondaryNavigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                <span suppressHydrationWarning>{t(item.labelKey)}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User Profile */}
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {getUserInitials()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-card-foreground">
              {getUserDisplayName()}
            </p>
            <p className="truncate text-xs text-muted-foreground">{user?.email || ''}</p>
          </div>
          <button
            onClick={logout}
            aria-label={t('common:logout')}
            className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            title={t('common:logout')}
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
