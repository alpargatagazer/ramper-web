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

  test('Songkick widget loads on shows page', async ({ page }) => {
    await page.goto('/shows');
    
    // The widget anchor should be present in the DOM
    const widgetLink = page.locator('a.songkick-widget');
    
    // Make sure your environment has PUBLIC_SONGKICK_ARTIST_ID configured
    await expect(widgetLink).toBeAttached();
  });

  test('Email copy to clipboard functionality on contact page', async ({ page }) => {
    const expectedEmail = process.env.PUBLIC_CONTACT_EMAIL || 'pablo@humointernacional.com';
    
    await page.goto('/contact');

    // Mock clipboard API to capture the text being copied
    let copiedText = '';
    await page.evaluate((email) => {
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: (text: string) => {
            (window as any).lastCopiedText = text;
            return Promise.resolve();
          },
        },
        configurable: true
      });
    }, expectedEmail);
    
    const emailButton = page.locator('#copy-email-btn');
    const feedbackText = page.locator('#copy-feedback');
    
    // Click to copy
    await emailButton.click();
    
    // Retrieve the text that was sent to the clipboard mock
    const lastCopied = await page.evaluate(() => (window as any).lastCopiedText);
    expect(lastCopied).toBe(expectedEmail);
    
    // Verify feedback appears
    await expect(feedbackText).toHaveClass(/opacity-100/);
    await expect(feedbackText).toHaveText('Copiado al portapapeles');
  });
});
