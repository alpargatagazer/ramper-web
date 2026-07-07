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

  test('Newsletter form allows subscription (mocked)', async ({ page }) => {
    await page.goto('/news');

    // Form elements should be visible
    const formContainer = page.locator('#newsletter-container');
    await expect(formContainer).toBeVisible();

    const emailInput = page.locator('#newsletter-email');
    await expect(emailInput).toBeVisible();

    const submitBtn = page.locator('#newsletter-submit');
    await expect(submitBtn).toBeVisible();

    // Intercept the API call to avoid hitting the actual backend during tests
    await page.route('**/api/newsletter/subscribe', async route => {
      // Add a small delay to allow loading state verification
      await new Promise(resolve => setTimeout(resolve, 500));
      // Mock a successful subscription response
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Success' }),
      });
    });

    // Fill and submit the form
    await emailInput.fill('test@ramper.band');
    await submitBtn.click();

    // Verify loading state
    await expect(submitBtn).toContainText('Enviando...');

    // Verify success message
    const messageDiv = page.locator('#newsletter-message');
    await expect(messageDiv).toBeVisible();
    await expect(messageDiv).toContainText('Gracias por suscribirte');
    await expect(messageDiv).toHaveClass(/bg-green-50/);

    // Verify button resets
    await expect(submitBtn).toContainText('Suscrito ✓');
  });
});
