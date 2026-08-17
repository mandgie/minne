// The memory operations behind the agent's tools.
//
// Everything the LLM may do to `~/Minne` happens here and nowhere else: search,
// read, list, write a page, append to the log. `memory-tools.ts` is a thin pi
// adapter over this file, so every rule below is testable without an LLM.
//
// Three properties this module is responsible for:
//
//   containment — no read or write leaves the memory root, ever (memory-path.ts).
//   validity    — a write that would introduce a wiki-lint *error* is refused;
//                 one that introduces a *warning* goes through and the warning
//                 comes back with the result. New issues are diffed against a
//                 lint of the tree as it was, so a wiki the user has already
//                 broken elsewhere doesn't block the agent from working.
//   consistency — `last_updated` is stamped by the clock, never taken from the
//                 model, and a page the agent creates gets its `index.md` entry
//                 in the same write.
import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import {
  parseFrontmatter,
  renderValue,
  type Frontmatter,
  type FrontmatterValue,
} from "./frontmatter";
import { queryTerms, searchSources, type SourceHit } from "./sources";
import { resolveInMemory, type ResolvedPath } from "./memory-path";
import {
  DATE_PATTERN,
  INDEX_FILE,
  LOG_FILE,
  PAGE_TYPES,
  SCHEMA_FILE,
  WIKI_DIR,
  bootstrapWiki,
  loadWikiTree,
  pagePath,
  renderPage,
  type LogPass,
  type PageType,
  type WikiTree,
} from "./wiki";
import { lintWiki, type LintIssue } from "./wiki-lint";

/** A page or source the agent asked for that is not there. */
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

/** A write that wiki-lint would call broken. Carries the offending issues. */
export class SchemaViolationError extends Error {
  readonly issues: LintIssue[];

  constructor(message: string, issues: LintIssue[]) {
    super(message);
    this.name = "SchemaViolationError";
    this.issues = issues;
  }
}

export type MemoryScope = "all" | "wiki" | "sources";

export interface WikiHit {
  kind: "wiki";
  /** memory-root-relative path */
  path: string;
  title: string;
  type: string;
  summary: string;
  /** matching text with `**highlights**` and `…` elisions */
  snippet: string;
  /** relevance within the wiki results, higher is better */
  score: number;
  lastUpdated?: string;
}

export interface SourceRefHit extends SourceHit {
  kind: "source";
}

export type MemoryHit = WikiHit | SourceRefHit;

export interface MemorySearchResult {
  query: string;
  scope: MemoryScope;
  /** false when nothing has been captured yet — there is no index to search */
  sourcesAvailable: boolean;
  /** snapshots in the index, not just the matching ones */
  indexedSnapshots: number;
  /** wiki pages scanned */
  scannedPages: number;
  /**
   * Wiki hits first, then source hits, each ranked within its kind. The two
   * scores measure different things (bm25 over the FTS index vs. weighted term
   * counts over a page) and are deliberately never interleaved.
   */
  results: MemoryHit[];
}

export type PageKind = "index" | "log" | "schema" | "wiki" | "source" | "other";

export interface PageContents {
  path: string;
  kind: PageKind;
  /** the snapshot number, when a `sources/...#N` citation was read */
  section?: number;
  text: string;
  /** true when `text` was cut at the byte cap */
  truncated: boolean;
  /** parsed frontmatter fields, when the file has any */
  frontmatter?: Record<string, FrontmatterValue>;
}

export interface IndexEntry {
  path: string;
  title: string | null;
  type: string | null;
  summary: string | null;
  lastUpdated: string | null;
  /** how many citations the page carries */
  sources: number;
}

export interface IndexListing {
  /** contents of index.md, or null when the memory has not been created yet */
  index: string | null;
  pages: IndexEntry[];
  /** page count per type, e.g. `{ person: 3, project: 1 }` */
  counts: Record<string, number>;
}

export interface WritePageInput {
  type: PageType;
  title: string;
  summary: string;
  /** citations; omitted on an update keeps the page's existing list */
  sources?: string[];
  /** markdown after the frontmatter; omitted keeps the existing body */
  body?: string;
  /** `YYYY-MM-DD`, required by daily pages (defaults to the title) */
  date?: string;
  /** overrides the path derived from type and title; must be under `wiki/` */
  path?: string;
}

