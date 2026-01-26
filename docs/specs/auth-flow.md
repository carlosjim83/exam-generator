# Authentication Flow Specification

**Version**: 1.0  
**Last Updated**: 2026-01-26

---

## Overview

This document specifies the authentication flows for the Exam Generator application, including local registration/login and OAuth providers (Google, GitHub, Microsoft).

---

## User Roles

| Role | Permissions |
|------|-------------|
| **Teacher** | Upload documents, generate exams, view own documents/exams |
| **Student** | View assigned exams, take exams (future feature) |

**Default role**: Teacher (for MVP)

---

## Authentication Methods

### 1. Local Authentication (Email/Password)

#### Registration

**Endpoint**: `POST /api/auth/register`

**Request**:
```json
{
  "email": "teacher@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "role": "teacher"
}
```

**Validation Rules**:
- Email: Valid format, unique in database
- Password: Min 8 chars, must contain uppercase, lowercase, number, special char
- Name: Min 2 chars, max 100 chars
- Role: Must be "teacher" or "student"

**Response** (201 Created):
```json
{
  "user": {
    "id": "uuid",
    "email": "teacher@example.com",
    "name": "John Doe",
    "role": "teacher"
  },
  "tokens": {
    "accessToken": "jwt-access-token",
    "refreshToken": "jwt-refresh-token"
  }
}
```

**Errors**:
- `400`: Invalid input (validation errors)
- `409`: Email already exists

**Backend Logic**:
1. Validate request body
2. Check email uniqueness
3. Hash password with bcrypt (12 rounds)
4. Create user in database
5. Generate JWT tokens (access: 15min, refresh: 7 days)
6. Set httpOnly cookies
7. Return user data + tokens

---

#### Login

**Endpoint**: `POST /api/auth/login`

**Request**:
```json
{
  "email": "teacher@example.com",
  "password": "SecurePass123!"
}
```

**Response** (200 OK):
```json
{
  "user": {
    "id": "uuid",
    "email": "teacher@example.com",
    "name": "John Doe",
    "role": "teacher"
  },
  "tokens": {
    "accessToken": "jwt-access-token",
    "refreshToken": "jwt-refresh-token"
  }
}
```

**Errors**:
- `400`: Missing email or password
- `401`: Invalid credentials
- `429`: Too many failed attempts (rate limited)

**Backend Logic**:
1. Find user by email
2. Compare password with bcrypt
3. Check account status (not locked)
4. Generate new JWT tokens
5. Set httpOnly cookies
6. Return user data + tokens

**Security**:
- Rate limiting: 5 attempts per 15min per IP
- Account lockout: 10 failed attempts → lock for 30min
- Log failed attempts

---

### 2. OAuth Authentication

Supported providers:
- Google (OAuth 2.0)
- GitHub (OAuth 2.0)
- Microsoft (Azure AD OAuth 2.0)

---

#### OAuth Flow (Google Example)

**Step 1: Initiate OAuth**

**Endpoint**: `GET /api/auth/google`

**Response**: Redirect to Google OAuth consent screen

**URL Example**:
```
https://accounts.google.com/o/oauth2/v2/auth?
  client_id=xxx&
  redirect_uri=https://api.example.com/api/auth/google/callback&
  response_type=code&
  scope=email profile&
  state=random-string
```

---

**Step 2: OAuth Callback**

**Endpoint**: `GET /api/auth/google/callback?code=xxx&state=xxx`

**Backend Logic**:
1. Validate `state` parameter (CSRF protection)
2. Exchange `code` for access token (Google API)
3. Fetch user info from Google (email, name, picture)
4. Find or create user in database:
   - **Existing user**: Match by `email` + `provider=GOOGLE`
   - **New user**: Create with `provider=GOOGLE`, `providerId=google-user-id`
5. Generate JWT tokens
6. Set httpOnly cookies
7. Redirect to frontend (`/dashboard`)

**Database Record** (new OAuth user):
```json
{
  "id": "uuid",
  "email": "teacher@gmail.com",
  "name": "John Doe",
  "provider": "GOOGLE",
  "providerId": "google-oauth-id-12345",
  "passwordHash": null,
  "role": "teacher"
}
```

