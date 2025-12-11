# Test Coverage

This document explains the test coverage requirements and how they are enforced in CI.

## Current Coverage

As of the latest update:
- **Function Coverage**: 86.97%
- **Line Coverage**: 96.21%

## Coverage Thresholds

The project enforces minimum coverage thresholds to prevent regression:

```javascript
{
  functions: 86.0%,  // Minimum function coverage
  lines: 96.0%       // Minimum line coverage
}
```

These thresholds are defined in `scripts/check-coverage.cjs` and checked in CI.

## Running Coverage Locally

```bash
# Run tests with coverage report
bun run test:coverage

# Run tests and check against thresholds
bun run test:coverage:check
```

## CI Integration

The GitHub Actions CI workflow automatically checks coverage on every PR:

1. Runs all tests with coverage enabled
2. Parses coverage results
3. Fails the build if coverage drops below thresholds

See `.github/workflows/ci.yml` for the CI configuration.

## Updating Thresholds

When coverage improves significantly, update the thresholds in `scripts/check-coverage.cjs`:

```javascript
const THRESHOLDS = {
  functions: 87.0,  // Update to new minimum
  lines: 97.0,      // Update to new minimum
};
```

**Important**: Only increase thresholds, never decrease them, to prevent coverage regression.

## Coverage by Module

### Fully Covered (100%)
- ✅ `NoSandboxProvider` - 100% / 100%
- ✅ `PooledEngine` - 100% / 100%
- ✅ `RNQuickJSProvider` - 100% / 100%

### High Coverage (>90%)
- ✅ `Reconciler` - 56% / 91%
- ✅ `WorkerJSEngineProvider` - 95% / 98%
- ✅ `DefaultJSEngineProvider` - 57% / 89%

### Areas Needing Improvement
- Remaining uncovered code primarily consists of:
  - React internal lifecycle methods (low risk)
  - Edge cases in environment detection
  - Container-level reconciliation methods

## Test Types

1. **Unit Tests**: Individual function/class testing
2. **Integration Tests**: React component rendering with reconciler
3. **Edge Case Tests**: Error handling, fallbacks, boundary conditions
4. **Mock Tests**: Environment simulation, provider mocking

## Best Practices

1. **Always add tests** for new features
2. **Test error paths** and edge cases
3. **Mock external dependencies** (RN modules, Workers)
4. **Use realistic scenarios** in integration tests
5. **Update thresholds** when coverage significantly improves
