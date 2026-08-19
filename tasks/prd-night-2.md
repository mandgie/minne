# PRD: Night Batch 2 — the overlay becomes an editor, and the editor teaches the memory

## Introduction

The overlay graduates from a tooltip to a tiny editor. Today the draft is
read-only (fixing one word means inserting first and editing in the live
field — the exact place Minne promises not to disturb), the guidance field is
one line that scrolls the user's words out of view, and the panel visibly
jumps between states. This batch makes the draft editable in place, the steer
field legible, the geometry calm — and then turns what users do in that
editor (steers, edits) into durable style knowledge, using the counter→distill
machinery US-109 established.

Design principles (binding):
- **The golden path must not slow down.** Tap → read → Return → inserted stays
  byte-identical in feel. Editing is opt-in, one gesture away, never demanded.
- **Micro vs macro:** direct editing is for small fixes (faster to do than to
  describe); guidance is for rework (faster to describe than to do). Both stay.
- **Learn rules, not blobs**, and every learned rule is user-visible on a
  style page the user can edit or delete.

## Ground rules for implementing agents (binding for every story)

- Repo green after every story: `cd app && swift build && swift test` AND
  `cd brain && bun run typecheck && bun test`. One commit per story:
  `US-2xx: <summary>`. No push, no release, no version bump.
- The user's own Minne (a dev build launched via dev.sh, running with a live
  event tap) is IN USE — never kill it, never launch anything that installs a
  second event tap, never post synthetic keyboard/mouse events, never touch
  `/Applications/Minne.app` or `~/Minne`.
- **Visual verification is REQUIRED for every UI story**, via the safe
  technique in GOTCHAS [polish]: launch the bare SwiftPM binary
  (`app/.build/arm64-apple-macosx/debug/Minne`) with
  `-simulateNoAccessibility YES -minneKeyEnabled NO -chatHotKeyEnabled NO
  -onboardingSeen YES -minneKeyPreview <state>` plus scratch
  `MINNE_APP_SUPPORT_DIR` and `MINNE_MEMORY_ROOT` dirs, wait for the panel,
  screenshot it (peekaboo has Screen Recording; `peekaboo image` works), kill
  the preview process by pid promptly. This installs NO tap and NO hotkeys and
  is safe alongside the user's instance. Save screenshots to
  `<scratchpad>/night2-shots/US-2xx-<state>.png` and report the paths — the
  orchestrator inspects them before accepting the story. LOOK at your own
  screenshot before reporting: if it looks wrong, fix before committing.
- Extend the `-minneKeyPreview` states when your story adds UI states, so they
  stay screenshotable forever.
- Read `tasks/GOTCHAS.md` before starting (especially [guide], [wispr],
  [polish], US-017); append what you learn. A story that cannot go green is
  reverted and parked under Open Questions.

## User Stories

### US-201: The guidance field wraps and grows
**Description:** As a user typing a longer steer, I want to see all of what
I'm writing — today the single-line field scrolls my words out of view.

**Acceptance Criteria:**
- [ ] The guidance field wraps; it grows with content up to 4 lines, then
  scrolls internally. The panel reflows downward without moving the anchor.
- [ ] Return still submits the steer (never inserts a newline); Shift-Return
  inserts a newline. Escape still cancels guiding. Tab behavior unchanged.
- [ ] The keyboard-borrow machinery (wantsKey, activation, AX exposure — see
  GOTCHAS [guide]/[wispr]) works identically; the "guidance field has the
  keyboard" log line still reports caret+active+AX.
- [ ] Screenshots: guiding state empty, with one line, with 4+ lines (extend
  `-minneKeyPreview` to seed long guidance text). Orchestrator-inspectable.
- [ ] Both builds + all tests green.

### US-202: The draft is editable in the overlay
**Description:** As a user, I want to fix a word in the draft before it ever
touches my field, so the revision loop happens where mistakes are free.

