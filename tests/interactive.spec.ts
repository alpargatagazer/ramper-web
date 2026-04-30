import { test, expect } from '@playwright/test';

test.describe('Interactive Elements and Widgets', () => {
  test('YouTube widgets load on video page', async ({ page }) => {
    await page.goto('/video');
    
    // There should be iframes present
    const iframes = page.locator('iframe[src*="youtube.com/embed/"]');
    
    // Verify that at least one iframe is present
    await expect(iframes.first()).toBeVisible();
    
    // Verify all iframes have a valid src
    const count = await iframes.count();
    expect(count).toBeGreaterThan(0);
    
    for (let i = 0; i < count; i++) {
      const src = await iframes.nth(i).getAttribute('src');
      expect(src).toContain('youtube.com/embed/');
    }
  });

  test('Songkick widget or placeholder loads on shows page', async ({ page }) => {
    await page.goto('/shows');
    
    const widgetLink = page.locator('a.songkick-widget');
    
    const isWidgetPresent = await widgetLink.count() > 0;
    
    expect(isWidgetPresent).toBeTruthy();
  });

  test('Email copy to clipboard functionality on contact page', async ({ page }) => {
    
    await page.goto('/contact');

    // Mock clipboard API since it might fail in headless environments without a secure context
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: () => Promise.resolve(),
        },
        configurable: true
      });
    });
    
    const emailButton = page.locator('#copy-email-btn');
    const feedbackText = page.locator('#copy-feedback');
    
    // Verify initial state
    await expect(emailButton).toBeVisible();
    await expect(feedbackText).toHaveClass(/opacity-0/);
    
    // Click to copy
    await emailButton.click();
    
    // Verify feedback appears
    await expect(feedbackText).toHaveClass(/opacity-100/);
    await expect(feedbackText).toHaveText('Copiado al portapapeles');
  });
});
