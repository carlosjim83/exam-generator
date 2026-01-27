# E2E Tests - Known Issues

## Rate Limiting in Development

**Issue:** E2E tests are failing due to backend rate limiting (429 Too Many Requests).

**Details:**

- Backend has rate limiting enabled globally (`@fastify/rate-limit`)
- Rate limit: 5 requests per minute per IP for auth endpoints
- E2E tests create multiple users rapidly, triggering rate limits
- Error: `Rate limit exceeded. Try again in 3600 seconds.`

**Solutions:**

### Option 1: Disable Rate Limiting in Test Mode (Recommended)

Add environment variable check in `backend/src/server.ts`:

```typescript
// Only enable rate limiting in production
if (process.env.NODE_ENV !== 'test') {
  await fastify.register(rateLimit, {
    // ... config
  });
}
```

### Option 2: Increase Rate Limits for Development

Modify `backend/src/server.ts`:

```typescript
await fastify.register(rateLimit, {
  global: true,
  max: process.env.NODE_ENV === 'production' ? 5 : 100, // Higher limit in dev
  timeWindow: '1 minute',
  // ...
});
```

### Option 3: Database Seeding Strategy

- Pre-create test users in database before running E2E tests
- Use database transactions/cleanup between tests
- Reduces number of registration requests

### Option 4: Mock Backend for E2E

- Use MSW (Mock Service Worker) to intercept requests
- Not ideal for true E2E testing

## Current Status

- ✅ E2E test suites written (4 files, 31 tests)
- ✅ Tests follow Playwright best practices
- ⚠️ Tests fail due to rate limiting
- ⏳ Waiting for backend rate limit configuration fix

## Test Files

1. `auth-register.spec.ts` - 6 tests
2. `auth-login.spec.ts` - 9 tests
3. `auth-oauth.spec.ts` - 8 tests
4. `auth-protected.spec.ts` - 8 tests

**Total:** 31 E2E tests ready to run once rate limiting is addressed.

## Next Steps

1. Configure backend to disable/relax rate limiting in test mode
2. Add `NODE_ENV=test` or `ENABLE_RATE_LIMIT=false` environment variable
3. Re-run E2E tests
4. Document passing tests

---

**Last Updated:** 2026-01-27
