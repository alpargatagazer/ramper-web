import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  outputDir: 'playwright-results',

  /* The conditions changed when we run the tests in CI. */
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  /**
   * Reporter to use. Unless overridden, we always wait for the user to check the results.
   * See https://playwright.dev/docs/test-reporters
   */
  reporter: [
    [
      'html',
      { 
        host: '0.0.0.0', 
        port: 9323, 
        open: (process.env.PLAYWRIGHT_HTML_OPEN as any) || 'on-failure', 
        outputFolder: 'playwright-results' 
      }
    ]
  ],

  /**
   * Shared settings for all the projects below.
   * See https://playwright.dev/docs/api/class-testoptions.
   */
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL,
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
