# Spec: Teacher Subscription Tiers

## Overview

Define subscription tiers for teachers to monetize Formydable while providing value and encouraging upgrades from free to paid plans. The subscription system should follow Freemium best practices observed in competitive platforms like Kahoot!, Google Workspace, and Typeform.

## Business Requirements

### 1. Subscription Tiers

We will implement **3 subscription tiers**:

| Tier       | Price (Monthly) | Price (Yearly) | Discount           |
| ---------- | --------------- | -------------- | ------------------ |
| Free       | $0              | $0             | -                  |
| Pro        | $9              | $90            | 17% off (save $18) |
| Pro Plus   | $19             | $190           | 17% off (save $38) |
| Enterprise | Custom          | Custom         | -                  |

### 2. Free Tier (Starter)

**Purpose:** Allow teachers to try the product and see value before upgrading.

**Limitations:**

- **1 active class** (soft limit - can archive old ones)
- **30 students total** (hard limit - cannot add 31st student)
- **10 exams per month** (resets monthly)
- **50 questions per exam** (hard limit)
- **Basic analytics** (aggregate stats only)
- **Email support** (48-72hr response time)
- **Standard exam AI** (GPT-4o mini - faster, less expensive)
- **Branding**: Formydable logo visible to students

**Included features:**

- Upload PDF/DOCX documents
- Generate exams from documents
- Auto-grading for multiple choice questions
- Student invitation via email/code
- Class management
- Basic performance reports

**Upgrade triggers:**

- When teacher reaches 28 students (show upgrade banner: "2 students remaining on Free plan")
- When teacher creates 8th exam in a month (show: "2 exams remaining this month")
- When students see Formydable branding (teacher can remove with upgrade)

### 3. Pro Tier

**Purpose:** Target individual teachers who need more capacity and features.

**Limits:**

- **Unlimited classes** (no limit)
- **Unlimited students** (no limit)
- **Unlimited exams** (no limit)
- **Unlimited questions per exam** (no limit)
- **Advanced analytics** (per-student tracking, question-level analytics, trends)
- **Priority support** (24-48hr response time, live chat)
- **Advanced exam AI** (GPT-4o - better quality)
- **Premium themes** (remove branding, custom colors)
- **Export results** (CSV, Excel, PDF)
- **Exam templates** (save and reuse exam configurations)

**Upgrade triggers (to Pro Plus):**

- Usage analysis: if teacher creates >50 exams/month or has >100 students
- Feature demand: when teacher tries to use team features or LMS integration

### 4. Pro Plus Tier

**Purpose:** Target power users, department heads, and small school departments.

**Everything in Pro, plus:**

- **Team features** (2-5 teachers can share classes and exams)
- **Collaborative exam creation** (multiple teachers can work on same exam)
- **Team analytics dashboard** (aggregate performance across team)
- **LMS integrations** (Google Classroom, Microsoft Teams for Education, Canvas)
- **Custom branding** (school logo, custom colors, fonts)
- **API access** (for custom integrations)
- **Bulk student import** (CSV import with validation)
- **Exam banks** (organize and tag questions for reuse)
- **Dedicated account manager**

**Upgrade triggers (to Enterprise):**

- When team exceeds 5 teachers
- When school wants SSO (Single Sign-On)
- When school needs HIPAA/FERPA compliance
- When school needs on-premise deployment option

### 5. Enterprise Tier

**Purpose:** Target entire schools, districts, and educational institutions.

**Everything in Pro Plus, plus:**

- **Unlimited teachers** (no limit on team size)
- **SSO integration** (Google SSO, Microsoft Entra ID, SAML 2.0)
- **Admin dashboard** (manage all teachers, classes, students centrally)
- **Advanced security** (2FA enforcement, audit logs, IP allowlisting)
- **Compliance certifications** (FERPA, GDPR, COPPA)
- **Custom data regions** (choose where data is stored)
- **Priority support** (4hr response time SLA, dedicated support phone line)
- **Training & onboarding** (included training sessions for teachers)
- **Discount pricing** (volume discounts for larger deployments)
- **White-label option** (remove Formydable branding completely, custom domain)
- **Custom contracts** (NET payment terms, procurement requirements)

