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
    // Expect root URL with optional trailing slash
    await expect(page).toHaveURL(new RegExp(`${process.env.PLAYWRIGHT_TEST_BASE_URL || ''}\/?$`));
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
      
      // Verify URL using the provided regex
      await expect(page).toHaveURL(section.url);
      
      // Check active state (bold and specific color)
      await expect(link).toHaveClass(/font-bold/);
      await expect(link).toHaveClass(/text-ramper-blue-deep/);
    }
  });

  test('External social and merch links open in new tabs with successful status', async ({ page, context }) => {
    const externalLinks = [
      { 
        selector: '#social-links a[aria-label="Instagram"]', 
        expected: process.env.PUBLIC_INSTAGRAM_URL ? new RegExp(process.env.PUBLIC_INSTAGRAM_URL.replace(/https?:\/\//, '')) : /instagram\.com/ 
      },
      { 
        selector: '#social-links a[aria-label="X (Twitter)"]', 
        expected: process.env.PUBLIC_X_URL ? new RegExp(process.env.PUBLIC_X_URL.replace(/https?:\/\//, '')) : /x\.com/ 
      },
      { 
        selector: '#social-links a[aria-label="Bluesky"]', 
        expected: process.env.PUBLIC_BLUESKY_URL ? new RegExp(process.env.PUBLIC_BLUESKY_URL.replace(/https?:\/\//, '')) : /bsky\.app/ 
      },
      { 
        selector: '#nav-merch', 
        expected: process.env.PUBLIC_MERCH_URL ? new RegExp(process.env.PUBLIC_MERCH_URL.replace(/https?:\/\//, '')) : /humointernacional\.com/ 
      }
    ];

    for (const { selector, expected } of externalLinks) {
      const link = page.locator(selector);
      await expect(link).toBeVisible();
      
      // Ensure it has target="_blank"
      await expect(link).toHaveAttribute('target', '_blank');

      // Click and wait for the new page (tab) to open
      const [newPage] = await Promise.all([
        context.waitForEvent('page'),
        link.click(),
      ]);

      // Verify the new tab's URL
      await expect(newPage).toHaveURL(expected);
      
      // Verify that the page loaded successfully (no 404/500)
      const href = await link.getAttribute('href') || '';
      const response = await page.context().request.get(href);
      expect(response.status()).not.toBe(404);
      
      await newPage.close();
    }
  });
});