export interface WritePageResult {
  path: string;
  created: boolean;
  lastUpdated: string;
  /** what happened to this page's line in index.md */
  indexEntry: "added" | "updated" | "unchanged";
  /** lint warnings this write introduced — advisory, the write went through */
  warnings: string[];
}

export interface AppendLogResult {
  path: string;
  timestamp: string;
  pass: LogPass;
  warnings: string[];
}

export interface MemoryOptions {
  /** the memory root, `~/Minne` (or MINNE_MEMORY_ROOT) */
  root: string;
  /** app support dir holding minne.db, which the app writes and we read */
  dataDir: string;
  /** injectable clock; `last_updated` and log timestamps come from here */
  now?: () => Date;
}

/** Largest slice of a file `read_page` returns before truncating. */
export const MAX_READ_CHARS = 40_000;
export const DEFAULT_SEARCH_LIMIT = 10;
export const MAX_SEARCH_LIMIT = 25;

/** Where a page of each type is listed in `index.md`. */
const INDEX_SECTIONS: Readonly<Record<PageType, string>> = {
  person: "People",
  project: "Projects",
  topic: "Topics",
  daily: "Daily logs",
};

/** The placeholder a bootstrapped index carries under every section. */
const EMPTY_SECTION = "_(none yet)_";

/**
 * The memory, as the agent may touch it. One instance per brain; cheap to
 * construct and holds no file handles, because the app writes this tree
 * underneath us and anything cached would be stale.
 */
export class Memory {
  readonly root: string;
  readonly dataDir: string;
  private readonly clock: () => Date;

  constructor(options: MemoryOptions) {
    this.root = options.root;
    this.dataDir = options.dataDir;
    this.clock = options.now ?? (() => new Date());
  }

  // ---- search ----

  /**
   * One query against both layers: FTS5 over the raw captures, and a scan over
   * the wiki pages. The wiki has no index of its own — a few hundred pages of
   * a few KB each is milliseconds to scan, and an index would be one more
   * thing to keep in sync with a tree the user is free to edit in Obsidian.
   */
  search(
    query: string,
    options: { limit?: number; scope?: MemoryScope } = {},
  ): MemorySearchResult {
    const scope = options.scope ?? "all";
    const limit = Math.min(Math.max(1, options.limit ?? DEFAULT_SEARCH_LIMIT), MAX_SEARCH_LIMIT);
    // Throws EmptyQueryError for a query with no searchable words, before
    // either half runs — the two must agree on what the terms are.
    const terms = queryTerms(query);

    const results: MemoryHit[] = [];
    let scannedPages = 0;
    if (scope !== "sources") {
      const wiki = this.searchWiki(terms, limit);
      scannedPages = wiki.scanned;
      results.push(...wiki.hits);
    }
    let sourcesAvailable = false;
    let indexedSnapshots = 0;
    if (scope !== "wiki") {
      const sources = searchSources(this.dataDir, query, limit);
      sourcesAvailable = sources.available;
      indexedSnapshots = sources.indexed;
      results.push(...sources.results.map((hit): SourceRefHit => ({ kind: "source", ...hit })));
    }
    return { query, scope, sourcesAvailable, indexedSnapshots, scannedPages, results };
  }