## Domain Model

### Entities

#### SubscriptionTier

```typescript
enum SubscriptionTier {
  FREE = 'FREE',
  PRO = 'PRO',
  PRO_PLUS = 'PRO_PLUS',
  ENTERPRISE = 'ENTERPRISE',
}
```

#### Subscription

```typescript
interface Subscription {
  id: SubscriptionId;
  teacherId: TeacherId;
  tier: SubscriptionTier;
  billingCycle: 'monthly' | 'yearly';
  status: 'active' | 'past_due' | 'cancelled' | 'expired';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### SubscriptionLimits

```typescript
interface SubscriptionLimits {
  tier: SubscriptionTier;
  maxClasses: number | null; // null = unlimited
  maxStudents: number | null;
  maxExamsPerMonth: number | null;
  maxQuestionsPerExam: number | null;
  maxTeamMembers: number | null;
  analyticsLevel: 'basic' | 'advanced' | 'team';
  supportLevel: 'email' | 'priority' | 'dedicated';
  aiModel: 'gpt-4o-mini' | 'gpt-4o';
  customBranding: boolean;
  exportFeatures: boolean;
  lmsIntegrations: string[];
  apiAccess: boolean;
  sso: boolean;
  complianceFeatures: string[];
}
```

#### UsageMetrics

```typescript
interface UsageMetrics {
  teacherId: TeacherId;
  subscriptionId: SubscriptionId;
  period: Date; // YYYY-MM format (e.g., 2026-03)

  // Current usage
  currentClasses: number;
  currentStudents: number;
  examsCreatedThisMonth: number;
  examsCreatedTotal: number;

  // Historical data
  peakConcurrentStudents: number;
  avgExamsPerMonth: number;

