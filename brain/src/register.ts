// US-109: the per-recipient voice register — what the user's own sent messages
// say about how they write to one person, distilled deterministically.
//
// The sync pass hands every batch of captured snapshots through here before the
// model sees them. When a snapshot is a messaging surface whose flat AX text
// carries an unambiguous "this bubble is the user's" marker, the message is
// folded into a running register (greeting habit, sign-off, typical length,
// emoji usage, language) and a `## Register` section is rewritten on the
// recipient's style page — the page `findStylePage` already injects into every
// draft prompt for that app and recipient.
//
// The binding principle, from the PRD: a register polluted with the OTHER
// person's words is worse than no register at all. Captured window text is a
// flat list of AX strings with no authorship attribution, so extraction only
// trusts markers that macOS renders exclusively under the user's own messages:
//
//   Messages — delivery/read receipts ("Delivered", "Read 14:05", and their
//              Swedish forms) appear only under an outgoing bubble, so the line
//              directly above one is the user's. Nothing else in the window is
//              attributed. (Residual risk, accepted and documented: a message
//              *from* the other person that is literally the bare word
//              "Delivered" would mis-attribute the line above it once.)
//   Slack    — parked. A DM shows sender display names, but we do not know the
//              user's own name, and a name-shaped line inside a pasted message
//              would mis-attribute whole blocks. No unambiguous signal exists
//              in the flat text.
//   Mail     — parked. A compose window and a reading pane both show To:/
//              subject chrome in flat text, and mistaking a *received* mail for
//              the user's writing is exactly the pollution this must not risk.
//
// Everything below `updateVoiceRegisters` is pure; the counters live in
// sync-state.json (brain-owned) rather than on the page, so re-observing the
// same window — capture snapshots the same thread every few seconds — cannot
// double-count (message hashes), and an agent rewriting the style page cannot
// erase what has been learned.
import { parseFrontmatter, type Frontmatter } from "./frontmatter";
import { localDate, NotFoundError, type Memory } from "./memory";
import { pagePath, styleTitle } from "./wiki";

/** What one snapshot yielded: who it was to, and the user's own lines. */
export interface SentSample {
  app: string;
  recipient: string;
  messages: string[];
}

/** The register's running counters for one (app, recipient) pair. */
export interface RegisterState {
  app: string;
  recipient: string;
  /** distinct sent messages folded in */
  messages: number;
  /** total characters across them — `chars / messages` is the typical length */
  chars: number;
  /** canonical greeting token → count ("hej", "hi", "dear") */
  greetings: Record<string, number>;
  /** canonical sign-off token → count ("mvh", "best regards", "/m") */
  signoffs: Record<string, number>;
  /** messages containing at least one emoji */
  withEmoji: number;
  /** emoji character → count, capped so one keyboard smash cannot grow it */
  emoji: Record<string, number>;
  /** "sv" | "en" → count; messages too short to call are not counted */
  languages: Record<string, number>;
  /** hashes of recent messages, newest last — the idempotency guard */
  hashes: string[];
  /** citations of the snapshots observed, newest last */
  citations: string[];
  /** YYYY-MM-DD of the last fold */
  updated: string;
}

/** Everything folded in from one batch of snapshot rows. */
export interface RegisterUpdate {
  /** style pages written (memory-root-relative) */
  pages: string[];
  /** messages newly folded — zero means the state did not change */
  folded: number;
}

const MAX_HASHES = 64;
const MAX_CITATIONS = 16;
const MAX_EMOJI_KINDS = 12;

// ---- extraction ----

// Delivery receipts are bare; read receipts always carry a time or day, which
// is what keeps a one-word message "Read" from the other person from being
// taken for a marker.
const RECEIPT_PATTERN = /^(Delivered|Levererat|(Read|Läst)\s+\S.{0,38})$/u;

/** Lines that are Messages chrome, never a message. */
const CHROME_PATTERNS: RegExp[] = [
  /^(iMessage|SMS|MMS|Text Message|New Message|Messages|Meddelanden|Details|Detaljer|To:|Till:)$/i,
  /^(Today|Yesterday|Idag|I ?går)\b/i,
  /^(Mon|Tues|Wednes|Thurs|Fri|Satur|Sun)day\b/i,
  /^(måndag|tisdag|onsdag|torsdag|fredag|lördag|söndag)\b/i,
  /^\d{1,2}[:.]\d{2}(\s?(AM|PM))?$/i,
  /^\d{4}-\d{2}-\d{2}/,
  RECEIPT_PATTERN,
];

