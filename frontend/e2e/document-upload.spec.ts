import { test, expect, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import os from 'os';

/**
 * E2E Test: Document Upload Feature (REAL Backend)
 *
 * Prerequisites:
 * - Backend running on http://localhost:3001
 * - Test user exists: testuser@dashboard.com / SecurePass123!
 */

test.describe('Document Upload Feature', () => {
  const TEST_USER = {
    email: 'testuser@dashboard.com',
    password: 'SecurePass123!',
  };

  let testPdfPath: string;

  /**
   * Helper: Login to application
   */
  async function loginUser(page: Page): Promise<void> {
    await page.goto('/login');
    await page.getByLabel('Email').fill(TEST_USER.email);
    await page.getByLabel('Password').fill(TEST_USER.password);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();

    // Wait for redirect
    await page.waitForURL('/dashboard', { timeout: 10000 });
  }

  test.beforeEach(() => {
    // Create test PDF file before each test (not just once)
    const tmpDir = os.tmpdir();
    testPdfPath = path.join(tmpDir, `playwright-test-${Date.now()}.pdf`);

    const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 60 >>
stream
BT
/F1 16 Tf
100 700 Td
(Playwright E2E Test Document - Upload Feature) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000262 00000 n 
0000000371 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
460
%%EOF`;

    fs.writeFileSync(testPdfPath, pdfContent);
  });

  test.afterEach(() => {
    // Cleanup after each test
    if (testPdfPath && fs.existsSync(testPdfPath)) {
      fs.unlinkSync(testPdfPath);
    }
  });

  test('should upload document and update dashboard', async ({ page }) => {
    test.slow(); // Mark as slow test (3x timeout)

    // ========== STEP 1: Login ==========
    await loginUser(page);

    // ========== STEP 2: Wait for dashboard to load ==========
    await page.waitForSelector('text=/Quick Actions|Upload Document/i', { timeout: 10000 });

    // ========== STEP 3: Get initial document count ==========

    // Wait for stats cards to load
    await page.waitForTimeout(2000); // Give dashboard time to fetch stats

    // Look for the stats card with "Documents" - be flexible with selector
    const statsCards = page.locator('[class*="card"]').filter({ hasText: /Documents/i });
    await expect(statsCards.first()).toBeVisible({ timeout: 5000 });

    // Extract number (try multiple approaches)
    let initialCount = 0;
    try {
      const statsText = await statsCards.first().textContent();
      const match = statsText?.match(/(\d+)/);
      initialCount = match ? parseInt(match[1]) : 0;
    } catch (err) {}

    // ========== STEP 4: Open upload dialog ==========

    const uploadButton = page.getByRole('button', { name: /Upload Document/i });
    await expect(uploadButton).toBeVisible({ timeout: 5000 });
    await uploadButton.click();

    // Wait for dialog
    await expect(page.getByRole('heading', { name: 'Upload Document' })).toBeVisible({
      timeout: 3000,
    });

    // ========== STEP 5: Select file ==========

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testPdfPath);

    // Wait for file to be displayed (use more specific selector)
    await expect(page.locator('p.font-medium').filter({ hasText: /\.pdf$/i })).toBeVisible({
      timeout: 2000,
    });

    // ========== STEP 6: Fill title (optional) ==========
    const titleInput = page.locator('#title');
    await titleInput.fill('Playwright E2E Test Upload');

    // ========== STEP 7: Click Upload ==========

    const submitButton = page.getByRole('button', { name: /^Upload$/i, exact: false });
    await expect(submitButton).toBeEnabled();
    await submitButton.click();

    // ========== STEP 8: Wait for success or dialog to close ==========

    // Dialog should close within 5 seconds
    await expect(page.getByRole('heading', { name: 'Upload Document' })).not.toBeVisible({
      timeout: 10000,
    });

    // ========== STEP 9: Verify dashboard updated ==========

    // Wait for refresh
    await page.waitForTimeout(2000);

    // Get updated count
    const updatedStatsText = await statsCards.first().textContent();
    const updatedMatch = updatedStatsText?.match(/(\d+)/);
    const updatedCount = updatedMatch ? parseInt(updatedMatch[1]) : 0;

    // Verify count increased
    expect(updatedCount).toBe(initialCount + 1);
  });

  test('should validate file type', async ({ page }) => {
    await loginUser(page);

    // Open dialog
    await page.waitForTimeout(1000);
    const uploadButton = page.getByRole('button', { name: /Upload Document/i });
    await uploadButton.click();
    await expect(page.getByRole('heading', { name: 'Upload Document' })).toBeVisible();

    // Create invalid file
    const tmpDir = os.tmpdir();
    const txtPath = path.join(tmpDir, 'invalid.txt');
    fs.writeFileSync(txtPath, 'This is not a PDF or DOCX');

    // Try to upload
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(txtPath);

    // Should show error
    await expect(
      page.locator('text=/only.*PDF.*DOCX|invalid.*file.*type|must be.*PDF.*DOCX/i')
    ).toBeVisible({ timeout: 3000 });

    // Cleanup
    fs.unlinkSync(txtPath);
  });

  test('should validate file size', async ({ page }) => {
    await loginUser(page);

    // Open dialog
    await page.waitForTimeout(1000);
    const uploadButton = page.getByRole('button', { name: /Upload Document/i });
    await uploadButton.click();
    await expect(page.getByRole('heading', { name: 'Upload Document' })).toBeVisible();

    // Create large file (11MB)
    const tmpDir = os.tmpdir();
    const largePath = path.join(tmpDir, 'large.pdf');
    const largeBuffer = Buffer.alloc(11 * 1024 * 1024);
    fs.writeFileSync(largePath, largeBuffer);

    // Try to upload
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(largePath);

    // Should show error (be specific to avoid strict mode violation)
    await expect(page.locator('p.text-red-700').filter({ hasText: /10.*MB/i })).toBeVisible({
      timeout: 3000,
    });

    // Cleanup
    fs.unlinkSync(largePath);
  });
});