  updatedAt: Date;
}
```

## Use Cases

### UC-1: Check Subscription Limits

**Description:** Before allowing actions (add student, create exam), check if user has capacity.

**Preconditions:**

- Teacher is authenticated
- Teacher has an active subscription

**Flow:**

1. Teacher attempts action (e.g., add student to class)
2. System retrieves subscription tier and limits
3. System checks current usage against limits
4. If within limits: allow action, increment usage metrics
5. If at 80%+ of limit: show soft warning ("You've used 24 of 30 student slots. Upgrade to Pro for unlimited students.")
6. If at limit: block action, show upgrade modal with clear CTA
7. Log limit check for analytics

**Postconditions:**

- Action is allowed or blocked appropriately
- Usage metrics are updated
- Conversion opportunity is tracked

### UC-2: Upgrade Subscription

**Description:** Teacher upgrades from Free to Pro/Pro Plus.

**Preconditions:**

- Teacher is authenticated
- Teacher is on lower tier

**Flow:**

1. Teacher clicks "Upgrade" button
2. Show pricing page with tier comparison
3. Teacher selects tier and billing cycle (monthly/yearly)
4. Redirect to Stripe Checkout
5. Payment processed
6. Stripe webhook updates subscription in database
7. Send confirmation email
8. Show success message: "You now have [plan features]!"
9. Track conversion event

**Postconditions:**

- Subscription is updated to new tier
- Billing is set up in Stripe
- Teacher is notified
- Analytics track upgrade

### UC-3: Handle Monthly Limit Resets

**Description:** Reset exam count monthly for Free tier users.

**Preconditions:**

- It's a new month
- Usage metrics exist

**Flow:**

1. Cron job runs at 00:00 UTC on 1st of month
2. Reset `examsCreatedThisMonth` to 0 for all Free users
3. Send usage summary email (optional: "You created 8 exams last month")
4. Update usage metrics timestamp

**Postconditions:**

- Monthly counters are reset
- Teachers may create new exams for the new month

### UC-4: Prorate Upgrade Mid-Period

**Description:** Teacher upgrades mid-month, calculate prorated refund/charge.

**Preconditions:**

- Teacher has active subscription
- Teacher upgrades to higher tier

**Flow:**

1. Stripe handles proration automatically
2. Stripe webhook sends updated subscription info
3. System updates subscription in database
4. Send email with updated billing amount
5. Show new features available

**Postconditions:**

- Teacher is immediately upgraded
- Billing is prorated correctly
- Teacher is informed

### UC-5: Cancel Subscription

**Description:** Teacher cancels subscription.

**Preconditions:**

- Teacher has active Pro/Pro Plus subscription

**Flow:**

1. Teacher clicks "Cancel subscription"
2. Show cancellation survey (optional but recommended)
3. Show warning: "Your subscription will end on [date]. After that, you'll revert to Free tier."
4. Confirm cancellation
5. Set `cancelAtPeriodEnd = true` in Stripe
6. Update subscription in database
7. Send confirmation email

**Grace Period:**

- Account remains on current tier until period end
- Teacher can reactivate anytime (set cancel to false)
- Data is NOT deleted, features become unavailable

**Postconditions:**

- Subscription will downgrade to Free at period end
- Teacher is informed
- Churn metrics are tracked

### UC-6: Handle Failed Payments

**Description:** Payment fails, handle retry and account status.

**Preconditions:**

- Stripe webhook receives `invoice.payment_failed` event

**Flow:**

1. Stripe sends webhook
2. System updates subscription status to `past_due`
3. Email teacher: "Payment failed, update payment method"
4. Allow 3 retry attempts over 7 days
5. Email reminders at day 3 and day 6
6. If all retries fail: downgrade to Free, send email explaining
7. Show upgrade banner on next login

**Postconditions:**

- Teacher is notified of payment failure
- Grace period allows rectification
- Account downgrades if not resolved

### UC-7: Track Usage for Upgrade Suggestions

**Description:** Analyze usage to suggest relevant upgrades.

**Preconditions:**

- Teacher has enough historical data (at least 2 weeks)

**Flow:**

1. System analyzes usage patterns weekly
2. Identify upgrade triggers:
   - Student count approaching limit
   - Exam count high monthly
   - Feature usage (e.g., trying to export, requesting analytics)
3. Score upgrade urgency (Low/Medium/High)
4. If High: show in-app banner with relevant feature
5. If Medium: include in newsletter
6. If Low: track for later

**Examples:**

- Teacher has 28/30 students: "Almost at limit! 2 students remaining. Upgrade for unlimited students."
- Teacher creates 8+ exams/month: "You're creating lots of exams! Upgrade for unlimited exams."
- Teacher tries to export: "Upgrade to Pro to export results."

**Postconditions:**

- Relevant upgrade suggestions are shown
- Conversion rate increases

### UC-8: Enterprise Onboarding

**Description:** School purchases Enterprise tier.

**Preconditions:**

- School contacts sales
- Agreement signed

**Flow:**

1. Sales creates Enterprise subscription manually
2. Set custom limits and pricing in Stripe
3. Create admin account for school
4. Send onboarding email with setup instructions
5. Schedule training session
6. Configure SSO if requested
7. Add custom branding if requested
8. Monitor early usage, provide support

**Postconditions:**

- School is successfully onboarded
- Admin account has full control
- Features are configured

## API Endpoints

### GET /api/subscription/current

Get current teacher's subscription and usage.

**Response:**

```json
{
  "tier": "FREE",
  "status": "active",
  "currentPeriodEnd": "2026-04-01T00:00:00Z",
  "limits": {
    "maxClasses": 1,
    "maxStudents": 30,
    "maxExamsPerMonth": 10,
    "maxQuestionsPerExam": 50,
    "analyticsLevel": "basic",
    "supportLevel": "email",
    "customBranding": false,
    "exportFeatures": false
  },
  "usage": {
    "currentClasses": 1,
    "currentStudents": 28,
    "examsCreatedThisMonth": 7,
    "examsCreatedTotal": 42
  },
  "canUpgradeTo": ["PRO", "PRO_PLUS"],
  "upgradeTriggers": {
    "type": "student_limit",
    "severity": "warning",
    "message": "You've used 28 of 30 student slots. 2 remaining.",
    "cta": "Upgrade to Pro for unlimited students"
  }
}
```

### POST /api/subscription/upgrade

Initiate upgrade to higher tier.

**Request:**

```json
{
  "targetTier": "PRO",
  "billingCycle": "yearly"
}
```

**Response:**

```json
{
  "checkoutUrl": "https://checkout.stripe.com/c/..."
}
```

### POST /api/subscription/cancel

Cancel subscription at period end.

**Request:**

```json
{
  "reason": "too_expensive",
  "feedback": "pricing is high for small classes"
}
```

**Response:**

```json
{
  "success": true,
  "willDowngradeOn": "2026-04-01T00:00:00Z",
  "remainingFeatures": "You'll keep access to Pro features until this date, then downgrade to Free."
}
```

### GET /api/subscription/plans

Get all available plans with features.

**Response:**

```json
{
  "plans": [
    {
      "tier": "FREE",
      "price": 0,
      "currency": "USD",
      "features": [...]
    },
    {
      "tier": "PRO",
      "price": 9,
      "currency": "USD",
      "priceYearly": 90,
      "features": [...]
    },
    {
      "tier": "PRO_PLUS",
      "price": 19,
      "currency": "USD",
      "priceYearly": 190,
      "features": [...]
    }
  ]
}
```

### Webhook: /api/webhooks/stripe

Handle Stripe webhooks.

**Events:**

- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `checkout.session.completed`

## Database Schema

### Tables

```sql
CREATE TABLE subscription_tiers (
  tier VARCHAR(20) PRIMARY KEY,
  max_classes INT,
  max_students INT,
  max_exams_per_month INT,
  max_questions_per_exam INT,
  max_team_members INT,
  analytics_level VARCHAR(20),
  support_level VARCHAR(20),
  ai_model VARCHAR(20),
  custom_branding BOOLEAN DEFAULT FALSE,
  export_features BOOLEAN DEFAULT FALSE,
  lms_integrations JSONB DEFAULT '[]',
  api_access BOOLEAN DEFAULT FALSE,
  sso BOOLEAN DEFAULT FALSE,
  compliance_features JSONB DEFAULT '[]'
);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  tier VARCHAR(20) NOT NULL REFERENCES subscription_tiers(tier),
  billing_cycle VARCHAR(10) NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'cancelled', 'expired')),
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  stripe_subscription_id VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(stripe_subscription_id)
);

