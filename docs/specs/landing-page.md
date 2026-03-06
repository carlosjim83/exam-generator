# Spec: Public Landing Page

## Overview

Create a modern, professional, and academic public landing page for Formydable - an AI-powered exam generation platform. The landing page is accessible to all users (authenticated and unauthenticated), showcasing the platform's value proposition and driving conversions for both teachers and students. The header dynamically changes based on authentication status.

## Requirements

### Functional Requirements

1. **Multi-language Support**
   - Content must be fully bilingual (EN/ES)
   - Uses existing i18n infrastructure (react-i18next)
   - Language persists in localStorage
   - Single URL `/` (no language-based routing)

2. **Smart Header (Authentication State)**
   - Landing page ALWAYS shows (no automatic redirects from `/`)
   - Header changes content based on auth state:
     - **Unauthenticated**: Shows "Sign In" button + language selector
     - **Authenticated**: Shows user avatar + dropdown with "Go to Dashboard", "Settings", "Logout"
   - No blocking on auth check - content loads immediately

3. **Section Breakdown**
   - Hero Section: Value proposition + primary CTAs
   - Features Section: Core capabilities (AI generation, auto-grading, etc.)
   - For Teachers Section: Teacher-specific benefits + CTA
   - For Students Section: Student-specific benefits + CTA
   - How It Works: 3-step process
   - Pricing/Growth: Contact for enterprise, free for education
   - Footer: Links, social, legal

4. **Call-to-Actions (CTAs)**
   - Primary: "Get Started as Teacher" → `/register?role=teacher`
   - Secondary: "Join as Student" → `/student/join` or `/register?role=student`
   - Navigation links → `/login`

### Non-Functional Requirements

1. **Performance**
   - Fast initial load (LCP < 2.5s)
   - Lazy load images if any
   - Minimal bundle size (optimize imports)

2. **Responsive Design**
   - Mobile-first approach
   - Works on tablets (768px+)
   - Desktop optimization (1024px+)

3. **Accessibility**
   - WCAG AA compliant
   - Proper semantic HTML
   - Keyboard navigation support

4. **Style Guide**
   - Modern, professional, academic aesthetic
   - Clean typography with good readability
   - Use existing Tailwind config and shadcn/ui components
   - Consistent spacing and hierarchy

## Domain Model

N/A (Frontend-only feature, no backend entities)

## Use Cases

### UC-1: Unauthenticated User Visits Homepage

**Actor:** Unauthenticated visitor

**Flow:**

1. User navigates to `/`
2. App checks authentication status
3. App checks user's language preference (localStorage or browser)
4. Landing page loads with detected language
5. User scrolls through sections
6. User clicks CTA → redirected to registration flow

### UC-2: Authenticated User Visits Homepage

**Actor:** Authenticated user (teacher or student)

**Flow:**

1. User navigates to `/`
2. App checks authentication status
3. Landing page loads (no redirect)
4. Header shows authenticated state:
   - User avatar with dropdown
   - Links: "Go to Dashboard", "Settings", "Logout"
   - Dropdown actions redirect to respective pages
5. Logged-out CTA buttons still visible, but authenticated users can bypass registration

### UC-3: User Changes Language on Landing Page

**Actor:** Any user on landing page

**Flow:**

1. User clicks language selector
2. Language preference updates in localStorage
3. Components re-render with new language (no page reload)

## API Endpoints

None required (frontend only, uses existing auth context)

## UI Components

### Component Hierarchy

```
/app/page.tsx
└── features/landing/
    ├── LandingPage.tsx (main container)
    ├── HeroSection.tsx
    ├── FeaturesSection.tsx
    ├── TeacherSection.tsx
    ├── StudentSection.tsx
    ├── HowItWorksSection.tsx
    ├── PricingSection.tsx
    ├── Footer.tsx
    ├── LanguageSwitcher.tsx (or reuse existing)
    └── Navigation.tsx (public, minimal)
```

### Component Specifications

#### HeroSection

**Elements:**

- Headline: "Generate AI-Powered Exams in Minutes" / "Genera Exámenes con IA en Minutos"
- Subheadline: 1-2 sentence value proposition
- Primary CTA: "Get Started as Teacher" / "Comenzar como Profesor"
- Secondary CTA: "Join as Student" / "Unirse como Estudiante"
- Visual: Abstract illustration or gradient (no images for now)

**Interaction:**

- CTAs navigate to registration pages
- Hover states with subtle scale/color change

#### FeaturesSection

**Elements:**

