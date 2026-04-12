-- Seed FREE tier subscriptions for existing teachers without subscription
-- This migration creates subscriptions and usage metrics for teachers who registered
-- before the automatic subscription creation was implemented

-- First, create subscriptions for teachers who don't have one
INSERT INTO subscriptions (
    id,
    teacher_id,
    tier,
    billing_cycle,
    status,
    current_period_start,
    current_period_end,
    cancel_at_period_end,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    u.id,
    'FREE',
    'MONTHLY',
    'ACTIVE',
    NOW(),
    NOW() + INTERVAL '1 month',
    false,
    NOW(),
    NOW()
FROM users u
WHERE u.role = 'TEACHER'
  AND NOT EXISTS (
    SELECT 1 FROM subscriptions s WHERE s.teacher_id = u.id
  );

-- Then, create usage metrics for the new subscriptions
INSERT INTO usage_metrics (
    id,
    teacher_id,
    subscription_id,
    period,
    current_classes,
    current_students,
    exams_created_this_month,
    exams_created_total,
    peak_concurrent_students,
    avg_exams_per_month,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    s.teacher_id,
    s.id,
    DATE_TRUNC('month', NOW()),
    0,
    0,
    0,
    0,
    0,
    0,
    NOW(),
    NOW()
FROM subscriptions s
WHERE NOT EXISTS (
    SELECT 1 FROM usage_metrics um WHERE um.teacher_id = s.teacher_id
);
