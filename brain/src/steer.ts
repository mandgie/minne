// US-204: recurring steers become standing style rules — a user who typed
// "shorter" three times on x.com never types it again.
//
// The pipeline is US-109's, deliberately: counters in sync-state.json (never on
// the wiki page, so an agent rewriting the page cannot erase learning), folded
// and persisted before any model runs, distilled deterministically during the
// sync pass into a section the drafting prompt already reads (`findStylePage`).
//
// What counts as one steer. Swift accumulates guidance across the reworks of a
// press: a guided rework appends exactly one new steer and sends the whole
// array, a regenerate resends the array unchanged, and a retry after a failure
// resends the failed request verbatim under a new id. So the NEW steer of a
// request is the last guidance entry when `regenerate` is not set — exact for
// reworks and regenerates — and the retry is caught by hashing the steer
// together with the draft it was steering: a retry carries the same
// previousDraft byte for byte, while a genuine repeat of "shorter" arrives on
// a different draft. (Residual risk, accepted: a model that returns the same
// draft byte-identically across two presses would swallow one repeat.)
//
// The context a steer counts against is exactly the page the draft will read:
// the domain when the press had a URL, else the app, narrowed by the recipient
// when there is one — the head of `findStylePage`'s candidate list.
//
// Normalization is mechanical only — lowercase, collapse whitespace, strip
// trailing punctuation — so "Shorter." and "shorter" pool while "shorter
// please" stays a separate steer. Anything cleverer (courtesy-word stripping,
// synonymy) would merge steers the user meant differently; the cost is that a
// habit split across phrasings takes longer to reach the threshold.
import { domainOf } from "./draft";
import { parseFrontmatter, type Frontmatter } from "./frontmatter";
import { NotFoundError, type Memory } from "./memory";
import { messageHash, upsertSection } from "./register";
import { pagePath, styleTitle } from "./wiki";

/** The counters for one style context, keyed by its style-page title. */
export interface SteerState {
  /** the context half of the page title: the page's domain, else the app */
  context: string;
  recipient?: string;
  /** normalized steer → times the user has asked for it */
  counts: Record<string, number>;
  /** hashes of (steer, draft) pairs already counted — the retry guard */
  hashes: string[];
  /** YYYY-MM-DD of the last fold */
  updated: string;
  /** a rule at or past threshold changed since the last distillation */
  dirty: boolean;
}

/** The rework fields of one draft request, as `recordSteer` reads them. */
export interface SteerPress {
  app: string;
  url?: string;
  recipient?: string;
  guidance?: string[];
  regenerate?: boolean;
  previousDraft?: string;
}

/** A steer this often in one context becomes a standing rule. */
export const STEER_THRESHOLD = 3;
/** Rules per page, most-asked first — the section must ride a 4 000-char read. */
export const MAX_STANDING_RULES = 8;
/** A steer longer than this is a one-off instruction, not a habit to learn. */
export const MAX_STEER_CHARS = 200;
/** Distinct steers tracked per context; a full ledger stops taking new kinds. */
const MAX_STEER_KINDS = 32;
const MAX_STEER_HASHES = 64;

export const STANDING_GUIDANCE_HEADING = "## Standing guidance";

// ---- normalization ----

/** Lowercase, whitespace collapsed, trailing punctuation stripped. Mechanical
 * on purpose (see the header comment): near-duplicates that differ in words
 * ("shorter please") do not pool. */
export function normalizeSteer(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/gu, " ")
    .trim()
    .replace(/[\s.!?,;:…]+$/u, "");
}

// ---- counting ----

export function emptySteerState(context: string, recipient?: string): SteerState {
  return {
    context,
    ...(recipient === undefined || recipient === "" ? {} : { recipient }),
    counts: {},
    hashes: [],
    updated: "",
    dirty: false,
  };
}

/**
 * Folds the new steer of one draft request in, if it carries one. Returns
 * false — and changes nothing — for a first press, a regenerate, a retry of an
 * already-counted steer, or a steer too long to be a habit. True means the
 * state changed and must be persisted (before the model runs, per US-109).
 */
export function foldSteerPress(
  steers: Record<string, SteerState>,
  press: SteerPress,
  date: string,
): boolean {
  if (press.regenerate === true) return false;
  const last = press.guidance?.at(-1);
  if (last === undefined) return false;
  const steer = normalizeSteer(last);
  if (steer === "" || steer.length > MAX_STEER_CHARS) return false;

  const context = domainOf(press.url) ?? press.app.trim();
  if (context === "") return false;
  const recipient = press.recipient?.trim();
  const key = styleTitle(context, recipient);
  const state = (steers[key] ??= emptySteerState(context, recipient));

  const hash = messageHash(`${steer}\u0000${press.previousDraft ?? ""}`);
  if (state.hashes.includes(hash)) return false;
  state.hashes.push(hash);
  if (state.hashes.length > MAX_STEER_HASHES) {
    state.hashes.splice(0, state.hashes.length - MAX_STEER_HASHES);
  }

  if (steer in state.counts || Object.keys(state.counts).length < MAX_STEER_KINDS) {
    const count = (state.counts[steer] ?? 0) + 1;
    state.counts[steer] = count;
    if (count >= STEER_THRESHOLD) state.dirty = true;
  }
  state.updated = date;
  return true;
}

// ---- rendering ----

