import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('News Section', () => {
  test('News feed loads and contains posts', async ({ page }) => {
    // Attempt to count mdoc files to have an expectation
    const newsDir = path.resolve(process.cwd(), 'src/content/news');
    let expectedCount = 0;
    try {
      if (fs.existsSync(newsDir)) {
        const files = fs.readdirSync(newsDir);
        expectedCount = files.filter(f => f.endsWith('.mdoc')).length;
      }
    } catch (e) {
      console.warn('Could not read news directory, relying on page content only.');
    }

    await page.goto('/news');
    
    // RSS link should be present
    const rssLink = page.locator('#rss-link');
    await expect(rssLink).toBeVisible();
    await expect(rssLink).toHaveAttribute('href', '/rss.xml');

    // Verify articles
    const articles = page.locator('article');
    const noPostsMessage = page.getByText(/No hay noticias publicadas todavía/i);

    if (expectedCount > 0) {
      // If we know there are files, they MUST be on the page
      await expect(articles).toHaveCount(expectedCount);
    } else {
      // If we don't know (or count is 0), at least one of these must be true
      const hasArticles = await articles.count() > 0;
      const hasMessage = await noPostsMessage.isVisible();
      expect(hasArticles || hasMessage).toBeTruthy();
    }
  });

  test('Clicking a news post navigates to the detail page', async ({ page }) => {
    await page.goto('/news');
    
    const firstArticle = page.locator('article a').first();
    
    if (await firstArticle.isVisible()) {
      const href = await firstArticle.getAttribute('href');
      if (href) {
        await firstArticle.click();
        // Use regex to handle potential trailing slash differences (CI vs Local)
        const urlPattern = new RegExp(`${href.replace(/\/$/, '')}\/?$`);
        await page.waitForURL(urlPattern);
        
        // Check for prose-ramper styling container
        await expect(page.locator('.prose-ramper')).toBeVisible();
        
        // Check for back link
        await expect(page.getByRole('link', { name: /volver a noticias/i })).toBeVisible();
      }
    }
  });
});
