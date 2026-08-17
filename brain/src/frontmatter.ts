// The flat YAML subset Minne's markdown uses, parsed without a YAML library.
//
// Every page in the wiki opens with frontmatter (see SCHEMA.md), and both the
// linter and the memory tools need to read it. A real YAML parser would bring
// a dependency and a great deal of syntax nobody here is allowed to write:
// SCHEMA.md promises flat `key: value` pairs, scalars and lists of scalars,
// nothing nested. Parsing exactly that — and refusing everything else with a
// line number — keeps the contract enforceable rather than aspirational.

/** A scalar, a list of scalars, or an explicit `null`. */
export type FrontmatterValue = string | string[] | null;

export interface Frontmatter {
  fields: Record<string, FrontmatterValue>;
  /** 1-based line each key was found on, so issues can point at it */
  lines: Record<string, number>;
  /** everything after the closing `---`, newlines normalised */
  body: string;
  /** 1-based line the body starts on */
  bodyLine: number;
}

/** A file whose frontmatter is missing or outside the supported subset. */
export class FrontmatterError extends Error {
  /** 1-based line the problem is on */
  readonly line: number;

  constructor(message: string, line: number) {
    super(message);
    this.name = "FrontmatterError";
    this.line = line;
  }
}

const KEY_LINE = /^([A-Za-z_][A-Za-z0-9_-]*):(?:[ \t]+(.*))?$/;
const FENCE = "---";

/** True when `text` opens with a `---` frontmatter fence. */
export function hasFrontmatter(text: string): boolean {
  return splitLines(text)[0]?.trimEnd() === FENCE;
}

/**
 * Reads the frontmatter block at the top of `text`.
 *
 * Throws `FrontmatterError` when the block is missing, unterminated, or uses
 * YAML the schema does not allow (nesting, indentation, duplicate keys).
 */
export function parseFrontmatter(text: string): Frontmatter {
  const lines = splitLines(text);
  if (lines[0]?.trimEnd() !== FENCE) {
    throw new FrontmatterError("file does not start with a `---` frontmatter block", 1);
  }

  const fields: Record<string, FrontmatterValue> = {};
  const keyLines: Record<string, number> = {};
  // The key a following `- item` line belongs to, opened by a key line with
  // an empty value and closed by the next key or the end of the block. An
  // empty value that never gets items is a null field, as in YAML — a list
  // has to be written `[]` to mean the empty list.
  let listKey: string | null = null;
  let listCount = 0;
  const closeList = () => {
    if (listKey !== null && listCount === 0) fields[listKey] = null;
    listKey = null;
    listCount = 0;
  };

  for (let i = 1; i < lines.length; i++) {
    const raw = lines[i] ?? "";
    const line = i + 1;
    if (raw.trimEnd() === FENCE) {
      closeList();
      return {
        fields,
        lines: keyLines,
        body: lines.slice(i + 1).join("\n"),
        bodyLine: line + 1,
      };
    }
    const trimmed = raw.trim();
    if (trimmed === "" || trimmed.startsWith("#")) continue;

    if (trimmed.startsWith("-")) {
      if (listKey === null) {
        throw new FrontmatterError("list item with no key above it", line);
      }
      const item = unquote(trimmed.slice(1).trim(), line);
      (fields[listKey] as string[]).push(item);
      listCount++;
      continue;
    }

    if (raw !== raw.trimStart()) {
      throw new FrontmatterError("indented value — frontmatter is flat, no nesting", line);
    }
    const match = KEY_LINE.exec(raw.trimEnd());
    if (!match) {
      throw new FrontmatterError(`not a \`key: value\` line: ${trimmed}`, line);
    }
    closeList();
    const key = match[1] as string;
    if (key in fields) {
      throw new FrontmatterError(`duplicate key "${key}"`, line);
    }
    const rest = (match[2] ?? "").trim();
    keyLines[key] = line;
    if (rest === "") {
      // Either an empty scalar or the head of a `- item` list; the next
      // non-blank line decides, so start as a list and collapse it below.
      fields[key] = [];
      listKey = key;
      continue;
    }
    fields[key] = parseValue(rest, line);
  }

  throw new FrontmatterError("frontmatter block is never closed with `---`", lines.length);
}

/**
 * `null` for an absent or explicitly null field, so callers can tell "no
 * value" from "empty string" without repeating the type dance.
 */
export function scalar(frontmatter: Frontmatter, key: string): string | null {
  const value = frontmatter.fields[key];
  return typeof value === "string" ? value : null;
}

/** A field read as a list; a lone scalar counts as a one-item list. */
export function list(frontmatter: Frontmatter, key: string): string[] | null {
  const value = frontmatter.fields[key];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") return [value];
  return null;
}

/** Renders a value back into the subset, quoting only when it must. */
export function renderValue(value: FrontmatterValue): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return `[${value.map(renderScalar).join(", ")}]`;
  return renderScalar(value);
}

function renderScalar(value: string): string {
  return needsQuoting(value) ? `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"` : value;
}

function needsQuoting(value: string): boolean {
  if (value === "") return true;
  if (value !== value.trim()) return true;
  if (/^(null|true|false|yes|no|~)$/i.test(value)) return true;
  // Leading YAML indicators, and anything a reader could take for structure.
  if (/^[-?:,\[\]{}#&*!|>'"%@`]/.test(value)) return true;
  return /: |:$|\s#|\n/.test(value);
}

function parseValue(rest: string, line: number): FrontmatterValue {
  if (rest === "null" || rest === "~") return null;
  if (rest.startsWith("[")) {
    if (!rest.endsWith("]")) {
      throw new FrontmatterError("inline list is not closed with `]`", line);
    }
    return splitInline(rest.slice(1, -1), line).map((item) => unquote(item, line));
  }
  return unquote(rest, line);
}

/** Splits `a, "b, c"` on commas that are not inside quotes. */
function splitInline(inner: string, line: number): string[] {
  const items: string[] = [];
  let current = "";
  let quote: string | null = null;
  for (let i = 0; i < inner.length; i++) {
    const char = inner[i] as string;
    if (quote !== null) {
      if (char === "\\" && quote === '"' && i + 1 < inner.length) {
        current += char + inner[i + 1];
        i++;
        continue;
      }
      if (char === quote) quote = null;
      current += char;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      current += char;
      continue;
    }
    if (char === ",") {
      items.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  if (quote !== null) throw new FrontmatterError("unterminated quote in inline list", line);
  items.push(current);
  const trimmed = items.map((item) => item.trim());
  // `[]` is the empty list, not a list holding one empty string.
  return trimmed.length === 1 && trimmed[0] === "" ? [] : trimmed;
}

function unquote(value: string, line: number): string {
  if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
    return value
      .slice(1, -1)
      .replace(/\\(["\\nt])/g, (_all, escape: string) =>
        escape === "n" ? "\n" : escape === "t" ? "\t" : escape,
      );
  }
  if (value.length >= 2 && value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1).replace(/''/g, "'");
  }
  if (value.startsWith('"') || value.startsWith("'")) {
    throw new FrontmatterError("unterminated quote", line);
  }
  return value;
}

function splitLines(text: string): string[] {
  return text.split(/\r?\n/);
}