**Acceptance Criteria:**
- [ ] Clicking into the draft text (or ⌘E while the overlay shows a result)
  turns the draft into an editable text view, borrowing the keyboard exactly
  like guiding does (same wantsKey/activation/AX path — reuse, don't fork).
- [ ] Return while editing inserts the CURRENT text (as edited); Escape ends
  editing and returns to the read-only result (edits kept); a second Escape
  dismisses. The Insert button always inserts what is on screen.
- [ ] The golden path is untouched: with no edit gesture, Return inserts and
  the panel never takes the keyboard.
- [ ] A regenerate (⌘R) after an edit sends the EDITED text as previousDraft.
- [ ] A steer after an edit reworks the EDITED text.
- [ ] The controller state machine changes are pure and unit-tested (editing
  begins/ends, edited text flows to insert/rework/regenerate, ⌘Z inside the
  editor belongs to the editor, keys claimed per state stay correct).
- [ ] Screenshots: result state, editing state (caret visible, affordance
  clear), post-edit result. Extend `-minneKeyPreview` with `editing`.
- [ ] Both builds + all tests green.

### US-203: One calm geometry
**Description:** As a user, I want the panel to feel like a solid little
editor, not a tooltip that jumps — today it resizes on every state change.

**Acceptance Criteria:**
- [ ] The panel claims one width on presentation and keeps it through
  thinking → result → guiding → editing → inserted.
- [ ] Height changes only when content genuinely needs it, animated, with the
  anchor edge pinned (no jump of the panel's anchored corner).
- [ ] The draft area has a max height (~12 lines) and scrolls internally
  beyond it; buttons and status never move mid-state.
- [ ] Unit tests for the geometry decisions where they are pure (measurement/
  layout math extracted, not AppKit constants).
- [ ] Screenshots: the full state sequence at identical width — thinking,
  result short, result long (scrolling), guiding, editing, inserted.
- [ ] Both builds + all tests green.

### US-204: Recurring steers become style rules
**Description:** As a user who has typed "shorter" five times on x.com, I
want to never type it again — recurring guidance should become a standing
rule on that context's style page.

**Acceptance Criteria:**
- [ ] The brain records each submitted steer with its style context (domain
  when present, else app; recipient when present) in sync-state counters —
  the US-109 fold pattern: idempotent, restart-safe, never on the wiki page
  itself. Swift already sends guidance with each rework; if the terminal
  outcome (inserted vs abandoned) is needed, add a minimal `draft_outcome`
  notification request to the protocol (both sides + tests).
- [ ] Steers are normalized (case, whitespace, trailing punctuation) and
  counted; a steer reaching threshold (3 occurrences in one context) is
  distilled during the existing sync pass into a "## Standing guidance"
  section on that context's style page, written via Memory.writePage
  (lint-enforced), phrased as a rule ("Keep it short — asked 3 times").
- [ ] Rules ride into draft prompts through the existing style-page read; the
  section stays within the style read budget (tested).
- [ ] Pure extraction/normalization/threshold logic unit-tested with fixtures
  (repeat steer, near-duplicate steers, different contexts kept apart,
  one-off steers never distilled).
- [ ] Both builds + all tests green.

### US-205: In-editor edits feed the ledger
**Description:** As a user correcting drafts in the new editor, I want Minne
to learn from the corrections — the byte-exact diff nobody else can see.

**Acceptance Criteria:**
- [ ] When an edited draft is inserted, Swift sends the generated text and
  the edited text with the outcome (extend the US-204 `draft_outcome`
  request; skip when unedited). No new capture surface.
- [ ] The brain computes compact, deterministic edit observations (length
  delta, removed/added leading greeting or trailing sign-off, punctuation
  shifts like exclamation removal, language switch) — pure and fixture-tested
  (≥5 fixtures incl. a Swedish rewrite and a trim-only edit).
- [ ] Observations fold into the same sync-state counters and distill into the
  style page's register/standing-guidance sections past the same thresholds —
  reuse US-109/US-204 machinery, do not invent a third pipeline.
- [ ] A draft inserted unedited is also counted (as approval) — cheap and
  balances the signal. Abandons are counted, never interpreted.
- [ ] Both builds + all tests green.

## Non-Goals

- No picker/palette before generation; no new trigger gestures.
- No release, push, or deploy; no site changes.
- No LLM calls added to any hot path — distillation rides existing sync passes.
- No rich-text editing (plain text only in the overlay editor).

## Technical Considerations

- Order: US-201 → US-202 → US-203 (all deep in MinneKeyOverlay.swift, strictly
  sequential) → US-204 → US-205 (brain-heavy; 205 depends on 202's edited
  text and 204's protocol addition).
- The overlay panel is AX-exposed and activates during keyboard borrow as of
  2026-08-19 — US-202's editor inherits that behavior by reusing the guiding
  path.
- The `-minneKeyPreview` hook is the visual-verification backbone; every new
  state must be seedable through it.

## Open Questions

(Parking area — append story, blocker, what was tried.)

- US-204 did not need the optional `draft_outcome` request: the new steer of a
  request is exactly the last `guidance` entry of a non-regenerate draft (the
  retry path is deduplicated by hashing steer+previousDraft), so counting is
  complete without knowing whether the draft was inserted or abandoned. US-205
  should add `draft_outcome` itself — it genuinely needs the edited/inserted/
  abandoned signal that no existing request carries.
