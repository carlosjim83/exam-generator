import { Page } from '@playwright/test';

// In-memory database for E2E tests
const users = new Map<string, any>();
const tokens = new Map<string, any>();

// Helper to generate mock tokens
const generateTokens = (userId: string) => {
  const accessToken = `mock-access-${userId}-${Date.now()}`;
  const refreshToken = `mock-refresh-${userId}-${Date.now()}`;

  tokens.set(accessToken, {
    userId,
    expiresAt: Date.now() + 3600000, // 1 hour
  });

  return { accessToken, refreshToken };
};

// Helper to extract user from token
const getUserFromToken = (authHeader: string | null) => {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  const tokenData = tokens.get(token);
  if (!tokenData || tokenData.expiresAt < Date.now()) return null;
  return users.get(tokenData.userId);
};

export const setupMockBackend = async (page: Page) => {
  // Mock all API calls to backend
  await page.route('http://localhost:3001/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    const headers = request.headers();

    // POST /auth/register
    if (method === 'POST' && url.pathname === '/auth/register') {
      const body = request.postDataJSON();
      const { email, password, firstName, lastName, role } = body;

      // Check if user already exists
      if (users.has(email)) {
        return route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            statusCode: 400,
            message: 'User with this email already exists',
          }),
        });
      }

      // Create user
      const userId = `user-${Date.now()}-${Math.random()}`;
      const user = {
        id: userId,
        email,
        password, // Store password for login validation in mock
        firstName,
        lastName,
        role: role || 'TEACHER',
        provider: 'local',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      users.set(email, user);
      users.set(userId, user); // Also store by ID
      const tokenPair = generateTokens(userId);

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user,
          ...tokenPair,
        }),
      });
    }

    // POST /auth/login
    if (method === 'POST' && url.pathname === '/auth/login') {
      const body = request.postDataJSON();
      const { email, password } = body;

      const user = users.get(email);

      if (!user) {
        return route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            statusCode: 401,
            message: 'Invalid credentials',
          }),
        });
      }

      // Validate password (in mock, we store the password during registration)
      if (user.password && user.password !== password) {
        return route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            statusCode: 401,
            message: 'Invalid credentials',
          }),
        });
      }

      const tokenPair = generateTokens(user.id);

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user,
          ...tokenPair,
        }),
      });
    }

    // GET /api/profile
    if (method === 'GET' && url.pathname === '/api/profile') {
      const authHeader = headers['authorization'];
      const user = getUserFromToken(authHeader);

      if (!user) {
        return route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            statusCode: 401,
            message: 'Unauthorized',
          }),
        });
      }

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(user),
      });
    }

    // GET /auth/google/mock (OAuth mock)
    if (method === 'GET' && url.pathname === '/auth/google/mock') {
      const role = url.searchParams.get('role') || 'TEACHER';

      // Create OAuth user
      const email = `oauth-${Date.now()}@google.mock`;
      const userId = `oauth-user-${Date.now()}-${Math.random()}`;
      const user = {
        id: userId,
        email,
        firstName: 'OAuth',
        lastName: 'User',
        role,
        provider: 'google',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      users.set(email, user);
      users.set(userId, user);
      const tokenPair = generateTokens(userId);

      // Redirect to callback with all user data (camelCase to match callback page expectations)
      const callbackUrl = new URL('http://localhost:3000/auth/callback');
      callbackUrl.searchParams.set('accessToken', tokenPair.accessToken);
      callbackUrl.searchParams.set('refreshToken', tokenPair.refreshToken);
      callbackUrl.searchParams.set('userId', user.id);
      callbackUrl.searchParams.set('email', user.email);
      callbackUrl.searchParams.set('firstName', user.firstName);
      callbackUrl.searchParams.set('lastName', user.lastName);
      callbackUrl.searchParams.set('role', user.role);
      callbackUrl.searchParams.set('provider', user.provider);

      return route.fulfill({
        status: 302,
        headers: {
          Location: callbackUrl.toString(),
        },
      });
    }

    // GET /health
    if (method === 'GET' && url.pathname === '/health') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'ok',
          timestamp: new Date().toISOString(),
          environment: 'test',
          version: '0.1.0',
        }),
      });
    }

    // Fallback: let request through
    await route.continue();
  });
};

export const resetMockDatabase = () => {
  users.clear();
  tokens.clear();
};