**Errors**:
- `400`: Invalid state parameter
- `401`: OAuth provider rejected
- `500`: Failed to fetch user info

---

#### OAuth Flow (GitHub)

**Endpoint**: `GET /api/auth/github`

**Flow**: Same as Google, but using GitHub OAuth API

**Scopes**: `user:email` (read email address)

---

#### OAuth Flow (Microsoft)

**Endpoint**: `GET /api/auth/microsoft`

**Flow**: Same as Google, but using Azure AD OAuth API

**Scopes**: `openid email profile`

---

## JWT Token Structure

### Access Token (15min expiry)

**Payload**:
```json
{
  "sub": "user-uuid",
  "email": "teacher@example.com",
  "role": "teacher",
  "type": "access",
  "iat": 1706270400,
  "exp": 1706271300
}
```

**Algorithm**: RS256 (asymmetric, public/private key pair)

---

### Refresh Token (7 days expiry)

**Payload**:
```json
{
  "sub": "user-uuid",
  "type": "refresh",
  "iat": 1706270400,
  "exp": 1706875200
}
```

**Storage**: httpOnly cookie (not accessible via JavaScript)

---

## Token Management

### Refresh Access Token

**Endpoint**: `POST /api/auth/refresh`

**Request**: No body (refresh token in httpOnly cookie)

**Response** (200 OK):
```json
{
  "accessToken": "new-jwt-access-token"
}
```

**Errors**:
- `401`: Invalid or expired refresh token
- `403`: Refresh token revoked

**Backend Logic**:
1. Extract refresh token from cookie
2. Validate JWT signature + expiry
3. Check token not in blacklist (revoked)
4. Generate new access token (15min)
5. Return new access token

**Token Rotation**: Generate new refresh token every refresh (optional, for higher security)

---

### Logout

**Endpoint**: `POST /api/auth/logout`

**Request**: No body (requires valid access token)

**Response** (204 No Content)

**Backend Logic**:
1. Add refresh token to blacklist (Redis or DB table)
2. Clear httpOnly cookies
3. Return 204

**Note**: Access tokens remain valid until expiry (15min max). For immediate revocation, maintain token blacklist.

---

## Protected Routes

### Authentication Middleware

**Logic**:
```typescript
async function authenticateRequest(request: FastifyRequest, reply: FastifyReply) {
  // 1. Extract access token from Authorization header or cookie
  const token = request.headers.authorization?.replace('Bearer ', '') || request.cookies.accessToken;
  
  if (!token) {
    return reply.status(401).send({ error: 'Authentication required' });
  }
  
  // 2. Verify JWT signature + expiry
  try {
    const payload = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
    
    if (payload.type !== 'access') {
      return reply.status(401).send({ error: 'Invalid token type' });
    }
    
    // 3. Attach user to request
    request.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
    
  } catch (error) {
    return reply.status(401).send({ error: 'Invalid or expired token' });
  }
}
```

**Usage**:
```typescript
// Apply to protected routes
fastify.get('/api/documents', { preHandler: authenticateRequest }, async (request) => {
  const userId = request.user.id;
  // ... fetch user's documents
});
```

---

## Authorization Checks

### Resource Ownership

**Example**: User can only access their own documents

```typescript
async function getDocument(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const documentId = request.params.id;
  const userId = request.user.id;
  
  const document = await prisma.document.findUnique({
    where: { id: documentId }
  });
  
  if (!document) {
    return reply.status(404).send({ error: 'Document not found' });
  }
  
  if (document.userId !== userId) {
    return reply.status(403).send({ error: 'Forbidden: You do not own this document' });
  }
  
  return document;
}
```

---

## Security Considerations

### Password Security
- **Hashing**: bcrypt with 12 rounds (slow, resistant to brute-force)
- **Storage**: Never store plaintext passwords
- **Transmission**: HTTPS only (TLS 1.3)

