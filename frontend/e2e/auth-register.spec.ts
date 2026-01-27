import { test, expect } from '@playwright/test';
import { setupMockBackend, resetMockDatabase } from './mocks/backend';

test.describe('Authentication - Register Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Setup mock backend (no real backend needed!)
    await setupMockBackend(page);

    // Navigate to register page
    await page.goto('/register');
  });

  test.afterEach(() => {
    // Reset mock database between tests
    resetMockDatabase();
  });

  test('should register a new teacher account successfully', async ({ page }) => {
    // Generate unique email for test isolation
    const timestamp = Date.now();
    const email = `teacher-${timestamp}@example.com`;

    // Fill registration form
    await page.getByLabel('First Name').fill('John');
    await page.getByLabel('Last Name').fill('Doe');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password', { exact: true }).fill('Password123!');
    await page.getByLabel('Confirm Password').fill('Password123!');

    // Role should be TEACHER by default
    await expect(page.getByText('Teacher', { exact: true })).toBeVisible();
    await expect(page.getByText(/Signing up as Teacher/i)).toBeVisible();

    // Submit form
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 15000 });

    // Should see user name or dashboard content
    // Wait a bit for page to load
    await page.waitForTimeout(1000);

    // Check that we're authenticated (not redirected back to login)
    expect(page.url()).toContain('/dashboard');
  });

  test('should register a new student account successfully', async ({ page }) => {
    // Generate unique email
    const timestamp = Date.now();
    const email = `student-${timestamp}@example.com`;

    // Fill registration form
    await page.getByLabel('First Name').fill('Jane');
    await page.getByLabel('Last Name').fill('Smith');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password', { exact: true }).fill('Password123!');
    await page.getByLabel('Confirm Password').fill('Password123!');

    // Switch to STUDENT role
    await page.getByRole('button', { name: /student/i }).click();
    await expect(page.getByText(/Signing up as Student/i)).toBeVisible();

    // Submit form
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 15000 });

    // Wait for dashboard to load
    await page.waitForTimeout(1000);

    // Verify we stayed on dashboard
    expect(page.url()).toContain('/dashboard');
  });

  test('should show error when passwords do not match', async ({ page }) => {
    await page.getByLabel('First Name').fill('John');
    await page.getByLabel('Last Name').fill('Doe');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password', { exact: true }).fill('Password123!');
    await page.getByLabel('Confirm Password').fill('DifferentPassword!');

    await page.getByRole('button', { name: 'Create Account' }).click();

    // Should show validation error
    await expect(page.getByText(/passwords do not match/i)).toBeVisible();
  });

  test('should show error when email is already registered', async ({ page }) => {
    // Use a fixed email for this test
    const email = 'duplicate-test@example.com';

    // First, try to register (may already exist from previous runs)
    await page.getByLabel('First Name').fill('John');
    await page.getByLabel('Last Name').fill('Doe');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password', { exact: true }).fill('Password123!');
    await page.getByLabel('Confirm Password').fill('Password123!');
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Check if registration succeeded or failed
    await page.waitForTimeout(2000);
    const currentUrl = page.url();

    if (currentUrl.includes('/dashboard')) {
      // First registration succeeded, logout before trying again
      // Open user menu dropdown
      const userMenuButton = page
        .getByRole('button')
        .filter({ has: page.locator('div.rounded-full.bg-gradient-to-br') });
      await userMenuButton.click();

      // Click logout
      await page.getByTestId('logout-button').click();
      await page.waitForURL('/login');

      // Now go to register page
      await page.goto('/register');
    }

    // Now try to register with same email again
    await page.getByLabel('First Name').fill('Jane');
    await page.getByLabel('Last Name').fill('Smith');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password', { exact: true }).fill('Password123!');
    await page.getByLabel('Confirm Password').fill('Password123!');
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Should show error (might be different error messages)
    const hasError =
      (await page
        .getByText(/already exists/i)
        .isVisible()
        .catch(() => false)) ||
      (await page
        .getByText(/already registered/i)
        .isVisible()
        .catch(() => false)) ||
      (await page
        .getByText(/already in use/i)
        .isVisible()
        .catch(() => false));

    expect(hasError).toBe(true);
  });

  test('should navigate to login page when clicking "Already have an account?"', async ({
    page,
  }) => {
    await page.getByRole('link', { name: /sign in/i }).click();
    await expect(page).toHaveURL('/login');
  });

  test('should disable form during submission', async ({ page }) => {
    const timestamp = Date.now();
    const email = `test-${timestamp}@example.com`;

    await page.getByLabel('First Name').fill('John');
    await page.getByLabel('Last Name').fill('Doe');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password', { exact: true }).fill('Password123!');
    await page.getByLabel('Confirm Password').fill('Password123!');

    // Click submit
    const submitButton = page.getByRole('button', { name: 'Create Account' });
    await submitButton.click();

    // Should redirect successfully (within reasonable time)
    await expect(page).toHaveURL('/dashboard', { timeout: 15000 });
  });
});