const MESSAGES_BUNDLE_ID = "com.apple.MobileSMS";

/**
 * The user's own sent messages in one captured window, or null when the
 * surface gives no unambiguous authorship signal. Only Messages qualifies
 * today (see the header comment for why Slack and Mail are parked).
 *
 * A receipt marks only the bubble directly above it, so at most the last sent
 * message (or two, with a lingering "Read") per snapshot is harvested — the
 * register accumulates across snapshots rather than gulping a thread at once.
 * Of a multi-line bubble only the final line sits against the marker, so the
 * observed length is a floor, never an invention.
 */
export function extractSentMessages(snapshot: {
  app: string;
  bundleId: string;
  title: string;
  text: string;
}): SentSample | null {
  if (snapshot.bundleId !== MESSAGES_BUNDLE_ID) return null;
  const recipient = cleanRecipient(snapshot.title);
  if (recipient === null) return null;

  const lines = snapshot.text.split("\n").map((line) => line.trim());
  const messages: string[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i] as string;
    if (!RECEIPT_PATTERN.test(line)) continue;
    const candidate = lines[i - 1] as string;
    if (candidate === "" || candidate === recipient) continue;
    if (CHROME_PATTERNS.some((pattern) => pattern.test(candidate))) continue;
    if (!messages.includes(candidate)) messages.push(candidate);
  }
  return messages.length === 0 ? null : { app: snapshot.app, recipient, messages };
}

/**
 * A window title that really names a correspondent — the same bar
 * `RecipientHint.clean` sets on the Swift side, plus "not the app's own name",
 * because Messages' conversation list window is titled just "Messages".
 */
function cleanRecipient(title: string): string | null {
  const text = title.trim();
  if (text.length <= 1 || text.length > 60) return null;
  if (!/\p{L}/u.test(text)) return null;
  if (/^(Messages|Meddelanden|New Message|Nytt meddelande)$/i.test(text)) return null;
  return text;
}

// ---- per-message analysis ----

export interface MessageTraits {
  greeting: string | null;
  signoff: string | null;
  chars: number;
  /** distinct emoji in the message */
  emoji: string[];
  language: "sv" | "en" | null;
}

/** Longest-first, so "good morning" wins over "morning" alone matching "good". */
const GREETINGS = [
  "good morning",
  "good afternoon",
  "good evening",
  "god morgon",
  "god kväll",
  "hej hej",
  "hejsan",
  "hallå",
  "hello",
  "howdy",
  "morning",
  "morrn",
  "tjena",
  "dear",
  "hiya",
  "hej",
  "hey",
  "tja",
  "yo",
  "hi",
];

const SIGNOFFS = [
  "med vänliga hälsningar",
  "vänliga hälsningar",
  "tack på förhand",
  "kind regards",
  "best regards",
  "warm regards",
  "best wishes",
  "many thanks",
  "take care",
  "thank you",
  "talk soon",
  "ha det bra",
  "hälsningar",
  "allt gott",
  "vi hörs",
  "regards",
  "thanks",
  "cheers",
  "kramar",
  "kram",
  "hörs",
  "tack",
  "best",
  "mvh",
  "vh",
  "br",
];

const SWEDISH_WORDS = new Set(
  ("och att det är jag inte på med för du vi har som den till kan ska bra hej tack nej ja " +
    "igår idag imorgon vad när där så men om din min ju väl lite mycket hur blir kommer går " +
    "ses hörs strax snart nu sen sedan också redan ikväll").split(" "),
);

const ENGLISH_WORDS = new Set(
  ("the and is are you to of in that it for on we have will was this at be with not but they " +
    "what when i my your yes no ok sure see get got good great just now later tomorrow today " +
    "here there thanks").split(" "),
);

const EMOJI_PATTERN = /\p{Extended_Pictographic}/gu;

