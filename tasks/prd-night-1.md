# PRD: Night Batch 1 — grounding visibility, key hardening, memory transparency

## Introduction

A batch of improvements distilled from competitor-user research (2026-08-18): what
Goldfish's users ask for and don't get, what the post-Limitless market punishes,
and what Minne's own architecture makes uniquely easy. Two themes: make the Minne
key trustworthy enough that pressing it is a zero-downside act, and make the
memory visible, editable, and creditable — the #1 unmet request in this category.

Full research context: the maker of Goldfish (goldfish.sh) confirmed undo
friction and context-opacity as their open problems; Recall/Rewind users' top
dealbreakers are cloud egress, storage bloat, and opaque memory; Superhuman's
per-recipient voice is the drafting bar.

## Goals

- Every draft shows what grounded it (wiki pages, style page) in the overlay.
- Pressing the Minne key is provably zero-downside: one ⌘Z restores everything, always.
- The right-Option trigger is safe on international keyboard layouts.
- A press in a freshly-woken Chromium app succeeds on the first tap, not the second.
- The memory prefetch fires in Mail and browser mail/chat clients, not just Slack/Messages.
- The memory is inspectable from the menu bar and readable by outside agents (MCP).
- Draft quality is measurable by a fixture suite, not vibes.

## Ground rules for implementing agents (binding for every story)

- Repo must be green after every story: `cd app && swift build && swift test`
  AND `cd brain && bun run typecheck && bun test`.
- One commit per story: `US-1xx: <summary>`. No push. No version bump, no
  release, no notarization.
- NEVER: launch or kill a Minne instance, touch `/Applications/Minne.app` or
  `~/Minne`, drive the desktop (no peekaboo/osascript/synthetic events), or
  add a dependency (exception: US-110 may add the official MCP SDK to brain).
- Read `tasks/GOTCHAS.md` before starting; append what you learn after.
- Verification is builds + unit tests only. A story that cannot go green gets
  reverted and parked with a note under Open Questions, not forced.
- Brain stdout is protocol only; logs to stderr. Swift owns AX/UI; TS owns LLM
  and wiki writes.

## User Stories

### US-101: Overlay shows what grounded the draft
**Description:** As a user, I want the overlay to say which memory pages and
style page shaped the draft, so I can trust (and debug) what Minne knows.

**Acceptance Criteria:**
- [ ] Swift decodes `memoryPages: [String]` and `stylePage: String?` from the draft done event (both already sent by the brain; absent/unknown fields must not break decoding of older events).
- [ ] While a draft is showing, the overlay renders a single muted line, e.g. `from memory: ingrid-berg, oslo-trip · style: slack` — page slugs only (no `wiki/` prefix, no `.md`), omitted entirely when both are empty.
- [ ] The line never wraps; overflow is truncated with `…`.
- [ ] Unit tests cover the formatting (slug extraction, empty, one, many, truncation).
- [ ] Both builds + all tests green.

### US-102: Zero-downside undo, proven
**Description:** As a user, I want one ⌘Z to always restore the field exactly as
it was before the insertion, so pressing the key never needs a cost-benefit
thought.

**Acceptance Criteria:**
- [ ] Audit both insertion paths (AX write, paste) against the undo rules in GOTCHAS (post-v1 entries); document the guarantee as a comment block in `FieldWriter.swift` (or wherever insertion lives).
- [ ] Unit tests assert: after an AX-write insertion, Minne's own undo restores the exact prior text and selection; after a paste insertion, ⌘Z is NOT consumed by Minne (it belongs to the app).
- [ ] The overlay's Undo affordance uses the correct path for the insertion that actually happened (test with a scripted fake writer).
- [ ] No code path ever writes placeholder/progress text into the user's field (assert by grepping insertion call sites; document in GOTCHAS).
- [ ] Both builds + all tests green.

### US-103: Right-Option is safe on international layouts
**Description:** As a user on a Swedish/EU keyboard, I use right-Option (AltGr)
to type @, ~, €, etc.; Minne must never fire on those chords, and I want a
setting to disable or re-map the trigger if my muscle memory conflicts.

**Acceptance Criteria:**
- [ ] Unit tests on `MinneKeyDiscriminator`/`MinneKeyTap.rightOptionInput` simulating AltGr chords: right-Option down → letter keyDown → right-Option up must NOT count as a tap (keyDown feeds `.otherInput`); test @ (⌥2-style), ~ (⌥¨-style), and rapid repeated chords.
- [ ] A `minneKeyTrigger` setting exists with values `rightOption` (default) and `off`; `off` tears down the tap exactly like `minneKeyEnabled` false. (Re-mapping to other keys is groundwork only: the enum and plumbing, no new key implementations.)
- [ ] Settings UI exposes the toggle with copy that mentions international layouts.
- [ ] Both builds + all tests green.

