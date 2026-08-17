// wiki-lint: does this memory still obey SCHEMA.md?
//
// A pure function over an in-memory file map (`loadWikiTree` in wiki.ts does
// the reading). The agent is the only writer of the wiki and it forgets, so
// the wiki needs a check that is cheap enough to run after every sync and
// specific enough to be fixed automatically — which is what US-012's
// maintenance pass feeds back to the model.
//
// Errors vs warnings is the useful distinction there:
//
//   error   — the file is malformed or points at something that does not
//             exist. A reader (human, agent, or Obsidian) hits a dead end.
//   warning — the wiki is valid but drifting: an orphaned page, a page with
//             no citations, a citation whose source has since been pruned.
//             Worth fixing, never worth refusing a write over.
//
// So `write_page` (US-011) may reject on errors, and the maintenance job works
// through the warnings.
import { FrontmatterError, parseFrontmatter, type Frontmatter } from "./frontmatter";
import {
  CITATION_PATTERN,
  DATE_PATTERN,
  INDEX_FILE,
  LOG_ENTRY_PATTERN,
  LOG_FILE,
  LOG_PASSES,
  PAGE_TYPES,
  REQUIRED_FIELDS,
  SCHEMA_FILE,
  WIKI_DIR,
  wikiLinks,
  type WikiPageType,
  type WikiTree,
} from "./wiki";

export type Severity = "error" | "warning";

export type LintCode =
  | "index_missing"
  | "log_missing"
  | "schema_missing"
  | "frontmatter_invalid"
  | "type_missing"
  | "type_unknown"
  | "field_missing"
  | "field_invalid"
  | "duplicate_title"
  | "broken_link"
  | "citation_invalid"
  | "citation_missing"
  | "log_entry_invalid"
  | "log_pass_unknown"
  | "no_sources"
  | "orphan";

export const SEVERITIES: Readonly<Record<LintCode, Severity>> = {
  index_missing: "error",
  log_missing: "error",
  schema_missing: "warning",
  frontmatter_invalid: "error",
  type_missing: "error",
  type_unknown: "error",
  field_missing: "error",
  field_invalid: "error",
  duplicate_title: "error",
  broken_link: "error",
  citation_invalid: "error",
  // A cited source can be pruned by retention while the page keeps what it
  // learned — expected, not broken.
  citation_missing: "warning",
  log_entry_invalid: "error",
  log_pass_unknown: "warning",
  no_sources: "warning",
  orphan: "warning",
};

export interface LintIssue {
  code: LintCode;
  severity: Severity;
  /** memory-root-relative path of the offending file */
  path: string;
  message: string;
  /** 1-based line, when the problem has one */
  line?: number;
  /** the offending token — a link target, a citation, a field name */
  detail?: string;
}

export interface LintReport {
  /** no errors; warnings may still be present */
  ok: boolean;
  /** pages linted (the two root pages plus everything under `wiki/`) */
  pages: number;
  /** every issue, in file order */
  issues: LintIssue[];
  errors: LintIssue[];
  warnings: LintIssue[];
}

interface LintedPage {
  path: string;
  type: WikiPageType | null;
  frontmatter: Frontmatter | null;
  title: string | null;
}

/** Validates a wiki tree against SCHEMA.md. Pure: no I/O, no clock. */
export function lintWiki(tree: WikiTree): LintReport {
  const issues: LintIssue[] = [];
  const add = (
    code: LintCode,
    path: string,
    message: string,
    extra: { line?: number; detail?: string } = {},
  ) => {
    issues.push({
      code,
      severity: SEVERITIES[code],
      path,
      message,
      ...(extra.line === undefined ? {} : { line: extra.line }),
      ...(extra.detail === undefined ? {} : { detail: extra.detail }),
    });
  };

  const files = tree.files;
  if (!(INDEX_FILE in files)) {
    add("index_missing", INDEX_FILE, "the wiki has no index.md — nothing is reachable");
  }
  if (!(LOG_FILE in files)) {
    add("log_missing", LOG_FILE, "the wiki has no log.md");
  }
  if (!(SCHEMA_FILE in files)) {
    add("schema_missing", SCHEMA_FILE, "the memory has no SCHEMA.md — the agent has no contract");
  }

  const pagePaths = Object.keys(files)
    .filter(isLintedPage)
    .sort();
  const pages: LintedPage[] = [];

  for (const path of pagePaths) {
    const text = files[path] as string;
    let frontmatter: Frontmatter | null = null;
    try {
      frontmatter = parseFrontmatter(text);
    } catch (err) {
      const line = err instanceof FrontmatterError ? err.line : 1;
      add("frontmatter_invalid", path, (err as Error).message, { line });
    }
    const type = frontmatter === null ? null : checkType(path, frontmatter, add);
    if (frontmatter !== null && type !== null) {
      checkFields(path, type, frontmatter, tree, add);
    }
    const title = frontmatter === null ? null : stringField(frontmatter, "title");
    pages.push({ path, type, frontmatter, title });
    checkBody(path, text, tree, add);
  }

  checkDuplicateTitles(pages, add);
  if (LOG_FILE in files) checkLog(files[LOG_FILE] as string, add);
  checkReachability(files, pages, add);

  const errors = issues.filter((issue) => issue.severity === "error");
  const warnings = issues.filter((issue) => issue.severity === "warning");
  return { ok: errors.length === 0, pages: pages.length, issues, errors, warnings };
}