CREATE TABLE usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  period DATE NOT NULL, -- YYYY-MM-01 format
  current_classes INT DEFAULT 0,
  current_students INT DEFAULT 0,
  exams_created_this_month INT DEFAULT 0,
  exams_created_total INT DEFAULT 0,
  peak_concurrent_students INT DEFAULT 0,
  avg_exams_per_month DECIMAL(10,2) DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(teacher_id, period)
);

CREATE TABLE usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES teachers(id),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id),
  event_type VARCHAR(50) NOT NULL, -- 'exam_created', 'student_added', 'limit_reached', 'upgrade_clicked'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_usage_events_teacher_id ON usage_events(teacher_id);
CREATE INDEX idx_usage_events_created_at ON usage_events(created_at);
CREATE INDEX idx_subscriptions_teacher_id ON subscriptions(teacher_id);
```

## Frontend Components

### 1. PricingPage (`/pricing`)

Pricing comparison page with all tiers.

**Key Elements:**

- Toggle: Monthly / Yearly (show 17% savings)
- 3 cards: Free, Pro, Pro Plus
- Enterprise: "Contact Sales" CTA
- Feature comparison table
- FAQ section

**Translatable strings needed:**

```
landing:pricing.*
  title
  subtitle
  toggle.monthly
  toggle.yearly (save 17%)
  free.* // expand
  pro.features // expand with new features
  pro.price
  pro_plus.title // new
  pro_plus.description // new
  pro_plus.features // new array
  pro_plus.price
  pro_plus.cta
  enterprise.cta
  faq.* // new section
```

### 2. SubscriptionLimitBanner

In-app banner showing current usage and upgrade prompts.

**Shown when:**

- Students > 80% of limit
- Exams > 80% of monthly limit
- Trying to use restricted feature

**Design:**

```tsx
<Alert variant="warning">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Almost at limit</AlertTitle>
  <AlertDescription>
    You've used 28 of 30 student slots. <Link href="/pricing">Upgrade to Pro</Link> for unlimited
    students.
  </AlertDescription>
