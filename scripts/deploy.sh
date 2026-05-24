#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

NODE_BIN_DIR="${NODE_BIN_DIR:-/root/.nvm/versions/node/v24.12.0/bin}"
NODE="$NODE_BIN_DIR/node"
NPM="$NODE_BIN_DIR/npm"
NPX="$NODE_BIN_DIR/npx"

if [[ ! -x "$NODE" ]]; then
  echo "ERROR: Node not found or not executable at $NODE" >&2
  echo "Jenkins runs as user 'jenkins' and cannot use /root/.nvm by default." >&2
  echo "Fix on server (as root):" >&2
  echo "  ln -sf $NODE_BIN_DIR/node /usr/local/bin/node" >&2
  echo "  ln -sf $NODE_BIN_DIR/npm  /usr/local/bin/npm" >&2
  echo "  ln -sf $NODE_BIN_DIR/npx  /usr/local/bin/npx" >&2
  exit 1
fi

export PATH="$NODE_BIN_DIR:$PATH"

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

echo "==> Deploy complete"
$PM2 status alhalnewweb