- Section heading: "Why Formydable?" / "¿Por qué Formydable?"
- Grid of 4-6 feature cards:
  - AI-Powered Generation
  - Auto-Grading
  - Multi-Language Support
  - Document Import (PDF, DOCX)
  - Real-time Analytics
  - Class Management

**Styling:**

- Cards with hover effects
- Icons (lucide-react)
- Short descriptions

#### TeacherSection

**Elements:**

- Split layout: text on left, visual on right
- Benefits list (3-5 points)
- Testimonial quote (optional for now)
- CTA: "Get Started Free" / "Comenzar Gratis"

#### StudentSection

**Elements:**

- Similar to TeacherSection but student-focused
- Benefits: take exams, see results, track progress
- CTA: "Join a Class" / "Unirse a una Clase"

#### HowItWorksSection

**Elements:**

- Step-by-step process (3 steps):
  1. Upload Document
  2. Configure Exam
  3. Generate & Share

**Styling:**

- Numbered circles or icons
- Connecting line between steps
- Arrow indicators (optional)

#### PricingSection

**Elements:**

- Single pricing tier: "Free for Education"
- Contact for enterprise option
- Simple, clean layout

#### Footer

**Elements:**

- Logo: "Formydable"
- Links: About, Features, Pricing, Contact
- Social: GitHub, Twitter (optional for now)
- Legal: Terms, Privacy (links to placeholder)

#### Navigation (Public/Auth-Aware)

**Elements:**

- Logo: "Formydable"
- Links: Features, Pricing (optional)
- Language selector dropdown
- **Unauthenticated State:**
  - "Sign In" button → `/login`
- **Authenticated State:**
  - User avatar/profile dropdown with:
    - "Go to Dashboard" → `/dashboard` or `/student/exams`
    - "Settings" → `/dashboard/settings`
    - "Sign Out" → logout action

**Fixed/Sticky:**

- Sticky on scroll with blur effect
- Transitions smoothly on auth state change

## Translation Keys

Create new namespace: `landing`

### File: `frontend/lib/i18n/locales/en/landing.json`

```json
{
  "appName": "Formydable",
  "hero": {
    "title": "Generate AI-Powered Exams in Minutes",
    "subtitle": "Transform your educational materials into intelligent assessments. Upload, configure, and generate professional exams in seconds.",
    "ctaTeacher": "Get Started as Teacher",
    "ctaStudent": "Join as Student"
  },
  "features": {
    "title": "Why Formydable?",
    "subtitle": "Everything you need to create, manage, and grade assessments at scale.",
    "aiGenerate": {
      "title": "AI-Powered Generation",
      "description": "Our AI analyzes your documents and generates high-quality questions automatically."
    },
    "autoGrade": {
      "title": "Auto-Grading",
      "description": "Instant automated grading with detailed explanations and performance analytics."
    },
    "multiLanguage": {
      "title": " Multi-Language Support",
      "description": "Create exams in multiple languages to serve diverse classrooms."
    },
    "documentImport": {
      "title": "Easy Document Import",
      "description": "Upload PDF or DOCX files and convert them into assessments seamlessly."
    },
    "analytics": {
      "title": "Real-time Analytics",
      "description": "Track student progress with detailed insights and performance metrics."
    },
    "classManagement": {
      "title": "Class Management",
      "description": "Organize students, assign exams, and manage your entire curriculum."
    }
  },
  "teachers": {
    "title": "Empower Your Teaching",
    "subtitle": "Spend less time grading and more time teaching with AI-powered tools.",
    "benefits": [
      "Save hours of exam preparation time",
      "Create unlimited assessments from your materials",
      "Auto-grade with detailed feedback",
      "Track student performance effortlessly"
    ],
    "cta": "Get Started Free"
  },
  "students": {
    "title": "Learn Better, Faster",
    "subtitle": "Take exams anytime, see results instantly, and track your progress.",
    "benefits": [
      "Take exams on any device",
      "Get instant results and explanations",
      "Track your learning progress",
      "Join multiple classes easily"
    ],
    "cta": "Join a Class"
  },
  "howItWorks": {
    "title": "How It Works",
    "subtitle": "Three simple steps to your first AI-generated exam.",
    "step1": {
      "title": "Upload Your Document",
      "description": "Drag and drop your PDF or DOCX file with course material."
    },
    "step2": {
      "title": "Configure Your Exam",
      "description": "Set the number of questions, difficulty level, and question types."
    },
    "step3": {
      "title": "Generate & Share",
      "description": "Let AI create your exam and share it with your class instantly."
    }
  },
  "pricing": {
    "title": "Simple Pricing",
    "subtitle": "Education should be accessible to everyone.",
    "free": {
      "title": "Free for Education",
      "description": "Perfect for individual teachers and students.",
      "features": [
        "Unlimited exam generation",
        "Class management",
        "Auto-grading",
        "Real-time analytics",
        "Multi-language support"
      ]
    },
    "enterprise": {
      "title": "For Schools & Universities",
      "description": "Get in touch for custom solutions.",
      "cta": "Contact Us"
    }
  },
  "footer": {
    "tagline": "Transform education with AI-powered assessments",
    "links": {
      "about": "About",
      "features": "Features",
      "pricing": "Pricing",
      "contact": "Contact"
    },
    "legal": {
      "terms": "Terms of Service",
      "privacy": "Privacy Policy"
    },
    "rights": "All rights reserved."
  },
  "navigation": {
    "about": "About",
    "features": "Features",
    "pricing": "Pricing",
    "login": "Sign In"
  }
}
```

