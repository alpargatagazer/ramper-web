import { test, expect } from '@playwright/test';

test.describe('Layout and Visuals', () => {
  test('Textures are present in the DOM', async ({ page }) => {
    await page.goto('/');
    
    // Check for active "Dos criaturas" texture layers and global grain
    await expect(page.locator('img[src*="feathers"]').first()).toBeAttached();
    await expect(page.locator('img[src*="hair"]').first()).toBeAttached();
    await expect(page.locator('img[src*="red"]').first()).toBeAttached();
    await expect(page.locator('#animated-grain')).toBeAttached();
  });

  test('Page titles are correctly formatted', async ({ page }) => {
    test.slow();
    // Check Home
    await page.goto('/');
    await expect(page).toHaveTitle(/Ramper/);

    // Check Music
    await page.goto('/music');
    await expect(page).toHaveTitle('Ramper | música');

    // Check Shows
    await page.goto('/shows');
    await expect(page).toHaveTitle('Ramper | conciertos');

    // Check News
    await page.goto('/news');
    await expect(page).toHaveTitle('Ramper | noticias');

    // Check About
    await page.goto('/about');
    await expect(page).toHaveTitle('Ramper | ¿...quién?');

    // Check Contact
    await page.goto('/contact');
    await expect(page).toHaveTitle('Ramper | escribe');
  });
});
