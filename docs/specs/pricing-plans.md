# Spec: Pricing Plans Feature

## Overview

This spec defines a comprehensive pricing plans system for Formidable - an AI-powered exam generation platform. The feature includes subscription tiers with real backend integration, usage tracking, and payment processing infrastructure.

**Status:** Draft - Pending Review

---

## Problem Statement

Currently, the landing page displays "fake" pricing tiers that are not implemented:

- Free tier mentions "5 exams per month" without enforcement
- Pro tier at "$9/month" has no actual payment processing
- Enterprise tier is just a "Contact Us" email link

This creates a poor user experience and missed revenue opportunities.

---

## Competitive Analysis

### How Other LMS Platforms Handle Pricing

#### 1. Canvas LMS (Instructure)

- **Free Tier**: Limited to 1 course, 100 students
- **Paid Plans**: Start at ~$15/user/month for institutions
- **Enterprise**: Custom pricing with SSO, advanced admin tools
- **Key Insight**: Freemium model with clear limits on free tier

#### 2. Moodle

- **Open Source**: Free to download and self-host
- **MoodleCloud**: Free basic tier, $25/month for enhanced hosting
- **Moodle Workplace**: Enterprise pricing (custom)
- **Key Insight**: Hosted vs. self-hosted option, community model

#### 3. Kahoot!

- **Free**: Limited games per month, basic features
- **Kahoot!+**: $6/month - more games, AI features, offline
- **Kahoot!@School**: $15/month - admin dashboard, class management
- **Enterprise**: Custom pricing with analytics, integrations
- **Key Insight**: Gamification focus, consumer-friendly pricing

#### 4. Quizlet

- **Free**: Basic study modes, limited sets
- **Quizlet Plus**: $7.99/month - expert solutions, offline access
- **Quizlet Teacher**: $13.99/month - class management, analytics
- **School Plans**: Custom pricing based on enrollment
- **Key Insight**: Per-feature tiering, annual discount (40%)

#### 5. ClassDojo

- **Free**: Full platform for teachers and students
- **ClassDojo Plus**: $9.99/month or $79.99/year - portfolios, reports
- **Key Insight**: Core features free, premium for advanced reporting

---

## Requirements

### Functional Requirements

#### Tier 1: Free (Starter)

- **Target Users**: Individual teachers exploring the platform, students
- **Price**: $0/month
- **Limits**:
  - 5 exams per month
  - Up to 30 students across all classes
  - 3 active classes
  - Basic analytics (completion rates only)
  - Standard document processing (5MB max, 50 pages)
  - Community support (forum, docs)
- **Features Included**:
  - AI exam generation
  - Auto-grading for multiple choice
  - Document import (PDF, DOCX)
  - Multi-language support
  - Student enrollment
  - Basic exam taking experience

#### Tier 2: Pro (Educator)

- **Target Users**: Active teachers, small tutoring businesses
- **Price**: $9.99/month or $95.88/year (save 20%)
- **Limits**:
  - Unlimited exams per month
  - Up to 500 students
  - Unlimited classes
  - Advanced analytics (time tracking, difficulty analysis)
  - Priority document processing (50MB max, 500 pages)
  - Priority email support (24h response)
- **Features Included**:
  - Everything in Free
  - Advanced question types (short answer, essay with AI grading)
  - Exam templates library
  - Bulk student import (CSV)
  - Custom branding (logo, colors)
  - Scheduled exams
  - Randomization options
  - Export results (CSV, PDF)
  - API access (limited: 1000 requests/day)

#### Tier 3: Team (School)

- **Target Users**: Small schools, tutoring centers, departments
- **Price**: $149/month (up to 10 teachers) or $12/teacher/month
- **Limits**:
  - Unlimited exams
  - Up to 5,000 students
  - Unlimited classes
  - Institution-wide analytics
  - Large document processing (100MB max, 2000 pages)
  - Priority support (8h response) + onboarding session
- **Features Included**:
  - Everything in Pro
  - Team management dashboard
  - Teacher roles & permissions
  - Shared question banks
  - Institution-wide templates
  - Single Sign-On (Google, Microsoft)
  - Admin dashboard
  - Usage reporting per teacher
  - Custom domain
  - API access (10,000 requests/day)

#### Tier 4: Enterprise (District/University)

