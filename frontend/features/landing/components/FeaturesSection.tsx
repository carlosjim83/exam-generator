'use client';

import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Brain, FileText, Globe, BarChart3, Users, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const featureIcons = {
  aiGenerate: Brain,
  autoGrade: CheckCircle2,
  multiLanguage: Globe,
  documentImport: FileText,
  analytics: BarChart3,
  classManagement: Users,
};

const featureColors = {
  aiGenerate: 'from-purple-500 to-pink-500',
  autoGrade: 'from-green-500 to-emerald-500',
  multiLanguage: 'from-blue-500 to-cyan-500',
  documentImport: 'from-orange-500 to-amber-500',
  analytics: 'from-indigo-500 to-violet-500',
  classManagement: 'from-rose-500 to-red-500',
};

interface FeaturesSectionProps {
  id?: string;
}

export function FeaturesSection({ id }: FeaturesSectionProps) {
  const { t } = useTranslation(['common', 'landing']);

  const features = [
    'aiGenerate',
    'autoGrade',
    'multiLanguage',
    'documentImport',
    'analytics',
    'classManagement',
  ] as const;

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.1, 0.25, 1] as const,
      },
    },
  };

  return (
    <section id={id} className="relative py-32 bg-background overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-0 w-[500px] h-[500px] rounded-full bg-purple-500/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-3xl" />
      </div>

      <div className="container px-6 sm:px-8 lg:px-12 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
          className="mx-auto max-w-3xl text-center mb-20"
        >
          <h2 className="mb-6 text-4xl font-semibold tracking-tight sm:text-5xl text-foreground">
            {t('landing:features.title')}
          </h2>
          <p className="text-lg text-muted-foreground">{t('landing:features.subtitle')}</p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((featureKey) => {
            const Icon = featureIcons[featureKey];
            const gradient = featureColors[featureKey];
            return (
              <motion.div key={featureKey} variants={itemVariants}>
                <motion.div
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                  className="h-full"
                >
                  <Card className="h-full border border-white/10 bg-white/[0.02] backdrop-blur-sm hover:border-white/20 transition-all duration-500 group overflow-hidden">
                    <CardHeader className="pb-4">
                      <div
                        className={`mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} p-3.5 shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-500`}
                      >
                        <Icon className="h-7 w-7 text-white" />
                      </div>
                      <CardTitle className="text-xl font-semibold text-foreground">
                        {t(`landing:features.${featureKey}.title`)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base text-muted-foreground leading-relaxed">
                        {t(`landing:features.${featureKey}.description`)}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
