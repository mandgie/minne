#!/usr/bin/env bash
# Development loop: run the brain uncompiled, then the debug app (bare
# executable, no bundle). Ctrl-C quits the app.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> Brain (uncompiled, bun run)"
(cd "$ROOT/brain" && bun install --frozen-lockfile && bun run src/main.ts)

echo "==> App (swift build, debug)"
(cd "$ROOT/app" && swift build)
APP_BIN="$(cd "$ROOT/app" && swift build --show-bin-path)/Minne"

echo "==> Launching $APP_BIN (Ctrl-C to quit)"
exec "$APP_BIN"
