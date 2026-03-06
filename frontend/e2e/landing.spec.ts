import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should render landing page with logo and branding', async ({ page }) => {
    // Verify logo is visible
    const logo = page.locator('img[alt="Formydable"]').first();
    await expect(logo).toBeVisible();

    // Verify brand name
    await expect(page.getByText('Formydable').first()).toBeVisible();

    // Verify main heading
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      /Generate AI-Powered Exams|Genera Exámenes con IA/
    );
  });

  test('should display main CTAs', async ({ page }) => {
    // Verify "Get Started as Teacher" button
    const teacherCTA = page.getByRole('link', {
      name: /Get Started as Teacher|Comenzar como Profesor/,
    });
    await expect(teacherCTA).toBeVisible();
    await expect(teacherCTA).toHaveAttribute('href', '/register?role=teacher');

    // Verify "Join as Student" button
    const studentCTA = page.getByRole('link', { name: /Join as Student|Unirse como Estudiante/ });
    await expect(studentCTA).toBeVisible();
    await expect(studentCTA).toHaveAttribute('href', '/student/join');
  });

  test('should display features section', async ({ page }) => {
    // Scroll to features
    await page.click('a[href="#features"]');
    await expect(page.locator('#features')).toBeVisible();

    // Verify feature cards are present
    await expect(page.getByText(/AI-Powered Generation|Generación con IA/)).toBeVisible();
    await expect(page.getByText(/Auto-Grading|Calificación Automática/)).toBeVisible();
    await expect(page.getByText(/Multi-Language|Soporte Multilingüe/)).toBeVisible();
  });

  test('should display pricing section', async ({ page }) => {
    // Scroll to pricing
    await page.click('a[href="#pricing"]');
    await expect(page.locator('#pricing')).toBeVisible();

    // Verify pricing tiers
    await expect(page.getByRole('heading', { name: /Free|Gratis/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Pro/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Schools|Escuelas/ })).toBeVisible();

    // Verify pricing mentions
    await expect(page.getByText('$0')).toBeVisible();
    await expect(page.getByText('$9')).toBeVisible();
  });

  test('should support language switching', async ({ page }) => {
    // Check initial English content
    await expect(page.getByText(/Generate AI-Powered Exams/)).toBeVisible();

    // Open language dropdown
    await page.click('button:has-text("English")');

    // Select Spanish
    await page.click('text=Español');

    // Verify Spanish content
    await expect(page.getByText(/Genera Exámenes con IA/)).toBeVisible();
    await expect(page.getByRole('link', { name: /Comenzar como Profesor/ })).toBeVisible();
  });

  test('should navigate to login from landing', async ({ page }) => {
    await page.click('a:has-text("Sign In")');
    await expect(page).toHaveURL('/login');
    await expect(page.getByText('Formydable')).toBeVisible();
  });

  test('should have working navigation links', async ({ page }) => {
    // Test Features link
    await page.click('a[href="#features"]');
    await expect(page.url()).toContain('#features');

    // Test Pricing link
    await page.click('a[href="#pricing"]');
    await expect(page.url()).toContain('#pricing');
  });

  test('should show For Teachers and For Students sections', async ({ page }) => {
    // Scroll to find sections
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));

    // Verify sections exist
    await expect(page.getByText(/For Teachers|Para Profesores/).first()).toBeVisible();
    await expect(page.getByText(/For Students|Para Estudiantes/).first()).toBeVisible();
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Reload to apply mobile styles
    await page.goto('/');

    // Verify mobile menu button exists
    const mobileMenuButton = page.locator('button:has([class*="lucide-menu"])');
    await expect(mobileMenuButton).toBeVisible();

    // Open mobile menu
    await mobileMenuButton.click();

    // Verify mobile navigation is visible
    await expect(page.getByRole('link', { name: /Features|Características/ })).toBeVisible();
  });

  test('should have meta tags for SEO', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Formydable/);

    // Check meta description exists
    const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');
    expect(metaDescription).toBeTruthy();
  });
});
