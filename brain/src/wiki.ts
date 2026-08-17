// The wiki contract, in code: what SCHEMA.md promises, expressed as constants
// the brain can enforce.
//
// The prose lives in `brain/templates/` and is imported here as text, so the
// file the user reads in `~/Minne/SCHEMA.md` and the rules the linter applies
// come from the same source. `bun build --compile` embeds the templates in the
// binary, so a shipped brain carries them with no files alongside.
//
// The Swift app seeds `~/Minne` on first run (app/Sources/Minne/MemorySeed.swift)
// and holds a copy of the three bootstrap templates so it can seed without the
// brain running; MemorySeedTests compares its copy against these files, so the
// two can never drift.
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, posix } from "node:path";
import { renderValue, type FrontmatterValue } from "./frontmatter";
import schemaTemplate from "../templates/SCHEMA.md" with { type: "text" };
import indexTemplate from "../templates/index.md" with { type: "text" };
import logTemplate from "../templates/log.md" with { type: "text" };
import personTemplate from "../templates/person.md" with { type: "text" };
import projectTemplate from "../templates/project.md" with { type: "text" };
import topicTemplate from "../templates/topic.md" with { type: "text" };
import dailyTemplate from "../templates/daily.md" with { type: "text" };

export const SCHEMA_FILE = "SCHEMA.md";
export const INDEX_FILE = "index.md";
export const LOG_FILE = "log.md";
export const WIKI_DIR = "wiki";
export const SOURCES_DIR = "sources";
export const DAILY_DIR = posix.join(WIKI_DIR, "daily");

/** Page types the agent may create. */
export const PAGE_TYPES = ["person", "project", "topic", "daily"] as const;
export type PageType = (typeof PAGE_TYPES)[number];

/** Page types plus the two structural pages at the memory root. */
export type WikiPageType = PageType | "index" | "log";

/**
 * Frontmatter every page of a type must carry. `index` and `log` are the two
 * root pages: they are navigation, not memory, so they cite nothing.
 */
export const REQUIRED_FIELDS: Record<WikiPageType, readonly string[]> = {
  person: ["title", "type", "summary", "sources", "last_updated"],
  project: ["title", "type", "summary", "sources", "last_updated"],
  topic: ["title", "type", "summary", "sources", "last_updated"],
  daily: ["title", "type", "summary", "sources", "last_updated", "date"],
  index: ["title", "type", "summary", "last_updated"],
  log: ["title", "type", "summary"],
};

/** Kinds of pass that may appear in a `log.md` entry heading. */
export const LOG_PASSES = ["bootstrap", "sync", "lint", "chat"] as const;
export type LogPass = (typeof LOG_PASSES)[number];

/**
 * `sources/2026-08-17/1400-safari.md#3` — a source file and a snapshot number.
 * App slugs come from the app's own name, so they can hold any letter or
 * digit, not just ASCII (see SourceDocument.slugify in the app).
 */
export const CITATION_PATTERN = /^sources\/\d{4}-\d{2}-\d{2}\/\d{4}-[\p{L}\p{N}-]+\.md#\d+$/u;

/** `YYYY-MM-DD`, optionally followed by a time — what `last_updated` holds. */
export const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?$/;

/** `## 2026-08-17T14:31:07+02:00 — sync` */
export const LOG_ENTRY_PATTERN = /^##\s+(\S+)\s+—\s+(.+?)\s*$/;

/** The files a fresh memory starts with, keyed by memory-root-relative path. */
export const BOOTSTRAP_FILES: Readonly<Record<string, string>> = {
  [SCHEMA_FILE]: schemaTemplate,
  [INDEX_FILE]: indexTemplate,
  [LOG_FILE]: logTemplate,
};

/** Starting point for a new page of each type; `{{placeholders}}` filled by `renderPage`. */
export const PAGE_TEMPLATES: Readonly<Record<PageType, string>> = {
  person: personTemplate,
  project: projectTemplate,
  topic: topicTemplate,
  daily: dailyTemplate,
};

export interface PageValues {
  title: string;
  summary: string;
  /** citations in `sources/YYYY-MM-DD/HHmm-app.md#N` form; may be empty */
  sources: string[];
  /** `YYYY-MM-DD` or an ISO timestamp; defaults to today */
  lastUpdated?: string;
  /** required for `daily`, ignored otherwise */
  date?: string;
}

/**
 * Fills a page template.
 *
 * Placeholders inside the frontmatter block are rendered as YAML (quoted when
 * the value needs it); the same placeholder in the body is substituted
 * literally, because `# {{title}}` is a heading, not a scalar.
 */