  private searchWiki(terms: string[], limit: number): { hits: WikiHit[]; scanned: number } {
    const matchers = termMatchers(terms);
    const tree = loadWikiTree(this.root, { includeSources: false });
    const hits: WikiHit[] = [];
    let scanned = 0;
    for (const [path, text] of Object.entries(tree.files)) {
      // Pages only. index.md lists every page and so matches nearly every
      // query, log.md is a diary of the agent's own doings, and SCHEMA.md is
      // the contract — all three are reached deliberately, by list_index or
      // read_page, not by turning up in a search for something else.
      if (!path.startsWith(`${WIKI_DIR}/`)) continue;
      scanned++;
      const front = tryParseFrontmatter(text);
      const body = front?.body ?? text;
      const title = stringField(front, "title") ?? path;
      const summary = stringField(front, "summary") ?? "";
      const score = scorePage(matchers, [
        [title, 4],
        [summary, 3],
        [path.replace(/\.md$/, ""), 2],
        [body, 1],
      ]);
      if (score === null) continue;
      const lastUpdated = stringField(front, "last_updated");
      hits.push({
        kind: "wiki",
        path,
        title,
        type: stringField(front, "type") ?? "unknown",
        summary,
        snippet: snippetFor(body, matchers),
        score,
        ...(lastUpdated === null ? {} : { lastUpdated }),
      });
    }
    hits.sort(
      (a, b) =>
        b.score - a.score ||
        (b.lastUpdated ?? "").localeCompare(a.lastUpdated ?? "") ||
        a.path.localeCompare(b.path),
    );
    return { hits: hits.slice(0, limit), scanned };
  }

  // ---- read ----

  /**
   * Reads a wiki page or a source file. A citation reads as a citation:
   * `sources/2026-08-17/1400-safari.md#3` returns snapshot 3 alone, which is
   * what the agent has in hand after a search and all it usually wants.
   */
  read(path: string, options: { maxChars?: number } = {}): PageContents {
    const { file, section } = splitCitation(path);
    const resolved = resolveInMemory(this.root, file);
    let stats;
    try {
      stats = statSync(resolved.absolute);
    } catch {
      throw new NotFoundError(
        `${resolved.relative} is not in this memory — use list_index or search_memory to find what is`,
      );
    }
    if (!stats.isFile()) {
      throw new NotFoundError(`${resolved.relative} is a directory, not a page`);
    }

    let text = readFileSync(resolved.absolute, "utf8");
    if (section !== null) text = extractSnapshot(text, section, resolved.relative);
    const cap = options.maxChars ?? MAX_READ_CHARS;
    const truncated = text.length > cap;
    if (truncated) text = `${text.slice(0, cap)}\n\n…truncated at ${cap} characters…\n`;

    const front = tryParseFrontmatter(text);
    return {
      path: section === null ? resolved.relative : `${resolved.relative}#${section}`,
      kind: kindOf(resolved.relative),
      ...(section === null ? {} : { section }),
      text,
      truncated,
      ...(front === null ? {} : { frontmatter: front.fields }),
    };
  }

  // ---- list ----

  /** `index.md` plus a one-line row per page, so the agent can plan a write. */
  listIndex(): IndexListing {
    const tree = loadWikiTree(this.root, { includeSources: false });
    const pages: IndexEntry[] = [];
    const counts: Record<string, number> = {};
    for (const [path, text] of Object.entries(tree.files)) {
      if (path === SCHEMA_FILE || path === INDEX_FILE || path === LOG_FILE) continue;
      const front = tryParseFrontmatter(text);
      const type = stringField(front, "type");
      const sources = front === null ? null : front.fields["sources"];
      pages.push({
        path,
        title: stringField(front, "title"),
        type,
        summary: stringField(front, "summary"),
        lastUpdated: stringField(front, "last_updated"),
        sources: Array.isArray(sources) ? sources.length : 0,
      });
      counts[type ?? "unknown"] = (counts[type ?? "unknown"] ?? 0) + 1;
    }
    pages.sort((a, b) => a.path.localeCompare(b.path));
    return { index: tree.files[INDEX_FILE] ?? null, pages, counts };
  }

  // ---- write ----