/** One line per issue, for a log or a prompt. */
export function formatLintReport(report: LintReport): string {
  if (report.issues.length === 0) return `wiki-lint: ${report.pages} pages, no issues`;
  const lines = report.issues.map((issue) => {
    const where = issue.line === undefined ? issue.path : `${issue.path}:${issue.line}`;
    return `${issue.severity === "error" ? "error" : "warn "} ${where} [${issue.code}] ${issue.message}`;
  });
  return [
    `wiki-lint: ${report.pages} pages, ${report.errors.length} errors, ${report.warnings.length} warnings`,
    ...lines,
  ].join("\n");
}

type Add = (
  code: LintCode,
  path: string,
  message: string,
  extra?: { line?: number; detail?: string },
) => void;

function isLintedPage(path: string): boolean {
  if (path === INDEX_FILE || path === LOG_FILE) return true;
  return path.startsWith(`${WIKI_DIR}/`) && path.endsWith(".md");
}

/** The type a file claims, checked against the type its location allows. */
function checkType(path: string, frontmatter: Frontmatter, add: Add): WikiPageType | null {
  const declared = stringField(frontmatter, "type");
  const line = frontmatter.lines["type"];
  if (declared === null) {
    add("type_missing", path, "no `type` in frontmatter", { line: line ?? 1 });
    return null;
  }
  const expected: readonly string[] =
    path === INDEX_FILE ? ["index"] : path === LOG_FILE ? ["log"] : PAGE_TYPES;
  if (!expected.includes(declared)) {
    add(
      "type_unknown",
      path,
      `type "${declared}" is not allowed here (expected ${expected.join(", ")})`,
      { line: line ?? 1, detail: declared },
    );
    return null;
  }
  return declared as WikiPageType;
}

function checkFields(
  path: string,
  type: WikiPageType,
  frontmatter: Frontmatter,
  tree: WikiTree,
  add: Add,
): void {
  for (const field of REQUIRED_FIELDS[type]) {
    const value = frontmatter.fields[field];
    const line = frontmatter.lines[field] ?? 1;
    if (field === "sources") {
      if (!Array.isArray(value)) {
        add("field_missing", path, "`sources` must be a list of citations (`[]` when none yet)", {
          line,
          detail: field,
        });
        continue;
      }
      if (value.length === 0) {
        add("no_sources", path, "page cites no sources", { line });
      }
      for (const citation of value) checkCitation(path, citation, line, tree, add);
      continue;
    }
    if (field === "last_updated") {
      // A freshly bootstrapped index has never been written to.
      if (value === null && path === INDEX_FILE) continue;
      if (typeof value !== "string" || !DATE_PATTERN.test(value)) {
        add("field_invalid", path, "`last_updated` must be YYYY-MM-DD or an ISO timestamp", {
          line,
          detail: field,
        });
      }
      continue;
    }
    if (field === "date") {
      if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        add("field_invalid", path, "`date` must be YYYY-MM-DD", { line, detail: field });
      }
      continue;
    }
    if (typeof value !== "string" || value.trim() === "") {
      add("field_missing", path, `\`${field}\` is required and must not be empty`, {
        line,
        detail: field,
      });
    }
  }
}

function checkCitation(
  path: string,
  citation: string,
  line: number,
  tree: WikiTree,
  add: Add,
): void {
  if (!CITATION_PATTERN.test(citation)) {
    add("citation_invalid", path, `"${citation}" is not a source citation`, {
      line,
      detail: citation,
    });
    return;
  }
  const file = citation.slice(0, citation.indexOf("#"));
  if (tree.sources !== undefined && !tree.sources.has(file)) {
    add("citation_missing", path, `cited source ${file} is not on disk (pruned?)`, {
      line,
      detail: citation,
    });
  }
}