export function renderPage(type: PageType, values: PageValues): string {
  const date = values.date ?? (type === "daily" ? values.title : undefined);
  if (type === "daily" && (date === undefined || !DATE_PATTERN.test(date))) {
    throw new Error(`a daily page needs a "date" of the form YYYY-MM-DD, got ${date ?? "none"}`);
  }
  const fields: Record<string, FrontmatterValue> = {
    title: values.title,
    summary: values.summary,
    sources: values.sources,
    last_updated: values.lastUpdated ?? today(),
    ...(date === undefined ? {} : { date }),
  };

  const template = PAGE_TEMPLATES[type];
  const end = template.indexOf("\n---", 3);
  if (end < 0) throw new Error(`template for "${type}" has no closing frontmatter fence`);
  const head = substitute(template.slice(0, end), (key) => {
    const value = fields[key];
    return value === undefined ? undefined : renderValue(value);
  });
  const body = substitute(template.slice(end), (key) => {
    const value = fields[key];
    return typeof value === "string" ? value : undefined;
  });
  const rendered = head + body;
  const leftover = /\{\{(\w+)\}\}/.exec(rendered);
  if (leftover) throw new Error(`template for "${type}" has no value for {{${leftover[1]}}}`);
  return rendered;
}

/** `Ingrid Berg` → `ingrid-berg`: the file name a page of that title gets. */
export function slugify(title: string): string {
  const slug = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return slug === "" ? "page" : slug.slice(0, 60).replace(/-+$/g, "");
}

/** Where a page of this type and title belongs, relative to the memory root. */
export function pagePath(type: PageType, title: string): string {
  const file = `${slugify(title)}.md`;
  return posix.join(type === "daily" ? DAILY_DIR : WIKI_DIR, file);
}

export interface WikiLink {
  /** the text between the brackets, before any `|` */
  target: string;
  /** 1-based line it appears on */
  line: number;
}

/**
 * Every `[[wikilink]]` in `text`, with the line it sits on. Links inside
 * fenced code blocks are skipped — a page quoting markdown is not linking.
 */
export function wikiLinks(text: string): WikiLink[] {
  const links: WikiLink[] = [];
  let fence: string | null = null;
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i] as string;
    const fenceMatch = /^\s*(`{3,}|~{3,})/.exec(raw);
    if (fenceMatch) {
      const marker = fenceMatch[1] as string;
      if (fence === null) fence = marker;
      else if (marker.startsWith(fence[0] as string) && marker.length >= fence.length) fence = null;
      continue;
    }
    if (fence !== null) continue;
    for (const match of raw.matchAll(/\[\[([^\]|\n]+)(?:\|[^\]\n]*)?\]\]/g)) {
      links.push({ target: (match[1] as string).trim(), line: i + 1 });
    }
  }
  return links;
}

/**
 * Creates the memory root and the three bootstrap files if they are missing.
 * Idempotent and additive: a file that already exists is left alone, because
 * from the moment the user or the agent has edited it, it is theirs.
 *
 * The Swift app seeds the same files on first capture; whichever runs first
 * wins and the other finds its work done.
 */
export function bootstrapWiki(root: string): string[] {
  const created: string[] = [];
  mkdirSync(join(root, WIKI_DIR), { recursive: true });
  for (const [relative, contents] of Object.entries(BOOTSTRAP_FILES)) {
    const path = join(root, relative);
    try {
      writeFileSync(path, contents, { flag: "wx" });
      created.push(relative);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "EEXIST") throw err;
    }
  }
  return created;
}

export interface WikiTree {
  /** memory-root-relative path (`index.md`, `wiki/oslo-trip.md`) to file text */
  files: Record<string, string>;
  /**
   * Source files present on disk, memory-root-relative and without the
   * `#section`. Undefined when the tree was not read from a directory, in
   * which case citations are checked for form only.
   */
  sources?: Set<string>;
}

/** Reads a memory root into a `WikiTree`, ready for `lintWiki`. */
export function loadWikiTree(root: string): WikiTree {
  const files: Record<string, string> = {};
  for (const relative of [SCHEMA_FILE, INDEX_FILE, LOG_FILE]) {
    const text = readIfPresent(join(root, relative));
    if (text !== null) files[relative] = text;
  }
  for (const relative of markdownUnder(root, WIKI_DIR)) {
    const text = readIfPresent(join(root, relative));
    if (text !== null) files[relative] = text;
  }
  return { files, sources: new Set(markdownUnder(root, SOURCES_DIR)) };
}

/**
 * Every `.md` file under `root/directory`, as memory-root-relative paths.
 * Walked by hand rather than with a recursive readdir so the returned paths
 * are relative by construction, and a missing directory reads as empty.
 */
function markdownUnder(root: string, directory: string): string[] {
  let entries;
  try {
    entries = readdirSync(join(root, directory), { withFileTypes: true });
  } catch {
    return [];
  }
  const found: string[] = [];
  for (const entry of entries.sort((a, b) => (a.name < b.name ? -1 : 1))) {
    const relative = posix.join(directory, entry.name);
    if (entry.isDirectory()) found.push(...markdownUnder(root, relative));
    else if (entry.isFile() && entry.name.endsWith(".md")) found.push(relative);
  }
  return found;
}

function readIfPresent(path: string): string | null {
  try {
    return readFileSync(path, "utf8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

/** Writes a page, creating its directory. Used by bootstrap and the tests. */
export function writePage(root: string, relative: string, contents: string): void {
  const path = join(root, relative);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, contents);
}

function substitute(text: string, lookup: (key: string) => string | undefined): string {
  return text.replace(/\{\{(\w+)\}\}/g, (all, key: string) => lookup(key) ?? all);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}
