'use client';

import Link from 'next/link';
import { Search, Bell, Sparkles, LogOut, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function TopNavigation() {
  const { t } = useTranslation('common');
  const { user, logout } = useAuth();

  const getUserInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4 md:px-6">
        {/* Logo */}
        <div className="flex items-center gap-2 mr-8">
          <img src="/logo.png" alt="Formydable" className="h-8 w-8 rounded-lg object-cover" />
          <Link
            href={user?.role === 'STUDENT' ? '/student/exams' : '/dashboard'}
            className="font-semibold text-lg"
          >
            Formydable
          </Link>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-md mr-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search resources..." className="pl-9 bg-muted/50" />
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 flex-1">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
          >
            Dashboard
          </Link>
          <Link
            href="/library"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            My Library
          </Link>
          <Link
            href="/exams"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Exams
          </Link>
          <Link
            href="/settings"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Settings
          </Link>
        </nav>

        {/* User Actions */}
        <div className="flex items-center gap-4 ml-auto">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive" />
          </Button>

          {/* User Dropdown Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                  {user ? getUserInitials(user.firstName, user.lastName) : t('sidebar.guest')}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">
                    {user ? `${user.firstName} ${user.lastName}` : t('topNav.userPlaceholder')}
                  </p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Profile Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={logout}
                className="cursor-pointer text-destructive"
                data-testid="logout-button"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
