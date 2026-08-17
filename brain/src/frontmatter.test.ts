import { describe, expect, test } from "bun:test";
import {
  FrontmatterError,
  hasFrontmatter,
  list,
  parseFrontmatter,
  renderValue,
  scalar,
} from "./frontmatter";

function page(...frontmatter: string[]): string {
  return ["---", ...frontmatter, "---", "", "# Body", ""].join("\n");
}

describe("parseFrontmatter", () => {
  test("reads the flat key/value subset", () => {
    const parsed = parseFrontmatter(
      page(
        "title: Ingrid Berg",
        "type: person",
        "summary: Colleague at Nordfjord; runs the Oslo migration.",
        "last_updated: 2026-08-18",
      ),
    );
    expect(parsed.fields).toEqual({
      title: "Ingrid Berg",
      type: "person",
      summary: "Colleague at Nordfjord; runs the Oslo migration.",
      last_updated: "2026-08-18",
    });
    expect(parsed.lines["type"]).toBe(3);
    expect(parsed.body).toBe("\n# Body\n");
    expect(parsed.bodyLine).toBe(7);
  });

  test("reads inline and block lists the same way", () => {
    const inline = parseFrontmatter(page("sources: [a.md#1, b.md#2]"));
    const block = parseFrontmatter(page("sources:", "  - a.md#1", "  - b.md#2"));
    expect(inline.fields["sources"]).toEqual(["a.md#1", "b.md#2"]);
    expect(block.fields["sources"]).toEqual(["a.md#1", "b.md#2"]);
  });

  test("`[]` is the empty list, a bare key is null", () => {
    expect(parseFrontmatter(page("sources: []")).fields["sources"]).toEqual([]);
    expect(parseFrontmatter(page("sources:")).fields["sources"]).toBeNull();
    expect(parseFrontmatter(page("last_updated: null")).fields["last_updated"]).toBeNull();
    expect(parseFrontmatter(page("last_updated: ~")).fields["last_updated"]).toBeNull();
  });

  test("unquotes, keeping the colons and hashes a summary contains", () => {
    const parsed = parseFrontmatter(
      page(
        'title: "Berg: the sequel"',
        "summary: 'it''s fine'",
        'note: "line\\nbreak"',
        "tag: release #4",
      ),
    );
    expect(scalar(parsed, "title")).toBe("Berg: the sequel");
    expect(scalar(parsed, "summary")).toBe("it's fine");
    expect(scalar(parsed, "note")).toBe("line\nbreak");
    expect(scalar(parsed, "tag")).toBe("release #4");
  });

  test("splits inline lists on commas outside quotes", () => {
    const parsed = parseFrontmatter(page('aliases: ["Berg, Ingrid", Ingrid]'));
    expect(parsed.fields["aliases"]).toEqual(["Berg, Ingrid", "Ingrid"]);
  });

  test("handles CRLF and a body that contains a `---` rule", () => {
    const parsed = parseFrontmatter("---\r\ntitle: X\r\n---\r\ntext\r\n---\r\nmore\r\n");
    expect(scalar(parsed, "title")).toBe("X");
    expect(parsed.body).toBe("text\n---\nmore\n");
  });

  test.each([
    ["# Just a heading\n", "does not start with a `---`", 1],
    ["---\ntitle: X\n", "never closed", 3],
    ["---\ntitle: X\ntitle: Y\n---\n", 'duplicate key "title"', 3],
    ["---\ntitle: X\n  nested: Y\n---\n", "no nesting", 3],
    ["---\n- orphan\n---\n", "no key above it", 2],
    ["---\ntitle: X\nnot a key line\n---\n", "not a `key: value` line", 3],
    ["---\nsources: [a, b\n---\n", "not closed", 2],
    ['---\ntitle: "unfinished\n---\n', "unterminated quote", 2],
  ])("rejects %j", (text, message, line) => {
    expect(() => parseFrontmatter(text)).toThrow(message as string);
    try {
      parseFrontmatter(text as string);
    } catch (err) {
      expect(err).toBeInstanceOf(FrontmatterError);
      expect((err as FrontmatterError).line).toBe(line as number);
    }
  });

  test("ignores blank lines and comments", () => {
    const parsed = parseFrontmatter(page("# a comment", "", "title: X"));
    expect(parsed.fields).toEqual({ title: "X" });
  });
});

describe("field accessors", () => {
  const parsed = parseFrontmatter(page("title: X", "sources: [a, b]", "last_updated: null"));

  test("scalar reads strings only", () => {
    expect(scalar(parsed, "title")).toBe("X");
    expect(scalar(parsed, "sources")).toBeNull();
    expect(scalar(parsed, "missing")).toBeNull();
  });

  test("list reads a lone scalar as a one-item list", () => {
    expect(list(parsed, "sources")).toEqual(["a", "b"]);
    expect(list(parsed, "title")).toEqual(["X"]);
    expect(list(parsed, "last_updated")).toBeNull();
  });
});

describe("renderValue", () => {
  test("quotes only what would otherwise be misread", () => {
    expect(renderValue("Ingrid Berg")).toBe("Ingrid Berg");
    expect(renderValue("2026-08-18")).toBe("2026-08-18");
    expect(renderValue("Berg: the sequel")).toBe('"Berg: the sequel"');
    expect(renderValue("- dash first")).toBe('"- dash first"');
    expect(renderValue("null")).toBe('"null"');
    expect(renderValue("")).toBe('""');
    expect(renderValue(null)).toBe("null");
    expect(renderValue(["a", "b"])).toBe("[a, b]");
    expect(renderValue([])).toBe("[]");
  });

  test("round-trips through the parser", () => {
    const nasty = ['a: "quoted"', "b: colon: inside", "c: #hash", "d: [not, a, list]"];
    const rendered = nasty.map((v) => renderValue(v));
    const parsed = parseFrontmatter(
      page(...rendered.map((value, i) => `k${i}: ${value}`)),
    );
    expect(Object.values(parsed.fields)).toEqual(nasty);
  });
});

test("hasFrontmatter looks only at the first line", () => {
  expect(hasFrontmatter("---\ntitle: X\n---\n")).toBe(true);
  expect(hasFrontmatter("# Heading\n---\n")).toBe(false);
});
