'use client';

import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { CheckCircle2, BookOpen, ArrowRight, Trophy, Target, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export function StudentSection() {
  const { t } = useTranslation(['common', 'landing']);

  const benefits = t('landing:students.benefits', { returnObjects: true }) as string[];

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.1, 0.25, 1] as const,
      },
    },
  };

  return (
    <section className="relative py-32 overflow-hidden bg-muted/30">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-green-950/10 to-background" />

      <div className="container px-6 sm:px-8 lg:px-12 relative z-10">
        <div className="grid gap-16 lg:grid-cols-2 lg:gap-24 items-center">
          {/* Left: Visual (Swapped for alternating layout) */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
            className="order-2 lg:order-1 relative"
          >
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-3xl blur-2xl opacity-50" />

              {/* Main card */}
              <div className="relative rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-8 lg:p-10">
                {/* Student view mockup */}
                <div className="space-y-5">
                  {/* Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-500">
                        <Trophy className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">
                          {t('landing:mockUI.yourProgress')}
                        </div>
                        <div className="text-xs text-gray-500">{t('landing:mockUI.keepItUp')}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">92%</div>
                      <div className="text-xs text-green-400">↑ 8%</div>
                    </div>
                  </div>

                  {/* Progress cards */}
                  <div className="space-y-3">
                    {[
                      { subject: 'Mathematics', progress: 85, color: 'bg-blue-500' },
                      { subject: 'History', progress: 92, color: 'bg-purple-500' },
                      { subject: 'Science', progress: 78, color: 'bg-green-500' },
                    ].map((subject, index) => (
                      <motion.div
                        key={subject.subject}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 + 0.3 }}
                        className="space-y-2"
                      >
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-300">{subject.subject}</span>
                          <span className="text-gray-500">{subject.progress}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${subject.progress}%` }}
                            viewport={{ once: true }}
                            transition={{
                              delay: index * 0.1 + 0.5,
                              duration: 0.8,
                              ease: 'easeOut',
                            }}
                            className={`h-full rounded-full ${subject.color}`}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Upcoming exams */}
                  <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
                    <div className="text-sm text-gray-400 mb-3">
                      {t('landing:mockUI.upcomingExams')}
                    </div>
                    <div className="space-y-3">
                      {[
                        { title: 'Calculus Quiz', date: 'Tomorrow', icon: Target },
                        { title: 'History Essay', date: 'In 3 days', icon: BookOpen },
                      ].map((exam, index) => (
                        <motion.div
                          key={exam.title}
                          initial={{ opacity: 0, y: 10 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: index * 0.1 + 0.6 }}
                          className="flex items-center gap-3"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
                            <exam.icon className="h-4 w-4 text-green-400" />
                          </div>
                          <div className="flex-1">
                            <div className="text-sm text-white">{exam.title}</div>
                            <div className="text-xs text-gray-500">{exam.date}</div>
                          </div>
                          <Zap className="h-4 w-4 text-yellow-500" />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right: Content */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
            className="order-1 lg:order-2"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-4 py-1.5 text-sm backdrop-blur-sm">
              <BookOpen className="h-4 w-4 text-green-400" />
              <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent font-medium">
                {t('landing:roleLabels.forStudents')}
              </span>
            </div>

            <h2 className="mb-6 text-4xl font-semibold tracking-tight sm:text-5xl text-foreground">
              {t('landing:students.title')}
            </h2>

            <p className="mb-10 text-lg text-muted-foreground leading-relaxed">
              {t('landing:students.subtitle')}
            </p>

            <motion.ul
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="mb-10 space-y-5"
            >
              {benefits.map((benefit) => (
                <motion.li
                  key={benefit}
                  variants={itemVariants}
                  className="flex items-start gap-4 group"
                >
                  <div className="mt-0.5 flex shrink-0">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500/20 group-hover:bg-green-500/30 transition-colors">
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                    </div>
                  </div>
                  <span className="text-base text-foreground/90">{benefit}</span>
                </motion.li>
              ))}
            </motion.ul>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                size="lg"
                className="h-14 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 px-8 text-base font-medium hover:opacity-90"
                asChild
              >
                <a href="/student/join">
                  {t('landing:students.cta')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
