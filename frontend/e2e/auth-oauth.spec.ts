import { test, expect } from '@playwright/test';

test.describe('Authentication - OAuth Flow (Mock)', () => {
  test.beforeEach(async ({ page }) => {
    // Verify mock OAuth is enabled
    await page.goto('/login');
  });

  test('should register via OAuth mock with TEACHER role', async ({ page }) => {
    await page.goto('/register');

    // Should see "(Mock)" label indicating mock mode
    await expect(page.getByText(/sign up with google.*mock/i)).toBeVisible();

    // Click OAuth button
    await page.getByRole('button', { name: /sign up with google/i }).click();

    // Role selection modal should NOT appear (role pre-selected in register)
    // Should redirect directly to mock OAuth endpoint
    await page.waitForURL(/auth\/google\/mock/, { timeout: 5000 });

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

    // Should redirect to mock OAuth with STUDENT role
    await page.waitForURL(/auth\/google\/mock.*role=STUDENT/, { timeout: 5000 });

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
    await expect(page.getByText(/select your role/i)).toBeVisible();
    await expect(page.getByText(/teacher/i)).toBeVisible();
    await expect(page.getByText(/student/i)).toBeVisible();

    // Select TEACHER role
    await page
      .getByRole('button', { name: /teacher/i })
      .first()
      .click();

    // Should redirect to OAuth mock
    await page.waitForURL(/auth\/google\/mock.*role=TEACHER/, { timeout: 5000 });

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
  });

  test('should allow canceling role selection modal', async ({ page }) => {
    await page.goto('/login');

    // Click OAuth button
    await page.getByRole('button', { name: /sign in with google/i }).click();

    // Modal should appear
    await expect(page.getByText(/select your role/i)).toBeVisible();

    // Click cancel
    await page.getByRole('button', { name: /cancel/i }).click();

    // Modal should close
    await expect(page.getByText(/select your role/i)).not.toBeVisible();

    // Should still be on login page
    await expect(page).toHaveURL('/login');
  });

  test('should select STUDENT role in login OAuth flow', async ({ page }) => {
    await page.goto('/login');

    // Click OAuth button
    await page.getByRole('button', { name: /sign in with google/i }).click();

    // Modal should appear
    await expect(page.getByText(/select your role/i)).toBeVisible();

    // Select STUDENT role
    await page
      .getByRole('button', { name: /student/i })
      .first()
      .click();

    // Should redirect to OAuth mock with STUDENT role
    await page.waitForURL(/auth\/google\/mock.*role=STUDENT/, { timeout: 5000 });

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
    // Simulate OAuth callback with tokens
    const mockTokens = {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
    };

    // Navigate directly to callback page with tokens
    await page.goto(
      `/auth/callback?access_token=${mockTokens.access_token}&refresh_token=${mockTokens.refresh_token}`
    );

    // Should store tokens and redirect to dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });

    // Verify tokens are stored in localStorage
    const accessToken = await page.evaluate(() => localStorage.getItem('access_token'));
    const refreshToken = await page.evaluate(() => localStorage.getItem('refresh_token'));

    expect(accessToken).toBe(mockTokens.access_token);
    expect(refreshToken).toBe(mockTokens.refresh_token);
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
