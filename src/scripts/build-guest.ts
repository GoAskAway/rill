#!/usr/bin/env bun
/**
 * Guest Bundle Build Script
 *
 * Compiles the Guest bundle (React shims + Reconciler + Runtime helpers).
 *
 * Required output:
 *  - A TypeScript export file (for Engine to import): src/guest/build/bundle.ts
 *
 * Optional outputs (use flags):
 *  - Merged TypeScript file (for debugging): src/guest/build/guest-bundle.merged.ts
 *  - IIFE JS bundle (for inspection/injection): src/guest/build/guest-bundle.js
 *
 * Usage:
 *   bun src/scripts/build-guest.ts
 *   bun src/scripts/build-guest.ts --debug          # Non-minified for debugging
 *   bun src/scripts/build-guest.ts --write-js       # Also write src/guest/build/guest-bundle.js
 *   bun src/scripts/build-guest.ts --write-merged   # Also write src/guest/build/guest-bundle.merged.ts
 *
 * For app debugging, apps should import rill/guest directly and bundle themselves.
 * See counterapp/entry.ts for example.
 */

import * as fs from 'fs';
import * as path from 'path';

const SCRIPTS_DIR = path.resolve(import.meta.dir);
const GUEST_DIR = path.join(SCRIPTS_DIR, '..', 'guest');
const INPUT = path.join(GUEST_DIR, 'guest-bundle.ts');
const OUTPUT_DIR = path.join(GUEST_DIR, 'build');
const OUTPUT_JS = path.join(OUTPUT_DIR, 'guest-bundle.js');
const OUTPUT_TS_MERGED = path.join(OUTPUT_DIR, 'guest-bundle.merged.ts');
const OUTPUT_BUNDLE_TS = path.join(OUTPUT_DIR, 'bundle.ts');
const TEMP_DIR = '/tmp/rill-guest-build';
const TEMP_FILE = path.join(TEMP_DIR, 'guest-bundle.js');

// Flags
const isDebug = process.argv.includes('--debug');
const shouldWriteJSFile = process.argv.includes('--write-js');
const shouldWriteMergedTS = process.argv.includes('--write-merged');

/**
 * Generate merged TypeScript for debugging
 * Concatenates all source files in dependency order
 */
async function generateMergedTS(): Promise<string> {
  const files = [
    'init.ts',
    'globals-setup.ts',
    'types.ts',
    'shims/react-core.ts',
    'shims/hooks.ts',
    'shims/context.ts',
    'shims/component.ts',
    'shims/react-native.ts',
    'shims/react.ts',
    'shims/jsx-runtime.ts',
    'reconciler/types.ts',
    'reconciler/operation-collector.ts',
    'reconciler/guest-encoder.ts',
    'reconciler/element-transform.ts',
    'reconciler/host-config.ts',
    'reconciler/devtools.ts',
    'reconciler/reconciler-manager.ts',
    'reconciler/index.ts',
    'guest-bundle.ts',
  ];

  const header = `/**
 * Guest Bundle - Merged TypeScript Source
 *
 * AUTO-GENERATED - DO NOT EDIT
 * Run: bun src/scripts/build-guest.ts --write-merged
 *
 * This file contains all Guest source code merged for debugging.
 * Use this to understand the Guest bundle structure and debug issues.
 *
 * Generated: ${new Date().toISOString()}
 */

`;

  let merged = header;

  for (const file of files) {
    const filePath = path.join(GUEST_DIR, file);
    if (fs.existsSync(filePath)) {
      const content = await Bun.file(filePath).text();
      merged += `\n// ============================================\n`;
      merged += `// FILE: ${file}\n`;
      merged += `// ============================================\n\n`;
      merged += content;
      merged += '\n';
    }
  }

  return merged;
}

