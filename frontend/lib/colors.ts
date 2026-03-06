/**
 * Brand Color Palette
 *
 * This file contains all brand colors used across the application.
 * Use these instead of hardcoding colors.
 */

export const colors = {
  // Brand Primary
  brand: {
    primary: {
      DEFAULT: '#6366f1', // Indigo-500
      light: '#818cf8',
      dark: '#4f46e5',
    },
    secondary: {
      DEFAULT: '#06b6d4', // Cyan-500
      light: '#22d3ee',
      dark: '#0891b2',
    },
  },

  // Logo Background Color
  logo: {
    bg: 'rgb(245, 246, 231)', // R:245 G:246 B:231
    bgDark: 'rgb(230, 231, 220)',
  },

  // Gradients
  gradients: {
    primary: 'from-indigo-500 to-cyan-500',
    hero: 'from-blue-500 to-cyan-500',
    badge: 'from-purple-500 to-pink-500',
    teacher: 'from-blue-500 to-cyan-500',
    student: 'from-green-500 to-emerald-500',
    pricing: 'from-purple-500 to-pink-500',
  },

  // Feature Colors (for cards/icons)
  features: {
    aiGenerate: { from: 'purple-500', to: 'pink-500' },
    autoGrade: { from: 'green-500', to: 'emerald-500' },
    multiLanguage: { from: 'blue-500', to: 'cyan-500' },
    documentImport: { from: 'orange-500', to: 'amber-500' },
    analytics: { from: 'indigo-500', to: 'violet-500' },
    classManagement: { from: 'rose-500', to: 'red-500' },
  },

  // Steps Colors
  steps: {
    step1: { from: 'blue-500', to: 'cyan-500' },
    step2: { from: 'purple-500', to: 'pink-500' },
    step3: { from: 'green-500', to: 'emerald-500' },
  },

  // UI Colors
  ui: {
    glass: {
      white: 'bg-white/[0.02]',
      border: 'border-white/10',
      borderHover: 'border-white/20',
    },
    glow: {
      purple: 'bg-purple-500/5',
      blue: 'bg-blue-500/5',
    },
  },

  // Semantic Colors
  semantic: {
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
} as const;

// Tailwind classes for common patterns
export const classes = {
  // Glassmorphism card
  glassCard: 'border border-white/10 bg-white/[0.02] backdrop-blur-sm hover:border-white/20',

  // Gradient button
  gradientButton: 'bg-gradient-to-r from-indigo-500 to-cyan-500 hover:opacity-90',

  // Primary CTA button (using logo color)
  primaryCTA: 'bg-[rgb(245,246,231)] text-black hover:opacity-90 transition-opacity',

  // Section padding
  sectionPadding: 'px-6 sm:px-8 lg:px-12',

  // Container
  container: 'container px-6 sm:px-8 lg:px-12 relative z-10',
} as const;

export default colors;