- **Target Users**: Large institutions, districts, universities
- **Price**: Custom pricing (starting at $999/month)
- **Limits**: None
- **Features Included**:
  - Everything in Team
  - SSO with SAML/LDAP
  - Custom AI training on institution materials
  - Dedicated account manager
  - SLA guarantee (99.9% uptime)
  - Custom integrations (LMS, SIS)
  - Compliance (FERPA, GDPR, SOC 2)
  - Advanced security controls
  - Unlimited API access
  - Training sessions
  - Priority feature requests

---

### User Flows

#### UC-1: User Reaches Free Tier Limit

**Actor:** Free tier user who has created 5 exams this month

**Flow:**

1. User clicks "Create New Exam"
2. System checks exam count: current = 5, limit = 5
3. Modal appears: "You've reached your monthly limit"
4. Options displayed:
   - "Upgrade to Pro" → `/pricing#pro` (primary CTA)
   - "Wait until [date]" → shows reset date
   - "Contact Sales" → `/contact`
5. User can still view/edit existing exams
6. Analytics show usage meter

#### UC-2: User Upgrades to Pro

**Actor:** Free tier user upgrading to Pro

**Flow:**

1. User clicks "Upgrade to Pro" button
2. Modal: Select billing cycle (monthly/yearly)
3. Yearly shows 20% discount ($95.88 vs $119.88)
4. User enters payment details (Stripe Elements)
5. System creates subscription via Stripe
6. Success confirmation with new limits displayed
7. Usage limits updated immediately
8. Welcome email with Pro features guide

#### UC-3: Teacher Manages Team Subscription

**Actor:** Team owner managing school subscription

**Flow:**

1. Owner visits `/dashboard/settings/team`
2. Dashboard shows:
   - Current plan: Team ($149/month)
   - Teachers: 7/10 active
   - Students: 1,234/5,000 active
   - Next billing date
   - Monthly usage chart
3. Actions available:
   - Add/remove teachers
   - View teacher usage
   - Upgrade to Enterprise
   - Download invoice
   - Cancel subscription

#### UC-4: Admin Upgrades Institution to Enterprise

**Actor:** School admin requesting Enterprise upgrade

**Flow:**

1. Admin clicks "Contact Sales" from Enterprise card
2. Form: Company name, enrollment size, requirements
3. Sales team receives notification
4. Custom quote generated based on:
   - Number of teachers
   - Number of students
   - Required features
   - Support level
5. Contract signed (DocuSign integration)
6. Onboarding call scheduled
7. Account configured manually
8. Migration assistance provided

---

### Non-Functional Requirements

#### Performance

- Subscription status check < 100ms (cached)
- Payment processing < 3 seconds
- Usage limits checked in real-time for writes, cached for reads

#### Scalability

- Support 100,000+ concurrent subscriptions
- Handle Stripe webhook scaling automatically

#### Security

- PCI compliant payment handling (Stripe)
- No card data stored locally
- Encrypted subscription tokens
- Audit logging for all billing events

---

## Domain Model

### Entities

#### Subscription

```typescript
// Backend: @domain/entities/Subscription.ts
interface Subscription {
  id: SubscriptionId;
  userId: UserId | TeamId;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  billingInterval: 'month' | 'year';
  createdAt: Date;
  updatedAt: Date;
}

type SubscriptionPlan = 'free' | 'pro' | 'team' | 'enterprise';
type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing';
```

#### UsageRecord

```typescript
// Backend: @domain/entities/UsageRecord.ts
interface UsageRecord {
  id: UsageRecordId;
  userId: UserId;
  resource: UsageResource;
  count: number;
  periodStart: Date;
  periodEnd: Date;
  resetAt: Date;
}

type UsageResource = 'exams' | 'students' | 'classes' | 'documents' | 'api_requests';
```

#### SubscriptionLimit

```typescript
// Backend: @domain/entities/SubscriptionLimit.ts
interface SubscriptionLimit {
  plan: SubscriptionPlan;
  limits: {
    examsPerMonth: number | null; // null = unlimited
    maxStudents: number | null;
    maxClasses: number | null;
    maxDocumentSize: number; // bytes
    maxDocumentPages: number;
    analyticsLevel: 'basic' | 'advanced' | 'institution';
    apiRequestsPerDay: number | null;
    supportLevel: 'community' | 'email' | 'priority' | 'dedicated';
  };
}
```

