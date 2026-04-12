'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui-custom/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Crown,
  Users,
  GraduationCap,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import {
  getCurrentSubscription,
  type SubscriptionResponse,
} from '@/lib/services/api-subscription.service';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function SubscriptionPage() {
  const { t } = useTranslation('subscription');
  const [subscription, setSubscription] = useState<SubscriptionResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      setLoading(true);
      const data = await getCurrentSubscription();
      setSubscription(data);
    } catch (error) {
      console.error('Failed to load subscription:', error);
      toast.error(t('loadError'));
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'FREE':
        return 'bg-gray-100 text-gray-800';
      case 'PRO':
        return 'bg-blue-100 text-blue-800';
      case 'PRO_PLUS':
        return 'bg-purple-100 text-purple-800';
      case 'ENTERPRISE':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'FREE':
        return <FileText className="h-5 w-5" />;
      case 'PRO':
      case 'PRO_PLUS':
        return <Crown className="h-5 w-5" />;
      case 'ENTERPRISE':
        return <Crown className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const formatNumber = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'Unlimited';
    return value.toLocaleString();
  };

  const calculatePercentage = (used: number | undefined, total: number | null | undefined) => {
    if (total === null || total === undefined || used === undefined) return 0;
    return Math.min(100, Math.round((used / total) * 100));
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-8 px-4 max-w-6xl">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="grid gap-6">
            <Skeleton className="h-48" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!subscription) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-8 px-4 max-w-6xl">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <XCircle className="h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('errorLoading')}</h3>
              <Button onClick={loadSubscription}>{t('retry')}</Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const { tier, status, limits, usage, limitsReached, upgradeNeeded } = subscription;
  const isFree = tier === 'FREE';

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <PageHeader title={t('title')} subtitle={t('subtitle')} />

        {/* Current Plan Card */}
        <Card className={cn('mb-6', upgradeNeeded && 'border-amber-500')}>
          {' '}
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn('p-2 rounded-lg', getTierColor(tier))}>{getTierIcon(tier)}</div>
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    {t(`tiers.${tier}`)}
                    <Badge variant={status === 'ACTIVE' ? 'default' : 'destructive'}>
                      {t(`status.${status}`)}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {isFree ? t('freeDescription') : t('paidDescription')}
                  </CardDescription>
                </div>
              </div>
              {isFree && (
                <Link href="/dashboard/pricing">
                  <Button size="lg">
                    <Crown className="h-4 w-4 mr-2" />
                    {t('upgrade')}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {upgradeNeeded && (
              <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <span className="text-amber-800 font-medium">{t('approachingLimit')}</span>
              </div>
            )}

            {!isFree && (
              <div className="text-sm text-muted-foreground">
                {t('currentPeriodEnds')}:{' '}
                {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Usage Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Classes */}
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                {t('usage.classes')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between mb-2">
                <div className="text-2xl font-bold">
                  {usage.currentClasses ?? 0}
                  <span className="text-muted-foreground text-lg font-normal">
                    {' '}
                    / {formatNumber(limits.maxClasses)}
                  </span>
                </div>
                {limitsReached.classes && limits.maxClasses !== null && (
                  <Badge variant="destructive">{t('limitReached')}</Badge>
                )}
              </div>
              <Progress
                value={calculatePercentage(usage.currentClasses ?? 0, limits.maxClasses)}
                className={cn(
                  limits.maxClasses !== null && limitsReached.classes
                    ? 'bg-red-100'
                    : limits.maxClasses !== null &&
                        (usage.currentClasses ?? 0) >= limits.maxClasses - 1
                      ? 'bg-amber-100'
                      : ''
                )}
              />
              {limits.maxClasses !== null &&
                (usage.currentClasses ?? 0) >= limits.maxClasses - 1 && (
                  <p className="text-xs text-amber-600 mt-2">
                    {t('warnings.classes', {
                      remaining: limits.maxClasses - (usage.currentClasses ?? 0),
                    })}
                  </p>
                )}
            </CardContent>
          </Card>

          {/* Students */}
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                {t('usage.students')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between mb-2">
                <div className="text-2xl font-bold">
                  {usage.currentStudents ?? 0}
                  <span className="text-muted-foreground text-lg font-normal">
                    {' '}
                    / {formatNumber(limits.maxStudents)}
                  </span>
                </div>
                {limitsReached.students && limits.maxStudents !== null && (
                  <Badge variant="destructive">{t('limitReached')}</Badge>
                )}
              </div>
              <Progress
                value={calculatePercentage(usage.currentStudents ?? 0, limits.maxStudents)}
                className={cn(
                  limits.maxStudents !== null && limitsReached.students
                    ? 'bg-red-100'
                    : limits.maxStudents !== null &&
                        (usage.currentStudents ?? 0) >= limits.maxStudents - 5
                      ? 'bg-amber-100'
                      : ''
                )}
              />
              {limits.maxStudents !== null &&
                (usage.currentStudents ?? 0) >= limits.maxStudents - 5 && (
                  <p className="text-xs text-amber-600 mt-2">
                    {t('warnings.students', {
                      remaining: limits.maxStudents - (usage.currentStudents ?? 0),
                    })}
                  </p>
                )}
            </CardContent>
          </Card>

          {/* Exams */}
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {t('usage.exams')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between mb-2">
                <div className="text-2xl font-bold">
                  {usage.examsCreatedThisMonth ?? 0}
                  <span className="text-muted-foreground text-lg font-normal">
                    {' '}
                    / {formatNumber(limits.maxExamsPerMonth)}
                  </span>
                </div>
                {limitsReached.exams && limits.maxExamsPerMonth !== null && (
                  <Badge variant="destructive">{t('limitReached')}</Badge>
                )}
              </div>
              <Progress
                value={calculatePercentage(
                  usage.examsCreatedThisMonth ?? 0,
                  limits.maxExamsPerMonth
                )}
                className={cn(
                  limits.maxExamsPerMonth !== null && limitsReached.exams
                    ? 'bg-red-100'
                    : limits.maxExamsPerMonth !== null &&
                        (usage.examsCreatedThisMonth ?? 0) >= limits.maxExamsPerMonth - 2
                      ? 'bg-amber-100'
                      : ''
                )}
              />
              {limits.maxExamsPerMonth !== null &&
                (usage.examsCreatedThisMonth ?? 0) >= limits.maxExamsPerMonth - 2 && (
                  <p className="text-xs text-amber-600 mt-2">
                    {t('warnings.exams', {
                      remaining: limits.maxExamsPerMonth - (usage.examsCreatedThisMonth ?? 0),
                    })}
                  </p>
                )}
            </CardContent>
          </Card>
        </div>

        {/* Features List */}
        <Card>
          <CardHeader>
            <CardTitle>{t('features.title')}</CardTitle>
            <CardDescription>{t('features.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>
                  {limits.maxQuestionsPerExam === null
                    ? t('features.maxQuestionsUnlimited')
                    : t('features.maxQuestions', { count: limits.maxQuestionsPerExam })}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>
                  {limits.maxDocumentsPerExam === null
                    ? t('features.maxDocumentsUnlimited')
                    : t('features.maxDocuments', { count: limits.maxDocumentsPerExam })}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>{t('features.aiModel', { model: limits.aiModel })}</span>
              </div>
              <div className="flex items-center gap-3">
                {limits.hasAdvancedAnalytics ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-gray-400" />
                )}
                <span className={!limits.hasAdvancedAnalytics ? 'text-gray-500' : ''}>
                  {t('features.advancedAnalytics')}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {!limits.hasBranding ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-gray-400" />
                )}
                <span className={limits.hasBranding ? 'text-gray-500' : ''}>
                  {t('features.noBranding')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
