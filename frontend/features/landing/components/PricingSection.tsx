'use client';

import { useTranslation } from 'react-i18next';
import { CheckCircle2, Mail, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';

interface PricingSectionProps {
  id?: string;
}

export function PricingSection({ id }: PricingSectionProps) {
  const { t } = useTranslation(['common', 'landing']);

  const freeFeatures = t('landing:pricing.free.features', { returnObjects: true }) as string[];
  const proFeatures = t('landing:pricing.pro.features', { returnObjects: true }) as string[];
  const enterpriseFeatures = t('landing:pricing.enterprise.features', {
    returnObjects: true,
  }) as string[];

  return (
    <section id={id} className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-purple-950/5 to-background" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-t from-purple-500/5 to-transparent rounded-full blur-3xl" />

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
            {t('landing:pricing.title')}
          </h2>
          <p className="text-lg text-muted-foreground">{t('landing:pricing.subtitle')}</p>
        </motion.div>

        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Free Tier */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <motion.div whileHover={{ y: -8, transition: { duration: 0.3 } }} className="h-full">
                <Card className="relative h-full border border-white/10 bg-white/[0.02] backdrop-blur-sm overflow-hidden">
                  <CardHeader className="text-center pt-8 pb-6">
                    <CardTitle className="text-2xl font-semibold text-foreground">
                      {t('landing:pricing.free.title')}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      {t('landing:pricing.free.description')}
                    </CardDescription>
                    <div className="mt-6">
                      <span className="text-5xl font-bold text-foreground">$0</span>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-8">
                    <ul className="mb-8 space-y-4">
                      {freeFeatures.map((feature, index) => (
                        <motion.li
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center gap-3"
                        >
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500/20">
                            <CheckCircle2 className="h-3 w-3 text-green-400 shrink-0" />
                          </div>
                          <span className="text-sm text-foreground/90">{feature}</span>
                        </motion.li>
                      ))}
                    </ul>

                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        className="w-full h-12 rounded-full border border-white/20 bg-white/5 font-medium hover:bg-white/10"
                        size="lg"
                        asChild
                        variant="outline"
                      >
                        <a href="/register?role=teacher">{t('landing:teachers.cta')}</a>
                      </Button>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>

            {/* Pro Tier */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <motion.div whileHover={{ y: -8, transition: { duration: 0.3 } }} className="h-full">
                <Card className="relative h-full border border-purple-500/30 bg-white/[0.02] backdrop-blur-sm overflow-hidden">
                  {/* Popular badge */}
                  <div className="absolute top-0 right-0">
                    <div className="flex items-center gap-1 rounded-bl-xl bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-1 text-xs font-medium text-white">
                      <Sparkles className="h-3 w-3" />
                      Popular
                    </div>
                  </div>

                  <CardHeader className="text-center pt-10 pb-6">
                    <CardTitle className="text-2xl font-semibold text-foreground">
                      {t('landing:pricing.pro.title')}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      {t('landing:pricing.pro.description')}
                    </CardDescription>
                    <div className="mt-6">
                      <span className="text-5xl font-bold text-foreground">
                        {t('landing:pricing.pro.price')}
                      </span>
                      <span className="text-muted-foreground">
                        {t('landing:pricing.pro.period')}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-8">
                    <ul className="mb-8 space-y-4">
                      {proFeatures.map((feature, index) => (
                        <motion.li
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: index * 0.1 + 0.2 }}
                          className="flex items-center gap-3"
                        >
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-500/20">
                            <CheckCircle2 className="h-3 w-3 text-purple-400 shrink-0" />
                          </div>
                          <span className="text-sm text-foreground/90">{feature}</span>
                        </motion.li>
                      ))}
                    </ul>

                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        className="w-full h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 font-medium hover:opacity-90"
                        size="lg"
                        asChild
                      >
                        <a href="/register?role=teacher">{t('landing:pricing.pro.cta')}</a>
                      </Button>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>

            {/* Enterprise Tier */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <motion.div whileHover={{ y: -8, transition: { duration: 0.3 } }} className="h-full">
                <Card className="relative h-full border border-white/10 bg-white/[0.02] backdrop-blur-sm">
                  <CardHeader className="text-center pt-8 pb-6">
                    <CardTitle className="text-2xl font-semibold text-foreground">
                      {t('landing:pricing.enterprise.title')}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      {t('landing:pricing.enterprise.description')}
                    </CardDescription>
                    <div className="mt-6">
                      <span className="text-5xl font-bold text-foreground">Custom</span>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-8">
                    <ul className="mb-8 space-y-4">
                      {enterpriseFeatures.map((feature, index) => (
                        <motion.li
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: index * 0.1 + 0.4 }}
                          className="flex items-center gap-3"
                        >
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/20">
                            <CheckCircle2 className="h-3 w-3 text-blue-400 shrink-0" />
                          </div>
                          <span className="text-sm text-foreground/90">{feature}</span>
                        </motion.li>
                      ))}
                    </ul>

                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        variant="outline"
                        className="w-full h-12 rounded-full border-white/20 bg-white/5 font-medium hover:bg-white/10"
                        size="lg"
                        asChild
                      >
                        <a
                          href="mailto:hello@formydable.com?subject=Enterprise Inquiry"
                          className="gap-2"
                        >
                          <Mail className="h-4 w-4" />
                          {t('landing:pricing.enterprise.cta')}
                        </a>
                      </Button>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
