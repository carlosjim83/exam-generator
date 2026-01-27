'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../services/api.service';
import { Sparkles, AlertCircle, GraduationCap, BookOpen } from 'lucide-react';
import { OAuthButtons } from './OAuthButtons';

export function RegisterForm() {
  const { register } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'TEACHER' | 'STUDENT'>('TEACHER');
  const [error, setError] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setValidationErrors({});

    // Client-side validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
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
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Dynamic color scheme based on role
  const colors = {
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

  const currentTheme = colors[role];
  const Icon = currentTheme.icon;

  return (
    <div
      className={`min-h-screen flex items-center justify-center bg-gradient-to-br ${currentTheme.bg} px-4 py-12 transition-colors duration-500`}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div
            className={`flex items-center justify-center w-12 h-12 rounded-lg ${currentTheme.accent} transition-colors duration-300`}
          >
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold">ExamGen SaaS</h1>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">Create your account</CardTitle>
            <CardDescription>Get started with AI-powered exam generation</CardDescription>
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
                <label className="text-sm font-medium">I am a...</label>
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
                    <span>Teacher</span>
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
                    <span>Student</span>
                  </button>
                </div>

                {/* Role Badge Indicator */}
                <div className="flex items-center justify-center gap-2">
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${currentTheme.accentLight} transition-colors duration-300`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${currentTheme.accentText}`} />
                    <span className={`text-xs font-medium ${currentTheme.accentText}`}>
                      Signing up as {role === 'TEACHER' ? 'Teacher' : 'Student'}
                    </span>
                  </div>
                </div>
              </div>

              {/* First Name Input */}
              <div className="space-y-2">
                <label htmlFor="firstName" className="text-sm font-medium">
                  First Name
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
                  Last Name
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
                  Email
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
                  Password
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
                  Confirm Password
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
                {isLoading ? 'Creating account...' : 'Create account'}
              </Button>

              {/* OAuth Buttons */}
              <OAuthButtons mode="register" disabled={isLoading} />

              {/* Login Link */}
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className={`font-medium ${currentTheme.accentText} hover:underline transition-colors duration-200`}
                >
                  Sign in
                </Link>
              </p>
            </form>
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
