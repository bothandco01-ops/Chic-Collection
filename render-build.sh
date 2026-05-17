#!/usr/bin/env bash
set -euo pipefail

echo "==> Installing pnpm..."
npm install -g pnpm@latest-10

echo "==> Installing dependencies (no frozen lockfile to handle platform differences)..."
pnpm install --no-frozen-lockfile

echo "==> Building shared TypeScript libraries..."
pnpm run typecheck:libs

echo "==> Building frontend (Vite)..."
BASE_PATH=/ NODE_ENV=production pnpm --filter @workspace/both-and-co run build

echo "==> Building API server (esbuild)..."
pnpm --filter @workspace/api-server run build

echo "==> Build complete."
