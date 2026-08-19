// US-205: in-editor corrections feed the ledger — the byte-exact diff between
// what the model wrote and what the user actually inserted, distilled into the
// same standing guidance a repeated steer becomes. One pipeline, not a third:
// the counters follow US-109/US-204's discipline (sync-state.json, persisted
// the moment they change, presentation kept off the wiki page), and rendering
// rides steer.ts's section machinery.
//
// The observations are deterministic edit *features*, never the texts: a
// correction is compared once, folded into a fixed-vocabulary counter, and the
// draft and its edit are forgotten. What counts as a rule is a feature seen at
// least EDIT_THRESHOLD times in one context AND corrected more often than the
// user inserted drafts there untouched — an approval is the model getting it
// right, and three trims against ten clean inserts is taste, not a rule.
// Abandons are counted raw and never interpreted: a dismissed draft says
// nothing about *why*.
import { domainOf } from "./draft";
import { analyzeMessage } from "./register";
import { styleTitle } from "./wiki";

/** Corrections this often in one context become a standing rule. */
export const EDIT_THRESHOLD = 3;

/** The fixed vocabulary of things an edit can be observed to do. */
export type EditFeature =
  | "trimmed"
  | "grew"
  | "greeting_removed"
  | "greeting_added"
  | "greeting_changed"
  | "signoff_removed"
  | "signoff_added"
  | "exclamations_removed"
  | "switched_to_sv"
  | "switched_to_en";

export const EDIT_FEATURES: readonly EditFeature[] = [
  "trimmed",
  "grew",
  "greeting_removed",
  "greeting_added",
  "greeting_changed",
  "signoff_removed",
  "signoff_added",
  "exclamations_removed",
  "switched_to_sv",
  "switched_to_en",
];

/** An edit past this fraction of the draft's length is a trim or a growth. */
const LENGTH_DELTA = 0.2;

/**
 * The deterministic features of one correction. Pure text comparison —
 * greeting, sign-off and language detection are register.ts's, so a habit
 * observed from sent messages and one observed from corrections agree on what
 * a greeting is.
 */
export function editFeatures(generated: string, edited: string): EditFeature[] {
  const features: EditFeature[] = [];
  const genLength = generated.trim().length;
  const editLength = edited.trim().length;
  if (genLength > 0 && editLength < genLength * (1 - LENGTH_DELTA)) features.push("trimmed");
  if (genLength > 0 && editLength > genLength * (1 + LENGTH_DELTA)) features.push("grew");

  const before = analyzeMessage(generated);
  const after = analyzeMessage(edited);
  if (before.greeting !== null && after.greeting === null) features.push("greeting_removed");
  if (before.greeting === null && after.greeting !== null) features.push("greeting_added");
  if (before.greeting !== null && after.greeting !== null && before.greeting !== after.greeting) {
    features.push("greeting_changed");
  }
  if (before.signoff !== null && after.signoff === null) features.push("signoff_removed");
  if (before.signoff === null && after.signoff !== null) features.push("signoff_added");

  const exclamations = (text: string) => (text.match(/!/g) ?? []).length;
  if (exclamations(generated) > exclamations(edited)) features.push("exclamations_removed");

  if (before.language !== null && after.language !== null && before.language !== after.language) {
    features.push(after.language === "sv" ? "switched_to_sv" : "switched_to_en");
  }
  return features;
}

/** The edit ledger's counters for one style context, keyed by page title. */
export interface EditState {
  /** the context half of the page title: the page's domain, else the app */
  context: string;
  recipient?: string;
  /** edit feature → drafts the user corrected that way here */
  corrections: Partial<Record<EditFeature, number>>;
  /** drafts inserted untouched — approvals of the model's text as-is */
  approvals: number;
  /** drafts dismissed after being written; counted, never interpreted */
  abandons: number;
  /** YYYY-MM-DD of the last fold */
  updated: string;
  /** a rule at or past threshold may have changed since the last distillation */
  dirty: boolean;
}

/** One draft's settled outcome, as the brain attributes it to its context. */
export interface DraftOutcomePress {
  app: string;
  url?: string;
  recipient?: string;
  outcome: "inserted" | "abandoned";
  /** the inserted text, only when it differs from what the model wrote */
  edited?: string;
  /** what the model wrote, only alongside `edited` */
  generated?: string;
}

export function emptyEditState(context: string, recipient?: string): EditState {
  return {
    context,
    ...(recipient === undefined || recipient === "" ? {} : { recipient }),
    corrections: {},
    approvals: 0,
    abandons: 0,
    updated: "",
    dirty: false,
  };
}