  /**
   * Creates or updates one wiki page, and keeps `index.md` pointing at it.
   *
   * The frontmatter is rendered here rather than taken from the model: the
   * required fields are always present and `last_updated` is always the clock's,
   * so "the agent forgot to bump the date" is not a failure mode that exists.
   * The body is the model's, minus the frontmatter it never gets to write.
   */
  writePage(input: WritePageInput): WritePageResult {
    if (!PAGE_TYPES.includes(input.type)) {
      throw new SchemaViolationError(
        `"${input.type}" is not a page type (expected ${PAGE_TYPES.join(", ")})`,
        [],
      );
    }
    const title = input.title.trim();
    if (title === "") throw new SchemaViolationError("a page needs a non-empty title", []);
    const summary = collapse(input.summary);
    if (summary === "") throw new SchemaViolationError("a page needs a non-empty summary", []);

    bootstrapWiki(this.root);
    const resolved = this.resolveWikiPage(input.path ?? pagePath(input.type, title));
    const before = loadWikiTree(this.root);
    const existing = before.files[resolved.relative];
    const created = existing === undefined;

    const now = this.clock();
    const lastUpdated = localDate(now);
    const page = this.composePage(input, { title, summary, lastUpdated, existing });
    const index = updateIndex(before.files[INDEX_FILE] ?? "", {
      type: input.type,
      title,
      summary,
      previousTitle: created ? null : stringField(tryParseFrontmatter(existing), "title"),
      lastUpdated,
    });

    const after: WikiTree = {
      files: { ...before.files, [resolved.relative]: page, [INDEX_FILE]: index.text },
      ...(before.sources === undefined ? {} : { sources: before.sources }),
    };
    const introduced = introducedIssues(before, after);
    const mine = introduced.filter(
      (issue) => issue.path === resolved.relative || issue.path === INDEX_FILE,
    );
    const errors = mine.filter((issue) => issue.severity === "error");
    if (errors.length > 0) {
      throw new SchemaViolationError(
        `write refused — ${resolved.relative} would not satisfy SCHEMA.md:\n${errors
          .map(formatIssue)
          .join("\n")}`,
        errors,
      );
    }

    writeFile(resolved, page);
    if (index.text !== before.files[INDEX_FILE]) {
      writeFile(resolveInMemory(this.root, INDEX_FILE), index.text);
    }
    return {
      path: resolved.relative,
      created,
      lastUpdated,
      indexEntry: index.entry,
      warnings: mine.filter((issue) => issue.severity === "warning").map(formatIssue),
    };
  }

  /**
   * Appends one entry to `log.md`. The heading — timestamp and pass — belongs
   * to the tool; the model writes the prose underneath it.
   */
  appendLog(pass: LogPass, message: string): AppendLogResult {
    const prose = message.trim();
    if (prose === "") throw new SchemaViolationError("a log entry needs something to say", []);

    bootstrapWiki(this.root);
    const before = loadWikiTree(this.root);
    const existing = before.files[LOG_FILE] ?? "";
    const timestamp = isoLocal(this.clock());
    const separator = existing === "" || existing.endsWith("\n") ? "\n" : "\n\n";
    const text = `${existing}${separator}## ${timestamp} — ${pass}\n\n${prose}\n`;

    const after: WikiTree = {
      files: { ...before.files, [LOG_FILE]: text },
      ...(before.sources === undefined ? {} : { sources: before.sources }),
    };
    const mine = introducedIssues(before, after).filter((issue) => issue.path === LOG_FILE);
    const errors = mine.filter((issue) => issue.severity === "error");
    if (errors.length > 0) {
      throw new SchemaViolationError(
        `log entry refused — it would not satisfy SCHEMA.md:\n${errors.map(formatIssue).join("\n")}`,
        errors,
      );
    }

    writeFile(resolveInMemory(this.root, LOG_FILE), text);
    return {
      path: LOG_FILE,
      timestamp,
      pass,
      warnings: mine.filter((issue) => issue.severity === "warning").map(formatIssue),
    };
  }

  /** Refuses anything that is not a markdown file under `wiki/`. */
  private resolveWikiPage(path: string): ResolvedPath {
    const resolved = resolveInMemory(this.root, path);
    if (!resolved.relative.startsWith(`${WIKI_DIR}/`)) {
      throw new SchemaViolationError(
        `write_page only writes under ${WIKI_DIR}/ — "${resolved.relative}" is outside it ` +
          `(index.md is maintained for you, log.md is written with append_log, ` +
          `SCHEMA.md and sources/ are not the agent's to edit)`,
        [],
      );
    }
    if (!resolved.relative.endsWith(".md")) {
      throw new SchemaViolationError(`"${resolved.relative}" is not a markdown page`, []);
    }
    return resolved;
  }