async function build(): Promise<void> {
  console.log('Building Guest Bundle...');
  console.log(`  Input: ${INPUT}`);
  console.log(`  Output TS (export): ${OUTPUT_BUNDLE_TS}`);
  if (shouldWriteJSFile) console.log(`  Output JS: ${OUTPUT_JS}`);
  if (shouldWriteMergedTS) console.log(`  Output TS (merged): ${OUTPUT_TS_MERGED}`);
  console.log(`  Mode: ${isDebug ? 'debug' : 'production'}`);

  // Ensure output directories exist
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }

  // Step 1 (optional): Generate merged TypeScript for debugging
  if (shouldWriteMergedTS) {
    console.log('\n1. Generating merged TypeScript...');
    const mergedTS = await generateMergedTS();
    fs.writeFileSync(OUTPUT_TS_MERGED, mergedTS);
    console.log(`   Wrote: ${OUTPUT_TS_MERGED} (${(mergedTS.length / 1024).toFixed(2)} KB)`);
  }

  // Step 2: Build with Bun
  console.log(`\n${shouldWriteMergedTS ? 2 : 1}. Building JavaScript bundle...`);
  const result = await Bun.build({
    entrypoints: [INPUT],
    outdir: TEMP_DIR,
    target: 'browser',
    format: 'iife',
    minify: !isDebug,
    naming: 'guest-bundle.[ext]',
    external: [], // Bundle everything
  });

  if (!result.success) {
    console.error('Build failed:');
    for (const log of result.logs) {
      console.error(log);
    }
    process.exit(1);
  }

  // Read the built code
  const jsCode = await Bun.file(TEMP_FILE).text();
  const jsSizeKB = (jsCode.length / 1024).toFixed(2);
  console.log(`   Bundle size: ${jsSizeKB} KB (${jsCode.length} bytes)`);

  // Step 3 (optional): Write JavaScript bundle
  if (shouldWriteJSFile) {
    fs.writeFileSync(OUTPUT_JS, jsCode);
    console.log(`   Wrote: ${OUTPUT_JS}`);
  }

  // Step 4: Generate TypeScript export file
  console.log(`\n${shouldWriteMergedTS ? 3 : 2}. Generating TypeScript export...`);
  const tsExport = `/**
 * Guest Bundle Export (Auto-generated)
 *
 * DO NOT EDIT - Generated by src/scripts/build-guest.ts
 * Run: bun src/scripts/build-guest.ts
 *
 * This is the compiled Guest bundle that provides:
 * - React/JSX shims
 * - Console setup
 * - Runtime helpers (event communication)
 * - RillReconciler (render, unmount, etc.)
 *
 * Size: ${jsSizeKB} KB (${isDebug ? 'debug' : 'minified'})
 * Generated: ${new Date().toISOString()}
 */

/**
 * The compiled Guest bundle code.
 * Eval this once during Engine initialization.
 */
export const GUEST_BUNDLE_CODE = ${JSON.stringify(jsCode)};

/**
 * Size in bytes (for monitoring)
 */
export const GUEST_BUNDLE_SIZE = ${jsCode.length};

/**
 * Is debug build
 */
export const GUEST_BUNDLE_DEBUG = ${isDebug};
`;

  fs.writeFileSync(OUTPUT_BUNDLE_TS, tsExport);
  console.log(`   Wrote: ${OUTPUT_BUNDLE_TS}`);

  // Cleanup
  try {
    fs.unlinkSync(TEMP_FILE);
  } catch {
    // Ignore cleanup errors
  }

  console.log('\n✓ Build complete!');
  console.log(`\nOutputs:`);
  console.log(`  - ${OUTPUT_BUNDLE_TS} (export for Engine)`);
  if (shouldWriteMergedTS) console.log(`  - ${OUTPUT_TS_MERGED} (merged TS for debugging)`);
  if (shouldWriteJSFile) console.log(`  - ${OUTPUT_JS} (compiled JS bundle)`);
}

// Run build
build().catch((err: unknown) => {
  console.error('Build failed:', err);
  process.exit(1);
});
