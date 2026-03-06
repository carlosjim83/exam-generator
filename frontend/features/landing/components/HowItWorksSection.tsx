'use client';

import { useTranslation } from 'react-i18next';
import { Upload, Settings, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';

const stepIcons = {
  step1: Upload,
  step2: Settings,
  step3: Share2,
};

const stepColors = {
  step1: 'from-blue-500 to-cyan-500',
  step2: 'from-purple-500 to-pink-500',
  step3: 'from-green-500 to-emerald-500',
};

const steps = ['step1', 'step2', 'step3'] as const;

export function HowItWorksSection() {
  const { t } = useTranslation(['common', 'landing']);

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.2,
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
    <section className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-purple-500/5 to-transparent rounded-full blur-3xl" />
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
            {t('landing:howItWorks.title')}
          </h2>
          <p className="text-lg text-muted-foreground">{t('landing:howItWorks.subtitle')}</p>
        </motion.div>

        {/* Steps Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="relative mx-auto max-w-5xl"
        >
          {/* Connecting Line (Desktop) */}
          <div className="absolute top-24 left-[16%] right-[16%] hidden lg:block">
            <div className="h-0.5 bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-green-500/30" />
          </div>

          <div className="grid gap-8 md:grid-cols-3 md:gap-6 items-start">
            {steps.map((stepKey, index) => {
              const Icon = stepIcons[stepKey];
              const gradient = stepColors[stepKey];

              return (
                <motion.div key={stepKey} variants={itemVariants} className="relative">
                  <motion.div
                    whileHover={{ y: -8, transition: { duration: 0.3 } }}
                    className="text-center"
                  >
                    {/* Step Card */}
                    <div className="relative rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm p-8 hover:border-white/20 transition-all duration-500">
                      {/* Step Number */}
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${gradient} text-white text-sm font-bold shadow-lg`}
                        >
                          {index + 1}
                        </div>
                      </div>

                      {/* Icon */}
                      <div
                        className={`mb-5 mt-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} p-3 shadow-lg`}
                      >
                        <Icon className="h-7 w-7 text-white" />
                      </div>

                      {/* Content */}
                      <h3 className="mb-3 text-xl font-semibold text-foreground">
                        {t(`landing:howItWorks.${stepKey}.title`)}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {t(`landing:howItWorks.${stepKey}.description`)}
                      </p>
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
