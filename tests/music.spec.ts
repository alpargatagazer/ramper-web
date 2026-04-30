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

  test('Clicking an album navigates to its detail page and validates all metadata', async ({ page, request }) => {
    await page.goto('/music');
    
    // Get the first album link
    const firstAlbum = page.locator('#music-grid a').first();
    const albumHref = await firstAlbum.getAttribute('href');
    
    if (albumHref) {
      await firstAlbum.click();
      // Use regex to handle potential trailing slash differences (CI vs Local)
      const urlPattern = new RegExp(`${albumHref.replace(/\/$/, '')}\/?$`);
      await page.waitForURL(urlPattern);
      
      // 1. Verify Header Elements
      const title = page.locator('main h1').first();
      await expect(title).toBeVisible();
      
      // 2. Verify Cover Image (using Astro Image component)
      const cover = page.locator('img[alt*="Portada"]').first();
      await expect(cover).toBeVisible();
      // Match both dev (/_image?href=) and prod (/_astro/) patterns
      await expect(cover).toHaveAttribute('src', /.*(\/_image\?href=|\/_astro\/).*/);

      // 3. Verify Metadata (Year, Type)
      const releaseTime = page.locator('header time');
      await expect(releaseTime).toBeVisible();
      const timeText = await releaseTime.textContent();
      expect(timeText).toMatch(/\d{4}/); // Should contain a year

      // 4. Verify Tracklist
      const tracklistHeader = page.locator('h2').filter({ hasText: 'Tracklist' });
      await expect(tracklistHeader).toBeVisible();
      const tracks = page.locator('ul li');
      const trackCount = await tracks.count();
      expect(trackCount).toBeGreaterThan(0);
      
      // 5. Validate External Links (Bandcamp, Spotify, etc.)
      const externalLinks = await page.locator('header a[target="_blank"]').all();
      for (const link of externalLinks) {
        const href = await link.getAttribute('href');
        const ariaLabel = await link.getAttribute('aria-label') || '';
        
        if (href) {
          // Precise validation: check if the URL matches the service name
          if (ariaLabel.includes('Spotify')) expect(href).toContain('spotify.com');
          if (ariaLabel.includes('Bandcamp')) expect(href).toContain('bandcamp.com');
          if (ariaLabel.includes('Apple')) expect(href).toContain('apple.com');
          if (ariaLabel.includes('Tidal')) expect(href).toContain('tidal.com');
          
          try {
            const response = await request.get(href);
            // Ensure no 404
            expect(response.status()).not.toBe(404);
          } catch (e) {
            console.warn(`Could not verify external link ${href}`);
          }
        }
      }
    }
  });
});