### Value Objects

#### PlanPricing

```typescript
// Backend: @domain/value-objects/PlanPricing.ts
interface PlanPricing {
  plan: SubscriptionPlan;
  monthlyPrice: number; // cents
  yearlyPrice: number; // cents
  currency: 'usd';
  trialDays: number;
}
```

---

## Use Cases

### Backend Use Cases

#### UC-B1: CheckSubscriptionLimits

- **Input**: userId, requestedResource
- **Output**: { allowed: boolean, currentUsage: number, limit: number, resetDate?: Date }
- **Business Rules**:
  - Free users checked monthly
  - Pro/Team/Enterprise checked against limits
  - Enterprise always returns allowed=true

#### UC-B2: RecordUsage

- **Input**: userId, resource, increment = 1
- **Output**: { success: boolean, newCount: number }
- **Business Rules**:
  - Increment usage counter
  - If limit exceeded, reject and return upgrade prompt
  - Log to analytics

#### UC-B3: CreateSubscription

- **Input**: userId, plan, billingInterval
- **Output**: { subscription: Subscription, checkoutUrl?: string }
- **Business Rules**:
  - Validate plan exists
  - Create Stripe customer if not exists
  - Create Stripe subscription
  - Store subscription locally
  - Send welcome email

#### UC-B4: CancelSubscription

- **Input**: userId, immediate = false
- **Output**: { subscription: Subscription }
- **Business Rules**:
  - Set cancelAtPeriodEnd = true
  - User retains access until period end
  - Send cancellation confirmation

#### UC-B5: UpgradeSubscription

- **Input**: userId, newPlan
- **Output**: { subscription: Subscription }
- **Business Rules**:
  - Prorate remaining days
  - Apply new limits immediately
  - Update Stripe subscription

#### UC-B6: HandleStripeWebhook

- **Input**: Stripe event
- **Output**: void
- **Events Handled**:
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`

---

## API Endpoints

### Subscription Management

#### GET /api/subscriptions/current

Returns current user's subscription and usage.

**Response:**

```json
{
  "subscription": {
    "plan": "pro",
    "status": "active",
    "currentPeriodEnd": "2025-04-01T00:00:00Z",
    "billingInterval": "month"
  },
  "usage": {
    "exams": { "used": 12, "limit": null },
    "students": { "used": 45, "limit": 500 },
    "classes": { "used": 3, "limit": null },
    "apiRequests": { "used": 234, "limit": 1000 }
  },
  "limits": {
    "analyticsLevel": "advanced",
    "supportLevel": "priority"
  }
}
```

#### POST /api/subscriptions/create-checkout-session

Creates Stripe checkout session for new subscription.

**Request:**

```json
{
  "plan": "pro",
  "billingInterval": "year",
  "successUrl": "/dashboard?upgrade=success",
  "cancelUrl": "/pricing?upgrade=canceled"
}
```

**Response:**

```json
{
  "checkoutUrl": "https://checkout.stripe.com/..."
}
```

#### POST /api/subscriptions/portal

Creates Stripe customer portal session.

**Response:**

```json
{
  "portalUrl": "https://billing.stripe.com/..."
}
```

#### POST /api/subscriptions/cancel

Cancels subscription at period end.

**Request:**

```json
{
  "immediate": false
}
```

**Response:**

```json
{
  "subscription": {
    "cancelAtPeriodEnd": true,
    "currentPeriodEnd": "2025-04-01T00:00:00Z"
  }
}
```

#### POST /api/subscriptions/upgrade

Upgrades to a higher plan (prorated).

**Request:**

```json
{
  "newPlan": "team"
}
```

### Webhooks

#### POST /api/webhooks/stripe

Handles Stripe webhook events.

**Headers:**

- `stripe-signature`: Webhook signature

---

## Database Schema

### PostgreSQL Tables

```sql
-- Subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  plan VARCHAR(20) NOT NULL CHECK (plan IN ('free', 'pro', 'team', 'enterprise')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_customer_id VARCHAR(255) UNIQUE,
  stripe_price_id VARCHAR(255),
  billing_interval VARCHAR(10) NOT NULL CHECK (billing_interval IN ('month', 'year')),
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage records table
CREATE TABLE usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  resource VARCHAR(50) NOT NULL CHECK (resource IN ('exams', 'students', 'classes', 'documents', 'api_requests')),
  count INTEGER NOT NULL DEFAULT 0,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  reset_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, team_id, resource, period_start)
);