/**
 * Folds one settled draft in. Returns false — and changes nothing — only when
 * the press names no context at all. The context key is the same page the
 * draft read (and the same key the steers use): the domain when the press had
 * a URL, else the app, narrowed by the recipient. True means the state changed
 * and must be persisted.
 */
export function foldDraftOutcome(
  edits: Record<string, EditState>,
  press: DraftOutcomePress,
  date: string,
): boolean {
  const context = domainOf(press.url) ?? press.app.trim();
  if (context === "") return false;
  const recipient = press.recipient?.trim();
  const key = styleTitle(context, recipient);
  const state = (edits[key] ??= emptyEditState(context, recipient));

  if (press.outcome === "abandoned") {
    state.abandons++;
  } else if (
    press.edited !== undefined &&
    press.generated !== undefined &&
    press.edited !== press.generated
  ) {
    for (const feature of editFeatures(press.generated, press.edited)) {
      const count = (state.corrections[feature] ?? 0) + 1;
      state.corrections[feature] = count;
      if (count >= EDIT_THRESHOLD) state.dirty = true;
    }
  } else {
    state.approvals++;
    // An approval can retire a rule (corrections must outnumber approvals),
    // so a context with a rule in play re-renders on the next pass.
    if (Object.values(state.corrections).some((count) => count >= EDIT_THRESHOLD)) {
      state.dirty = true;
    }
  }
  state.updated = date;
  return true;
}

// ---- rendering ----

/**
 * The corrections that have earned a rule: at least EDIT_THRESHOLD of them,
 * and more of them than untouched inserts in this context. Returns rendered
 * rule lines with their counts, most-corrected first, so steer.ts can merge
 * them with the steers under the one combined cap.
 */
export function editRules(state: EditState): [string, number][] {
  return (Object.entries(state.corrections) as [EditFeature, number][])
    .filter(([, count]) => count >= EDIT_THRESHOLD && count > state.approvals)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([feature, count]) => [ruleLabel(feature, count, count + state.approvals), count]);
}

/** Deterministic phrasing: the imperative, then the evidence. */
function ruleLabel(feature: EditFeature, count: number, total: number): string {
  const of = `${count} of ${total} draft${total === 1 ? "" : "s"}`;
  switch (feature) {
    case "trimmed":
      return `Trim it — the user shortened ${of} here`;
    case "grew":
      return `Say more — the user lengthened ${of} here`;
    case "greeting_removed":
      return `Skip the greeting — the user removed it from ${of} here`;
    case "greeting_added":
      return `Open with a greeting — the user added one to ${of} here`;
    case "greeting_changed":
      return `Rework the greeting — the user changed it in ${of} here`;
    case "signoff_removed":
      return `Skip the sign-off — the user removed it from ${of} here`;
    case "signoff_added":
      return `End with a sign-off — the user added one to ${of} here`;
    case "exclamations_removed":
      return `Go easy on exclamation marks — the user removed them from ${of} here`;
    case "switched_to_sv":
      return `Write in Swedish — the user rewrote ${of} into it here`;
    case "switched_to_en":
      return `Write in English — the user rewrote ${of} into it here`;
  }
}

// ---- persistence guards ----

/** sync-state.json's `edits` field, dropped entry-wise when unreadable. */
export function sanitizeEdits(value: unknown): Record<string, EditState> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const edits: Record<string, EditState> = {};
  for (const [key, raw] of Object.entries(value)) {
    const state = sanitizeEdit(raw);
    if (state !== null) edits[key] = state;
  }
  return edits;
}

function sanitizeEdit(value: unknown): EditState | null {
  if (typeof value !== "object" || value === null) return null;
  const raw = value as Record<string, unknown>;
  if (typeof raw["context"] !== "string") return null;
  const recipient = typeof raw["recipient"] === "string" ? raw["recipient"] : undefined;
  const base = emptyEditState(raw["context"], recipient);
  const corrections = raw["corrections"];
  if (typeof corrections === "object" && corrections !== null && !Array.isArray(corrections)) {
    // The vocabulary is fixed: a key this build does not know is dropped, so
    // the ledger can never grow keys from user text or a future schema.
    for (const feature of EDIT_FEATURES) {
      const count = (corrections as Record<string, unknown>)[feature];
      if (typeof count === "number" && Number.isInteger(count) && count > 0) {
        base.corrections[feature] = count;
      }
    }
  }
  base.approvals = countOf(raw["approvals"]);
  base.abandons = countOf(raw["abandons"]);
  base.updated = typeof raw["updated"] === "string" ? raw["updated"] : "";
  base.dirty = raw["dirty"] === true;
  return base;
}

function countOf(value: unknown): number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : 0;
}
