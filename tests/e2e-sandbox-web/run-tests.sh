#!/bin/bash
# Web Sandbox E2E Tests - One-shot runner
# Installs deps, builds, starts server, runs Playwright tests

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$ROOT_DIR"

echo "======================================"
echo "  Web Sandbox E2E Tests"
echo "======================================"
echo ""

# Check dependencies
echo "[1/3] Checking dependencies..."
if ! command -v bun &> /dev/null; then
  echo "[ERROR] bun is required but not installed"
  exit 1
fi

if ! command -v npx &> /dev/null; then
  echo "[ERROR] npx is required but not installed"
  exit 1
fi

# Install Playwright if needed
if ! npx playwright --version &> /dev/null; then
  echo "[INFO] Installing Playwright..."
  npx playwright install chromium
fi

# Run tests
echo ""
echo "[2/3] Building and starting server..."
echo "[3/3] Running Playwright tests..."
bun tests/e2e-sandbox-web/run.ts

echo ""
echo "[OK] All Web E2E tests passed"
