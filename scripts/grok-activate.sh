#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

log() { printf '[grok] %s\n' "$*"; }
fail() { printf '[grok] ERROR: %s\n' "$*" >&2; exit 1; }

command -v node >/dev/null 2>&1 || fail "Node.js is required. Install Node 22+ and rerun."
if ! command -v pnpm >/dev/null 2>&1; then
  command -v corepack >/dev/null 2>&1 || fail "pnpm/corepack is required. Install Node 22+ and rerun."
  corepack enable
fi

log "Installing from the committed lockfile (offline cache preferred)."
pnpm install --prefer-offline

if [[ -n "${DATABASE_URL:-}" || -n "${DRIZZLE_DATABASE_URL:-}" ]]; then
  log "Database credentials detected; applying the additive Drizzle migration workflow."
  pnpm db:push
else
  log "No database DSN detected; skipping database sync. The fixture-backed UI and public research remain runnable."
fi

log "Running typecheck, lint, tests, and production bundle build."
pnpm check
pnpm lint
pnpm test
pnpm build

if curl --max-time 2 -fsS http://127.0.0.1:3000/api/health >/dev/null 2>&1 && curl --max-time 2 -fsS http://127.0.0.1:8081/manus-routes.json >/dev/null 2>&1; then
  log "Frontend and API are already healthy on ports 8081 and 3000. Reusing them."
  exit 0
fi

if command -v ss >/dev/null 2>&1 && ss -ltn | grep -Eq '(:3000|:8081) '; then
  log "A frontend/API listener is already booting on port 8081 or 3000; waiting instead of launching a duplicate."
  for _ in $(seq 1 45); do
    if curl --max-time 2 -fsS http://127.0.0.1:3000/api/health >/dev/null 2>&1 && curl --max-time 2 -fsS http://127.0.0.1:8081/manus-routes.json >/dev/null 2>&1; then
      log "Existing frontend and API are now healthy. Reusing them."
      exit 0
    fi
    sleep 1
  done
  fail "Port 8081 or 3000 is occupied but the existing process did not become healthy. Inspect the owning process before retrying."
fi

if [[ -f .grok-dev.pid ]] && kill -0 "$(cat .grok-dev.pid)" 2>/dev/null; then
  log "Existing Grok development process is already running with PID $(cat .grok-dev.pid)."
  exit 0
fi

log "Starting Expo Metro/Web and the API in the background."
nohup pnpm dev > .grok-dev.log 2>&1 < /dev/null &
echo $! > .grok-dev.pid

for _ in $(seq 1 45); do
  if curl --max-time 2 -fsS http://127.0.0.1:3000/api/health >/dev/null 2>&1 && curl --max-time 2 -fsS http://127.0.0.1:8081/manus-routes.json >/dev/null 2>&1; then
    log "Frontend healthy at http://127.0.0.1:8081 and API healthy at http://127.0.0.1:3000."
    log "Logs: $ROOT_DIR/.grok-dev.log"
    exit 0
  fi
  sleep 1
done

log "The background process started, but readiness did not complete within 45 seconds."
log "Inspect .grok-dev.log before retrying."
exit 1