### File: `frontend/lib/i18n/locales/es/landing.json`

```json
{
  "appName": "Formydable",
  "hero": {
    "title": "Genera Exámenes con IA en Minutos",
    "subtitle": "Transforma tus materiales educativos en evaluaciones inteligentes. Sube, configura y genera exámenes profesionales en segundos.",
    "ctaTeacher": "Comenzar como Profesor",
    "ctaStudent": "Unirse como Estudiante"
  },
  "features": {
    "title": "¿Por qué Formydable?",
    "subtitle": "Todo lo que necesitas para crear, gestionar y calificar evaluaciones a gran escala.",
    "aiGenerate": {
      "title": "Generación con IA",
      "description": "Nuestra IA analiza tus documentos y genera preguntas de alta calidad automáticamente."
    },
    "autoGrade": {
      "title": "Calificación Automática",
      "description": "Calificación instantánea con explicaciones detalladas y análisis de desempeño."
    },
    "multiLanguage": {
      "title": "Soporte Multilingüe",
      "description": "Crea exámenes en múltiples idiomas para servir a aulas diversas."
    },
    "documentImport": {
      "title": "Importación de Documentos",
      "description": "Sube archivos PDF o DOCX y conviértelos en evaluaciones sin interrupciones."
    },
    "analytics": {
      "title": "Análisis en Tiempo Real",
      "description": "Rastrea el progreso de los estudiantes con insights detallados y métricas de desempeño."
    },
    "classManagement": {
      "title": "Gestión de Clases",
      "description": "Organiza estudiantes, asigna exámenes y gestiona todo tu currículo."
    }
  },
  "teachers": {
    "title": "Potencia tu Enseñanza",
    "subtitle": "Pasa menos tiempo calificando y más enseñando con herramientas potenciadas por IA.",
    "benefits": [
      "Ahorra horas de preparación de exámenes",
      "Crea evaluaciones ilimitadas con tu material",
      "Califica automáticamente con feedback detallado",
      "Rastrea el desempeño sin esfuerzo"
    ],
    "cta": "Comenzar Gratis"
  },
  "students": {
    "title": "Aprende Mejor, Más Rápido",
    "subtitle": "Toma exámenes cuando quieras, mira los resultados al instante y rastrea tu progreso.",
    "benefits": [
      "Toma exámenes en cualquier dispositivo",
      "Obtén resultados y explicaciones al instante",
      "Rastrea tu progreso de aprendizaje",
      "Únete a múltiples clases fácilmente"
    ],
    "cta": "Unirse a una Clase"
  },
  "howItWorks": {
    "title": "Cómo Funciona",
    "subtitle": "Tres simples pasos para tu primer examen generado por IA.",
    "step1": {
      "title": "Sube tu Documento",
      "description": "Arrastra y suelta tu archivo PDF o DOCX con el material del curso."
    },
    "step2": {
      "title": "Configura tu Examen",
      "description": "Define la cantidad de preguntas, nivel de dificultad y tipos de preguntas."
    },
    "step3": {
      "title": "Genera y Comparte",
      "description": "Deja que la IA cree tu examen y compártelo con tu clase al instante."
    }
  },
  "pricing": {
    "title": "Precios Simples",
    "subtitle": "La Educación debe ser accesible para todos.",
    "free": {
      "title": "Gratis para Educación",
      "description": "Perfecto para profesores individuales y estudiantes.",
      "features": [
        "Generación ilimitada de exámenes",
        "Gestión de clases",
        "Calificación automática",
        "Análisis en tiempo real",
        "Soporte multilingüe"
      ]
    },
    "enterprise": {
      "title": "Para Escuelas y Universidades",
      "description": "Contáctanos para soluciones personalizadas.",
      "cta": "Contáctanos"
    }
  },
  "footer": {
    "tagline": "Transforma la educación con evaluaciones potenciadas por IA",
    "links": {
      "about": "Nosotros",
      "features": "Características",
      "pricing": "Precios",
      "contact": "Contacto"
    },
    "legal": {
      "terms": "Términos de Servicio",
      "privacy": "Política de Privacidad"
    },
    "rights": "Todos los derechos reservados."
  },
  "navigation": {
    "about": "Nosotros",
    "features": "Características",
    "pricing": "Precios",
    "login": "Iniciar Sesión"
  }
}
```

