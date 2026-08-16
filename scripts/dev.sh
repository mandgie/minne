#!/usr/bin/env bash
# Development loop: build both halves, then run the debug app (bare
# executable, no bundle). The app spawns the brain uncompiled via
# `bun run` (MINNE_BRAIN_PATH). Ctrl-C quits the app.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> Brain deps + typecheck"
(cd "$ROOT/brain" && bun install --frozen-lockfile && bun run typecheck)

echo "==> App (swift build, debug)"
(cd "$ROOT/app" && swift build)
APP_BIN="$(cd "$ROOT/app" && swift build --show-bin-path)/Minne"

echo "==> Launching $APP_BIN (brain via bun run; Ctrl-C to quit)"
MINNE_BRAIN_PATH="$ROOT/brain/src/main.ts" exec "$APP_BIN"
