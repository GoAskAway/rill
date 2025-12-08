/**
 * Benchmark utilities for performance testing
 */

export interface BenchmarkResult {
  name: string;
  mean: number; // milliseconds
  median: number;
  min: number;
  max: number;
  stdDev: number;
  ops: number; // operations per second
  samples: number;
}

export interface BenchmarkOptions {
  iterations?: number;
  warmup?: number;
  minSamples?: number;
  maxTime?: number; // max time in ms
}

/**
 * Measure execution time of a function
 */
export async function measure(
  fn: () => void | Promise<void>
): Promise<number> {
  const start = performance.now();
  await fn();
  const end = performance.now();
  return end - start;
}

/**
 * Run benchmark with multiple iterations
 */
export async function benchmark(
  name: string,
  fn: () => void | Promise<void>,
  options: BenchmarkOptions = {}
): Promise<BenchmarkResult> {
  const {
    iterations = 100,
    warmup = 10,
    minSamples = 50,
    maxTime = 10000,
  } = options;

  // Warmup phase
  for (let i = 0; i < warmup; i++) {
    await fn();
  }

  // Measurement phase
  const samples: number[] = [];
  const startTime = performance.now();

  for (let i = 0; i < iterations; i++) {
    const time = await measure(fn);
    samples.push(time);

    // Stop if we've collected enough samples or exceeded max time
    if (
      samples.length >= minSamples &&
      performance.now() - startTime > maxTime
    ) {
      break;
    }
  }

  // Calculate statistics
  const sorted = [...samples].sort((a, b) => a - b);
  const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
  const median = sorted[Math.floor(sorted.length / 2)] ?? 0;
  const min = sorted[0] ?? 0;
  const max = sorted[sorted.length - 1] ?? 0;

  // Calculate standard deviation
  const variance =
    samples.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
    samples.length;
  const stdDev = Math.sqrt(variance);

  // Operations per second
  const ops = 1000 / mean;

  return {
    name,
    mean,
    median,
    min,
    max,
    stdDev,
    ops,
    samples: samples.length,
  };
}

/**
 * Compare benchmark result against baseline
 */
export function compareWithBaseline(
  result: BenchmarkResult,
  baseline: BenchmarkResult | undefined
): {
  delta: number; // percentage change
  faster: boolean;
  regression: boolean; // true if performance degraded significantly
} {
  if (!baseline) {
    return { delta: 0, faster: false, regression: false };
  }

  const delta = ((result.mean - baseline.mean) / baseline.mean) * 100;
  const faster = result.mean < baseline.mean;
  const regression = delta > 10; // 10% slower is considered a regression

  return { delta, faster, regression };
}

/**
 * Format benchmark result for display
 */
export function formatResult(result: BenchmarkResult): string {
  return [
    `${result.name}:`,
    `  Mean: ${result.mean.toFixed(2)}ms`,
    `  Median: ${result.median.toFixed(2)}ms`,
    `  Min: ${result.min.toFixed(2)}ms`,
    `  Max: ${result.max.toFixed(2)}ms`,
    `  Std Dev: ${result.stdDev.toFixed(2)}ms`,
    `  Ops/sec: ${result.ops.toFixed(0)}`,
    `  Samples: ${result.samples}`,
  ].join('\n');
}