/** The steers past threshold, most-asked first, capped at the page's budget. */
export function standingRules(state: SteerState): [string, number][] {
  return Object.entries(state.counts)
    .filter(([, count]) => count >= STEER_THRESHOLD)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, MAX_STANDING_RULES);
}

/**
 * The section as it appears on the style page — and therefore inside every
 * draft prompt for this context. The rule is the user's own steer, capitalized
 * and nothing more: deterministic, and their words rather than a paraphrase.
 */
export function renderStandingGuidance(state: SteerState): string {
  const rules = standingRules(state);
  const lines = [
    STANDING_GUIDANCE_HEADING,
    "",
    `Guidance the user has repeated when drafting here — treat each line as a ` +
      `standing rule for every draft. Maintained automatically from their ` +
      `steers, last updated ${state.updated}; Minne rewrites this section as ` +
      `the counts change.`,
    "",
    ...rules.map(([steer, count]) => `- ${capitalize(steer)} — asked ${count} times`),
  ];
  return lines.join("\n");
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// ---- persistence guards ----

/** sync-state.json's `steers` field, dropped entry-wise when unreadable. */
export function sanitizeSteers(value: unknown): Record<string, SteerState> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const steers: Record<string, SteerState> = {};
  for (const [key, raw] of Object.entries(value)) {
    const state = sanitizeSteer(raw);
    if (state !== null) steers[key] = state;
  }
  return steers;
}

function sanitizeSteer(value: unknown): SteerState | null {
  if (typeof value !== "object" || value === null) return null;
  const raw = value as Record<string, unknown>;
  if (typeof raw["context"] !== "string") return null;
  const recipient = typeof raw["recipient"] === "string" ? raw["recipient"] : undefined;
  const base = emptySteerState(raw["context"], recipient);
  if (typeof raw["counts"] === "object" && raw["counts"] !== null && !Array.isArray(raw["counts"])) {
    for (const [steer, count] of Object.entries(raw["counts"])) {
      if (typeof count === "number" && Number.isInteger(count) && count > 0) {
        base.counts[steer] = count;
      }
    }
  }
  if (Array.isArray(raw["hashes"])) {
    base.hashes = raw["hashes"]
      .filter((item): item is string => typeof item === "string")
      .slice(-MAX_STEER_HASHES);
  }
  base.updated = typeof raw["updated"] === "string" ? raw["updated"] : "";
  base.dirty = raw["dirty"] === true;
  return base;
}

// ---- the write ----

const NEW_PAGE_INTRO =
  "How the user writes in this context, distilled from the guidance they\n" +
  "repeated to Minne's drafting key — their own words, never invented.";

/**
 * Rewrites the standing-guidance section of every style page whose steers
 * changed past threshold since the last pass. Deterministic and model-free;
 * writes go through `Memory.writePage` (lint-enforced), and a failure is
 * logged, never allowed to fail the sync pass. Returns the pages written.
 *
 * Like the register, this recreates a section the user deleted if the steer
 * recurs afterwards — which is the feature: they asked again. A rule they
 * deleted stays gone until then, because a clean pass leaves the page alone.
 */
export function distillSteers(
  memory: Memory,
  steers: Record<string, SteerState>,
  log: (...args: unknown[]) => void,
): string[] {
  const pages: string[] = [];
  for (const title of Object.keys(steers).sort()) {
    const state = steers[title] as SteerState;
    if (!state.dirty) continue;
    if (standingRules(state).length === 0) {
      state.dirty = false;
      continue;
    }
    try {
      const written = writeStandingGuidancePage(memory, title, state);
      if (written !== null) pages.push(written);
      state.dirty = false;
    } catch (err) {
      log(`steer distillation: could not update the style page for ${title}:`, err);
    }
  }
  return pages;
}

/**
 * One style page: existing body and frontmatter kept, standing-guidance
 * section replaced. A missing page is created (the way US-109's register
 * does); a page whose frontmatter cannot be parsed is left alone.
 */
function writeStandingGuidancePage(
  memory: Memory,
  title: string,
  state: SteerState,
): string | null {
  const path = pagePath("style", title);
  let existing = null;
  try {
    existing = memory.read(path);
  } catch (err) {
    if (!(err instanceof NotFoundError)) throw err;
  }

  const where = state.recipient === undefined ? state.context : `${state.context} — ${state.recipient}`;
  let summary = `How the user writes in ${where}, with standing guidance they repeated to the drafting key.`;
  let body = `# ${title}\n\n${NEW_PAGE_INTRO}`;
  if (existing !== null) {
    let front: Frontmatter;
    try {
      front = parseFrontmatter(existing.text);
    } catch {
      // A page whose frontmatter this schema cannot read is the user's or the
      // agent's problem to notice, not ours to overwrite (US-109's choice).
      return null;
    }
    const existingSummary = front.fields["summary"];
    if (typeof existingSummary === "string" && existingSummary.trim() !== "") {
      summary = existingSummary;
    }
    body = front.body;
  }

  // `sources` is omitted: an existing page keeps its citations untouched, and
  // a new one starts empty — a steer is a press, not a capture, so there is no
  // snapshot to cite.
  const result = memory.writePage({
    type: "style",
    title,
    summary,
    body: upsertSection(body, STANDING_GUIDANCE_HEADING, renderStandingGuidance(state)),
  });
  return result.path;
}
