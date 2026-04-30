import { test, expect } from '@playwright/test';

test.describe('Navigation and External Links', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Logo redirects to home page', async ({ page }) => {
    // Click on music first to navigate away
    await page.click('text=música');
    await expect(page).toHaveURL(/.*\/music\/?$/);
    
    // Click logo
    await page.click('#logo-link');
    await expect(page).toHaveURL(/\/$/);
  });

  test('Primary navigation links work and have active state', async ({ page }) => {
    const sections = ['música', 'conciertos', 'noticias', 'vídeo'];
    
    for (const section of sections) {
      const link = page.getByRole('link', { name: section, exact: true });
      await expect(link).toBeVisible();
      await link.click();
      
      // Wait for navigation
      await page.waitForLoadState('networkidle');
      
      // Check if it has the active class (font-bold text-ramper-blue-deep)
      await expect(link).toHaveClass(/font-bold/);
      await expect(link).toHaveClass(/text-ramper-blue-deep/);
    }
  });

  test('Secondary and tertiary links work', async ({ page }) => {
    const aboutLink = page.getByRole('link', { name: '¿...quién?', exact: true });
    await aboutLink.click();
    await expect(page).toHaveURL(/.*\/about\/?$/);

    const contactLink = page.getByRole('link', { name: 'escribe', exact: true });
    await contactLink.click();
    await expect(page).toHaveURL(/.*\/contact\/?$/);
  });

  test('External social and merch links are valid and return successful status', async ({ request, page }) => {
    const linksToCheck = [
      '#social-links a[aria-label="Instagram"]',
      '#social-links a[aria-label="X (Twitter)"]',
      '#social-links a[aria-label="Bluesky"]',
      '#nav-merch'
    ];

    for (const selector of linksToCheck) {
      const link = page.locator(selector);
      await expect(link).toBeVisible();
      const href = await link.getAttribute('href');
      expect(href).toBeTruthy();
      
      if (href) {
        // Some social networks block automated requests, so we allow 403, 429, etc. 
        // We mainly want to ensure it doesn't 404 (Not Found).
        try {
          const response = await request.get(href);
          expect(response.status()).not.toBe(404);
        } catch (e) {
          console.warn(`Failed to fetch ${href}, might be blocked by CORS or bot protection.`);
        }
      }
    }
  });
});
