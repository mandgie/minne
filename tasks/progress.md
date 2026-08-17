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
- [~] US-011 Agent memory tools
- [ ] US-012 Ingestion job (/sync)

## Phase 4 — Chat UI and settings
- [ ] US-013 Chat window
- [ ] US-014 Onboarding — provider sign-in
- [ ] US-015 Settings window
- [ ] US-016 Release build pipeline

## Phase 5 — The Minne key (post-v1)
- [ ] US-017 Global hotkey and caret overlay
- [ ] US-018 Draft generation and insertion

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