</Alert>
```

### 3. UpgradeModal

Modal shown when hitting hard limits.

**Components:**

- Clear message: "To add more students, upgrade to Pro"
- Feature comparison
- Pricing
- CTA: "Upgrade Now" (Stripe checkout)
- Dismiss: "Maybe later"

### 4. SubscriptionSettingsPage (`/settings/subscription`)

Manage current subscription.

**Shows:**

- Current plan and billing cycle
- Next billing date and amount
- Usage stats
- Upgrade/Downgrade options
- Payment method
- Cancel subscription button

### 5. UsageDashboard

Visual usage metrics in teacher dashboard.

**Charts:**

- Student count vs limit
- Exams created (current month vs last 3 months)
- Feature usage heatmap

## Testing Strategy

### Unit Tests

- `SubscriptionLimits` entity validation
- Usage metrics calculations
- Limit checking logic
- Proration calculations
- Tier comparison logic

### Integration Tests

- Stripe webhook handling
- Database updates on subscription changes
- Usage metric tracking
- Email sending on subscription events

### E2E Tests

- Free signup → Create class → Add 30 students → Try 31st → Show upgrade modal → Upgrade → Verify Pro features
- Pro user → Cancel subscription → Verify downgrade at period end
- Yearly billing → Verify discount applied
- Failed payment → Verify grace period → Verify downgrade

## Acceptance Criteria

### Phase 1: Minimal Viable Subscription (MVP)

- [ ] Free tier with limits (1 class, 30 students, 10 exams/month)
- [ ] Pro tier ($9/mo) with unlimited everything
- [ ] Stripe integration for payments
- [ ] Limit checking before critical actions
- [ ] Upgrade banners and modals
- [ ] Monthly exam counter reset
- [ ] Basic usage metrics tracking
- [ ] Subscription settings page

### Phase 2: Enhanced Subscription Features

- [ ] Pro Plus tier ($19/mo) with team features
- [ ] Yearly billing with 17% discount
- [ ] Prorated upgrades
- [ ] Cancellation flow with grace period
- [ ] Failed payment handling
- [ ] Usage analytics dashboard
- [ ] Upgrade suggestion engine
- [ ] Feature comparison table

### Phase 3: Enterprise & Advanced

- [ ] Enterprise tier (custom pricing)
- [ ] SSO integration
- [ ] LMS integrations (Google Classroom, etc.)
- [ ] API access
- [ ] Team analytics dashboard
- [ ] Compliance features (FERPA, GDPR)
- [ ] Custom branding
- [ ] White-label option

## Stripe Integration Details

### Products and Prices

```javascript
// Create products
const products = [
  { name: 'Pro', description: 'Unlimited classes, students, exams' },
  { name: 'Pro Plus', description: 'Team features and integrations' },
];

