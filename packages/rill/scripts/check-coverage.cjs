#!/usr/bin/env node
/**
 * Coverage threshold check script
 * Fails if coverage drops below defined thresholds
 */

const fs = require('fs');
const { execSync } = require('child_process');

// Coverage thresholds - update these as coverage improves
const THRESHOLDS = {
  functions: 86.0,  // Current: 86.97%
  lines: 96.0,      // Current: 96.21%
};

console.log('Running coverage check...\n');

try {
  // Run tests with coverage - try bun in PATH, then fallback to common locations
  let bunCommand = 'bun';
  try {
    execSync('which bun', { stdio: 'pipe' });
  } catch {
    // Try common Bun installation locations
    const bunPaths = [
      `${process.env.HOME}/.bun/bin/bun`,
      '/usr/local/bin/bun',
      'bun' // fallback
    ];
    bunCommand = bunPaths.find(path => {
      try {
        require('fs').accessSync(path, require('fs').constants.X_OK);
        return true;
      } catch {
        return false;
      }
    }) || 'bun';
  }

  let output;
  try {
    output = execSync(`${bunCommand} test --coverage 2>&1`, {
      encoding: 'utf-8'
    });
  } catch (err) {
    // Tests might fail but still produce coverage - capture output
    output = err.stdout || err.stderr || '';
    if (!output) throw err;
  }

  // Parse coverage from output
  const lines = output.split('\n');
  const allFilesLine = lines.find(line => line.includes('All files'));

  if (!allFilesLine) {
    console.error('❌ Could not find coverage summary in test output');
    process.exit(1);
  }

  // Extract coverage percentages
  // Format: "All files                               |   86.97 |   96.21 |"
  const matches = allFilesLine.match(/\|\s+(\d+\.\d+)\s+\|\s+(\d+\.\d+)/);

  if (!matches) {
    console.error('❌ Could not parse coverage percentages');
    process.exit(1);
  }

  const actualFunctions = parseFloat(matches[1]);
  const actualLines = parseFloat(matches[2]);

  console.log('📊 Coverage Results:');
  console.log(`   Functions: ${actualFunctions.toFixed(2)}% (threshold: ${THRESHOLDS.functions}%)`);
  console.log(`   Lines:     ${actualLines.toFixed(2)}% (threshold: ${THRESHOLDS.lines}%)\n`);

  // Check thresholds
  let failed = false;

  if (actualFunctions < THRESHOLDS.functions) {
    console.error(`❌ Function coverage ${actualFunctions.toFixed(2)}% is below threshold ${THRESHOLDS.functions}%`);
    failed = true;
  } else {
    console.log(`✅ Function coverage passed (${actualFunctions.toFixed(2)}% >= ${THRESHOLDS.functions}%)`);
  }

  if (actualLines < THRESHOLDS.lines) {
    console.error(`❌ Line coverage ${actualLines.toFixed(2)}% is below threshold ${THRESHOLDS.lines}%`);
    failed = true;
  } else {
    console.log(`✅ Line coverage passed (${actualLines.toFixed(2)}% >= ${THRESHOLDS.lines}%)`);
  }

  if (failed) {
    console.error('\n💥 Coverage check failed! Please add tests to meet the thresholds.');
    process.exit(1);
  }

  console.log('\n🎉 Coverage check passed!');
  process.exit(0);

} catch (error) {
  // Test failures - still check coverage
  console.warn('⚠️  Some tests failed, but checking coverage anyway...\n');

  try {
    const output = error.stdout ? error.stdout.toString() : '';
    const lines = output.split('\n');
    const allFilesLine = lines.find(line => line.includes('All files'));

    if (allFilesLine) {
      const matches = allFilesLine.match(/\|\s+(\d+\.\d+)\s+\|\s+(\d+\.\d+)/);
      if (matches) {
        const actualFunctions = parseFloat(matches[1]);
        const actualLines = parseFloat(matches[2]);

        console.log('📊 Coverage Results:');
        console.log(`   Functions: ${actualFunctions.toFixed(2)}% (threshold: ${THRESHOLDS.functions}%)`);
        console.log(`   Lines:     ${actualLines.toFixed(2)}% (threshold: ${THRESHOLDS.lines}%)\n`);

        let failed = false;

        if (actualFunctions < THRESHOLDS.functions) {
          console.error(`❌ Function coverage ${actualFunctions.toFixed(2)}% is below threshold ${THRESHOLDS.functions}%`);
          failed = true;
        } else {
          console.log(`✅ Function coverage passed (${actualFunctions.toFixed(2)}% >= ${THRESHOLDS.functions}%)`);
        }

        if (actualLines < THRESHOLDS.lines) {
          console.error(`❌ Line coverage ${actualLines.toFixed(2)}% is below threshold ${THRESHOLDS.lines}%`);
          failed = true;
        } else {
          console.log(`✅ Line coverage passed (${actualLines.toFixed(2)}% >= ${THRESHOLDS.lines}%)`);
        }

        if (failed) {
          console.error('\n💥 Coverage thresholds not met! Please add tests.');
          process.exit(1);
        }

        console.log('\n✅ Coverage thresholds passed (despite some test failures)');
        process.exit(0);
      }
    }
  } catch (parseError) {
    console.error('❌ Could not parse coverage from test output');
  }

  console.error('❌ Coverage check failed:', error.message);
  process.exit(1);
}
