# Minne — agent guide

macOS menu-bar AI memory app. Native Swift shell (`app/`) + Bun/TypeScript sidecar
brain (`brain/`) speaking JSON-lines over stdio. Memory is a Karpathy-style markdown
wiki under `~/Minne/`. Full spec: `tasks/prd-minne.md`.

## Before you start
1. Read `tasks/GOTCHAS.md` — accumulated build knowledge. Append what you learn.
2. Read your assigned story (US-xxx) in `tasks/prd-minne.md`; its acceptance criteria are the definition of done.

## Commands
- App: `cd app && swift build` (SwiftPM; no Xcode project)
- Brain: `cd brain && bun install && bun run typecheck && bun test`
- Full bundle: `scripts/build.sh` · Dev: `scripts/dev.sh`

## Rules
- Repo must be green after every story (both builds + tests).
- Brain stdout = protocol only; logs to stderr.
- Swift owns AX/TCC/UI/hotkeys; TS owns LLM calls and wiki writes. The stdio protocol is the only bridge.
- Never copy code from Nadreau/goldfish.
- One commit per story: `US-xxx: <summary>`, no push (orchestrator pushes).
