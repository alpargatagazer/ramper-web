import { test, expect } from '@playwright/test';

test.describe('News Section', () => {
  test('News feed loads and contains posts', async ({ page }) => {
    await page.goto('/news');
    
    // RSS link should be present
    const rssLink = page.locator('#rss-link');
    await expect(rssLink).toBeVisible();
    await expect(rssLink).toHaveAttribute('href', '/rss.xml');

    // Posts should load (or a "no posts" message)
    const articles = page.locator('article');
    const noPostsMessage = page.getByText(/No hay noticias publicadas todavía/i);
    
    const hasArticles = await articles.count() > 0;
    const hasNoPostsMessage = await noPostsMessage.isVisible();
    
    expect(hasArticles || hasNoPostsMessage).toBeTruthy();
  });

  test('Clicking a news post navigates to the detail page', async ({ page }) => {
    await page.goto('/news');
    
    const firstArticle = page.locator('article a').first();
    
    if (await firstArticle.isVisible()) {
      const href = await firstArticle.getAttribute('href');
      if (href) {
        await firstArticle.click();
        await page.waitForURL(href);
        
        // Check for prose-ramper styling container
        await expect(page.locator('.prose-ramper')).toBeVisible();
        
        // Check for back link
        await expect(page.getByRole('link', { name: /volver a noticias/i })).toBeVisible();
      }
    }
  });
});
