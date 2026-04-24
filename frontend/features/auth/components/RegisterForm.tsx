'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Image from 'next/image';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../services/api.service';
import { AlertCircle, GraduationCap, BookOpen } from 'lucide-react';
import { OAuthButtons } from './OAuthButtons';
import { colors } from '@/lib/colors';

export function RegisterForm() {
  const searchParams = useSearchParams();
  const { t } = useTranslation('common');
  const { register } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Set role from URL query param if present, default to TEACHER
  const roleParam = searchParams.get('role');
  const initialRole: 'TEACHER' | 'STUDENT' = roleParam === 'student' ? 'STUDENT' : 'TEACHER';
  const [role, setRole] = useState<'TEACHER' | 'STUDENT'>(initialRole);

  const [error, setError] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Update role if query param changes
  useEffect(() => {
    if (roleParam === 'student') {
      setRole('STUDENT');
    } else if (roleParam === 'teacher') {
      setRole('TEACHER');
    }
  }, [roleParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setValidationErrors({});

    // Client-side validation
    if (password !== confirmPassword) {
      setError(t('auth.passwordsDoNotMatch'));
      return;
    }

    if (password.length < 8) {
      setError(t('auth.passwordTooShort'));
      return;
    }

    setIsLoading(true);

    try {
      await register(email, password, firstName, lastName, role);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.errors) {
          setValidationErrors(err.errors);
        } else {
          setError(err.message);
        }
      } else {
        setError(t('unexpectedError'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Dynamic color scheme based on role
  const roleColors = {
    TEACHER: {
      bg: 'from-blue-50 to-indigo-100',
      accent: 'bg-blue-600 hover:bg-blue-700',
      accentLight: 'bg-blue-100',
      accentText: 'text-blue-600',
      focusRing: 'focus-visible:ring-blue-500',
      icon: GraduationCap,
    },
    STUDENT: {
      bg: 'from-emerald-50 to-teal-100',
      accent: 'bg-emerald-600 hover:bg-emerald-700',
      accentLight: 'bg-emerald-100',
      accentText: 'text-emerald-600',
      focusRing: 'focus-visible:ring-emerald-500',
      icon: BookOpen,
    },
  };

  const currentTheme = roleColors[role];
  const Icon = currentTheme.icon;

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ backgroundColor: colors.logo.bg }}
    >
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
          <CardHeader>
            <CardTitle className="text-2xl">{t('auth.createAccount')}</CardTitle>
            <CardDescription>{t('auth.getStarted')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Alert */}
              {error && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                  <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-destructive">{error}</p>
                  </div>
                </div>
              )}

              {/* Role Toggle Selector */}
              <div className="space-y-3">
                <label className="text-sm font-medium">{t('auth.iAmA')}</label>
                <div className="relative flex items-center bg-muted/50 rounded-lg p-1.5">
                  {/* Sliding Indicator */}
                  <div
                    className={`absolute h-[calc(100%-12px)] w-[calc(50%-6px)] ${currentTheme.accent} rounded-md shadow-md transition-all duration-300 ease-out`}
                    style={{
                      transform:
                        role === 'TEACHER' ? 'translateX(0)' : 'translateX(calc(100% + 12px))',
                    }}
                  />

                  {/* Teacher Button */}
                  <button
                    type="button"
                    onClick={() => setRole('TEACHER')}
                    disabled={isLoading}
                    className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md font-medium text-sm transition-colors duration-200 ${
                      role === 'TEACHER'
                        ? 'text-white'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>{t('auth.teacher')}</span>
                  </button>

                  {/* Student Button */}
                  <button
                    type="button"
                    onClick={() => setRole('STUDENT')}
                    disabled={isLoading}
                    className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md font-medium text-sm transition-colors duration-200 ${
                      role === 'STUDENT'
                        ? 'text-white'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>{t('auth.student')}</span>
                  </button>
                </div>

                {/* Role Badge Indicator */}
                <div className="flex items-center justify-center gap-2">
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${currentTheme.accentLight} transition-colors duration-300`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${currentTheme.accentText}`} />
                    <span className={`text-xs font-medium ${currentTheme.accentText}`}>
                      {t('auth.signingUpAs')}{' '}
                      {role === 'TEACHER' ? t('auth.teacher') : t('auth.student')}
                    </span>
                  </div>
                </div>
              </div>

              {/* First Name Input */}
              <div className="space-y-2">
                <label htmlFor="firstName" className="text-sm font-medium">
                  {t('firstName')}
                </label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  disabled={isLoading}
                  className={currentTheme.focusRing}
                />
                {validationErrors.firstName && (
                  <p className="text-xs text-destructive">{validationErrors.firstName[0]}</p>
                )}
              </div>

              {/* Last Name Input */}
              <div className="space-y-2">
                <label htmlFor="lastName" className="text-sm font-medium">
                  {t('lastName')}
                </label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  disabled={isLoading}
                  className={currentTheme.focusRing}
                />
                {validationErrors.lastName && (
                  <p className="text-xs text-destructive">{validationErrors.lastName[0]}</p>
                )}
              </div>

              {/* Email Input */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  {t('email')}
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder={
                    role === 'TEACHER' ? 'professor@university.edu' : 'student@university.edu'
                  }
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className={currentTheme.focusRing}
                />
                {validationErrors.email && (
                  <p className="text-xs text-destructive">{validationErrors.email[0]}</p>
                )}
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  {t('password')}
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className={currentTheme.focusRing}
                />
                {validationErrors.password && (
                  <p className="text-xs text-destructive">{validationErrors.password[0]}</p>
                )}
              </div>

              {/* Confirm Password Input */}
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium">
                  {t('confirmPassword')}
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className={currentTheme.focusRing}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className={`w-full ${currentTheme.accent} transition-colors duration-300`}
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? t('auth.signingUp') + '...' : t('auth.signUp')}
              </Button>

              {/* Login Link */}
              <p className="text-center text-sm text-muted-foreground">
                {t('auth.alreadyHaveAccount')}{' '}
                <Link
                  href="/login"
                  className={`font-medium ${currentTheme.accentText} hover:underline transition-colors duration-200`}
                >
                  {t('auth.signIn')}
                </Link>
              </p>
            </form>

            {/* OAuth Buttons - Outside form to prevent form submission */}
            <div className="mt-4">
              <OAuthButtons mode="register" role={role} disabled={isLoading} />
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          By creating an account, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