  /**
   * Renders the page text. A new page starts from its type's template, so it
   * arrives with the headings the schema expects; an existing page keeps its
   * frontmatter — including fields we know nothing about, like a project's
   * `status` — with only the managed ones rewritten.
   */
  private composePage(
    input: WritePageInput,
    context: { title: string; summary: string; lastUpdated: string; existing: string | undefined },
  ): string {
    const { title, summary, lastUpdated, existing } = context;
    const base =
      existing === undefined
        ? parseFrontmatter(
            // The template is what refuses a daily page with no date; its
            // complaint is for the model, so it arrives as a schema violation.
            fromTemplate(() =>
              renderPage(input.type, {
                title,
                summary,
                sources: input.sources ?? [],
                lastUpdated,
                ...(input.date === undefined ? {} : { date: input.date }),
              }),
            ),
          )
        : tryParseFrontmatter(existing);
    if (base === null) {
      throw new SchemaViolationError(
        `${input.path ?? pagePath(input.type, title)} has frontmatter this schema cannot read; ` +
          `pass the full replacement body to rewrite the page`,
        [],
      );
    }

    const fields: Record<string, FrontmatterValue> = { ...base.fields };
    fields["title"] = title;
    fields["type"] = input.type;
    fields["summary"] = summary;
    if (input.sources !== undefined) fields["sources"] = input.sources;
    else if (!Array.isArray(fields["sources"])) fields["sources"] = [];
    fields["last_updated"] = lastUpdated;
    if (input.type === "daily") {
      const date = input.date ?? (typeof fields["date"] === "string" ? fields["date"] : title);
      if (!DATE_PATTERN.test(date)) {
        throw new SchemaViolationError(
          `a daily page needs a "date" of the form YYYY-MM-DD, got "${date}"`,
          [],
        );
      }
      fields["date"] = date;
    }

    const body = input.body === undefined ? base.body : `\n${input.body.trim()}\n`;
    const lines = Object.entries(fields).map(([key, value]) => `${key}: ${renderValue(value)}`);
    return `---\n${lines.join("\n")}\n---\n${body}`;
  }
}

// ---- index.md ----

interface IndexUpdate {
  type: PageType;
  title: string;
  summary: string;
  /** the page's title before this write, when it had one */
  previousTitle: string | null;
  lastUpdated: string;
}

/**
 * Puts (or moves) one `- [[Title]] — summary` line under the section for the
 * page's type, so a page the agent creates is reachable from `index.md` the
 * moment it exists. Everything else in the file — the user's prose, their own
 * sections, their ordering — is left exactly as it was.
 */
export function updateIndex(
  index: string,
  update: IndexUpdate,
): { text: string; entry: "added" | "updated" | "unchanged" } {
  const entryLine = `- [[${update.title}]] — ${update.summary}`;
  const lines = (index === "" ? "# Index\n" : index).split("\n");

  // The page's existing line, found by either title so a rename moves it.
  const names = [update.title, update.previousTitle].filter((name) => name !== null);
  const existingAt = lines.findIndex((line) => names.some((name) => isEntryFor(line, name)));
  const stale = existingAt >= 0 && !inSection(lines, existingAt, INDEX_SECTIONS[update.type]);
  // A page that changed type has its line under the wrong heading; drop it and
  // let the insert below put it where it now belongs.
  if (stale) lines.splice(existingAt, 1);

  let entry: "added" | "updated" | "unchanged";
  if (existingAt >= 0 && !stale) {
    entry = lines[existingAt] === entryLine ? "unchanged" : "updated";
    lines[existingAt] = entryLine;
  } else {
    entry = stale ? "updated" : "added";
    insertInSection(lines, INDEX_SECTIONS[update.type], entryLine);
  }

  return { text: stampIndexDate(lines.join("\n"), update.lastUpdated), entry };
}

