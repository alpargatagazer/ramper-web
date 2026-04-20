import { test, expect } from '@playwright/test';

test.describe('Ramper Website Smoke Tests', () => {
  test('home page should load and show title', async ({ page }) => {
    await page.goto('/');

    // Check main heading (h1)
    const heading = page.locator('h1').filter({ hasText: 'Ramper' }).first();
    await expect(heading).toBeVisible();

    // Check sub-heading/summary
    const summary = page.getByText(/Spanish slowcore/i);
    await expect(summary).toBeVisible();
  });

  test('navigation should work between Home and About', async ({ page }) => {
    await page.goto('/');

    // Click on About link using a simpler text-based selector
    const aboutLink = page.locator('header nav a', { hasText: 'About' });
    await aboutLink.click();

    // Check we are on the about page
    await expect(page).toHaveURL(/\/about/);
    await expect(page.getByRole('heading', { level: 1, name: 'About' })).toBeVisible();
  });
});
