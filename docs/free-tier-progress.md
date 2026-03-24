# Free Tier Implementation - Summary

## ✅ Completed

### 1. Domain Layer

- **Subscription** entity - manages subscription tiers, status, billing
- **SubscriptionLimits** entity - defines limits for each tier (FREE, PRO, PRO_PLUS, ENTERPRISE)
- **UsageMetrics** entity - tracks current usage (students, classes, exams)
- **SubscriptionId** value object - UUID-based ID

### 2. Database

- Prisma schema updated with:
  - `Subscription` table with Stripe integration fields
  - `UsageMetrics` table for tracking usage per month
  - Relationship to User table
- Database synchronized with `db push`

### 3. Infrastructure

- **SubscriptionRepository** - Prisma implementation
- **UsageMetricsRepository** - Prisma implementation with methods to increment/decrement counters

### 4. Application Layer

- **CheckSubscriptionLimitUseCase** - validates limits:
  - `checkStudentLimit()` - checks if can add students
  - `checkClassLimit()` - checks if can create classes
  - `checkExamLimit()` - checks if can create exams
  - `checkQuestionLimit()` - checks question count per exam
  - `getUpgradeSuggestions()` - returns upgrade prompts

- **GetSubscriptionUseCase** - retrieves subscription with usage metrics

### 5. API Routes

- `GET /api/subscription/current` - returns subscription status, limits, and current usage
- `GET /api/subscription/plans` - returns available plans (Free & Pro)

### 6. Auto-Creation

- **RegisterUserUseCase** - automatically creates Free subscription when new teacher registers

## 🚧 TODO - Remaining Implementation

### High Priority

1. **Update CreateClassUseCase**
   - Check class limit before creating class
   - Increment class count in usage metrics
   - Return error if limit reached

2. **Update AddStudentToClassUseCase**
   - Check student limit before adding
   - Increment student count in usage metrics
   - Return error if limit reached with upgrade CTA

3. **Update GenerateExamUseCase**
   - Check exam limit before creating exam
   - Increment exam count in usage metrics
   - Update class count when new exam is assigned

### Medium Priority

4. **Cron Job for Monthly Reset**
   - Reset `examsCreatedThisMonth` for all Free tier users
   - Run on 1st of each month at 00:00 UTC
   - Send usage summary emails

### Frontend Work

5. **SubscriptionContext** - global subscription state for React
6. **UpgradeBanner** - in-app banner when approaching limits
7. **UpgradeModal** - modal when hitting hard limits
8. **Translation Keys** - add EN/ES translations for:
   - Subscription features
   - Limit messages
   - Upgrade prompts

## 🔧 Free Tier Limits

### Current Limits (per spec)

- **1 active class** (soft limit - can archive old ones)
- **30 students total** (hard limit)
- **10 exams per month** (resets monthly)
- **50 questions per exam** (hard limit)
- **Basic analytics** only
- **Email support** (48-72hr)
- **AI: GPT-4o-mini** (faster but less sophisticated)

### Triggers for Upgrade UI

- **Warning at 80%** of limit:
  - 24 students (`0.8 * 30 = 24`)
  - 8 exams in month (`0.8 * 10 = 8`)
  - Remaining slots banner
- **Hard limit**:
  - Show modal with upgrade CTA
  - Cannot continue action without upgrade

## 📊 Database Schema

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  teacher_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  tier VARCHAR(20) NOT NULL DEFAULT 'FREE',
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_customer_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE usage_metrics (
  id UUID PRIMARY KEY,
  teacher_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL,
  period DATE NOT NULL, -- YYYY-MM-01 format (first day of month)
  current_classes INT DEFAULT 0,
  current_students INT DEFAULT 0,
  exams_created_this_month INT DEFAULT 0,
  exams_created_total INT DEFAULT 0,
  peak_concurrent_students INT DEFAULT 0,
  avg_exams_per_month DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🎯 Next Steps

**Immediate:**

1. Test subscription creation on new teacher registration
2. Verify `/api/subscription/current` returns correct data
3. Update CreateClassUseCase to enforce class limit

**Short-term:** 4. Update AddStudentToClassUseCase to enforce student limit 5. Update GenerateExamUseCase to enforce exam limit 6. Create UpgradeBanner component

**Long-term:** 7. Implement Stripe integration for payment processing 8. Create upgrade flow with Stripe Checkout 9. Implement Pro tier features (unlimited limits) 10. Add analytics dashboard for subscription metrics

## 🐛 Known Issues

- LSP TypeScript errors: These are expected and will resolve when TypeScript server restarts after Prisma client regeneration
- Need to wire up subscription repositories in all use cases that modify usage
- Usage tracking is manual - need to ensure all code paths update metrics correctly

## 💰 Pricing (per specs)

| Plan       | Monthly | Yearly | Discount  |
| ---------- | ------- | ------ | --------- |
| Free       | $0      | $0     | -         |
| Pro        | $9      | $90    | 17% ($18) |
| Pro Plus   | $19     | $190   | 17% ($38) |
| Enterprise | Custom  | Custom | -         |
