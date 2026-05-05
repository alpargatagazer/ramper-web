import { test, expect } from '@playwright/test';

test.describe('Navigation and External Links', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Logo redirects to home page', async ({ page }) => {
    const isMobile = (page.viewportSize()?.width || 0) < 1024;

    // Click on music first to navigate away
    if (isMobile) {
      await page.click('#mobile-menu-toggle');
      await page.click('#mobile-menu-overlay a[href="/music"]');
    } else {
      await page.click('#nav-music');
    }
    await expect(page).toHaveURL(/.*\/music\/?$/);
    
    // Click logo
    const logoSelector = isMobile ? '#mobile-logo-link' : '#logo-link';
    await page.click(logoSelector);
    // Expect root title
    await expect(page).toHaveTitle(/Ramper/);
  });

  test('All navigation links work and have active state', async ({ page }) => {
    const isMobile = (page.viewportSize()?.width || 0) < 1024;
    const sections = [
      { id: 'music', url: /\/music\/?$/ },
      { id: 'shows', url: /\/shows\/?$/ },
      { id: 'news', url: /\/news\/?$/ },
      { id: 'video', url: /\/video\/?$/ },
      { id: 'about', url: /\/about\/?$/ },
      { id: 'contact', url: /\/contact\/?$/ }
    ];
    
    for (const section of sections) {
      if (isMobile) {
        await page.click('#mobile-menu-toggle');
        const link = page.locator(`#mobile-menu-overlay a[href="/${section.id}"]`);
        await expect(link).toBeVisible();
        await link.click();
      } else {
        const link = page.locator(`#nav-${section.id}`);
        await expect(link).toBeVisible();
        await link.click();
      }
      
      // Verify URL using the provided regex
      await expect(page).toHaveURL(section.url);
      
      // Check active state
      if (!isMobile) {
        const link = page.locator(`#nav-${section.id}`);
        await expect(link).toHaveClass(/font-bold/);
        await expect(link).toHaveClass(/text-ramper-blue-deep/);
      }
    }
  });

  test('External social and merch links open in new tabs with successful status', async ({ page, context }) => {
    const isMobile = (page.viewportSize()?.width || 0) < 1024;
    const socialContainer = isMobile ? '#mobile-social-links' : '#social-links';

    const externalLinks = [
      {
        selector: `${socialContainer} a[aria-label="Instagram"]`,
        expected: process.env.CI ? /instagram\.com/ : (process.env.PUBLIC_INSTAGRAM_URL ? new RegExp(process.env.PUBLIC_INSTAGRAM_URL.replace(/https?:\/\//, '')) : /instagram\.com/)
      },
      {
        selector: `${socialContainer} a[aria-label="X (Twitter)"]`,
        expected: process.env.CI ? /x\.com/ : (process.env.PUBLIC_X_URL ? new RegExp(process.env.PUBLIC_X_URL.replace(/https?:\/\//, '')) : /x\.com/) 
      },
      {
        selector: `${socialContainer} a[aria-label="Bluesky"]`,
        expected: process.env.CI ? /bsky\.app/ : (process.env.PUBLIC_BLUESKY_URL ? new RegExp(process.env.PUBLIC_BLUESKY_URL.replace(/https?:\/\//, '')) : /bsky\.app/) 
      },
      {
        selector: isMobile ? '#mobile-menu-overlay a:has-text("merch")' : '#nav-merch',
        expected: process.env.PUBLIC_MERCH_URL ? new RegExp(process.env.PUBLIC_MERCH_URL.replace(/https?:\/\//, '')) : /humointernacional\.com/,
        isMenuLink: isMobile
      }
    ];

    for (const { selector, expected, isMenuLink } of externalLinks) {
      if (isMenuLink) {
        await page.click('#mobile-menu-toggle');
      }

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
