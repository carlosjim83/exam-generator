# ADR 0004: Hybrid Authentication (Local + OAuth) with Passport.js

**Date**: 2026-01-26  
**Status**: Accepted  
**Decision Makers**: Student + Senior Architect

---

## Context

We need authentication that supports:
1. **Local auth**: Email/password registration and login
2. **OAuth**: Google, GitHub, Microsoft (Azure AD)
3. **Session management**: Secure, stateless tokens
4. **Role-based access**: Teachers vs Students (future: Admins)

**Options considered**:
1. **NextAuth.js** (frontend-first, integrated with Next.js)
2. **Passport.js** (backend library, strategy-based)
3. **Lucia Auth** (modern, TypeScript-first)
4. **Auth0 / Clerk** (SaaS, managed auth)
5. **Custom JWT implementation**

---

## Decision

We will use **Passport.js** in the Fastify backend with **JWT tokens** for session management.

**Authentication methods**:
- **Local strategy**: Email + password (bcrypt hashing)
- **OAuth strategies**: Google, GitHub, Microsoft (via Passport strategies)

**Session tokens**:
- **JWT** (JSON Web Tokens) stored in httpOnly cookies
- Short-lived access tokens (15min) + refresh tokens (7 days)

---

## Rationale

### Why Passport.js?

#### Flexibility
- ✅ Strategy-based architecture (plug-and-play OAuth providers)
- ✅ Works with any backend framework (Fastify, Express, etc.)
- ✅ Over 500+ authentication strategies available
- ✅ Not tied to frontend framework (can support web + mobile)

#### Ecosystem Maturity
- ✅ Battle-tested (10+ years in production)
- ✅ Used by enterprise companies (IBM, Cisco, etc.)
- ✅ Extensive documentation and community support
- ✅ Official Fastify integration (`@fastify/passport`)

#### Backend-First Approach
- ✅ Auth logic lives in backend (proper separation)
- ✅ API can be consumed by any client (web, mobile, CLI)
- ✅ Full control over token generation and validation

---

### Why NOT NextAuth.js?

While NextAuth is excellent, it's tightly coupled to Next.js:
- ❌ Backend is Fastify (separate from Next.js)
- ❌ NextAuth requires Next.js API routes
- ❌ Less flexible for non-web clients
- ✅ If we were using Next.js API Routes for backend, NextAuth would be the choice

---

### Why JWT over Sessions?

#### Stateless
- ✅ No session storage needed (Redis, DB)
- ✅ Backend can scale horizontally (no shared state)
- ✅ Works well with microservices (future expansion)

#### Security
- ✅ httpOnly cookies (prevents XSS attacks)
- ✅ Short-lived access tokens (15min expiry)
- ✅ Refresh token rotation (prevent replay attacks)
- ✅ Token signing with RS256 (asymmetric keys)

#### Performance
- ✅ No DB lookup per request (token contains claims)
- ✅ Faster than session validation

---

## Consequences

### Positive
- Support multiple auth methods (local + OAuth) from day one
- Backend fully controls authentication flow
- Can add more OAuth providers easily (LinkedIn, Apple, etc.)
- Works with any frontend (React, Vue, mobile apps)
- Industry-standard approach (JWT + OAuth2)

### Negative
- More boilerplate than NextAuth (manual route setup)
- Need to handle token refresh logic manually
- OAuth redirect flows require careful implementation
- Must secure JWT signing keys properly

### Neutral
- Requires understanding of OAuth2 flow
- Frontend must handle token storage and refresh

---

## Implementation Notes

### Backend Routes
```
POST   /api/auth/register          # Local registration
POST   /api/auth/login             # Local login
POST   /api/auth/refresh           # Refresh access token
POST   /api/auth/logout            # Invalidate refresh token
GET    /api/auth/google            # OAuth redirect (Google)
GET    /api/auth/google/callback   # OAuth callback (Google)
GET    /api/auth/github            # OAuth redirect (GitHub)
GET    /api/auth/github/callback   # OAuth callback (GitHub)
GET    /api/auth/microsoft         # OAuth redirect (Microsoft)
GET    /api/auth/microsoft/callback # OAuth callback (Microsoft)
GET    /api/auth/me                # Get current user
```

### JWT Payload
```typescript
interface JWTPayload {
  sub: string;        // User ID
  email: string;      // User email
  role: 'teacher' | 'student';
  iat: number;        // Issued at
  exp: number;        // Expiration
}
```

### Password Hashing
```typescript
import bcrypt from 'bcrypt';

// Registration
const hashedPassword = await bcrypt.hash(password, 12); // 12 rounds

// Login validation
const isValid = await bcrypt.compare(password, user.hashedPassword);
```

### Passport Strategies
- `passport-local`: Email/password
- `passport-google-oauth20`: Google OAuth
- `passport-github2`: GitHub OAuth
- `passport-azure-ad-oauth2`: Microsoft OAuth

---

## Security Considerations

### Password Requirements
- Minimum 8 characters
- Must contain: uppercase, lowercase, number, special char
- Rate limiting on login attempts (5 attempts per 15min)
- Account lockout after 10 failed attempts

### Token Security
- Access token: 15min expiry (short-lived)
- Refresh token: 7 days expiry (stored in httpOnly cookie)
- Refresh token rotation (new token issued on refresh)
- Blacklist for revoked tokens (if user logs out)

### OAuth Security
- State parameter (CSRF protection)
- PKCE flow for public clients (if needed)
- Validate OAuth provider responses
- Store OAuth tokens securely (encrypted in DB)

---

## Alternatives Considered

### Lucia Auth
- ✅ Modern, TypeScript-first
- ✅ No magic (explicit token handling)
- ❌ Smaller ecosystem than Passport
- ❌ Fewer OAuth providers out-of-the-box

### Auth0 / Clerk (SaaS)
- ✅ Fully managed (no auth code to write)
- ✅ Beautiful UI components
- ❌ Cost (Auth0 expensive for production)
- ❌ Vendor lock-in
- ❌ Less learning value (abstracted away)

### Custom JWT Implementation
- ✅ Full control
- ❌ Reinventing the wheel (security risks)
- ❌ Have to implement OAuth flows from scratch
- ❌ Not a good use of time

---

## Testing Strategy

### Unit Tests
- Password hashing/validation
- JWT generation/validation
- Token expiry logic

### Integration Tests
- Local registration flow
- Local login flow
- OAuth redirect flow (mocked providers)
- Token refresh flow
- Logout flow

### E2E Tests (Playwright)
- User registers and logs in
- User logs in with Google
- Access protected route with valid token
- Access protected route with expired token

---

## Related Decisions
- See ADR 0002 for backend framework (Fastify)
- See ADR 0003 for database (user storage)

---

## References
- [Passport.js Documentation](https://www.passportjs.org/)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [OAuth 2.0 Security Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
