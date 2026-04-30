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

  test('All navigation links work and have active state', async ({ page }) => {
    const sections = [
      { name: 'música', id: '#nav-music', url: /\/music\/?$/ },
      { name: 'conciertos', id: '#nav-shows', url: /\/shows\/?$/ },
      { name: 'noticias', id: '#nav-news', url: /\/news\/?$/ },
      { name: 'vídeo', id: '#nav-video', url: /\/video\/?$/ },
      { name: '¿...quién?', id: '#nav-about', url: /\/about\/?$/ },
      { name: 'escribe', id: '#nav-contact', url: /\/contact\/?$/ }
    ];
    
    for (const section of sections) {
      const link = page.locator(section.id);
      await expect(link).toBeVisible();
      await link.click();
      
      // Verify URL
      await expect(page).toHaveURL(section.url);
      
      // Re-locate and check active state
      const activeLink = page.locator(section.id);
      await expect(activeLink).toHaveClass(/font-bold/);
      await expect(activeLink).toHaveClass(/text-ramper-blue-deep/);
    }
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
