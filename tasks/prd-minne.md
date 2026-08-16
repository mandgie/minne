# PRD: Minne — open-source local AI memory

## 1. Introduction / Overview

Minne ("memory" in Swedish) is an open-source macOS menu-bar companion, modeled on Goldfish.sh, that watches what you work on and turns it into a local, human-readable memory — then lets an AI that already knows your context chat with you and (later) write for you anywhere you type.

Three principles distinguish it from Goldfish:

1. **Your own AI subscription is the engine.** No vendor backend. The LLM runs through [pi](https://github.com/badlogic/pi-mono) (`@earendil-works/pi-ai` + `pi-agent-core`), authenticated with the user's own Claude Pro/Max OAuth, ChatGPT Plus/Pro (Codex) OAuth, or a local model (Ollama / any OpenAI-compatible endpoint).
2. **Memory is a Karpathy-style LLM wiki.** Plain interlinked markdown maintained by the agent — `sources/` (immutable raw captures) → `wiki/` (agent-maintained pages for people, projects, topics) governed by a `SCHEMA.md`. No embeddings, no vector DB. Retrieval = index + links + full-text search. Obsidian-compatible.
3. **Nothing leaves the machine except the user's own LLM calls.** No accounts, no telemetry, no cloud storage. MIT-licensed, freely distributed.

**Architecture:** Native Swift menu-bar app (capture via Accessibility APIs, UI, permissions) + a bundled Bun-compiled TypeScript sidecar ("the brain") running pi. They speak JSON-lines over stdio.

```
┌────────────────────────── Minne.app (Swift) ──────────────────────────┐
│  Menu bar UI · Chat window · Settings · Onboarding                    │
│  Capture engine (AX APIs) → masking → snapshot writer                 │
│  Sidecar supervisor ── JSON-lines over stdio ──┐                      │
└────────────────────────────────────────────────┼──────────────────────┘
                                                 ▼
┌──────────────────── minne-brain (TS, Bun binary) ─────────────────────┐
│  pi-agent-core loop · pi-ai providers (Anthropic OAuth, Codex OAuth,  │
│  Ollama) · memory tools (read/search/update wiki) · ingestion jobs    │
└───────────────┬───────────────────────────────────────────────────────┘
                ▼
   ~/Minne/  sources/  wiki/  SCHEMA.md  index.md  log.md  minne.db (FTS)
```

## 2. Goals

- A user with a Claude or ChatGPT subscription can install Minne, sign in via OAuth in-app, and have a working local memory with zero API-key setup.
- Foreground-window text is captured continuously via Accessibility APIs (text only — never screenshots), masked for sensitive data, and stored locally.
- The agent maintains a browsable markdown wiki that compounds over time and answers questions like "what was I working on yesterday?" or "who did I email about the Oslo trip?"
- All memory is plain markdown the user can open in Obsidian, grep, edit, or delete.
- v1 (Phases 0–4) is a usable, demoable app: capture → wiki → chat. Phase 5 adds the in-place drafting hotkey.

## 3. User Stories

Stories are ordered for an autonomous build loop: each is completable in one focused session, and each leaves the repo green (`swift build` + sidecar typecheck/tests pass).

---

### Phase 0 — Scaffolding

### US-001: Repo scaffolding and build pipeline
**Description:** As a developer, I need a monorepo where the Swift app and TS sidecar build together, so every later story has a green baseline.

**Acceptance Criteria:**
- [ ] `app/` — SwiftPM-based macOS app target `Minne` (menu-bar app, `LSUIElement` true), builds with `swift build`
- [ ] `brain/` — Bun + TypeScript workspace with strict tsconfig, `bun test` and `bun run typecheck` pass
- [ ] `scripts/build.sh` compiles `brain/` with `bun build --compile` into a single binary and copies it into the app bundle's Resources
- [ ] `scripts/dev.sh` runs app + sidecar uncompiled for iteration
- [ ] README with architecture diagram and build instructions; MIT LICENSE
- [ ] `.gitignore` covers Xcode, SwiftPM, node_modules, build artifacts

### US-002: Stdio JSON-lines protocol
**Description:** As a developer, I need a typed protocol between app and brain so the two halves can evolve independently.

**Acceptance Criteria:**
- [ ] `brain/src/protocol.ts` defines all messages as discriminated unions: requests (`hello`, `chat`, `abort`, `login`, `logout`, `ingest`, `status`), streamed events (`text_delta`, `tool_call`, `auth_url`, `auth_prompt`, `progress`, `done`, `error`), each with a correlation `id`
- [ ] Brain reads JSON-lines from stdin, writes to stdout; logs go to stderr only (stdout is protocol-clean)
- [ ] Swift `BrainClient` actor: spawns sidecar `Process`, handshakes `hello` (protocol version check), decodes events with `Codable`, auto-restarts sidecar on crash with backoff
- [ ] Round-trip integration test: Swift (or a test harness) sends `hello` + `status`, gets valid responses
- [ ] Typecheck and tests pass on both sides

---

### Phase 1 — The brain (pi integration)

### US-003: pi providers and OAuth login flow
**Description:** As a user, I want to sign in with my existing Claude or ChatGPT subscription (or point at a local model) so Minne needs no API keys.

**Acceptance Criteria:**
- [ ] Brain registers pi providers: `anthropic` (Claude Pro/Max OAuth), `openai-codex` (ChatGPT OAuth), `ollama`/OpenAI-compatible via base URL; API-key auth also works as fallback for anthropic/openai
- [ ] pi `CredentialStore` persists to `~/Library/Application Support/Minne/auth.json` (0600 permissions); token refresh is automatic
- [ ] `login` request drives pi's OAuth flow over the protocol: `auth_url` events (app opens browser), `auth_prompt` for manual code entry; `logout` clears credentials
- [ ] `status` reports per-provider auth state and selected model
- [ ] Manual verification documented in the story log: full OAuth login against at least one real provider

### US-004: Streaming chat through the agent loop
**Description:** As a user, I want to chat with the model and see tokens stream so the app feels alive before memory exists.

**Acceptance Criteria:**
- [ ] `chat` request runs a `pi-agent-core` `Agent` with a Minne system prompt; assistant `text_delta`s stream back over the protocol with correlation ids
- [ ] `abort` cancels in-flight generation
- [ ] Session context persists across a conversation (in-memory) and is cleared with a `new_chat` flag
- [ ] Errors (no auth, network, rate limit) surface as typed `error` events, not crashes
- [ ] Tests cover protocol behavior with a mocked stream function (no live LLM calls in CI)

---

### Phase 2 — Capture (Swift)

### US-005: Menu-bar app and sidecar supervision
**Description:** As a user, I want Minne living in my menu bar, always running, managing its brain process invisibly.

**Acceptance Criteria:**
- [ ] Status item with menu: Open Chat, Pause Capture, Settings, Quit
- [ ] App spawns the bundled brain binary at launch, restarts it on crash (with backoff), shuts it down cleanly on quit
- [ ] Brain connection state (connected / restarting / failed) is visible in the menu
- [ ] Launch-at-login toggle (SMAppService)
- [ ] Verify visually via peekaboo screenshot of the open menu

### US-006: Accessibility permission onboarding
**Description:** As a user, I want a clear first-run flow that explains why Minne needs the Accessibility permission and gets me set up.

**Acceptance Criteria:**
- [ ] First-run window explains what is captured (foreground text, locally) and what never happens (screenshots, cloud storage)
- [ ] "Grant permission" deep-links to System Settings → Privacy & Security → Accessibility; app detects grant live (`AXIsProcessTrusted` polling) and advances automatically
- [ ] App functions in a degraded no-capture mode when permission is missing, with a persistent menu-bar hint
- [ ] Verify visually via peekaboo screenshots of each onboarding step

### US-007: Foreground text capture engine
**Description:** As a user, I want Minne to notice what I'm reading and writing so memory builds itself.

**Acceptance Criteria:**
- [ ] `NSWorkspace` observer tracks frontmost app; AX observer tracks focused window and title changes
- [ ] On app/window switch and on a debounced timer (≥15s in same window), engine walks the focused window's `AXUIElement` tree and extracts visible text (value, title, selected text of text elements), capped per snapshot (e.g. 50KB)
- [ ] Snapshots carry metadata: timestamp, app bundle id, app name, window title, URL when the AX tree exposes one (browsers)
- [ ] Consecutive near-duplicate snapshots (same window, >90% similar text) are dropped
- [ ] CPU stays negligible (<1% average) — no polling of full trees more than once per debounce interval
- [ ] Unit tests for the dedup and debounce logic

### US-008: Masking, blacklist, and pause
**Description:** As a user, I want sensitive data kept out of memory and full control over when and where Minne watches.

**Acceptance Criteria:**
- [ ] Regex masking before anything is persisted: credit-card numbers (Luhn-checked), CVV patterns, IBAN, SSN, Swedish personnummer → replaced with `▮▮▮` tokens
- [ ] Text from password/secure fields (AX secure text) is never captured
- [ ] Blacklist by app bundle id and by domain (for browser windows); blacklisted sources produce no snapshot at all
- [ ] Pause capture: from the menu — 15 min / 1 hour / until resumed; state visible in menu bar icon
- [ ] Private/incognito browser windows are skipped when detectable from window title
- [ ] Unit tests for each masking pattern and blacklist matching

### US-009: Raw source store and full-text index
**Description:** As a developer, I need captures persisted as Karpathy-style immutable sources with fast search, so the wiki layer has ground truth.

**Acceptance Criteria:**
- [ ] Memory root `~/Minne/` created on first run with `sources/`, `wiki/`, `SCHEMA.md`, `index.md`, `log.md` seeded from templates
- [ ] Each snapshot appends to a per-app-per-hour source file `sources/YYYY-MM-DD/HHmm-<app-slug>.md` with YAML frontmatter (timestamps, app, window titles, url) — written once, never edited
- [ ] SQLite database `~/Library/Application Support/Minne/minne.db` with an FTS5 table indexing every snapshot (text, app, title, timestamp)
- [ ] Brain exposes `search_sources` over the protocol (query → ranked snippets with source refs) — Swift writes the DB, brain reads it
- [ ] Retention setting: raw sources older than N days (default 90) are pruned; wiki is never auto-pruned
- [ ] Tests: source file format, FTS round-trip

---

### Phase 3 — Wiki memory (the second brain)

### US-010: Wiki schema and conventions
**Description:** As a developer, I need the SCHEMA.md contract that turns the agent into a disciplined wiki maintainer (Karpathy's pattern).

**Acceptance Criteria:**
- [ ] `SCHEMA.md` template defines: the three layers (sources immutable, wiki agent-owned, schema human-owned); page types (person, project, topic, daily log) with required frontmatter (`title`, `type`, `summary`, `sources`, `last_updated`); `[[wikilink]]` conventions; every page reachable from `index.md`; citation format pointing at source files; `log.md` entry format
- [ ] Templates for each page type in `brain/templates/`
- [ ] Bootstrap: on first run, wiki contains `index.md` and an empty `log.md` conforming to schema
- [ ] A `wiki-lint` pure function validates a wiki tree against the schema (frontmatter present, links resolve, orphan detection) with unit tests

### US-011: Agent memory tools
**Description:** As a developer, I need the agent to read and write memory through typed tools, so chat and ingestion share one interface.

**Acceptance Criteria:**
- [ ] pi tools implemented in the brain: `search_memory` (FTS over sources + wiki), `read_page` (wiki page or source by path), `list_index`, `write_page` (create/update wiki page — validates against schema, refuses writes outside `wiki/`), `append_log`
- [ ] Path traversal is impossible: tools resolve only inside `~/Minne/`, reject `..` and symlinks out
- [ ] `write_page` updates `last_updated` and keeps `index.md` consistent (new pages get an index entry)
- [ ] Unit tests for every tool, including traversal attempts

### US-012: Ingestion job (`/sync`)
**Description:** As a user, I want Minne to periodically digest what it captured into wiki pages, so memory compounds without my involvement.

**Acceptance Criteria:**
- [ ] Brain runs a sync pass on a schedule (default: every 30 min when new sources exist, and on demand via `ingest` request): agent reads unprocessed snapshots, identifies people/projects/topics, creates or updates the affected wiki pages with citations, appends a `log.md` entry
- [ ] A watermark (last-ingested snapshot id) makes sync incremental and idempotent — re-running ingests nothing new
- [ ] Sync uses the same OAuth'd model as chat; cost-conscious: batches snapshots, skips when idle
- [ ] Sync status (last run, pages touched) is queryable via `status` and shown in Settings
- [ ] A `lint` pass (weekly + on demand) runs wiki-lint and has the agent fix orphans and stale summaries
- [ ] Integration test with mocked LLM verifying watermark and idempotency

---

### Phase 4 — Chat UI and settings

### US-013: Chat window
**Description:** As a user, I want to ask my memory questions ("what did I do yesterday?") in a native chat window with streaming answers.

**Acceptance Criteria:**
- [ ] SwiftUI chat window (opens from menu bar and via global shortcut ⌥Space): message list, input field, streaming rendering of `text_delta`s, markdown rendering of finished messages
- [ ] Chat agent has the memory tools enabled; tool activity is shown subtly ("searching memory…")
- [ ] New-chat button; Escape closes; window remembers size/position
- [ ] Errors render inline with a retry affordance
- [ ] Verify visually via peekaboo screenshots (empty state, streaming, tool use)

### US-014: Onboarding — provider sign-in
**Description:** As a user, I want to pick my AI provider and sign in with OAuth as part of first-run, right after granting permissions.

**Acceptance Criteria:**
- [ ] Onboarding step lists: Claude (Pro/Max), ChatGPT (Plus/Pro), Local (Ollama base URL), API key (fallback)
- [ ] OAuth flows driven end-to-end from the UI via `login` (browser opens, manual-code fallback rendered natively); success advances onboarding
- [ ] Model picker defaults sensibly per provider (e.g. Sonnet-class for chat/sync)
- [ ] Auth state changes reflect live in Settings; sign-out works
- [ ] Verify visually via peekaboo screenshots of each state

### US-015: Settings window
**Description:** As a user, I want one place to control privacy, memory, and the model.

**Acceptance Criteria:**
- [ ] Sections: **Account** (provider, model, sign in/out) · **Privacy** (permission status, blacklist editor for apps/domains, pause, retention days, "Delete all memory" with typed confirmation that wipes `~/Minne/` + DB + credentials) · **Memory** ("Open wiki folder" in Finder/Obsidian, last sync status, sync-now button) · **General** (launch at login, shortcuts)
- [ ] All settings persist (`UserDefaults` / config file) and take effect without restart
- [ ] "Delete all memory" verified by test of the wipe routine
- [ ] Verify visually via peekaboo screenshots of each section

### US-016: Release build pipeline
**Description:** As a maintainer, I want a reproducible signed build so users can download a dmg from GitHub Releases.

**Acceptance Criteria:**
- [ ] `scripts/release.sh` produces a signed, notarized `Minne.app` in a dmg (signing identity/notary profile via env vars; unsigned build documented for contributors)
- [ ] GitHub Actions workflow: build + typecheck + tests on push; release workflow on tag
- [ ] `swift build` and brain tests green in CI

---

### Phase 5 — The Minne key (post-v1, in-place drafting)

### US-017: Global hotkey and caret overlay
**Description:** As a user, I want to press right-Option in any text field and see Minne wake up at my caret.

**Acceptance Criteria:**
- [ ] `CGEventTap` captures right-Option without swallowing normal Option usage (tap-vs-hold discrimination); configurable in Settings
- [ ] Focused text element + caret bounds located via AX; borderless overlay `NSPanel` appears anchored at the caret; Escape dismisses
- [ ] Works in at least: Mail, Slack, Notes, Safari/Chrome text areas, VS Code (document known-broken apps)
- [ ] Verify visually via peekaboo recording

### US-018: Draft generation and insertion
**Description:** As a user, I want Minne to write the reply for me — from my instruction, my selection, or pure context — in my tone.

**Acceptance Criteria:**
- [ ] Three modes: instruction in field → replaced with result; selection → rewritten in place; empty field → reply inferred from surrounding window text (read via AX at press time) + wiki memory
- [ ] The target field is never touched until the result is fully ready; insertion via AX value replacement with pasteboard-swap fallback (clipboard restored)
- [ ] A `style/` wiki page per frequent context (app + recipient) accumulates tone observations during sync; drafts cite it in the prompt
- [ ] Undo restores the field's prior contents

## 4. Functional Requirements

- FR-1: All memory artifacts are plain markdown under a single user-visible root (`~/Minne/`), Obsidian-compatible; the app must remain functional if the user hand-edits the wiki.
- FR-2: Raw captures are immutable once written; only the wiki layer is agent-editable; the schema file is human-owned.
- FR-3: The only network traffic the app produces is LLM API calls to the user's chosen provider, plus OAuth flows. No telemetry, no update pings in v1, no accounts.
- FR-4: Capture is text-only via Accessibility APIs. The app must never take screenshots or record the screen.
- FR-5: Masking runs before persistence — unmasked sensitive text must never touch disk.
- FR-6: The Swift app owns capture and UI; the TS sidecar owns all LLM interaction and wiki writes; the stdio protocol is the only channel between them.
- FR-7: The sidecar binary is bundled inside the .app; users never install Bun/Node.
- FR-8: Every phase leaves `swift build`, `bun run typecheck`, and both test suites green.
- FR-9: The brain must run with any of the three provider classes (Anthropic OAuth, Codex OAuth, OpenAI-compatible local) with no code changes — provider is configuration.

## 5. Non-Goals (Out of Scope)

- No Windows or Linux in v1 (the brain and wiki format are portable by design; the shell is not).
- No embeddings or vector database.
- No MCP server (possible later add-on; the wiki is plain files anyway).
- No cloud sync, accounts, backend, or telemetry — ever, as a product principle.
- No voice dictation, morning briefs, reminders, or desktop pet in v1 (candidate Phase 6 features).
- No screenshot/OCR capture path.
- No App Store distribution (direct dmg only; sandboxing is incompatible with AX capture).

## 6. Technical Considerations

- **pi packages** are `@earendil-works/*` (recently moved from `@mariozechner/*`); pin exact versions. pi's `pi-server`/`pi-protocol` CBOR protocol is experimental — we use our own thin JSON-lines protocol instead until theirs stabilizes.
- **OAuth-via-subscription** is tolerated-but-gray under provider ToS; users authenticate their own accounts. README must state this plainly. API-key and local-model paths are the always-safe fallbacks.
- **Prior art:** Nadreau/goldfish (Apache-2.0, OCR-based) references U.S. provisional patent 63/950,192. We implement independently from Goldfish's public behavior and Karpathy's published wiki pattern; do not copy code from that repo.
- **AX capture quality varies by app** (Electron apps are inconsistent). Ship a per-app extraction quirks table rather than chasing perfection.
- **Costs:** sync passes consume the user's subscription quota. Batch aggressively; default model per provider should be the cheap/fast tier for sync and better tier for chat.
- **Swift/TS boundary rule of thumb:** anything touching AX, TCC, windows, or hotkeys is Swift; anything touching LLMs or writing to `wiki/` is TS.

## 7. Success Metrics

- Fresh-machine install → OAuth sign-in → first captured snapshot in under 5 minutes, no terminal.
- After one workday of use, chat answers "what was I working on today?" correctly with citations to real sources.
- Wiki grows automatically: ≥1 person/project/topic page per active workday, with resolving links and no lint errors.
- Memory root is fully legible in Obsidian with zero Minne-specific tooling.
- Idle CPU < 1%, memory footprint of the app+brain < 150MB.

## 8. Open Questions

- Right-Option as default hotkey: does tap-vs-hold discrimination feel reliable, or should default be a chord (⌥Space is taken by chat)?
- Should sync use a cheaper model than chat by default (e.g. Haiku-class), and should that be a visible setting or automatic?
- Browser URL capture: AX exposes URLs inconsistently — is window-title parsing acceptable for the blacklist in v1?
- Wiki language: mirror the user's dominant captured language, or default English pages with quoted originals?