### JWT Security
- **Algorithm**: RS256 (asymmetric keys, public key can be shared)
- **Expiry**: Short-lived access tokens (15min)
- **Storage**: httpOnly cookies (prevents XSS)
- **Revocation**: Blacklist for logged-out tokens

### OAuth Security
- **State parameter**: Random string to prevent CSRF
- **Redirect URI validation**: Whitelist allowed callback URLs
- **HTTPS only**: Never use OAuth over HTTP

### Rate Limiting
- **Login**: 5 attempts per 15min per IP
- **Registration**: 3 accounts per hour per IP
- **Token refresh**: 10 requests per minute per user

### Account Security
- **Failed login attempts**: Log and monitor
- **Account lockout**: 10 failed attempts → 30min lock
- **Password reset**: Email verification (future feature)

---

## Frontend Integration

### Login Flow (React)

```typescript
async function login(email: string, password: string) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Include cookies
    body: JSON.stringify({ email, password }),
  });
  
  if (!response.ok) {
    throw new Error('Login failed');
  }
  
  const { user, tokens } = await response.json();
  
  // Store access token (localStorage or memory)
  localStorage.setItem('accessToken', tokens.accessToken);
  
  // Store user data (state management)
  setUser(user);
  
  // Redirect to dashboard
  router.push('/dashboard');
}
```

---

### OAuth Login (React)

```typescript
function LoginWithGoogle() {
  return (
    <a href="/api/auth/google">
      <Button>Login with Google</Button>
    </a>
  );
}

// After OAuth callback, backend redirects to /dashboard with cookies set
// Frontend checks for authenticated user:

useEffect(() => {
  fetch('/api/auth/me', { credentials: 'include' })
    .then(res => res.json())
    .then(user => setUser(user))
    .catch(() => router.push('/login'));
}, []);
```

---

### Protected API Calls

```typescript
async function fetchDocuments() {
  const accessToken = localStorage.getItem('accessToken');
  
  const response = await fetch('/api/documents', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
    credentials: 'include', // Send cookies (refresh token)
  });
  
  if (response.status === 401) {
    // Access token expired, try refresh
    await refreshAccessToken();
    return fetchDocuments(); // Retry
  }
  
  return response.json();
}

async function refreshAccessToken() {
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    credentials: 'include', // Send refresh token cookie
  });
  
  if (!response.ok) {
    // Refresh token invalid, logout
    logout();
    router.push('/login');
    return;
  }
  
  const { accessToken } = await response.json();
  localStorage.setItem('accessToken', accessToken);
}
```

---

## Testing Requirements

### Unit Tests
- Password hashing/validation
- JWT generation/validation
- Token expiry logic
- OAuth state parameter generation

### Integration Tests
- Local registration flow (valid + invalid inputs)
- Local login flow (correct + incorrect passwords)
- Token refresh flow
- Logout flow (blacklist token)
- OAuth mock flow (mock provider responses)

### E2E Tests (Playwright)
- User registers → redirected to dashboard
- User logs in → sees documents page
- User logs in with Google → OAuth flow completes
- User logs out → redirected to login
- Expired token → auto-refresh → request succeeds
- Invalid token → redirected to login

---

## API Endpoints Summary

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login with email/password |
| POST | `/api/auth/refresh` | No (refresh token) | Refresh access token |
| POST | `/api/auth/logout` | Yes | Logout (revoke tokens) |
| GET | `/api/auth/me` | Yes | Get current user info |
| GET | `/api/auth/google` | No | Initiate Google OAuth |
| GET | `/api/auth/google/callback` | No | Google OAuth callback |
| GET | `/api/auth/github` | No | Initiate GitHub OAuth |
| GET | `/api/auth/github/callback` | No | GitHub OAuth callback |
| GET | `/api/auth/microsoft` | No | Initiate Microsoft OAuth |
| GET | `/api/auth/microsoft/callback` | No | Microsoft OAuth callback |

---

## Related Documentation
- See `docs/adr/0004-authentication-strategy.md` for architectural decisions
- See `docs/architecture.md` for system overview

**Last Updated**: 2026-01-26
