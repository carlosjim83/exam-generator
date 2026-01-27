import { test, expect } from '@playwright/test';
import { setupMockBackend, resetMockDatabase } from './mocks/backend';

test.describe('Authentication - OAuth Flow (Mock)', () => {
  test.beforeEach(async ({ page }) => {
    // Setup mock backend
    await setupMockBackend(page);

    // Verify mock OAuth is enabled
    await page.goto('/login');
  });

  test.afterEach(() => {
    resetMockDatabase();
  });

  test('should register via OAuth mock with TEACHER role', async ({ page }) => {
    await page.goto('/register');

    // Should see "(Mock)" label indicating mock mode
    await expect(page.getByText(/sign up with google.*mock/i)).toBeVisible();

    // Click OAuth button
    await page.getByRole('button', { name: /sign up with google/i }).click();

    // Role selection modal should NOT appear (role pre-selected in register)
    // After OAuth mock processes, should redirect to dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });

    // Should see user info (mock OAuth creates user with Google data)
    await expect(page.getByText(/dashboard/i)).toBeVisible();
  });

  test('should register via OAuth mock with STUDENT role', async ({ page }) => {
    await page.goto('/register');

    // Switch to STUDENT role first
    await page.getByRole('button', { name: /student/i }).click();
    await expect(page.getByText(/Signing up as Student/i)).toBeVisible();

    // Click OAuth button
    await page.getByRole('button', { name: /sign up with google/i }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
  });

  test('should login via OAuth mock and open role selection modal', async ({ page }) => {
    await page.goto('/login');

    // Should see OAuth button
    await expect(page.getByRole('button', { name: /sign in with google/i })).toBeVisible();

    // Click OAuth button
    await page.getByRole('button', { name: /sign in with google/i }).click();

    // Role selection modal SHOULD appear (login mode)
    // Use a more specific selector - "Choose Your Role" is the actual heading
    await expect(page.getByText(/choose your role/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: /choose your role/i })).toBeVisible();

    // Select TEACHER role
    await page
      .getByRole('button', { name: /teacher/i })
      .first()
      .click();

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
  });

  test('should allow canceling role selection modal', async ({ page }) => {
    await page.goto('/login');

    // Click OAuth button
    await page.getByRole('button', { name: /sign in with google/i }).click();

    // Modal should appear
    await expect(page.getByText(/choose your role/i)).toBeVisible({ timeout: 10000 });

    // Click cancel
    await page.getByRole('button', { name: /cancel/i }).click();

    // Modal should close
    await expect(page.getByText(/choose your role/i)).not.toBeVisible();

    // Should still be on login page
    await expect(page).toHaveURL('/login');
  });

  test('should select STUDENT role in login OAuth flow', async ({ page }) => {
    await page.goto('/login');

    // Click OAuth button
    await page.getByRole('button', { name: /sign in with google/i }).click();

    // Modal should appear
    await expect(page.getByText(/choose your role/i)).toBeVisible({ timeout: 10000 });

    // Select STUDENT role
    await page
      .getByRole('button', { name: /student/i })
      .first()
      .click();

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
  });

  test('should show mock label only when mock mode is enabled', async ({ page }) => {
    // In development with NEXT_PUBLIC_USE_MOCK_OAUTH=true
    await page.goto('/login');

    const oauthButton = page.getByRole('button', { name: /sign in with google/i });
    await expect(oauthButton).toContainText('Mock', { ignoreCase: true });
  });

  test('should handle OAuth callback with tokens', async ({ page }) => {
    // First, we need to register tokens in mock backend by creating a user
    // This simulates the OAuth flow where backend creates user and tokens
    const mockEmail = 'oauth-test@google.com';

    // Register user via mock backend first (to create valid tokens)
    await page.goto('/register');
    await page.getByLabel('First Name').fill('OAuth');
    await page.getByLabel('Last Name').fill('User');
    await page.getByLabel('Email').fill(mockEmail);
    await page.getByLabel('Password', { exact: true }).fill('Password123!');
    await page.getByLabel('Confirm Password').fill('Password123!');
    await page.getByRole('button', { name: 'Create Account' }).click();
    await page.waitForURL('/dashboard');

    // Get the tokens that were just created
    const accessToken = await page.evaluate(() => localStorage.getItem('access_token'));
    const refreshToken = await page.evaluate(() => localStorage.getItem('refresh_token'));

    // Clear auth state
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.goto('/login');

    // Now simulate OAuth callback with the valid tokens
    const mockData = {
      accessToken: accessToken!,
      refreshToken: refreshToken!,
      userId: 'oauth-user-123',
      email: mockEmail,
      firstName: 'OAuth',
      lastName: 'User',
      role: 'TEACHER',
      provider: 'google',
    };

    // Navigate directly to callback page with all required params
    const params = new URLSearchParams(mockData);
    await page.goto(`/auth/callback?${params.toString()}`);

    // Should store tokens and redirect to dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });

    // Verify tokens are stored in localStorage
    const storedAccessToken = await page.evaluate(() => localStorage.getItem('access_token'));
    const storedRefreshToken = await page.evaluate(() => localStorage.getItem('refresh_token'));

    expect(storedAccessToken).toBe(mockData.accessToken);
    expect(storedRefreshToken).toBe(mockData.refreshToken);
  });

  test('should show error on OAuth callback failure', async ({ page }) => {
    // Navigate to callback without tokens
    await page.goto('/auth/callback');

    // Should show error or redirect to login
    const currentUrl = page.url();
    const hasError = await page
      .getByText(/error|failed/i)
      .isVisible()
      .catch(() => false);

    // Either shows error on callback page or redirects to login
    expect(hasError || currentUrl.includes('/login')).toBe(true);
  });
});