// Create prices
const prices = [
  { productId: 'pro', amount: 900, currency: 'usd', interval: 'month' },
  { productId: 'pro', amount: 9000, currency: 'usd', interval: 'year' },
  { productId: 'pro_plus', amount: 1900, currency: 'usd', interval: 'month' },
  { productId: 'pro_plus', amount: 19000, currency: 'usd', interval: 'year' },
];
```

### Webhook Endpoints

Must implement:

1. `POST /api/webhooks/stripe` with signature verification
2. Event handlers for all subscription events
3. Idempotency (handle duplicate webhooks)

### Checkout Flow

1. Create Stripe Checkout Session:

```typescript
const session = await stripe.checkout.sessions.create({
  customer: stripeCustomerId,
  mode: 'subscription',
  payment_method_types: ['card'],
  line_items: [
    {
      price: priceId,
      quantity: 1,
    },
  ],
  success_url: `${baseUrl}/settings/subscription?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${baseUrl}/pricing?canceled=true`,
  subscription_data: {
    metadata: {
      teacherId: teacherId,
      tier: targetTier,
    },
  },
});
```

2. Handle successful checkout:

- Listen for `checkout.session.completed` webhook
- Update subscription in database
- Record usage event: `subscription_upgraded`

## Security Considerations

1. **Stripe Webhook Signature Verification**: Always verify webhook signatures to prevent fraud
2. **Idempotency**: Handle duplicate webhook events safely
3. **Rate Limiting**: Limit upgrade attempts and API calls
4. **Data Retention**: Keep subscription data for legal compliance (even after cancellation)
5. **Access Control**: Only users can view/modify their own subscriptions

## Analytics & Metrics to Track

### Conversion Metrics

- Free → Pro conversion rate
- Pro → Pro Plus conversion rate
- Free user lifetime (time to upgrade or churn)
- Upgrade funnel abandonment rate

### Usage Metrics

- Avg students per Free user
- Avg exams created per Free user/month
- Feature usage by tier
- Limit hit frequency

### Revenue Metrics

- MRR (Monthly Recurring Revenue)
- ARPU (Average Revenue Per User)
- Churn rate (monthly/yearly)
- LTV (Lifetime Value)
- CAC (Customer Acquisition Cost) - if advertising

### Health Metrics

- Payment failure rate
- Time to payment recovery
- Support request volume by tier
- Bug report rate by tier

## Future Enhancements (Out of Scope for MVP)

1. **Annual Discounts**: Currently 17%, consider seasonal promotions
2. **Referral Program**: "Invite a colleague, get 1 month free"
3. **Volume Discounts**: For Enterprise with >100 teachers
4. **Trial Periods**: 7-day free trial of Pro Plus
5. **Usage-Based Pricing**: For very high-volume schools
6. **Add-ons**: Extra AI credits, additional team seats
7. **Educational Discounts**: For non-profit schools
8. **Regional Pricing**: Localized pricing for different countries

## Dependencies & Tech Stack

### Required

- **Stripe API**: Payment processing, subscription management
- **PostgreSQL**: Database (already have)
- **Prisma ORM** (if using): Type-safe database queries
- **Cron job scheduler** (node-cron or BullMQ): Monthly resets
- **Email service** (Resend/ AWS SES): Subscription notifications

### Nice to Have

- **BullMQ**: For async webhook processing
- **Redis**: For rate limiting and caching
- **Segment/Mixpanel**: For subscription analytics
- **Datadog/New Relic**: For monitoring subscription flows

## Risks & Mitigations

### Risk 1: Stripe Downtime

**Mitigation**: Graceful degradation - allow actions if Stripe is down, sync when back up

### Risk 2: Payment Churn

**Mitigation**: Automatic retry with exponential backoff, clear communication

### Risk 3: Complex State Management

**Mitigation**: Keep subscription state simple, use Stripe as source of truth

### Risk 4: Fraudulent Signups

**Mitigation**: Stripe fraud detection, CAPTCHA on signup, rate limiting

### Risk 5: Data Loss on Downgrade

**Mitigation**: Never delete data, only restrict access to features

## Success Metrics

Launch success criteria:

- [ ] 5% of Free users upgrade to Pro within 30 days
- [ ] 2% of Pro users upgrade to Pro Plus
- [ ] <1% payment failure rate
- [ ] <5% churn rate in first 3 months
- [ ] Positive feedback on pricing (survey NPS > 40)

## Appendix: Competitive Analysis Summary

| Platform         | Free Tier            | Paid Tier  | Key Differentiator                         |
| ---------------- | -------------------- | ---------- | ------------------------------------------ |
| Kahoot!          | Limited participants | $19-79/mo  | Participation limits, brand integration    |
| Google Workspace | 30GB storage         | €6.8-21/mo | Per-user pricing, AI features              |
| Typeform         | 100 responses/mo     | $39-129/mo | Response limits, analytics depth           |
| Formydable (us)  | 30 students, 10/mo   | $9-19/mo   | Student limits, AI-powered exam generation |

**Our Advantage:**

- More generous Free tier (30 students vs typical 10-20)
- Lower Pro price ($9 vs $19+ on Kahoot!)
- AI-powered exam generation (unique feature)
- Teacher-focused vs general audience

**Recommendation:**

- Keep pricing competitive but sustainable
- Emphasize AI features in marketing
- Focus on teacher pain points (grading, exam creation)
- Provide excellent free tier to build trust
