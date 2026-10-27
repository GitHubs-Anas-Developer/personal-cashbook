import { test, expect } from '@playwright/test';

test.describe('Personal Cashbook E2E Flow', () => {
  const testEmail = `testuser_${Date.now()}@cashbook.local`;
  const testPassword = 'Password123!';

  test('Registration, Onboarding, and Dashboard Navigation', async ({ page }) => {
    // 1. Visit registration page
    await page.goto('/register');
    await expect(page.locator('text=Create Cashbook')).toBeVisible();

    // 2. Fill registration form
    await page.fill('input[placeholder="e.g. Ramesh Patel"]', 'Test Cashbook User');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);

    // 3. Submit registration
    await page.click('button:has-text("Create My Cashbook")');

    // 4. Expect redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('text=Welcome back, Test')).toBeVisible();

    // 5. Verify KPI balances and default seeded wallets
    await expect(page.locator('text=Total Wallet Balance')).toBeVisible();
    await expect(page.locator('text=Net Cash Flow')).toBeVisible();

    // 6. Navigate to Wallets page
    await page.click('a:has-text("Wallets")');
    await expect(page).toHaveURL(/.*wallets/);
    await expect(page.locator('text=Primary Bank')).toBeVisible();
    await expect(page.locator('text=Cash in Hand')).toBeVisible();

    // 7. Navigate to Transactions Ledger page
    await page.click('a:has-text("Transactions")');
    await expect(page).toHaveURL(/.*transactions/);
    await expect(page.locator('text=Transaction Ledger')).toBeVisible();

    // 8. Navigate to Reports page
    await page.click('a:has-text("Reports & Export")');
    await expect(page).toHaveURL(/.*reports/);
    await expect(page.locator('text=Financial Reports & Exports')).toBeVisible();
    await expect(page.locator('button:has-text("Export CSV")')).toBeVisible();
    await expect(page.locator('button:has-text("Download PDF Statement")')).toBeVisible();
  });
});
