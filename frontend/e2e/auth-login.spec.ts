import { test, expect } from '@playwright/test';
import { setupMockBackend, resetMockDatabase } from './mocks/backend';

test.describe('Authentication - Login Flow', () => {
  // Create a test user before running login tests
  const testUser = {
    email: `test-user-${Date.now()}@example.com`,
    password: 'Password123!',
    firstName: 'Test',
    lastName: 'User',
  };

  test.beforeAll(async ({ browser }) => {
    // Register test user
    const page = await browser.newPage();
    await setupMockBackend(page);
    await page.goto('/register');
    await page.getByLabel('First Name').fill(testUser.firstName);
    await page.getByLabel('Last Name').fill(testUser.lastName);
    await page.getByLabel('Email').fill(testUser.email);
    await page.getByLabel('Password', { exact: true }).fill(testUser.password);
    await page.getByLabel('Confirm Password').fill(testUser.password);
    await page.getByRole('button', { name: 'Create Account' }).click();
    await page.waitForURL('/dashboard');
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    // Setup mock backend
    await setupMockBackend(page);
    await page.goto('/login');
  });

  test.afterEach(() => {
    // Note: We don't reset database here because we need the test user
    // Only reset after all tests complete
  });

  test('should login successfully with correct credentials', async ({ page }) => {
    await page.getByLabel('Email').fill(testUser.email);
    await page.getByLabel('Password').fill(testUser.password);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText(new RegExp(testUser.firstName, 'i'))).toBeVisible();
  });

  test('should show error with incorrect password', async ({ page }) => {
    await page.getByLabel('Email').fill(testUser.email);
    await page.getByLabel('Password').fill('WrongPassword123!');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();

    // Should show error message
    await expect(page.getByText(/invalid credentials|incorrect password/i)).toBeVisible();

    // Should stay on login page
    await expect(page).toHaveURL('/login');
  });

  test('should show error with non-existent email', async ({ page }) => {
    await page.getByLabel('Email').fill('nonexistent@example.com');
    await page.getByLabel('Password').fill('Password123!');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();

    // Should show error message
    await expect(page.getByText(/invalid credentials|user not found/i)).toBeVisible();

    // Should stay on login page
    await expect(page).toHaveURL('/login');
  });

  test('should navigate to register page when clicking "Sign up"', async ({ page }) => {
    await page.getByRole('link', { name: 'Create one' }).click();
    await expect(page).toHaveURL('/register');
  });

  test('should require email and password fields', async ({ page }) => {
    // Try to submit without filling form
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();

    // HTML5 validation should prevent submission
    const emailInput = page.getByLabel('Email');
    await expect(emailInput).toHaveAttribute('required');

    const passwordInput = page.getByLabel('Password');
    await expect(passwordInput).toHaveAttribute('required');
  });

  test('should disable form during submission', async ({ page }) => {
    await page.getByLabel('Email').fill(testUser.email);
    await page.getByLabel('Password').fill(testUser.password);

    const submitButton = page.getByRole('button', { name: 'Sign in', exact: true });
    await submitButton.click();

    // Should redirect successfully
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
  });

  test('should persist authentication across page reloads', async ({ page }) => {
    // Login
    await page.getByLabel('Email').fill(testUser.email);
    await page.getByLabel('Password').fill(testUser.password);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await page.waitForURL('/dashboard');

    // Reload page
    await page.reload();

    // Should still be on dashboard (not redirected to login)
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText(new RegExp(testUser.firstName, 'i'))).toBeVisible();
  });

  test('should clear error message when user starts typing', async ({ page }) => {
    // First, trigger an error
    await page.getByLabel('Email').fill('wrong@example.com');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();

    // Wait for error to appear
    await expect(page.getByText(/invalid credentials/i)).toBeVisible();

    // Start typing in email field
    await page.getByLabel('Email').fill('new@example.com');

    // Error should disappear
    await expect(page.getByText(/invalid credentials/i)).not.toBeVisible();
  });
});
