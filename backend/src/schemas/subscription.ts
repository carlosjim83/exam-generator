import { Type } from '@sinclair/typebox';

// --- Subscription schemas ---

export const SubscriptionLimitsSchema = Type.Object({
  maxClasses: Type.Union([Type.Number(), Type.Null()]),
  maxStudents: Type.Union([Type.Number(), Type.Null()]),
  maxExamsPerMonth: Type.Union([Type.Number(), Type.Null()]),
  maxQuestionsPerExam: Type.Union([Type.Number(), Type.Null()]),
  aiModel: Type.String(),
  analyticsLevel: Type.String(),
  supportLevel: Type.String(),
});

export const SubscriptionPlanSchema = Type.Object({
  tier: Type.String(),
  price: Type.Number(),
  priceYearly: Type.Number(),
  currency: Type.String(),
  limits: SubscriptionLimitsSchema,
});

export const CurrentSubscriptionResponseSchema = Type.Object(
  {
    tier: Type.String(),
    status: Type.String(),
    currentPeriodEnd: Type.String(),
    limits: Type.Object({}, { additionalProperties: true }),
    usage: Type.Object({}, { additionalProperties: true }),
    limitsReached: Type.Object({
      students: Type.Boolean(),
      classes: Type.Boolean(),
      exams: Type.Boolean(),
    }),
    upgradeNeeded: Type.Boolean(),
  },
  { description: 'Current subscription' }
);

export const SubscriptionPlansResponseSchema = Type.Object(
  {
    plans: Type.Array(SubscriptionPlanSchema),
  },
  { description: 'Subscription plans' }
);
