#!/usr/bin/env bash
# Verbose output — every line shows in Render's build log
set -euxo pipefail

echo ">>> Node $(node --version) | npm $(npm --version)"
echo ">>> Working dir: $(pwd)"

# ── Step 1: Get pnpm into PATH ─────────────────────────────────────────────
# We install to /tmp so we never touch read-only filesystem paths.
# Render may already have pnpm; we check first to avoid downloading twice.
if command -v pnpm &>/dev/null; then
  echo ">>> pnpm already available: $(pnpm --version)"
else
  echo ">>> pnpm not found — installing to /tmp/pnpm-local..."
  npm install --prefix /tmp/pnpm-local pnpm@10 2>&1
  export PATH="/tmp/pnpm-local/node_modules/.bin:$PATH"
  echo ">>> pnpm installed: $(pnpm --version)"
fi

# ── Step 2: Install workspace dependencies ─────────────────────────────────
# NODE_ENV must NOT be production during install or devDeps will be skipped.
# --node-linker=hoisted avoids workspace symlinks that break on Render's rofs.
echo ">>> Installing dependencies..."
NODE_ENV=development pnpm install --no-frozen-lockfile --node-linker=hoisted

# ── Step 3: Build shared TypeScript libraries ──────────────────────────────
echo ">>> Building shared libs..."
pnpm run typecheck:libs

# ── Step 4: Build frontend ─────────────────────────────────────────────────
echo ">>> Building frontend..."
BASE_PATH=/ NODE_ENV=production pnpm --filter @workspace/both-and-co run build

# ── Step 5: Build API server ───────────────────────────────────────────────
echo ">>> Building API server..."
pnpm --filter @workspace/api-server run build

echo ">>> Build complete."
