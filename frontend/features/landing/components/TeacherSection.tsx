'use client';

import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { CheckCircle2, GraduationCap, ArrowRight, Sparkles, Clock, Users } from 'lucide-react';
import { motion } from 'framer-motion';

export function TeacherSection() {
  const { t } = useTranslation(['common', 'landing']);

  const benefits = t('landing:teachers.benefits', { returnObjects: true }) as string[];

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
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
    <section className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-blue-950/10 to-background" />

      <div className="container px-6 sm:px-8 lg:px-12 relative z-10">
        <div className="grid gap-16 lg:grid-cols-2 lg:gap-24 items-center">
          {/* Left: Content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-sm backdrop-blur-sm">
              <GraduationCap className="h-4 w-4 text-blue-400" />
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent font-medium">
                {t('landing:roleLabels.forTeachers')}
              </span>
            </div>

            <h2 className="mb-6 text-4xl font-semibold tracking-tight sm:text-5xl text-foreground">
              {t('landing:teachers.title')}
            </h2>

            <p className="mb-10 text-lg text-muted-foreground leading-relaxed">
              {t('landing:teachers.subtitle')}
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
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
                      <CheckCircle2 className="h-4 w-4 text-blue-400" />
                    </div>
                  </div>
                  <span className="text-base text-foreground/90">{benefit}</span>
                </motion.li>
              ))}
            </motion.ul>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                size="lg"
                className="h-14 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 px-8 text-base font-medium hover:opacity-90"
                asChild
              >
                <a href="/register?role=teacher">
                  {t('landing:teachers.cta')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </motion.div>
          </motion.div>

          {/* Right: Visual */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative"
          >
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-3xl blur-2xl opacity-50" />

              {/* Main card */}
              <div className="relative rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-8 lg:p-10">
                {/* Dashboard mockup */}
                <div className="space-y-5">
                  {/* Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
                        <Sparkles className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">
                          {t('landing:mockUI.aiAssistant')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {t('landing:mockUI.readyToHelp')}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <div className="h-2 w-2 rounded-full bg-yellow-500" />
                      <div className="h-2 w-2 rounded-full bg-red-500" />
                    </div>
                  </div>

                  {/* Stats cards */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Exams', value: '24', icon: Clock },
                      { label: 'Students', value: '156', icon: Users },
                      { label: 'Avg Score', value: '87%', icon: CheckCircle2 },
                    ].map((stat, index) => (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 + 0.3 }}
                        className="rounded-xl border border-white/5 bg-white/[0.03] p-4 text-center"
                      >
                        <stat.icon className="h-4 w-4 text-blue-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-white">{stat.value}</div>
                        <div className="text-xs text-gray-500">{stat.label}</div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Activity mock */}
                  <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
                    <div className="text-sm text-gray-400 mb-4">
                      {t('landing:mockUI.recentActivity')}
                    </div>
                    <div className="space-y-3">
                      {[
                        { title: 'Mid-term Exam', status: 'Generated', time: '2m ago' },
                        { title: 'Quiz #3', status: 'Graded', time: '1h ago' },
                        { title: 'Final Project', status: 'Pending', time: '3h ago' },
                      ].map((item, index) => (
                        <motion.div
                          key={item.title}
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: index * 0.1 + 0.5 }}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-gray-300">{item.title}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-blue-400">{item.status}</span>
                            <span className="text-xs text-gray-600">{item.time}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