-- Indexes
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_team_id ON subscriptions(team_id);
CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX idx_usage_records_user_period ON usage_records(user_id, resource, period_start);
```

---

## Frontend Components

### PricingSection (Updated)

```typescript
// @features/landing/components/PricingSection.tsx
interface PricingSectionProps {
  currentPlan?: SubscriptionPlan;
  onUpgradeClick?: (plan: SubscriptionPlan) => void;
}
```

**Features:**

- Show user's current plan highlighted
- "Current Plan" badge on active subscription
- Usage meter showing current usage
- Upgrade buttons for lower/equal plans disabled
- Enterprise shows contact form modal

### UsageLimitModal

```typescript
// @features/subscription/components/UsageLimitModal.tsx
interface UsageLimitModalProps {
  resource: UsageResource;
  current: number;
  limit: number;
  resetDate?: Date;
  onUpgrade: () => void;
  onDismiss: () => void;
}
```

**Features:**

- Displays when user tries to exceed limit
- Shows current vs. limit
- Clear upgrade CTA
- Option to wait until reset
- Skip option (if applicable)

### SubscriptionDashboard

```typescript
// @features/subscription/components/SubscriptionDashboard.tsx
// Route: /dashboard/settings/subscription
```

**Features:**

- Current plan card with status
- Usage charts (bar charts for limits)
- Next billing date
- Upgrade/downgrade options
- Cancel subscription link
- Invoice history

### UpgradeCheckoutModal

```typescript
// @features/subscription/components/UpgradeCheckoutModal.tsx
interface UpgradeCheckoutModalProps {
  selectedPlan: SubscriptionPlan;
  currentPlan: SubscriptionPlan;
  onSuccess: () => void;
  onCancel: () => void;
}
```

**Features:**

- Plan comparison table
- Billing interval toggle (monthly/yearly)
- Price calculation with proration
- Stripe Elements form
- Terms acceptance checkbox
- Submit button with loading state

---

## Translation Keys

### File: `frontend/lib/i18n/locales/en/subscription.json`

```json
{
  "subscription": {
    "currentPlan": "Current Plan",
    "upgradeTo": "Upgrade to {{plan}}",
    "downgradeTo": "Downgrade to {{plan}}",
    "cancel": "Cancel Subscription",
    "reactivate": "Reactivate Subscription",
    "manageBilling": "Manage Billing"
  },
  "limits": {
    "examsPerMonth": "Exams per month",
    "students": "Students",
    "classes": "Classes",
    "documentSize": "Max document size",
    "analytics": "Analytics level",
    "support": "Support level"
  },
  "usage": {
    "used": "{{count}} used",
    "of": "of",
    "unlimited": "Unlimited",
    "resetOn": "Resets on {{date}}",
    "upgradeRequired": "Upgrade Required",
    "limitReached": "You've reached your {{resource}} limit"
  },
  "billing": {
    "monthly": "Monthly",
    "yearly": "Yearly",
    "savePercent": "Save {{percent}}%",
    "perMonth": "/month",
    "perYear": "/year",
    "nextBilling": "Next billing date",
    "today": "Today"
  },
  "status": {
    "active": "Active",
    "canceled": "Canceled",
    "pastDue": "Past Due",
    "trialing": "Trial"
  },
  "plans": {
    "free": {
      "name": "Free",
      "tagline": "Get started with AI-powered exams"
    },
    "pro": {
      "name": "Pro",
      "tagline": "For teachers who need more"
    },
    "team": {
      "name": "Team",
      "tagline": "For schools and departments"
    },
    "enterprise": {
      "name": "Enterprise",
      "tagline": "For large institutions"
    }
  },
  "checkout": {
    "title": "Complete your upgrade",
    "summary": "Order summary",
    "total": "Total",
    "payNow": "Pay now",
    "processing": "Processing..."
  },
  "portal": {
    "title": "Manage your subscription",
    "openPortal": "Open billing portal"
  }
}
```

---

## Stripe Integration

### Products & Prices Setup

```typescript
// Stripe Dashboard Configuration
// Products:
// 1. Formidable Free (no Stripe product - default)
// 2. Formidable Pro
//    - Monthly: $9.99/month (STRIPE_PRICE_PRO_MONTHLY)
//    - Yearly: $95.88/year (STRIPE_PRICE_PRO_YEARLY)
// 3. Formidable Team
//    - Monthly: $149/month (STRIPE_PRICE_TEAM_MONTHLY)
//    - Yearly: $1,490/year (STRIPE_PRICE_TEAM_YEARLY)
// 4. Formidable Enterprise
//    - Custom (handled manually via sales)
```

### Webhook Events to Listen

```typescript
const STRIPE_WEBHOOK_EVENTS = [
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'customer.subscription.trial_will_end',
  'invoice.paid',
  'invoice.payment_failed',
  'invoice.payment_succeeded',
];
```

---

## Testing Strategy

### Unit Tests

1. **Subscription Limits**
   - Free user with 5 exams cannot create 6th
   - Pro user can create unlimited exams
   - Usage correctly resets monthly

2. **Pricing Calculations**
   - Monthly vs yearly correctly calculated
   - Proration for upgrades correct

### Integration Tests

1. **Stripe Flow**
   - Webhook creates local subscription
   - Cancel sets cancelAtPeriodEnd
   - Payment failure updates status

2. **Usage Tracking**
   - Exam creation increments counter
   - Limit exceeded blocks creation
   - Counter resets on new period

### E2E Tests (Playwright)

1. **Upgrade Flow**
   - Navigate to pricing page
   - Click upgrade on Pro tier
   - Complete Stripe checkout
   - Verify new plan active

2. **Limit Enforcement**
   - Free user creates 5 exams
   - Try to create 6th → modal appears
   - Click upgrade → checkout flow

---

## Implementation Phases

### Phase 1: Foundation (Backend)

- [ ] Create subscription tables
- [ ] Create usage_records table
- [ ] Implement subscription limits service
- [ ] Add Stripe SDK integration
- [ ] Create webhook handler

### Phase 2: Subscription Management (Backend)

- [ ] Create checkout session endpoint
- [ ] Create portal session endpoint
- [ ] Implement cancel/upgrade logic
- [ ] Add usage recording to exam creation

### Phase 3: Frontend - Landing Page

- [ ] Update PricingSection with real data
- [ ] Add usage meter component
- [ ] Connect upgrade buttons to API
- [ ] Add Enterprise contact form

### Phase 4: Frontend - Dashboard

- [ ] Create subscription settings page
- [ ] Add usage analytics charts
- [ ] Implement upgrade/downgrade flows
- [ ] Add billing management (portal)

### Phase 5: Polish

- [ ] Email notifications (upgrade, cancel, payment issues)
- [ ] Analytics events for conversion tracking
- [ ] Error handling and retry logic
- [ ] Documentation for sales team

---

## Acceptance Criteria

- [ ] Free users limited to 5 exams/month, 30 students, 3 classes
- [ ] Pro users have unlimited exams, 500 students, priority support
- [ ] Team users can manage up to 10 teachers, 5,000 students
- [ ] Stripe checkout completes successfully
- [ ] Usage limits enforced in real-time
- [ ] Subscription status visible in dashboard
- [ ] Cancel subscription retains access until period end
- [ ] Enterprise contact form submits to sales team
- [ ] All text bilingual (EN/ES)
- [ ] Mobile responsive throughout

---

## Open Questions

1. **Free tier limits**: Are the proposed limits (5 exams, 30 students) appropriate?
   - Recommendation: Start with these, adjust based on data

2. **Trial period**: Should Pro/Team have a free trial?
   - Recommendation: 14-day trial with no credit card

3. **Annual discount**: 20% seems standard. Acceptable?

4. **Student self-registration**: Do students need their own subscription?
   - Recommendation: No - teachers subscribe, students are included

5. **Legacy data**: What happens to existing users when we launch?
   - Recommendation: Migrate to Pro tier automatically for launch

---

## Related Documents

- [ADR 0009: Clean Architecture with DDD](../adr/0009-clean-architecture.md)
- [Spec: Landing Page](./landing-page.md)
- [Spec: Authentication Flow](./auth-flow.md)

---

**Created:** March 21, 2026
**Status:** Draft
**Priority:** High
**Estimated Effort:** 3-4 weeks (Backend) + 2 weeks (Frontend)
