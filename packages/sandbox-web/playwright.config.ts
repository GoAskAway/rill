// rill/packages/sandbox-web/playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.TEST_PORT) || 15173;

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  fullyParallel: true,
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
    baseURL: `http://127.0.0.1:${PORT}`,
    headless: true,
  },
  timeout: 60 * 1000,
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
