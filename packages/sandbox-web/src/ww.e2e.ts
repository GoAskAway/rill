// rill/packages/sandbox-web/src/ww.spec.ts
import { test, expect, Page } from '@playwright/test';

// Extend the window object for type safety
declare global {
  interface Window {
    WWProvider: any;
  }
}

// Before each test, navigate to our test harness page
test.beforeEach(async ({ page }) => {
  // Set up console listener BEFORE navigation to avoid missing the message
  const consolePromise = page.waitForEvent('console', (msg) => msg.text().includes('WWProvider attached to window.'));
  await page.goto('/');
  await consolePromise;
});

test.describe('WWProvider via Playwright', () => {
  test('should evaluate a simple script', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const provider = new window.WWProvider();
      const runtime = await provider.createRuntime();
      const context = await runtime.createContext();
      return context.evaluateAsync('return 1 + 2;');
    });
    expect(result).toBe(3);
  });

  test('should handle scripts that return a promise', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const provider = new window.WWProvider();
      const runtime = await provider.createRuntime();
      const context = await runtime.createContext();
      return context.evaluateAsync('return Promise.resolve(42);');
    });
    expect(result).toBe(42);
  });

  test('should reject the promise if the script throws an error', async ({ page }) => {
    const evaluationPromise = page.evaluate(async () => {
      const provider = new window.WWProvider();
      const runtime = await provider.createRuntime();
      const context = await runtime.createContext();
      // Playwright's evaluate can't return a rejected promise directly,
      // so we catch it and return a serializable error object.
      try {
        await context.evaluateAsync('throw new Error("test error");');
      } catch (e: any) {
        return { name: e.name, message: e.message };
      }
    });
    await expect(evaluationPromise).resolves.toEqual({
      name: 'Error',
      message: 'test error',
    });
  });

  test('should handle multiple evaluations concurrently', async ({ page }) => {
    const results = await page.evaluate(async () => {
      const provider = new window.WWProvider();
      const runtime = await provider.createRuntime();
      const context = await runtime.createContext();

      const p1 = context.evaluateAsync('return 1;');
      const p2 = context.evaluateAsync('return "two";');
      const p3 = context.evaluateAsync('return new Promise(r => setTimeout(() => r(3), 10));');
      return Promise.all([p1, p2, p3]);
    });
    expect(results).toEqual([1, 'two', 3]);
  });
});