/** Lines of the `## <heading>` section: `[start, end)`, excluding the heading. */
function sectionRange(lines: string[], heading: string): { start: number; end: number } | null {
  const at = lines.findIndex((line) => line.trim().toLowerCase() === `## ${heading}`.toLowerCase());
  if (at < 0) return null;
  let end = at + 1;
  while (end < lines.length && !/^##\s/.test(lines[end] as string)) end++;
  return { start: at + 1, end };
}

function inSection(lines: string[], at: number, heading: string): boolean {
  const section = sectionRange(lines, heading);
  return section !== null && at >= section.start && at < section.end;
}

/** Adds `entryLine` under `## <heading>`, creating the section if it is missing. */
function insertInSection(lines: string[], heading: string, entryLine: string): void {
  let section = sectionRange(lines, heading);
  if (section === null) {
    if (lines.at(-1) !== "") lines.push("");
    lines.push(`## ${heading}`, "");
    section = { start: lines.length, end: lines.length };
  }
  for (let i = section.start; i < section.end; i++) {
    if ((lines[i] as string).trim() === EMPTY_SECTION) {
      lines[i] = entryLine;
      return;
    }
  }
  // After the section's last non-blank line, so the trailing blank that
  // separates it from the next heading stays where it is.
  let at = section.start - 1;
  for (let i = section.end - 1; i >= section.start; i--) {
    if ((lines[i] as string).trim() !== "") {
      at = i;
      break;
    }
  }
  lines.splice(at + 1, 0, entryLine);
}

function isEntryFor(line: string, title: string): boolean {
  const match = /^\s*[-*]\s*\[\[([^\]|]+)(\|[^\]]*)?\]\]/.exec(line);
  return match !== null && (match[1] as string).trim().toLowerCase() === title.toLowerCase();
}

/** Rewrites `last_updated` in the index's frontmatter, if it has any. */
function stampIndexDate(text: string, date: string): string {
  const front = tryParseFrontmatter(text);
  if (front === null || !("last_updated" in front.fields)) return text;
  const line = front.lines["last_updated"];
  if (line === undefined) return text;
  const lines = text.split("\n");
  lines[line - 1] = `last_updated: ${date}`;
  return lines.join("\n");
}

// ---- lint diffing ----

/**
 * Issues present after a write that were not present before it.
 *
 * Keyed by code, path and detail rather than by line, so a line number shifting
 * because the index grew a row does not read as a new problem — and a wiki the
 * user has already broken somewhere else never blocks a write.
 */
function introducedIssues(before: WikiTree, after: WikiTree): LintIssue[] {
  const key = (issue: LintIssue) => `${issue.code} ${issue.path} ${issue.detail ?? ""}`;
  const baseline = new Set(lintWiki(before).issues.map(key));
  return lintWiki(after).issues.filter((issue) => !baseline.has(key(issue)));
}

/** `wiki/oslo-trip.md:4 [broken_link] …` — one issue, for a tool result. */
function formatIssue(issue: LintIssue): string {
  const where = issue.line === undefined ? issue.path : `${issue.path}:${issue.line}`;
  return `${where} [${issue.code}] ${issue.message}`;
}

// ---- text helpers ----

