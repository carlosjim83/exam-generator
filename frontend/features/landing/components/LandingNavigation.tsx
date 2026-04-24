'use client';

import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Globe, MoreVertical, Menu, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { colors } from '@/lib/colors';

const languages = [
  { code: 'en' as const, name: 'English' },
  { code: 'es' as const, name: 'Español' },
];

const navLinks = [
  { href: '#features', label: 'landing:navigation.features' },
  { href: '#pricing', label: 'landing:navigation.pricing' },
];

export function LandingNavigation() {
  const { t } = useTranslation(['common', 'landing']);
  const { i18n } = useTranslation();
  const { user, logout, isAuthenticated } = useAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setIsScrolled(latest > 50);
  });

  const handleLanguageChange = (newLanguage: 'en' | 'es') => {
    i18n.changeLanguage(newLanguage);
    localStorage.setItem('i18nextLng', newLanguage);
  };

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'i18nextLng' && event.newValue) {
        i18n.changeLanguage(event.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [i18n]);

  const handleLogout = () => {
    logout();
    setShowLogoutDialog(false);
  };

  const getDashboardPath = () => {
    return user?.role === 'STUDENT' ? '/student/exams' : '/dashboard';
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled ? 'bg-black/80 backdrop-blur-xl border-b border-white/10' : 'bg-transparent'
        }`}
      >
        <div className="container px-6 sm:px-8 lg:px-12 flex h-16 items-center justify-between">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2"
          >
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Formydable"
                className="h-9 w-9 rounded-xl object-cover"
                width={36}
                height={36}
              />
              <span className="text-xl font-semibold text-white">Formydable</span>
            </Link>
          </motion.div>

          {/* Desktop Navigation Links */}
          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <motion.a
                key={link.href}
                href={link.href}
                className="text-sm text-gray-400 transition-colors hover:text-white"
                whileHover={{ y: -1 }}
              >
                {t(link.label)}
              </motion.a>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-gray-400 hover:text-white hover:bg-white/10"
                >
                  <Globe className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {languages.find((l) => i18n.language === l.code)?.name || 'Language'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="border-white/10 bg-black/90 backdrop-blur-xl"
              >
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className="text-gray-300 focus:bg-white/10 focus:text-white"
                  >
                    {lang.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Auth State - Desktop */}
            <div className="hidden md:flex items-center gap-2">
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2 text-gray-400 hover:text-white hover:bg-white/10"
                    >
                      <MoreVertical className="h-4 w-4" />
                      <span className="hidden sm:inline max-w-[120px] truncate">
                        {user?.firstName || user?.email || 'User'}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="border-white/10 bg-black/90 backdrop-blur-xl"
                  >
                    <DropdownMenuItem asChild>
                      <a
                        href={getDashboardPath()}
                        className="text-gray-300 focus:bg-white/10 focus:text-white"
                      >
                        {t('common:landingHeader.goToDashboard')}
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a
                        href="/dashboard/settings"
                        className="text-gray-300 focus:bg-white/10 focus:text-white"
                      >
                        {t('common:landingHeader.settings')}
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setShowLogoutDialog(true)}
                      className="text-red-400 focus:bg-red-500/10 focus:text-red-400"
                    >
                      {t('common:landingHeader.signOut')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    asChild
                    size="sm"
                    className="text-black font-medium px-4 hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: colors.logo.bg }}
                  >
                    <Link href="/login">{t('common:auth.signIn')}</Link>
                  </Button>
                </motion.div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-gray-400 hover:text-white hover:bg-white/10"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-x-0 top-16 z-40 border-b border-white/10 bg-black/95 backdrop-blur-xl md:hidden"
          >
            <div className="container px-6 sm:px-8 lg:px-12 py-6">
              <div className="flex flex-col gap-4">
                {navLinks.map((link, index) => (
                  <motion.a
                    key={link.href}
                    href={link.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="text-lg text-gray-300 transition-colors hover:text-white"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t(link.label)}
                  </motion.a>
                ))}

                <div className="my-4 border-t border-white/10" />

                {isAuthenticated ? (
                  <>
                    <a
                      href={getDashboardPath()}
                      className="text-lg text-gray-300 transition-colors hover:text-white"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {t('common:landingHeader.goToDashboard')}
                    </a>
                    <a
                      href="/dashboard/settings"
                      className="text-lg text-gray-300 transition-colors hover:text-white"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {t('common:landingHeader.settings')}
                    </a>
                    <button
                      onClick={() => {
                        setShowLogoutDialog(true);
                        setIsMobileMenuOpen(false);
                      }}
                      className="text-left text-lg text-red-400 transition-colors hover:text-red-300"
                    >
                      {t('common:landingHeader.signOut')}
                    </button>
                  </>
                ) : (
                  <a
                    href="/login"
                    className="text-lg text-white transition-colors hover:text-gray-300"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t('common:auth.signIn')}
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="border-white/10 bg-black/90 backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">{t('common:auth.signOut')}</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              {t('common:auth.signInToContinue')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/10 text-white hover:bg-white/20 border-white/10">
              {t('common:cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              {t('common:landingHeader.signOut')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
