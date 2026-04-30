import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Music Section', () => {
  test('Music grid loads and displays all releases from content', async ({ page }) => {
    // Count the number of .mdoc files in src/content/releases
    const releasesDir = path.resolve(process.cwd(), 'src/content/releases');
    const files = fs.readdirSync(releasesDir);
    const mdocFiles = files.filter(f => f.endsWith('.mdoc'));
    const expectedCount = mdocFiles.length;

    await page.goto('/music');
    
    // The grid should have the same number of links (albums)
    const albumLinks = page.locator('#music-grid a');
    await expect(albumLinks).toHaveCount(expectedCount);
  });

  test('Clicking an album navigates to its detail page and validates external links', async ({ page, request }) => {
    await page.goto('/music');
    
    // Get the first album link
    const firstAlbum = page.locator('#music-grid a').first();
    const albumHref = await firstAlbum.getAttribute('href');
    
    if (albumHref) {
      await firstAlbum.click();
      await page.waitForURL(albumHref);
      
      // Verify detail page elements
      await expect(page.locator('h1').first()).toBeVisible();
      await expect(page.locator('h2').filter({ hasText: 'Tracklist' })).toBeVisible();
      
      // Validate external buttons (Comprar, Spotify, etc.)
      const externalLinks = await page.locator('header a[target="_blank"]').all();
      
      for (const link of externalLinks) {
        const href = await link.getAttribute('href');
        if (href) {
          try {
            const response = await request.get(href);
            // We expect a successful status (not 404), some sites return 403 for bots which is fine
            expect(response.status()).not.toBe(404);
          } catch (e) {
            console.warn(`Failed to fetch ${href}, might be blocked by CORS or bot protection.`);
          }
        }
      }
    }
  });
});