/** Case-insensitive whole-word matchers, one per query term (`foo*` = prefix). */
function termMatchers(terms: string[]): RegExp[] {
  const wordChar = "[\\p{L}\\p{N}_]";
  return terms.map((term) => {
    const prefix = term.endsWith("*");
    const word = (prefix ? term.slice(0, -1) : term).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(?<!${wordChar})${word}${prefix ? `${wordChar}*` : `(?!${wordChar})`}`, "giu");
  });
}

/**
 * Weighted term count over a page's fields, or null when a term is missing
 * entirely — terms are ANDed, matching what FTS5 does with the same query.
 * Repeats past the third are not counted, so one page saying "Oslo" forty
 * times does not outrank the page that is actually about Oslo.
 */
function scorePage(matchers: RegExp[], fields: [string, number][]): number | null {
  let total = 0;
  for (const matcher of matchers) {
    let found = 0;
    for (const [text, weight] of fields) {
      const count = countMatches(text, matcher);
      if (count > 0) found += weight * Math.min(count, 3);
    }
    if (found === 0) return null;
    total += found;
  }
  return total;
}

function countMatches(text: string, matcher: RegExp): number {
  matcher.lastIndex = 0;
  let count = 0;
  while (matcher.exec(text) !== null) count++;
  matcher.lastIndex = 0;
  return count;
}

const SNIPPET_WIDTH = 240;

/**
 * A matching line, trimmed to a window and with the terms in bold. Prose is
 * preferred over a heading: `# Oslo Trip` matches every query about Oslo and
 * says nothing the title has not already said.
 */
function snippetFor(body: string, matchers: RegExp[]): string {
  let fallback = "";
  for (const line of body.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed === "") continue;
    let at = -1;
    for (const matcher of matchers) {
      matcher.lastIndex = 0;
      const match = matcher.exec(trimmed);
      matcher.lastIndex = 0;
      if (match && (at < 0 || match.index < at)) at = match.index;
    }
    if (at < 0) continue;
    const start = Math.max(0, at - SNIPPET_WIDTH / 4);
    const window = trimmed.slice(start, start + SNIPPET_WIDTH);
    const text = matchers.reduce(
      (acc, matcher) => acc.replace(matcher, (m) => `**${m}**`),
      `${start > 0 ? "…" : ""}${window}${start + SNIPPET_WIDTH < trimmed.length ? "…" : ""}`,
    );
    if (!trimmed.startsWith("#")) return text;
    if (fallback === "") fallback = text;
  }
  return fallback;
}

/** `sources/…/1400-mail.md#3` → the file and the snapshot number. */
function splitCitation(path: string): { file: string; section: number | null } {
  const hash = path.lastIndexOf("#");
  if (hash < 0) return { file: path, section: null };
  const fragment = path.slice(hash + 1);
  if (!/^\d+$/.test(fragment)) {
    throw new NotFoundError(
      `"${path}" is not a path or a citation — a citation ends in "#<snapshot number>"`,
    );
  }
  return { file: path.slice(0, hash), section: Number(fragment) };
}

/** One `## Snapshot N` section of a source file, heading included. */
function extractSnapshot(text: string, section: number, path: string): string {
  const lines = text.split("\n");
  const start = lines.findIndex((line) => new RegExp(`^##\\s+Snapshot\\s+${section}\\b`).test(line));
  if (start < 0) {
    const available = lines
      .map((line) => /^##\s+Snapshot\s+(\d+)\b/.exec(line)?.[1])
      .filter((n): n is string => n !== undefined);
    throw new NotFoundError(
      `${path} has no snapshot ${section}${available.length > 0 ? ` (it has ${available.join(", ")})` : ""}`,
    );
  }
  let end = start + 1;
  while (end < lines.length && !/^##\s+Snapshot\s+\d+/.test(lines[end] as string)) end++;
  return lines.slice(start, end).join("\n").trimEnd() + "\n";
}

function kindOf(relative: string): PageKind {
  if (relative === INDEX_FILE) return "index";
  if (relative === LOG_FILE) return "log";
  if (relative === SCHEMA_FILE) return "schema";
  if (relative.startsWith(`${WIKI_DIR}/`)) return "wiki";
  if (relative.startsWith("sources/")) return "source";
  return "other";
}

function writeFile(resolved: ResolvedPath, contents: string): void {
  mkdirSync(dirname(resolved.absolute), { recursive: true });
  writeFileSync(resolved.absolute, contents);
}

function fromTemplate(render: () => string): string {
  try {
    return render();
  } catch (err) {
    throw new SchemaViolationError(err instanceof Error ? err.message : String(err), []);
  }
}

function tryParseFrontmatter(text: string | undefined): Frontmatter | null {
  if (text === undefined) return null;
  try {
    return parseFrontmatter(text);
  } catch {
    return null;
  }
}

function stringField(front: Frontmatter | null, key: string): string | null {
  const value = front?.fields[key];
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

/** A summary is one line: newlines in frontmatter would break the parser. */
function collapse(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/** `2026-08-17T14:31:07+02:00` — local time, as SCHEMA.md's log entries show. */
export function isoLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const offset = -date.getTimezoneOffset();
  const sign = offset < 0 ? "-" : "+";
  const magnitude = Math.abs(offset);
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}` +
    `${sign}${pad(Math.floor(magnitude / 60))}:${pad(magnitude % 60)}`
  );
}

/** `last_updated` is the user's calendar day, not UTC's. */
export function localDate(date: Date): string {
  return isoLocal(date).slice(0, 10);
}
