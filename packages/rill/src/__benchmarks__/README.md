# Rill Performance Benchmarks

This directory contains performance benchmarks for the Rill engine, testing core operations to ensure production-ready performance and detect regressions.

## Overview

The benchmark suite measures:

- **Engine Performance**: Plugin loading, event handling, configuration updates
- **Receiver Performance**: Batch processing, rendering, node tree operations
- **Operations Performance**: Operation merging, scheduling, and throughput
- **Memory Usage**: Memory allocation during key operations

## Running Benchmarks

### Run All Benchmarks

```bash
npm run bench
```

### Run Specific Benchmark Suites

```bash
# Engine benchmarks only
npm run bench:engine

# Receiver benchmarks only
npm run bench:receiver

# Operations benchmarks only
npm run bench:operations
```

## Benchmark Structure

```
src/__benchmarks__/
├── utils/
│   ├── benchmark.ts       # Core benchmark utilities (timing, statistics)
│   ├── memory.ts          # Memory measurement tools
│   └── reporter.ts        # Report generation (text, JSON, markdown)
├── engine.bench.ts        # Engine performance tests
├── receiver.bench.ts      # Receiver performance tests
├── operations.bench.ts    # Operations processing tests
└── README.md              # This file
```

## Benchmark Metrics

Each benchmark reports the following statistics:

- **Mean**: Average execution time across all samples
- **Median**: Middle value of all samples (less affected by outliers)
- **Min**: Fastest execution time
- **Max**: Slowest execution time
- **Std Dev**: Standard deviation (consistency indicator)
- **Ops/sec**: Operations per second (throughput)
- **Samples**: Number of iterations measured

## Key Performance Targets

### Engine Benchmarks

| Test | Target (mean) | Description |
|------|---------------|-------------|
| Engine.new | < 10ms | Engine initialization time |
| Engine.loadBundle (simple) | < 50ms | Simple plugin loading |
| Engine.loadBundle (large) | < 200ms | Large plugin (1000 ops) loading |
| Engine.sendEvent | < 1ms | Event messaging latency |
| Engine.updateConfig | < 1ms | Configuration update |

### Receiver Benchmarks

| Test | Target (mean) | Description |
|------|---------------|-------------|
| Receiver.applyBatch (10 nodes) | < 5ms | Small batch processing |
| Receiver.applyBatch (100 nodes) | < 30ms | Medium batch processing |
| Receiver.applyBatch (1000 nodes) | < 300ms | Large batch processing |
| Receiver.render (100 nodes) | < 10ms | Render 100-node tree |

### Operations Benchmarks

| Test | Target (mean) | Description |
|------|---------------|-------------|
| OperationMerger.merge (100 UPDATEs) | < 2ms | Operation merging |
| ThrottledScheduler.enqueueAll (100) | < 5ms | Batch enqueueing |
| Full pipeline (10k operations) | < 1000ms | End-to-end throughput |

## Memory Benchmarks

Memory benchmarks report:
- **Before**: Heap size before operation
- **After**: Heap size after operation
- **Delta**: Memory allocated during operation

Target: Memory growth should be proportional to operation count with no significant leaks.

## Interpreting Results

### Performance Indicators

- **Mean < Target**: ✅ Performance is acceptable
- **Mean > Target**: ⚠️ May need optimization
- **High Std Dev**: ⚠️ Inconsistent performance, investigate cause
- **Regression > 10%**: 🔴 Performance degraded, requires investigation

### When to Optimize

Consider optimization when:
1. Mean execution time exceeds targets significantly (>50%)
2. Performance regresses by >10% compared to baseline
3. Standard deviation is high (>30% of mean)
4. Memory usage grows unexpectedly

## Baseline Management

### Generating Baseline

Run benchmarks and save results:

```bash
npm run bench > baseline.txt
```

### Comparing Against Baseline

The benchmark suite includes baseline comparison utilities in `utils/benchmark.ts`:

```typescript
import { compareWithBaseline } from './utils/benchmark';

const comparison = compareWithBaseline(currentResult, baselineResult);
console.log(`Delta: ${comparison.delta.toFixed(2)}%`);
console.log(`Faster: ${comparison.faster}`);
console.log(`Regression: ${comparison.regression}`);
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Benchmarks

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  benchmark:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run bench
      - name: Compare with baseline
        run: |
          # Compare results with stored baseline
          # Fail if regression > 10%
```

## Best Practices

### Writing Benchmarks

1. **Warmup**: Always include warmup iterations to stabilize JIT
2. **Sample Size**: Use enough samples for statistical significance (50-100+)
3. **Isolation**: Each benchmark should be independent
4. **Cleanup**: Properly dispose of resources after each iteration

### Benchmark Reliability

1. **Run on consistent hardware**: Results vary by CPU/memory
2. **Close other applications**: Minimize background processes
3. **Run multiple times**: Verify consistency across runs
4. **Use Node.js --expose-gc**: Enable GC for memory tests

```bash
node --expose-gc ./node_modules/.bin/vitest bench
```

## Troubleshooting

### High Variance in Results

- Close background applications
- Increase warmup iterations
- Check for memory pressure (GC pauses)
- Run on dedicated benchmark machine

### Unexpected Regressions

- Check for algorithm changes
- Review recent commits
- Compare with git history
- Profile specific slow operations

### Memory Leaks

- Use `--expose-gc` flag
- Check for event listener leaks
- Verify proper cleanup in `afterEach`
- Use memory profiling tools

## Related Documentation

- [Performance Optimization Guide](../../docs/guides/performance.md)
- [Advanced Features Example](../../examples/advanced-features/)
- [Production Checklist](../../docs/guides/production-checklist.md)
