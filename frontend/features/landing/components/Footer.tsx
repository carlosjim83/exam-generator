'use client';

import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import Image from 'next/image';
import { Github, Twitter, Linkedin } from 'lucide-react';
import { motion } from 'framer-motion';

export function Footer() {
  const { t } = useTranslation(['common', 'landing']);
  const currentYear = new Date().getFullYear();

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.1, 0.25, 1] as const,
      },
    },
  };

  return (
    <footer className="relative border-t border-white/10 bg-black py-16 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-t from-purple-500/5 to-transparent rounded-full blur-3xl" />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="container px-6 sm:px-8 lg:px-12 relative z-10"
      >
        <div className="grid gap-12 md:grid-cols-4">
          {/* Brand */}
          <motion.div variants={itemVariants} className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt={t('common:appName')}
                className="h-10 w-10 rounded-xl object-cover"
                width={40}
                height={40}
              />
              <span className="text-2xl font-semibold text-white">{t('common:appName')}</span>
            </div>
            <p className="text-sm text-gray-400 max-w-sm leading-relaxed">
              {t('landing:footer.tagline')}
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-3 pt-4">
              {[
                { icon: Twitter, href: '#', label: 'Twitter' },
                { icon: Github, href: '#', label: 'GitHub' },
                { icon: Linkedin, href: '#', label: 'LinkedIn' },
              ].map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5" />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Links */}
          <motion.div variants={itemVariants}>
            <h3 className="mb-4 text-sm font-semibold text-white">Product</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/#features"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  {t('landing:footer.links.features')}
                </Link>
              </li>
              <li>
                <Link
                  href="/#pricing"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  {t('landing:footer.links.pricing')}
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  {t('common:auth.signIn')}
                </Link>
              </li>
            </ul>
          </motion.div>

          {/* Legal */}
          <motion.div variants={itemVariants}>
            <h3 className="mb-4 text-sm font-semibold text-white">Legal</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                  {t('landing:footer.legal.terms')}
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                  {t('landing:footer.legal.privacy')}
                </a>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          variants={itemVariants}
          className="mt-16 flex flex-col gap-4 border-t border-white/10 pt-8 md:flex-row md:items-center md:justify-between"
        >
          <p className="text-sm text-gray-500">
            © {currentYear} Formydable. {t('landing:footer.rights')}
          </p>

          <p className="text-sm text-gray-600">{t('landing:footer.madeWith')}</p>
        </motion.div>
      </motion.div>
    </footer>
  );
}