## Database Schema

N/A (Frontend-only feature)

## Testing Strategy

### Unit Tests

1. **Component Tests**
   - `LandingPage.test.tsx`: Renders all sections
   - `HeroSection.test.tsx`: CTAs navigate correctly
   - `LanguageSwitcher.test.tsx`: Toggles language

2. **Translation Tests**
   - All translations keys exist in both EN and ES
   - No missing keys between languages

### E2E Tests (Playwright)

1. **Happy Path Flow**
   - Navigate to `/`
   - Verify landing page renders
   - Click "Get Started as Teacher" → redirect to `/register?role=teacher`
   - Toggle language → content updates

2. **Authenticated User Flow**
   - Visit `/` while logged in
   - Verify redirect to `/dashboard` or `/student/exams`

## Technical Details

### File Structure

```
frontend/
├── app/
│   └── page.tsx (update with auth check)
├── features/
│   └── landing/
│       ├── components/
│       │   ├── HeroSection.tsx
│       │   ├── FeaturesSection.tsx
│       │   ├── TeacherSection.tsx
│       │   ├── StudentSection.tsx
│       │   ├── HowItWorksSection.tsx
│       │   ├── PricingSection.tsx
│       │   ├── Footer.tsx
│       │   └── PublicNavigation.tsx
│       └── LandingPage.tsx
├── lib/
│   └── i18n/
│       └── locales/
│           ├── en/
│           │   └── landing.json (NEW)
│           └── es/
│               └── landing.json (NEW)
```

### Dependencies

**Existing:**

- lucide-react (icons)
- react-i18next (translations)
- Tailwind CSS (styling)
- shadcn/ui components (Button, Card, etc.)

**None Required:**

- No new dependencies needed
- Reuse existing auth context
- Reuse existing i18n infrastructure

### Design Tokens

**Colors:**

- Primary: Blue/Indigo (trust, academic)
- Secondary: Teal/Cyan (modern, tech)
- Background: White/light gray
- Text: Dark gray for readability

**Typography:**

- Headings: Bold, larger sizes
- Body: Regular, 16px minimum
- Line height: 1.6 for body text

**Spacing:**

- Section padding: 4rem (mobile), 8rem (desktop)
- Component gap: 1rem - 2rem
- Card padding: 2rem

## Acceptance Criteria

- [ ] Landing page loads at `/` for unauthenticated users
- [ ] Authenticated users are redirected to dashboard based on role
- [ ] All components render without hydration errors
- [ ] CTAs navigate to correct pages (register, login)
- [ ] Language switcher updates content immediately
- [ ] All text is in both EN and ES
- [ ] Page is fully responsive (mobile, tablet, desktop)
- [ ] Loading state shows while checking auth
- [ ] No hardcoded strings (all use i18n keys)
- [ ] Lighthouse score > 90 (performance, accessibility)
- [ ] Unit tests for all landing components pass
- [ ] E2E test for user flow passes
- [ ] Keyboard navigation works for all interactive elements

## Migration Notes

1. Update `app/page.tsx` to check auth and render landing page
2. Add translation files (`landing.json` in EN and ES)
3. Create new feature folder: `features/landing/components/`
4. Reuse existing components where possible (Button, Card, badges)
5. No backend changes required

## Related Documents

- [ADR 0001: Monorepo Structure](../adr/0001-monorepo-structure.md)
- [ADR 0010: Multi-language Support](../adr/0010-multi-language.md) (if exists)
- [Frontend Architecture Guide](../architecture/frontend.md) (if exists)

## Open Questions

1. _Do we need a "Contact Us" form or email link for enterprise?_
   - Decision: Use `mailto:` link for now, can add form later

2. _Should we add social proof (logos, testimonials) in v1?_
   - Decision: Skip for v1, add in future iteration

3. _Do we need a blog/resources section link in nav?_
   - Decision: Skip for v1, keep nav minimal

---

**Created:** March 6, 2026
**Status:** Ready for Implementation
**Priority:** High (Public-facing, critical for user acquisition)
