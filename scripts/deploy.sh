#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if command -v node >/dev/null 2>&1 && [[ -x "$(command -v node)" ]]; then
  NODE="$(command -v node)"
  NPM="$(command -v npm)"
  NPX="$(command -v npx)"
else
  NODE_BIN_DIR="${NODE_BIN_DIR:-/usr/local/bin}"
  NODE="$NODE_BIN_DIR/node"
  NPM="$NODE_BIN_DIR/npm"
  NPX="$NODE_BIN_DIR/npx"
fi

if [[ ! -x "$NODE" ]]; then
  echo "ERROR: Node not found at $NODE" >&2
  echo "Install Node 20+ or symlink to /usr/local/bin/node" >&2
  exit 1
fi

export PATH="$(dirname "$NODE"):$PATH"

echo "==> Deploying alhalnewweb from $ROOT_DIR"
echo "==> Node: $NODE ($("$NODE" -v))"
echo "==> npm:  $NPM ($("$NPM" -v))"

if [[ ! -f ".env.local" && ! -f ".env.production" && ! -f ".env" ]]; then
  echo "Warning: no .env.local, .env.production, or .env file found."
  echo "Set NEXT_PUBLIC_API_URL before building for production."
fi

mkdir -p logs

echo "==> Installing dependencies"
"$NPM" ci

echo "==> Lint (non-blocking)"
"$NPM" run lint || echo "Lint reported issues — continuing deploy"

echo "==> Building Next.js app"
"$NPM" run build

echo "==> Starting or reloading PM2 process"
PM2="$NPX pm2"
if $PM2 describe alhalnewweb >/dev/null 2>&1; then
  $PM2 reload ecosystem.config.cjs --env production --update-env
else
  $PM2 start ecosystem.config.cjs --env production
fi

$PM2 save

echo "==> Health check"
sleep 2
if curl -sf "http://127.0.0.1:3011" >/dev/null 2>&1; then
  echo "App responded on port 3011"
else
  echo "Warning: no HTTP response on 3011 — check PM2 logs"
fi

echo "==> Deploy complete"
$PM2 status alhalnewweb
