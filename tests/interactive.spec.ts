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

    // In CI, mock the external Songkick script to avoid network flakiness
    // while still ensuring the injection logic in our page works.
    if (process.env.CI) {
      await page.route('**/widget-app.songkick.com/injector/**', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/javascript',
          body: `
            const widget = document.querySelector('.songkick-widget');
            if (widget) {
              widget.style.display = 'block';
              widget.setAttribute('data-mocked', 'true');
              widget.innerText = 'Mocked Songkick Widget';
            }
          `
        });
      });
    }

    await page.goto('/shows');
    
    // The widget anchor should be present and attached
    const widget = page.locator('.songkick-widget');
    
    // Check attachment with a generous timeout for CI
    await expect(widget).toBeAttached({ timeout: process.env.CI ? 20000 : 5000 });

    // If in CI, also verify our mock "loaded" to be sure the script injection works
    if (process.env.CI) {
      await expect(widget).toHaveAttribute('data-mocked', 'true');
    }
  });

  test('Email copy to clipboard functionality on contact page', async ({ page }) => {
    const expectedEmail = process.env.PUBLIC_CONTACT_EMAIL || 'pablo@humointernacional.com';
    
    await page.goto('/contact');

    // Mock clipboard API to capture the text being copied
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: (text: string) => {
            (window as any).lastCopiedText = text;
            return Promise.resolve();
          },
        },
        configurable: true
      });
    });
    
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