export function analyzeMessage(text: string): MessageTraits {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");
  const first = (lines[0] ?? "").toLowerCase();

  let greeting: string | null = null;
  for (const token of GREETINGS) {
    if (first === token || (first.startsWith(token) && /[\s,.!?—–-]/.test(first[token.length] ?? ""))) {
      greeting = token;
      break;
    }
  }

  // A sign-off is how a message *ends*, so a one-line "thanks!" is the whole
  // message, not a habit of signing off — multi-line messages only.
  let signoff: string | null = null;
  if (lines.length >= 2) {
    for (const line of lines.slice(-3).reverse()) {
      const bare = line.toLowerCase().replace(/[,.!\s]+$/u, "");
      const hit = SIGNOFFS.find((token) => bare === token);
      if (hit !== undefined) {
        signoff = hit;
        break;
      }
      if (/^\/\s*\S{1,24}$/u.test(line)) {
        signoff = line.toLowerCase();
        break;
      }
    }
  }

  const emoji = [...new Set([...text.matchAll(EMOJI_PATTERN)].map((match) => match[0]))];

  let sv = /[åäö]/i.test(text) ? 2 : 0;
  let en = 0;
  for (const match of text.toLowerCase().matchAll(/\p{L}+/gu)) {
    const word = match[0];
    if (SWEDISH_WORDS.has(word)) sv++;
    if (ENGLISH_WORDS.has(word)) en++;
  }
  const language = sv >= 2 && sv > en ? "sv" : en >= 2 && en > sv ? "en" : null;

  return { greeting, signoff, chars: text.length, emoji, language };
}

// ---- the running register ----

export function emptyRegister(app: string, recipient: string): RegisterState {
  return {
    app,
    recipient,
    messages: 0,
    chars: 0,
    greetings: {},
    signoffs: {},
    withEmoji: 0,
    emoji: {},
    languages: {},
    hashes: [],
    citations: [],
    updated: "",
  };
}

/** FNV-1a over the whitespace-collapsed text; recapture spacing cannot split it. */
export function messageHash(text: string): string {
  const normalized = text.replace(/\s+/gu, " ").trim();
  let hash = 0x811c9dc5;
  for (let i = 0; i < normalized.length; i++) {
    hash ^= normalized.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

/**
 * Folds one sent message in. Returns false — and changes nothing — when the
 * message was already counted, which is what makes re-observing the same
 * window (capture snapshots it every few seconds) and re-reading a failed
 * batch harmless.
 */
export function foldMessage(
  state: RegisterState,
  text: string,
  citation: string,
  date: string,
): boolean {
  const hash = messageHash(text);
  if (state.hashes.includes(hash)) return false;
  state.hashes.push(hash);
  if (state.hashes.length > MAX_HASHES) state.hashes.splice(0, state.hashes.length - MAX_HASHES);

  const traits = analyzeMessage(text);
  state.messages++;
  state.chars += traits.chars;
  if (traits.greeting !== null) bump(state.greetings, traits.greeting);
  if (traits.signoff !== null) bump(state.signoffs, traits.signoff);
  if (traits.emoji.length > 0) state.withEmoji++;
  for (const glyph of traits.emoji) {
    if (glyph in state.emoji || Object.keys(state.emoji).length < MAX_EMOJI_KINDS) {
      bump(state.emoji, glyph);
    }
  }
  if (traits.language !== null) bump(state.languages, traits.language);

  if (!state.citations.includes(citation)) {
    state.citations.push(citation);
    if (state.citations.length > MAX_CITATIONS) {
      state.citations.splice(0, state.citations.length - MAX_CITATIONS);
    }
  }
  state.updated = date;
  return true;
}

function bump(counts: Record<string, number>, key: string): void {
  counts[key] = (counts[key] ?? 0) + 1;
}

// ---- rendering ----

export const REGISTER_HEADING = "## Register";

/**
 * The section as it appears on the style page — and therefore inside every
 * draft prompt for this recipient (`findStylePage` reads the page whole, with
 * a 4 000-character budget, so this stays a few hundred characters).
 */
export function renderRegister(state: RegisterState): string {
  const n = state.messages;
  const lines = [
    REGISTER_HEADING,
    "",
    `How the user actually writes to ${state.recipient} in ${state.app} — measured from ` +
      `${n} sent message${n === 1 ? "" : "s"}, last updated ${state.updated}. Maintained ` +
      `automatically; Minne rewrites this section as it observes more.`,
    "",
    `- Greeting: ${describeCounts(state.greetings, n, "none — they open mid-thought")}`,
    `- Sign-off: ${describeCounts(state.signoffs, n, "none observed")}`,
    `- Typical length: ${describeLength(state.chars, n)}`,
    `- Emoji: ${describeEmoji(state)}`,
    `- Language: ${describeLanguage(state.languages)}`,
  ];
  return lines.join("\n");
}

function topEntries(counts: Record<string, number>, take: number): [string, number][] {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, take);
}

function describeCounts(counts: Record<string, number>, n: number, none: string): string {
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  if (total === 0 || n === 0) return none;
  const parts = topEntries(counts, 2).map(([token, count]) => `"${token}" (${count} of ${n})`);
  return total / n < 0.5 ? `mostly none; sometimes ${parts.join(", ")}` : parts.join(", ");
}

function describeLength(chars: number, n: number): string {
  if (n === 0) return "unknown";
  const avg = Math.round(chars / n);
  if (avg <= 60) return `short — ~${avg} characters`;
  if (avg <= 200) return `a sentence or two (~${avg} characters)`;
  if (avg <= 600) return `a short paragraph (~${avg} characters)`;
  return `long-form (~${avg} characters)`;
}

function describeEmoji(state: RegisterState): string {
  if (state.withEmoji === 0 || state.messages === 0) return "none observed";
  const top = topEntries(state.emoji, 3)
    .map(([glyph]) => glyph)
    .join(" ");
  const rate = state.withEmoji / state.messages;
  const word = rate < 0.15 ? "rare" : rate < 0.5 ? "occasional" : "frequent";
  return `${word} (${state.withEmoji} of ${state.messages}: ${top})`;
}

function describeLanguage(languages: Record<string, number>): string {
  const names: Record<string, string> = { sv: "Swedish", en: "English" };
  const entries = topEntries(languages, 2).filter(([code]) => code in names);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);
  if (total === 0) return "unclear from short messages";
  const first = entries[0] as [string, number];
  if (entries.length === 1 || (first[1] ?? 0) / total >= 0.8) return names[first[0]] as string;
  return entries.map(([code]) => names[code]).join(" and ");
}

