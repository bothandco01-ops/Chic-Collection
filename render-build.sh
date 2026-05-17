#!/usr/bin/env bash
set -euo pipefail

echo "==> Enabling pnpm via corepack..."
# Render's Node.js ships with corepack — avoids npm install -g which fails on rofs
corepack enable pnpm

echo "==> Installing dependencies..."
# --node-linker=hoisted avoids pnpm workspace symlinks, which fail on Render's rofs filesystem
pnpm install --no-frozen-lockfile --node-linker=hoisted

echo "==> Building shared TypeScript libraries..."
pnpm run typecheck:libs

echo "==> Building frontend (Vite)..."
BASE_PATH=/ NODE_ENV=production pnpm --filter @workspace/both-and-co run build

echo "==> Building API server (esbuild)..."
pnpm --filter @workspace/api-server run build

echo "==> Build complete."
