import { test, expect } from '@playwright/test';
import { setupMockBackend, resetMockDatabase } from './mocks/backend';

test.describe('Protected Routes & Logout', () => {
  test.beforeEach(async ({ page }) => {
    // Setup mock backend
    await setupMockBackend(page);
  });

  test.afterEach(() => {
    resetMockDatabase();
  });

  test.describe('Protected Routes', () => {
    test('should redirect to login when accessing dashboard without authentication', async ({
      page,
    }) => {
      // Try to access protected route directly
      await page.goto('/dashboard');

      // Should redirect to login page
      await expect(page).toHaveURL('/login');
    });

    test('should allow access to dashboard when authenticated', async ({ page }) => {
      // Register and login
      const timestamp = Date.now();
      const email = `protected-test-${timestamp}@example.com`;

      await page.goto('/register');
      await page.getByLabel('First Name').fill('Protected');
      await page.getByLabel('Last Name').fill('Test');
      await page.getByLabel('Email').fill(email);
      await page.getByLabel('Password', { exact: true }).fill('Password123!');
      await page.getByLabel('Confirm Password').fill('Password123!');
      await page.getByRole('button', { name: 'Create Account' }).click();

      // Should be able to access dashboard
      await expect(page).toHaveURL('/dashboard');
      await expect(page.getByText(/Protected/i)).toBeVisible();
    });

    test('should redirect authenticated user from login to dashboard', async ({ page }) => {
      // First, register
      const timestamp = Date.now();
      const email = `redirect-test-${timestamp}@example.com`;

      await page.goto('/register');
      await page.getByLabel('First Name').fill('Redirect');
      await page.getByLabel('Last Name').fill('Test');
      await page.getByLabel('Email').fill(email);
      await page.getByLabel('Password', { exact: true }).fill('Password123!');
      await page.getByLabel('Confirm Password').fill('Password123!');
      await page.getByRole('button', { name: 'Create Account' }).click();
      await page.waitForURL('/dashboard');

      // Now try to go to login page
      await page.goto('/login');

      // Should redirect to dashboard (already authenticated)
      await expect(page).toHaveURL('/dashboard');
    });

    test('should redirect authenticated user from register to dashboard', async ({ page }) => {
      // First, register
      const timestamp = Date.now();
      const email = `redirect-register-${timestamp}@example.com`;

      await page.goto('/register');
      await page.getByLabel('First Name').fill('Register');
      await page.getByLabel('Last Name').fill('Test');
      await page.getByLabel('Email').fill(email);
      await page.getByLabel('Password', { exact: true }).fill('Password123!');
      await page.getByLabel('Confirm Password').fill('Password123!');
      await page.getByRole('button', { name: 'Create Account' }).click();
      await page.waitForURL('/dashboard');

      // Now try to go to register page
      await page.goto('/register');

      // Should redirect to dashboard (already authenticated)
      await expect(page).toHaveURL('/dashboard');
    });
  });

  test.describe('Logout Flow', () => {
    test('should logout successfully and redirect to login', async ({ page }) => {
      // First, login
      const timestamp = Date.now();
      const email = `logout-test-${timestamp}@example.com`;

      await page.goto('/register');
      await page.getByLabel('First Name').fill('Logout');
      await page.getByLabel('Last Name').fill('Test');
      await page.getByLabel('Email').fill(email);
      await page.getByLabel('Password', { exact: true }).fill('Password123!');
      await page.getByLabel('Confirm Password').fill('Password123!');
      await page.getByRole('button', { name: 'Create Account' }).click();
      await page.waitForURL('/dashboard');

      // Find and click user menu to open dropdown
      const userMenuButton = page
        .getByRole('button')
        .filter({ has: page.locator('div.rounded-full.bg-gradient-to-br') });
      await userMenuButton.click();

      // Click logout in dropdown
      const logoutButton = page.getByTestId('logout-button');
      await logoutButton.click();

      // Should redirect to login page
      await expect(page).toHaveURL('/login', { timeout: 5000 });

      // Verify tokens are cleared from localStorage
      const accessToken = await page.evaluate(() => localStorage.getItem('access_token'));
      const refreshToken = await page.evaluate(() => localStorage.getItem('refresh_token'));

      expect(accessToken).toBeNull();
      expect(refreshToken).toBeNull();
    });

    test('should not be able to access protected routes after logout', async ({ page }) => {
      // First, login
      const timestamp = Date.now();
      const email = `logout-protected-${timestamp}@example.com`;

      await page.goto('/register');
      await page.getByLabel('First Name').fill('Logout');
      await page.getByLabel('Last Name').fill('Protected');
      await page.getByLabel('Email').fill(email);
      await page.getByLabel('Password', { exact: true }).fill('Password123!');
      await page.getByLabel('Confirm Password').fill('Password123!');
      await page.getByRole('button', { name: 'Create Account' }).click();
      await page.waitForURL('/dashboard');

      // Logout - open user menu dropdown first
      const userMenuButton = page
        .getByRole('button')
        .filter({ has: page.locator('div.rounded-full.bg-gradient-to-br') });
      await userMenuButton.click();

      const logoutButton = page.getByTestId('logout-button');
      await logoutButton.click();
      await expect(page).toHaveURL('/login');

      // Try to access dashboard
      await page.goto('/dashboard');

      // Should redirect to login
      await expect(page).toHaveURL('/login');
    });

    test('should clear all authentication state on logout', async ({ page }) => {
      // Register
      const timestamp = Date.now();
      const email = `clear-state-${timestamp}@example.com`;

      await page.goto('/register');
      await page.getByLabel('First Name').fill('Clear');
      await page.getByLabel('Last Name').fill('State');
      await page.getByLabel('Email').fill(email);
      await page.getByLabel('Password', { exact: true }).fill('Password123!');
      await page.getByLabel('Confirm Password').fill('Password123!');
      await page.getByRole('button', { name: 'Create Account' }).click();
      await page.waitForURL('/dashboard');

      // Verify user is authenticated
      await expect(page.getByText(/Clear/i)).toBeVisible();

      // Logout - open user menu dropdown first
      const userMenuButton = page
        .getByRole('button')
        .filter({ has: page.locator('div.rounded-full.bg-gradient-to-br') });
      await userMenuButton.click();

      await page.getByTestId('logout-button').click();
      await expect(page).toHaveURL('/login');

      // Go to login page
      await page.goto('/login');

      // Should not auto-login (user data cleared)
      await expect(page).toHaveURL('/login');

      // Login form should be visible
      await expect(page.getByLabel('Email')).toBeVisible();
    });

    test('should handle logout when already logged out (idempotent)', async ({ page }) => {
      // Go to login page (not authenticated)
      await page.goto('/login');

      // Manually clear tokens (simulating already logged out state)
      await page.evaluate(() => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      });

      // Try to access dashboard
      await page.goto('/dashboard');

      // Should redirect to login (no errors)
      await expect(page).toHaveURL('/login');
    });
  });

  test.describe('Token Persistence', () => {
    test('should maintain session across page refreshes', async ({ page }) => {
      // Register
      const timestamp = Date.now();
      const email = `refresh-test-${timestamp}@example.com`;

      await page.goto('/register');
      await page.getByLabel('First Name').fill('Refresh');
      await page.getByLabel('Last Name').fill('Test');
      await page.getByLabel('Email').fill(email);
      await page.getByLabel('Password', { exact: true }).fill('Password123!');
      await page.getByLabel('Confirm Password').fill('Password123!');
      await page.getByRole('button', { name: 'Create Account' }).click();
      await page.waitForURL('/dashboard');

      // Refresh page
      await page.reload();

      // Should still be on dashboard
      await expect(page).toHaveURL('/dashboard');
      await expect(page.getByText(/Refresh/i)).toBeVisible();

      // Refresh again
      await page.reload();

      // Still authenticated
      await expect(page).toHaveURL('/dashboard');
    });

    test('should maintain session in new tab', async ({ context, page }) => {
      // Register in first tab
      const timestamp = Date.now();
      const email = `new-tab-${timestamp}@example.com`;

      await page.goto('/register');
      await page.getByLabel('First Name').fill('NewTab');
      await page.getByLabel('Last Name').fill('Test');
      await page.getByLabel('Email').fill(email);
      await page.getByLabel('Password', { exact: true }).fill('Password123!');
      await page.getByLabel('Confirm Password').fill('Password123!');
      await page.getByRole('button', { name: 'Create Account' }).click();
      await page.waitForURL('/dashboard');

      // Open new tab and setup mock backend for it
      const newTab = await context.newPage();
      await setupMockBackend(newTab);
      await newTab.goto('/dashboard');

      // Should be authenticated in new tab (localStorage is shared)
      // The new tab should stay on dashboard, not redirect to login
      await expect(newTab).toHaveURL('/dashboard');

      // Verify dashboard content is visible (not login page)
      await expect(newTab.getByText(/ExamGen SaaS/i)).toBeVisible();

      await newTab.close();
    });
  });
});
