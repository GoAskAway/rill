import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    onConsoleLog(log, type) {
      // Suppress noisy test logs from runtime and sandbox while preserving assertion spies
      if (/\[rill\]/.test(log) || /\[QuickJSProvider\]/.test(log)) return false;
    },
    globals: true,
    environment: 'node',
    pool: 'forks', // use forks to support process.chdir
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'src/**/*.bench.ts'],
    exclude: ['node_modules', 'dist', 'examples'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.test.tsx',
        'src/**/*.bench.ts',
        'src/__benchmarks__/**',
        'src/**/index.ts',
        'src/cli/index.ts',
        'src/components/**', // requires RN environment
        'src/runtime/EngineView.tsx', // requires RN environment
        'src/types.ts', // type definitions only, no runtime code
        'src/runtime/index.check.ts', // type checking utility
        'src/cli/oxcAdapter.ts', // thin wrapper around oxc-parser
      ],
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 75,
        statements: 85,
      },
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    benchmark: {
      include: ['src/**/*.bench.ts'],
      exclude: ['node_modules', 'dist'],
    },
  },
  resolve: {
    alias: {
      'rill/sdk': path.resolve(__dirname, 'src/sdk'),
      rill: path.resolve(__dirname, 'src/runtime'),
      'react-native': path.resolve(__dirname, 'src/__mocks__/react-native.ts'),
    },
  },
});
