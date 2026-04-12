'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui-custom/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Check, X, Crown, Zap, Building2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  getCurrentSubscription,
  getSubscriptionPlans,
  type SubscriptionPlan,
  type SubscriptionResponse,
} from '@/lib/services/api-subscription.service';

export default function PricingPage() {
  const { t } = useTranslation('pricing');
  const [isYearly, setIsYearly] = useState(false);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<SubscriptionResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [plansData, subscriptionData] = await Promise.all([
        getSubscriptionPlans(isYearly ? 'yearly' : 'monthly'),
        getCurrentSubscription(),
      ]);
      setPlans(plansData.plans);
      setCurrentSubscription(subscriptionData);
    } catch (error) {
      console.error('Failed to load pricing data:', error);
      toast.error(t('loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (tier: string) => {
    if (tier === 'FREE') return;

    // For now, just show a message that Stripe integration is coming
    toast.info(t('stripeComingSoon'));
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'FREE':
        return <Zap className="h-6 w-6" />;
      case 'PRO':
        return <Crown className="h-6 w-6" />;
      case 'PRO_PLUS':
        return <Crown className="h-6 w-6" />;
      case 'ENTERPRISE':
        return <Building2 className="h-6 w-6" />;
      default:
        return <Zap className="h-6 w-6" />;
    }
  };

  const getButtonText = (tier: string) => {
    if (currentSubscription?.tier === tier) {
      return t('currentPlan');
    }
    if (tier === 'FREE') {
      return t('freePlan');
    }
    return t('subscribe');
  };

  // Generate features from plan limits using translations
  const generateFeatures = (plan: SubscriptionPlan): string[] => {
    const features: string[] = [];
    const { limits, tier } = plan;

    // Classes
    if (limits.maxClasses === null) {
      features.push(t('unlimitedClasses'));
    } else {
      features.push(t('activeClasses', { count: limits.maxClasses }));
    }

    // Students
    if (limits.maxStudents === null) {
      features.push(t('unlimitedStudents'));
    } else {
      features.push(t('maxStudents', { count: limits.maxStudents }));
    }

    // Exams
    if (limits.maxExamsPerMonth === null) {
      features.push(t('unlimitedExams'));
    } else {
      features.push(t('maxExams', { count: limits.maxExamsPerMonth }));
    }

    // Questions
    if (limits.maxQuestionsPerExam === null) {
      features.push(t('unlimitedQuestions'));
    } else {
      features.push(t('maxQuestions', { count: limits.maxQuestionsPerExam }));
    }

    // Analytics
    features.push(
      limits.analyticsLevel === 'ADVANCED' ? t('advancedAnalytics') : t('basicAnalytics')
    );

    // Support
    features.push(limits.supportLevel === 'PRIORITY' ? t('prioritySupport') : t('emailSupport'));

    // Pro-only features
    if (tier === 'PRO') {
      features.push(t('removeBranding'));
      features.push(limits.aiModel === 'GPT_4O' ? t('advancedAI') : t('standardAI'));
      features.push(t('exportResults'));
      features.push(t('examTemplates'));
    } else {
      features.push(t('standardAI'));
    }

    return features;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-8 px-4 max-w-6xl">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <PageHeader title={t('title')} subtitle={t('subtitle')} />

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <span className={cn('text-sm', !isYearly && 'font-medium')}>{t('monthly')}</span>
          <Switch checked={isYearly} onCheckedChange={setIsYearly} />
          <span className={cn('text-sm', isYearly && 'font-medium')}>{t('yearly')}</span>
          {isYearly && (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              {t('saveUpTo')} 17%
            </Badge>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => {
            const isCurrentPlan = currentSubscription?.tier === plan.tier;
            const price = isYearly ? plan.priceYearly : plan.price;
            const period = isYearly ? t('perYear') : t('perMonth');

            return (
              <Card
                key={plan.tier}
                className={cn(
                  'relative',
                  isCurrentPlan && 'border-blue-500 border-2',
                  plan.tier === 'PRO' && 'shadow-lg'
                )}
              >
                {plan.tier === 'PRO' && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-blue-600">{t('mostPopular')}</Badge>
                  </div>
                )}

                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={cn(
                        'p-2 rounded-lg',
                        plan.tier === 'FREE' && 'bg-gray-100',
                        plan.tier === 'PRO' && 'bg-blue-100 text-blue-600',
                        plan.tier === 'PRO_PLUS' && 'bg-purple-100 text-purple-600',
                        plan.tier === 'ENTERPRISE' && 'bg-amber-100 text-amber-600'
                      )}
                    >
                      {getTierIcon(plan.tier)}
                    </div>
                    <CardTitle className="text-2xl">{t(`tiers.${plan.tier}`)}</CardTitle>
                  </div>
                  <CardDescription>{t(`descriptions.${plan.tier}`)}</CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">${price}</span>
                    <span className="text-muted-foreground"> {period}</span>
                    {isYearly && plan.price > 0 && (
                      <p className="text-sm text-green-600 mt-1">{t('billedAnnually')}</p>
                    )}
                  </div>

                  <Button
                    className="w-full mb-6"
                    variant={plan.tier === 'FREE' ? 'outline' : 'default'}
                    disabled={isCurrentPlan}
                    onClick={() => handleSubscribe(plan.tier)}
                  >
                    {getButtonText(plan.tier)}
                  </Button>

                  <ul className="space-y-3">
                    {generateFeatures(plan).map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* FAQ */}
        <Card className="mt-12 max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>{t('faq.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-1">{t('faq.upgradeQuestion')}</h4>
                <p className="text-sm text-muted-foreground">{t('faq.upgradeAnswer')}</p>
              </div>
              <div>
                <h4 className="font-medium mb-1">{t('faq.cancelQuestion')}</h4>
                <p className="text-sm text-muted-foreground">{t('faq.cancelAnswer')}</p>
              </div>
              <div>
                <h4 className="font-medium mb-1">{t('faq.downgradeQuestion')}</h4>
                <p className="text-sm text-muted-foreground">{t('faq.downgradeAnswer')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
