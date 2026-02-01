import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/features/auth/context/AuthContext';
import { I18nProvider } from '@/lib/i18n/I18nProvider';
import { ThemeProvider } from '@/lib/theme/ThemeProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ExamGen SaaS - AI-Powered Exam Generator',
  description: 'Generate intelligent exams from your documents using AI',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <I18nProvider>
          <AuthProvider>
            <ThemeProvider>{children}</ThemeProvider>
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
