# Minne build progress

Orchestrator-owned. One story in flight at a time; a story is checked only after the
orchestrator has verified it (build + tests green, acceptance criteria met, committed).

Legend: `[ ]` todo · `[~]` in flight · `[x]` verified & committed

## Phase 0 — Scaffolding
- [x] US-001 Repo scaffolding and build pipeline
- [x] US-002 Stdio JSON-lines protocol

## Phase 1 — Brain
- [x] US-003 pi providers and OAuth login flow  (code verified; PENDING one human browser sign-in: scripts/dev.sh → menu-bar icon → "Sign in to Claude…")
- [x] US-004 Streaming chat through the agent loop

## Phase 2 — Capture
- [x] US-005 Menu-bar app and sidecar supervision
- [x] US-006 Accessibility permission onboarding
- [x] US-007 Foreground text capture engine
- [x] US-008 Masking, blacklist, and pause
- [x] US-009 Raw source store and full-text index

## Phase 3 — Wiki memory
- [x] US-010 Wiki schema and conventions
- [x] US-011 Agent memory tools
- [x] US-012 Ingestion job (/sync)

## Phase 4 — Chat UI and settings
- [x] US-013 Chat window
- [x] US-014 Onboarding — provider sign-in
- [x] US-015 Settings window
- [x] US-016 Release build pipeline

## Phase 5 — The Minne key (post-v1)
- [x] US-017 Global hotkey and caret overlay
- [x] US-018 Draft generation and insertion

## Log
<!-- orchestrator appends one line per story: date · story · agent · verification result -->
- 2026-08-16 · US-001 · minne-us001 · verified green (swift build, typecheck, 1 test, build.sh bundle) · 3ff5499
- 2026-08-16 · US-002 · minne-us002 · verified green (13 bun tests, 2 swift tests, live restart-backoff check by agent) · bbe3f8b
- 2026-08-16 · US-003 · minne-us003 · verified green (30 bun tests incl. mocked OAuth, 7 swift tests, compiled-bundle OAuth URL emission) · eaf64b6 · human browser sign-in still pending
- 2026-08-16 · US-004 · minne-us004 · verified green (36 bun tests, 8 swift tests, compiled-binary mock chat smoke) · c75191c · Phase 1 complete
- 2026-08-17 · US-005 · minne-us005 (work recovered by orchestrator after loop loss) · verified green (36 bun tests, 19 swift tests, peekaboo screenshot of live menu: Brain connected v0.1.0, all items present) · 12fa220
- 2026-08-17 · US-006 · minne-us006 · verified green (36 bun tests, 34 swift tests, orchestrator re-ran suites + screenshot of onboarding window in simulated no-permission mode; agent verified deep link, live AXIsProcessTrusted auto-advance, degraded menu hint) · 2876cf3
- 2026-08-17 · US-007 · minne-us007 · verified green (36 bun tests, 75 swift tests re-run by orchestrator; agent live smoke: TextEdit/Chrome/Finder capture with URLs, dedup on revisit, 0.1% avg CPU) · a28ad73
- 2026-08-17 · US-008 · minne-us008 · verified green (36 bun tests, 128 swift tests re-run by orchestrator; agent live smoke: TextEdit redactions, blacklisted-domain + incognito Chrome skipped, menu pause/resume honored) · ae76a0a
- 2026-08-17 · US-009 · minne-us009 · verified green (49 bun tests, 159 swift tests re-run by orchestrator; agent headless e2e: locked-screen capture → source file + FTS row + search_sources round-trip via compiled brain) · aeca188 · Phase 2 complete
- 2026-08-17 · US-010 · minne-us010 · verified green (131 bun tests, 164 swift tests re-run by orchestrator; brain/templates single source of truth, drift-guard test in MemorySeedTests, wiki-lint with error/warning report) · 3ea2837
- 2026-08-17 · US-011 · minne-us011 · verified green (221 bun tests, 164 swift tests re-run by orchestrator; five memory tools wired into chat agent, traversal-proof paths, diff-based write validation, mock-provider tool round-trip) · 8b49cbf
- 2026-08-17 · US-012 · minne-us012 · verified green (239 bun tests, 165 swift tests re-run by orchestrator; watermark in brain-owned sync-state.json, idempotent re-run proven by mock call count, busy-guard, authless skip) · 1e6b3bf · Phase 3 complete
- 2026-08-17 · US-013 · minne-us013 · verified green (240 bun tests, 194 swift tests; orchestrator live check found Spaces ordering bug + fast-reply truncation, both fixed in follow-ups 0aadfc6/130259b with regression tests; live UI round-trip: empty state, streaming, reconciled final text) · d37476a+0aadfc6+130259b
- 2026-08-17 · US-014 · minne-us014 · verified green (242 bun tests, 233 swift tests re-run by orchestrator; AX-driven mock OAuth incl. stale-prompt race verified by agent; orchestrator screenshot of provider step: 4 cards + model picker + live auth row) · 29fe02e
- 2026-08-17 · US-015 · minne-us015 · verified green (242 bun tests, 261 swift tests re-run by orchestrator; agent live checks: blacklist edit hits running engine, retention prunes at once, typed wipe re-seeds + auth flips; orchestrator screenshots: Account + Privacy sections) · cb0ee18
- 2026-08-17 · US-016 · minne-us016 · verified green (242 bun tests, 261 swift tests; unsigned dmg e2e + orchestrator-found seal gap fixed by always ad-hoc signing, strict --deep verify passes on app and dmg contents; workflows actionlint-clean) · 41aaa2d+1abd56f · Phase 4 complete — v1 done
- 2026-08-17 · US-017 · minne-us017 · verified green (242 bun tests, 312 swift tests re-run by orchestrator; live matrix: TextEdit/Notes/Mail/Safari/Chrome/Slack at caret, VS Code documented AX-dark, secure fields refused, ⌥ passthrough proven in peekaboo recording) · 7cfdfa3
- 2026-08-17 · US-018 · minne-us018 · verified green (266 bun tests, 365 swift tests re-run by orchestrator; live: 3 modes in TextEdit/Safari/Brave, field untouched until insert, clipboard fully restored, undo exact; Chromium async-AX double-insert found+fixed) · 33ecec6 · Phase 5 complete — ALL 18 STORIES DONE