### US-104: First press works after a Chromium wake
**Description:** As a user pressing the key in a freshly-launched Chromium app,
I want the first press to produce a draft, not to silently arm the second one.

**Acceptance Criteria:**
- [ ] In `AccessibilityCaretLocator` (or the controller), when the focused element is nil AND this press just set `AXManualAccessibility` (the wake path added 2026-08-18), schedule exactly one retry of the caret locate ~500 ms later on the main queue.
- [ ] The retry is abandoned if, before it fires, the user typed, clicked, or pressed the key again (no stale overlay popping up over new activity).
- [ ] On retry success the normal draft flow proceeds; on failure the existing "no text field is focused" log line fires once.
- [ ] Retry/abandon decision logic is extracted pure and unit-tested (the AX call itself stays in glue).
- [ ] Both builds + all tests green.

### US-105: Recipient hints for Mail, Gmail, and LinkedIn
**Description:** As a user replying in Mail or webmail, I want the memory
prefetch to know who I'm writing to, so drafts are grounded in that person's
wiki page.

**Acceptance Criteria:**
- [ ] `RecipientHint` learns: Apple Mail (parse recipient from compose/reply window title where present), Gmail in a browser (window title patterns for compose/reply), LinkedIn messaging (window title carries the counterpart's name).
- [ ] Each new pattern has unit tests with real-shaped window titles, including negative cases (inbox list views must NOT yield a recipient).
- [ ] A wrong-recipient guess is worse than none: patterns must be precise; when ambiguous, return nil (tested).
- [ ] Both builds + all tests green.

### US-106: Source hygiene — no raw control bytes
**Description:** As a maintainer whose codebase is navigated by agents, I need
every source file to be plain text, because raw control bytes make grep/ripgrep
silently return nothing (verified live on `memory.ts`, 2026-08-18).

**Acceptance Criteria:**
- [ ] The two literal NUL bytes in `brain/src/memory.ts` line ~646 are replaced with `\u0000` escapes; `bun test` proves behavior unchanged.
- [ ] A hygiene test (in brain's test suite) walks `app/Sources`, `brain/src`, `tasks`, `scripts` and fails on any raw byte < 0x20 other than \n, \t, \r in a source file.
- [ ] `file brain/src/memory.ts` reports text, and plain `grep` finds symbols in it again.
- [ ] GOTCHAS gains an entry describing the silent-grep failure mode.
- [ ] Both builds + all tests green.

### US-107: Draft prompt evals
**Description:** As a developer changing prompts, I want a fixture suite that
asserts measurable properties of built prompts and cleaned outputs, so prompt
regressions are caught by tests instead of user reports.

**Acceptance Criteria:**
- [ ] A fixtures file defines ≥8 realistic DraftContexts (Slack reply w/ recipient+memory, Mail compose, rewrite with selection, instruction, infer with empty wiki, regenerate, guided rework, oversized window).
- [ ] For each fixture, assertions on `buildDraftPrompt` output: required blocks present/absent, ordering (mode instruction first, style last), byte-size ceiling respected, grounding cited by path.
- [ ] `cleanDraft` property tests: fence-stripping, quote-stripping, and idempotence (`cleanDraft(cleanDraft(x)) === cleanDraft(x)`).
- [ ] Both builds + all tests green.

### US-108: Memory transparency from the menu bar
**Description:** As a user, I want to see and open what Minne remembers, so the
memory feels like mine — the #1 request Goldfish users made and didn't get.

**Acceptance Criteria:**
- [ ] Status-bar menu gains "Open Memory Folder" (opens `~/Minne` in Finder via NSWorkspace — allowed: it opens a folder, it does not modify it).
- [ ] Status-bar menu gains a "Recently remembered" submenu listing the last ≤8 wiki pages by `last_updated` (title + relative time); selecting one opens that file. Sourced via a new brain request (`memory_recent`) — protocol addition with tests on both sides.
- [ ] Empty memory shows a disabled "Nothing yet" item.
- [ ] Both builds + all tests green.

### US-109: Per-recipient voice, learned from what you actually send
**Description:** As a user, I want drafts to a person to sound the way I
actually write to that person, so recipients can't tell a draft from my typing.

**Acceptance Criteria:**
- [ ] The brain's capture/ingest path, when it observes a sent message surface (Slack/Messages/Mail patterns) with a known recipient, appends/updates a "register" section on that recipient's style page (`style/<app>/<recipient>`): greeting habit, sign-off, typical length, emoji usage, language. Deterministic extraction where possible; LLM only in the existing ingest passes.
- [ ] `findStylePage` continues to prefer recipient page over app page (already true — keep tests green) and the register section rides into the draft prompt within the existing style-page char budget.
- [ ] The extraction is pure and unit-tested against ≥5 fixture transcripts (formal vs casual vs emoji-heavy vs Swedish vs terse).
- [ ] No new capture surface is added; this only distills from what capture already sees.
- [ ] Both builds + all tests green.

### US-110: Read-only MCP server over the wiki
**Description:** As a user of Claude Desktop (or any MCP client), I want my
Minne memory available as context, so the wiki becomes infrastructure — the
wedge both Goldfish and Screenpipe users validated.

**Acceptance Criteria:**
- [ ] `minne-brain --mcp` starts a stdio MCP server exposing exactly the three read-only tools (`search_memory`, `read_page`, `list_index`) over the same `Memory` — write tools are NOT exposed.
- [ ] The official `@modelcontextprotocol/sdk` may be added to brain (the one permitted dependency).
- [ ] Containment holds: no read escapes the memory root (reuse `memory-path.ts`; test a traversal attempt through the MCP layer).
- [ ] `docs/mcp.md` documents the Claude Desktop config snippet.
- [ ] Protocol mode and MCP mode are mutually exclusive and cleanly selected by argv; normal app operation is untouched (regression: main.test.ts still green).
- [ ] Both builds + all tests green.

### US-111: The egress story, stated where users look
**Description:** As a privacy-conscious user burned by Rewind/Recall, I want to
see exactly what leaves my machine and to whom, so I can trust Minne with my
screen.

**Acceptance Criteria:**
- [ ] Settings UI shows a plain-language egress statement: memory stays in `~/Minne`; the only network calls are LLM requests to the provider YOU configured, with your key; no Minne servers.
- [ ] README gains a "What leaves your Mac" section saying the same, listing per-feature egress (draft press, chat, ingest) and how to point Minne at a different provider.
- [ ] Site copy (`site/index.html`) gains the same section — committed only, NOT deployed.
- [ ] Every claim is verified against the code before writing (grep brain for network calls; list what exists). If a claim would be false, the story parks and reports instead of shipping copy.
- [ ] Both builds + all tests green.

## Functional Requirements

- FR-1: Draft done events carry `memoryPages` and `stylePage`; the overlay renders them (US-101).
- FR-2: Exactly one undo gesture reverses any insertion; Minne never owns an undo that belongs to the app (US-102).
- FR-3: A right-Option chord with any other key is never a tap (US-103).
- FR-4: `minneKeyTrigger` setting: `rightOption` | `off` (US-103).
- FR-5: One automatic retry after an accessibility wake; never more (US-104).
- FR-6: RecipientHint covers Slack, Messages, Mail, Gmail, LinkedIn; precision over recall (US-105).
- FR-7: Source tree contains no raw control bytes; enforced by test (US-106).
- FR-8: Prompt construction is covered by a fixture eval suite (US-107).
- FR-9: The menu bar can open the memory and list recent pages (US-108).
- FR-10: Style pages accumulate a per-recipient register from observed sent messages (US-109).
- FR-11: `minne-brain --mcp` serves read-only memory tools over stdio MCP (US-110).
- FR-12: Egress is documented truthfully in settings, README, and site (US-111).

## Non-Goals (Out of Scope)

- No release, notarization, or deploy — morning review gates all of that.
- No voice trigger/dictation, no mobile, no Windows, no follow-up nudges (future batches).
- No proactive/draft-before-you-ask behavior.
- No new capture surfaces (meeting audio is a future PRD).
- No re-mapping the Minne key to arbitrary keys (only the enum groundwork).

## Technical Considerations

- Execution order: US-106 first (unblocks agent navigation of memory.ts), then
  brain-side (US-107, US-109, US-110), Swift-side (US-101..105, US-108) can
  interleave; US-111 last (documents what then exists).
- Swift decodes brain events leniently (Codable ignores unknown keys) — protocol
  additions are backward-compatible, but both sides' tests must cover them.
- US-108's `memory_recent` request follows the existing request/response
  patterns in `protocol.ts` / `BrainProtocol.swift`.
- The installed 0.1.2 app keeps running untouched all night.

## Success Metrics

- All 11 stories green and committed, or parked with a written reason.
- `swift test` + `bun test` counts strictly increase; zero failures at dawn.
- A morning reviewer can trace every draft to its grounding from the overlay alone.

## Open Questions

(Parking area for implementing agents — append story, blocker, and what was tried.)

- US-107 (not a blocker, behavior finding): `cleanDraft` strips wrappings in a
  single pass, so a doubly-wrapped reply — quotes around a fence (`"``` … ```"`)
  or a fence around a fence — sheds only the outer layer and is not a fixed
  point (`cleanDraft(cleanDraft(x)) !== cleanDraft(x)` for those shapes). All
  realistic single wrappings, including quotes *inside* a fence, are idempotent
  and pinned by `brain/src/draft-evals.test.ts`. Left as-is per the story's
  no-behavior-change rule; if double-wrapped model output ever shows up in the
  wild, decide deliberately whether stripping should loop to a fixed point.
