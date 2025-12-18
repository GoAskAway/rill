// rill/packages/sandbox-web/playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src',
  testMatch: '**/*.e2e.ts', // Match only e2e test files
  fullyParallel: true,
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
    baseURL: 'http://127.0.0.1:5173',
    headless: true,
  },
  timeout: 60 * 1000, // Increase test timeout to 60 seconds

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // This is the key part: start a web server before running the tests.
  webServer: {
    command: 'npx vite dev --port 5173 --strictPort', // Add --strictPort and ensure npx
    url: 'http://127.0.0.1:5173',    // URL to wait for before starting tests
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe', // Pipe stdout for debugging
    stderr: 'pipe',
  },
});
