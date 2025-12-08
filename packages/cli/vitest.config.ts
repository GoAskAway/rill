import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    pool: 'forks', // Enable forks to support process.chdir()
    include: ['src/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
  },
});