/**
 * Replaces one `## `-level section of a page body, or inserts it before the
 * first `## ` heading (so a long page truncated at the read budget loses the
 * agent's trailing observations before it loses this). Pure text surgery: the
 * rest of the body — the sync agent's own observations — is untouched. Shared
 * with US-204's standing guidance: one section surgeon, however many sections.
 *
 * `heading` is the section's full heading line ("## Register"); the section
 * text passed must open with it.
 */
export function upsertSection(body: string, heading: string, section: string): string {
  const lines = body.split("\n");
  const isHeading = (line: string) => /^##\s/.test(line);
  const title = heading.replace(/^##\s+/, "");
  const pattern = new RegExp(`^##\\s+${escapeRegExp(title)}\\s*$`);
  const start = lines.findIndex((line) => pattern.test(line));
  if (start >= 0) {
    let end = start + 1;
    while (end < lines.length && !isHeading(lines[end] as string)) end++;
    const replaced = [...lines.slice(0, start), section, ...lines.slice(end)];
    return normalizeBlankRuns(replaced.join("\n"));
  }
  const firstHeading = lines.findIndex(isHeading);
  if (firstHeading >= 0) {
    const inserted = [...lines.slice(0, firstHeading), section, "", ...lines.slice(firstHeading)];
    return normalizeBlankRuns(inserted.join("\n"));
  }
  return normalizeBlankRuns(`${body.trimEnd()}\n\n${section}\n`);
}

function normalizeBlankRuns(text: string): string {
  return text.replace(/\n{3,}/g, "\n\n").trim();
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ---- persistence guards ----

/** sync-state.json's `registers` field, dropped entry-wise when unreadable. */
export function sanitizeRegisters(value: unknown): Record<string, RegisterState> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const registers: Record<string, RegisterState> = {};
  for (const [key, raw] of Object.entries(value)) {
    const state = sanitizeRegister(raw);
    if (state !== null) registers[key] = state;
  }
  return registers;
}

function sanitizeRegister(value: unknown): RegisterState | null {
  if (typeof value !== "object" || value === null) return null;
  const raw = value as Record<string, unknown>;
  if (typeof raw["app"] !== "string" || typeof raw["recipient"] !== "string") return null;
  const base = emptyRegister(raw["app"], raw["recipient"]);
  base.messages = countOf(raw["messages"]);
  base.chars = countOf(raw["chars"]);
  base.withEmoji = countOf(raw["withEmoji"]);
  base.greetings = countsOf(raw["greetings"]);
  base.signoffs = countsOf(raw["signoffs"]);
  base.emoji = countsOf(raw["emoji"]);
  base.languages = countsOf(raw["languages"]);
  base.hashes = stringsOf(raw["hashes"], MAX_HASHES);
  base.citations = stringsOf(raw["citations"], MAX_CITATIONS);
  base.updated = typeof raw["updated"] === "string" ? raw["updated"] : "";
  return base;
}

function countOf(value: unknown): number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : 0;
}

