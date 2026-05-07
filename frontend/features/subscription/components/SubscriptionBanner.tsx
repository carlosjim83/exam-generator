'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, X, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import {
  getCurrentSubscription,
  getLimitWarning,
  type SubscriptionResponse,
} from '@/lib/services/api-subscription.service';

interface SubscriptionBannerProps {
  limitType?: 'classes' | 'students' | 'exams';
  showIfBlocked?: boolean;
}

export function SubscriptionBanner({ limitType, showIfBlocked = true }: SubscriptionBannerProps) {
  const { t } = useTranslation('subscription');
  const [subscription, setSubscription] = useState<SubscriptionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const data = await getCurrentSubscription();
      setSubscription(data);
    } catch (error) {
      console.error('Failed to load subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || dismissed || !subscription) return null;

  // If user is not on free tier, don't show
  if (subscription.tier !== 'FREE') return null;

  // Check if any limit is reached
  const { limitsReached } = subscription;

  if (limitsReached.classes || limitsReached.students || limitsReached.exams) {
    if (!showIfBlocked) return null;

    let message = t('banner.limitReached');
    let action = t('banner.upgradeNow');

    if (limitsReached.classes) {
      message = t('banner.classesLimitReached');
    } else if (limitsReached.students) {
      message = t('banner.studentsLimitReached');
    } else if (limitsReached.exams) {
      message = t('banner.examsLimitReached');
    }

    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
          <div className="flex-1">
            <p className="text-foreground font-medium">{message}</p>
            <p className="text-destructive text-sm mt-1">{t('banner.upgradePrompt')}</p>
          </div>
          <Link href="/dashboard/pricing">
            <Button size="sm" className="bg-destructive hover:bg-destructive/90">
              <Crown className="h-4 w-4 mr-1" />
              {action}
            </Button>
          </Link>
          <button
            onClick={() => setDismissed(true)}
            className="text-destructive hover:text-destructive/80 p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // Check for warnings
  if (!limitType) return null;

  const warning = getLimitWarning(limitType, subscription);
  if (!warning) return null;

  return (
    <div className={cn('border rounded-lg p-4 mb-6', 'bg-amber-50 border-amber-200')}>
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600" />
        <div className="flex-1">
          <p className="text-amber-800">{warning}</p>
        </div>
        <Link href="/dashboard/pricing">
          <Button
            variant="outline"
            size="sm"
            className="border-amber-600 text-amber-700 hover:bg-amber-100"
          >
            {t('banner.upgrade')}
          </Button>
        </Link>
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-600 hover:text-amber-800 p-1"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * Hook to check if user is approaching limits and show warning
 */
export function useSubscriptionWarning(limitType: 'classes' | 'students' | 'exams') {
  const [warning, setWarning] = useState<string | null>(null);
  const [isLimitReached, setIsLimitReached] = useState(false);

  useEffect(() => {
    const checkLimits = async () => {
      try {
        const subscription = await getCurrentSubscription();

        if (subscription.tier !== 'FREE') {
          setWarning(null);
          setIsLimitReached(false);
          return;
        }

        const { limitsReached } = subscription;

        if (
          (limitType === 'classes' && limitsReached.classes) ||
          (limitType === 'students' && limitsReached.students) ||
          (limitType === 'exams' && limitsReached.exams)
        ) {
          setIsLimitReached(true);
          setWarning(null);
          return;
        }

        const warningMsg = getLimitWarning(limitType, subscription);
        setWarning(warningMsg);
        setIsLimitReached(false);
      } catch (error) {
        console.error('Failed to check subscription limits:', error);
      }
    };

    checkLimits();
  }, [limitType]);

  return { warning, isLimitReached };
}
