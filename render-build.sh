#!/usr/bin/env bash
set -euo pipefail

echo "==> Node: $(node --version), npm: $(npm --version)"

# ── Get pnpm (try corepack first, fall back to npx) ──────────────────────────
echo "==> Getting pnpm..."
if command -v pnpm &>/dev/null; then
  echo "    pnpm already available: $(pnpm --version)"
elif corepack enable pnpm 2>/dev/null; then
  echo "    pnpm via corepack: $(pnpm --version)"
else
  echo "    Falling back to npm install -g pnpm (force)..."
  npm install -g pnpm --force
  echo "    pnpm installed: $(pnpm --version)"
fi

# ── Install dependencies ──────────────────────────────────────────────────────
echo "==> Installing dependencies..."
# --node-linker=hoisted avoids workspace symlinks that fail on Render's rofs filesystem
pnpm install --no-frozen-lockfile --node-linker=hoisted

# ── Build shared libs ─────────────────────────────────────────────────────────
echo "==> Building shared TypeScript libraries..."
pnpm run typecheck:libs

# ── Build frontend ────────────────────────────────────────────────────────────
echo "==> Building frontend (Vite)..."
BASE_PATH=/ NODE_ENV=production pnpm --filter @workspace/both-and-co run build

# ── Build API server ──────────────────────────────────────────────────────────
echo "==> Building API server (esbuild)..."
pnpm --filter @workspace/api-server run build

echo "==> Build complete."