function countsOf(value: unknown): Record<string, number> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return {};
  const counts: Record<string, number> = {};
  for (const [key, raw] of Object.entries(value)) {
    if (typeof raw === "number" && Number.isInteger(raw) && raw > 0) counts[key] = raw;
  }
  return counts;
}

function stringsOf(value: unknown, cap: number): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string").slice(-cap);
}

// ---- the write ----

const NEW_PAGE_INTRO =
  "How the user writes in this context, observed from their own captured\n" +
  "messages — never invented and never prescriptive.";

/**
 * Folds a batch of snapshot rows into `registers` and rewrites the register
 * section of every style page whose state changed. Writes go through
 * `Memory.writePage`, so a page that would violate SCHEMA.md is refused there
 * and logged here — a register must never be able to break the wiki, and a
 * register failure must never be able to break the sync pass (the caller wraps
 * this too, belt and braces).
 */
export function updateVoiceRegisters(
  memory: Memory,
  rows: { app: string; bundleId: string; title: string; text: string; citation: string }[],
  registers: Record<string, RegisterState>,
  log: (...args: unknown[]) => void,
  now: () => Date,
): RegisterUpdate {
  const changed = new Set<string>();
  let folded = 0;
  for (const row of rows) {
    const sample = extractSentMessages(row);
    if (sample === null) continue;
    const key = styleTitle(sample.app, sample.recipient);
    const state = (registers[key] ??= emptyRegister(sample.app, sample.recipient));
    for (const message of sample.messages) {
      if (foldMessage(state, message, row.citation, localDate(now()))) {
        folded++;
        changed.add(key);
      }
    }
  }

  const pages: string[] = [];
  for (const title of [...changed].sort()) {
    const state = registers[title] as RegisterState;
    try {
      const written = writeRegisterPage(memory, title, state);
      if (written !== null) pages.push(written);
    } catch (err) {
      log(`voice register: could not update the style page for ${title}:`, err);
    }
  }
  return { pages, folded };
}

/** One style page: existing body kept, register section replaced. */
function writeRegisterPage(memory: Memory, title: string, state: RegisterState): string | null {
  const path = pagePath("style", title);
  let existing = null;
  try {
    existing = memory.read(path);
  } catch (err) {
    if (!(err instanceof NotFoundError)) throw err;
  }

  let summary = `How the user writes to ${state.recipient} in ${state.app}, learned from messages they actually sent.`;
  let sources = state.citations;
  let body = `# ${title}\n\n${NEW_PAGE_INTRO}`;
  if (existing !== null) {
    let front: Frontmatter;
    try {
      front = parseFrontmatter(existing.text);
    } catch {
      // A page whose frontmatter this schema cannot read is the user's or the
      // agent's problem to notice, not ours to overwrite.
      return null;
    }
    const existingSummary = front.fields["summary"];
    if (typeof existingSummary === "string" && existingSummary.trim() !== "") {
      summary = existingSummary;
    }
    const existingSources = front.fields["sources"];
    if (Array.isArray(existingSources)) {
      const kept = existingSources.filter(
        (item): item is string => typeof item === "string" && !state.citations.includes(item),
      );
      sources = [...kept, ...state.citations].slice(-MAX_CITATIONS);
    }
    body = front.body;
  }

  const result = memory.writePage({
    type: "style",
    title,
    summary,
    sources,
    body: upsertSection(body, REGISTER_HEADING, renderRegister(state)),
  });
  return result.path;
}