/** Inline citations in the body — SCHEMA.md asks for them in backticks. */
function checkBody(path: string, text: string, tree: WikiTree, add: Add): void {
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    for (const match of (lines[i] as string).matchAll(/`(sources\/[^`\s]+)`/g)) {
      checkCitation(path, match[1] as string, i + 1, tree, add);
    }
  }
}

function checkDuplicateTitles(pages: LintedPage[], add: Add): void {
  const byTitle = new Map<string, string[]>();
  for (const page of pages) {
    if (page.title === null) continue;
    const key = page.title.toLowerCase();
    byTitle.set(key, [...(byTitle.get(key) ?? []), page.path]);
  }
  for (const [, paths] of byTitle) {
    if (paths.length < 2) continue;
    for (const path of paths) {
      const others = paths.filter((other) => other !== path).join(", ");
      add("duplicate_title", path, `title is shared with ${others} — wikilinks cannot resolve`);
    }
  }
}

function checkLog(text: string, add: Add): void {
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i] as string;
    if (!raw.startsWith("## ")) continue;
    const match = LOG_ENTRY_PATTERN.exec(raw);
    if (!match) {
      add("log_entry_invalid", LOG_FILE, "entry heading must be `## <ISO timestamp> — <pass>`", {
        line: i + 1,
      });
      continue;
    }
    const timestamp = match[1] as string;
    const pass = match[2] as string;
    if (Number.isNaN(Date.parse(timestamp))) {
      add("log_entry_invalid", LOG_FILE, `"${timestamp}" is not an ISO 8601 timestamp`, {
        line: i + 1,
        detail: timestamp,
      });
    }
    if (!(LOG_PASSES as readonly string[]).includes(pass)) {
      add("log_pass_unknown", LOG_FILE, `unknown pass "${pass}"`, { line: i + 1, detail: pass });
    }
  }
}

/**
 * Resolves every `[[wikilink]]` and walks the wiki from `index.md`.
 *
 * A link may name a page's title, its slug, or its path without the
 * extension, matched case-insensitively — the three forms Obsidian accepts,
 * so a memory opened there behaves the same.
 */
function checkReachability(
  files: Record<string, string>,
  pages: LintedPage[],
  add: Add,
): void {
  const targets = new Map<string, string>();
  const register = (key: string, path: string) => {
    const existing = targets.get(key.toLowerCase());
    // Sorted paths in, so the first registration is the stable winner;
    // genuine collisions are reported by checkDuplicateTitles.
    if (existing === undefined) targets.set(key.toLowerCase(), path);
  };
  for (const page of pages) {
    if (page.title !== null) register(page.title, page.path);
    register(basename(page.path), page.path);
    register(page.path.replace(/\.md$/, ""), page.path);
  }
  // SCHEMA.md is human-owned and carries no frontmatter, but pages link to it.
  if (SCHEMA_FILE in files) register(basename(SCHEMA_FILE), SCHEMA_FILE);

  const outgoing = new Map<string, string[]>();
  for (const page of pages) {
    const resolved: string[] = [];
    for (const link of wikiLinks(files[page.path] as string)) {
      const target = link.target.split("#")[0]?.trim() ?? "";
      const to = target === "" ? undefined : targets.get(target.toLowerCase());
      if (to === undefined) {
        add("broken_link", page.path, `[[${link.target}]] does not resolve to a page`, {
          line: link.line,
          detail: link.target,
        });
        continue;
      }
      resolved.push(to);
    }
    outgoing.set(page.path, resolved);
  }

  // Without an index there is nothing to be reachable from; index_missing
  // already says so, and flagging every page as an orphan only buries it.
  if (!(INDEX_FILE in files)) return;

  // log.md is a diary, not a destination: it is reachable by definition.
  const reached = new Set<string>();
  const queue = [INDEX_FILE, LOG_FILE];
  while (queue.length > 0) {
    const path = queue.pop() as string;
    if (reached.has(path) || !(path in files)) continue;
    reached.add(path);
    queue.push(...(outgoing.get(path) ?? []));
  }
  for (const page of pages) {
    if (reached.has(page.path)) continue;
    add("orphan", page.path, "no path of links leads here from index.md");
  }
}

function basename(path: string): string {
  return (path.split("/").pop() ?? path).replace(/\.md$/, "");
}

function stringField(frontmatter: Frontmatter, key: string): string | null {
  const value = frontmatter.fields[key];
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}
