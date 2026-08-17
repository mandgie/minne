import { describe, expect, test } from "bun:test";
import { formatLintReport, lintWiki, type LintCode, type LintReport } from "./wiki-lint";
import type { WikiTree } from "./wiki";

const INDEX = `---
title: Index
type: index
summary: Entry point.
last_updated: 2026-08-18
---

# Index

- [[Ingrid Berg]]
`;

const LOG = `---
title: Log
type: log
summary: What the agent did.
---

# Log

## 2026-08-18T09:00:00+02:00 — sync

Created [[Ingrid Berg]] from three snapshots.
`;

const PERSON = `---
title: Ingrid Berg
type: person
summary: Colleague at Nordfjord.
sources: [sources/2026-08-17/1400-mail.md#3]
last_updated: 2026-08-18
---

# Ingrid Berg

Runs the Oslo migration.
`;

const SCHEMA = "# SCHEMA.md\n\nHuman-owned prose, no frontmatter.\n";

/** A tree that lints clean, with the pieces named in the test overridden. */
function tree(files: Record<string, string | null> = {}, sources?: string[]): WikiTree {
  const base: Record<string, string> = {
    "SCHEMA.md": SCHEMA,
    "index.md": INDEX,
    "log.md": LOG,
    "wiki/ingrid-berg.md": PERSON,
  };
  for (const [path, contents] of Object.entries(files)) {
    if (contents === null) delete base[path];
    else base[path] = contents;
  }
  return {
    files: base,
    sources: new Set(sources ?? ["sources/2026-08-17/1400-mail.md"]),
  };
}

function codes(report: LintReport): LintCode[] {
  return report.issues.map((issue) => issue.code);
}

describe("a wiki that follows the schema", () => {
  test("has no issues", () => {
    const report = lintWiki(tree());
    expect(report.issues).toEqual([]);
    expect(report.ok).toBe(true);
    expect(report.pages).toBe(3);
    expect(formatLintReport(report)).toBe("wiki-lint: 3 pages, no issues");
  });

  test("splits issues into errors and warnings, keeping file order in issues", () => {
    const report = lintWiki(tree({ "wiki/orphan.md": PERSON.replace("Ingrid Berg", "Nils Berg") }));
    expect(codes(report)).toEqual(["orphan"]);
    expect(report.errors).toEqual([]);
    expect(report.warnings).toEqual(report.issues);
    expect(report.ok).toBe(true);
    expect(formatLintReport(report)).toContain("warn  wiki/orphan.md [orphan]");
  });
});

describe("structure", () => {
  test("a missing index.md is an error, and does not orphan everything", () => {
    const report = lintWiki(tree({ "index.md": null }));
    expect(codes(report)).toEqual(["index_missing"]);
  });

  test("a missing log.md is an error, a missing SCHEMA.md a warning", () => {
    expect(codes(lintWiki(tree({ "log.md": null })))).toEqual(["log_missing"]);
    expect(codes(lintWiki(tree({ "SCHEMA.md": null })))).toEqual(["schema_missing"]);
  });

  test("files outside index.md, log.md and wiki/ are not linted", () => {
    const report = lintWiki(tree({ "notes.md": "no frontmatter here" }));
    expect(report.issues).toEqual([]);
    expect(report.pages).toBe(3);
  });
});

describe("frontmatter", () => {
  test("a page without frontmatter is an error pointing at line 1", () => {
    const report = lintWiki(tree({ "wiki/ingrid-berg.md": "# Ingrid\n" }));
    expect(report.errors[0]).toMatchObject({
      code: "frontmatter_invalid",
      path: "wiki/ingrid-berg.md",
      line: 1,
    });
  });

  test("unparseable frontmatter reports the offending line", () => {
    const broken = PERSON.replace("type: person", "  type: person");
    expect(lintWiki(tree({ "wiki/ingrid-berg.md": broken })).errors[0]).toMatchObject({
      code: "frontmatter_invalid",
      line: 3,
    });
  });

  test("a missing or foreign type is an error", () => {
    expect(codes(lintWiki(tree({ "wiki/ingrid-berg.md": PERSON.replace("type: person\n", "") })))).toContain(
      "type_missing",
    );
    const foreign = PERSON.replace("type: person", "type: sourcecode");
    const report = lintWiki(tree({ "wiki/ingrid-berg.md": foreign }));
    expect(report.errors[0]).toMatchObject({ code: "type_unknown", detail: "sourcecode" });
  });

  test("the root pages must declare their own types", () => {
    const report = lintWiki(tree({ "index.md": INDEX.replace("type: index", "type: topic") }));
    expect(report.errors[0]).toMatchObject({ code: "type_unknown", path: "index.md" });
  });

  test.each([
    ["summary: Colleague at Nordfjord.\n", "", "field_missing", "summary"],
    ["summary: Colleague at Nordfjord.", "summary:", "field_missing", "summary"],
    ["sources: [sources/2026-08-17/1400-mail.md#3]", "sources:", "field_missing", "sources"],
    ["last_updated: 2026-08-18", "last_updated: yesterday", "field_invalid", "last_updated"],
    ["last_updated: 2026-08-18", "last_updated: null", "field_invalid", "last_updated"],
  ])("%j → %j is %s", (from, to, code, field) => {
    const report = lintWiki(tree({ "wiki/ingrid-berg.md": PERSON.replace(from, to) }));
    expect(report.errors[0]).toMatchObject({ code: code as LintCode, detail: field as string });
  });

  test("last_updated may be an ISO timestamp, and null on a fresh index", () => {
    const stamped = PERSON.replace("last_updated: 2026-08-18", "last_updated: 2026-08-18T09:00:00+02:00");
    expect(lintWiki(tree({ "wiki/ingrid-berg.md": stamped })).issues).toEqual([]);
    const fresh = INDEX.replace("last_updated: 2026-08-18", "last_updated: null");
    expect(lintWiki(tree({ "index.md": fresh })).issues).toEqual([]);
  });

  test("a daily page needs a date", () => {
    const daily = `---
title: 2026-08-17
type: daily
summary: A Monday.
sources: [sources/2026-08-17/1400-mail.md#3]
last_updated: 2026-08-18
date: Monday
---

# 2026-08-17
`;
    const report = lintWiki(
      tree({ "wiki/daily/2026-08-17.md": daily, "index.md": `${INDEX}- [[2026-08-17]]\n` }),
    );
    expect(report.errors[0]).toMatchObject({ code: "field_invalid", detail: "date" });
  });

  test("a page with no citations is a warning, not an error", () => {
    const report = lintWiki(tree({ "wiki/ingrid-berg.md": PERSON.replace(/sources: \[.*\]/, "sources: []") }));
    expect(codes(report)).toEqual(["no_sources"]);
  });
});

describe("citations", () => {
  test("a citation must name a source file and a snapshot", () => {
    const bad = PERSON.replace("sources/2026-08-17/1400-mail.md#3", "sources/2026-08-17");
    const report = lintWiki(tree({ "wiki/ingrid-berg.md": bad }));
    expect(report.errors[0]).toMatchObject({
      code: "citation_invalid",
      line: 5,
      detail: "sources/2026-08-17",
    });
  });

  test("a citation whose source has been pruned is only a warning", () => {
    const report = lintWiki(tree({}, []));
    expect(codes(report)).toEqual(["citation_missing"]);
    expect(report.ok).toBe(true);
  });

  test("existence is not checked when the tree did not come from disk", () => {
    const detached = tree();
    delete detached.sources;
    expect(lintWiki(detached).issues).toEqual([]);
  });

  test("inline citations in the body are checked too", () => {
    const withInline = `${PERSON}\nBooked the hotel \`sources/2026-08-17/1400-mail.md#nine\`.\n`;
    const report = lintWiki(tree({ "wiki/ingrid-berg.md": withInline }));
    expect(report.errors[0]).toMatchObject({ code: "citation_invalid", line: 13 });
  });

  test("app slugs may hold any letter or digit", () => {
    const cited = PERSON.replace("1400-mail.md#3", "1400-möte3.md#12");
    const report = lintWiki(
      tree({ "wiki/ingrid-berg.md": cited }, ["sources/2026-08-17/1400-möte3.md"]),
    );
    expect(report.issues).toEqual([]);
  });
});

describe("links", () => {
  test("a link to a page that does not exist is an error", () => {
    const report = lintWiki(tree({ "index.md": `${INDEX}- [[Nils Berg]]\n` }));
    expect(report.errors[0]).toMatchObject({
      code: "broken_link",
      path: "index.md",
      line: 11,
      detail: "Nils Berg",
    });
  });

  test.each([
    "[[Ingrid Berg]]",
    "[[ingrid berg]]",
    "[[ingrid-berg]]",
    "[[wiki/ingrid-berg]]",
    "[[Ingrid Berg|Ingrid]]",
    "[[Ingrid Berg#Timeline]]",
    "[[SCHEMA]]",
  ])("%s resolves", (link) => {
    const report = lintWiki(tree({ "index.md": `${INDEX}\n${link}\n` }));
    expect(report.errors).toEqual([]);
  });

  test("two pages claiming the same title break resolution", () => {
    const twin = PERSON.replace("# Ingrid Berg", "# Ingrid Berg (2)");
    const report = lintWiki(tree({ "wiki/ingrid-berg-2.md": twin }));
    expect(report.errors.map((issue) => issue.path)).toEqual([
      "wiki/ingrid-berg-2.md",
      "wiki/ingrid-berg.md",
    ]);
    expect(report.errors[0]?.code).toBe("duplicate_title");
  });
});

describe("orphans", () => {
  test("a page nothing links to is a warning", () => {
    const nils = PERSON.replace(/Ingrid Berg/g, "Nils Berg");
    const report = lintWiki(tree({ "wiki/nils-berg.md": nils }));
    expect(report.warnings).toHaveLength(1);
    expect(report.warnings[0]).toMatchObject({ code: "orphan", path: "wiki/nils-berg.md" });
  });

  test("reachability is transitive", () => {
    const nils = PERSON.replace(/Ingrid Berg/g, "Nils Berg");
    const linked = PERSON.replace("Runs the Oslo migration.", "Works with [[Nils Berg]].");
    const report = lintWiki(tree({ "wiki/nils-berg.md": nils, "wiki/ingrid-berg.md": linked }));
    expect(report.issues).toEqual([]);
  });

  test("a page linked only from another orphan is still an orphan", () => {
    const nils = PERSON.replace(/Ingrid Berg/g, "Nils Berg").replace(
      "Runs the Oslo migration.",
      "Works with [[Åsa Berg]].",
    );
    const asa = PERSON.replace(/Ingrid Berg/g, "Åsa Berg");
    const report = lintWiki(tree({ "wiki/nils-berg.md": nils, "wiki/asa-berg.md": asa }));
    expect(report.warnings.map((issue) => issue.path)).toEqual([
      "wiki/asa-berg.md",
      "wiki/nils-berg.md",
    ]);
  });

  test("log.md is reachable by definition, and its links count", () => {
    const report = lintWiki(tree({ "index.md": INDEX.replace("- [[Ingrid Berg]]\n", "") }));
    expect(report.issues).toEqual([]);
  });
});

describe("log.md", () => {
  test("accepts the schema's entry heading", () => {
    expect(lintWiki(tree()).issues).toEqual([]);
  });

  test("a heading that is not an entry is an error", () => {
    const report = lintWiki(tree({ "log.md": LOG.replace("## 2026-08-18T09:00:00+02:00 — sync", "## sync") }));
    expect(report.errors[0]).toMatchObject({ code: "log_entry_invalid", path: "log.md", line: 9 });
  });

  test("a heading with an unparseable timestamp is an error", () => {
    const report = lintWiki(tree({ "log.md": LOG.replace("2026-08-18T09:00:00+02:00", "yesterday") }));
    expect(report.errors[0]).toMatchObject({ code: "log_entry_invalid", detail: "yesterday" });
  });

  test("an unknown kind of pass is only a warning", () => {
    const report = lintWiki(tree({ "log.md": LOG.replace("— sync", "— rummage") }));
    expect(report.warnings[0]).toMatchObject({ code: "log_pass_unknown", detail: "rummage" });
    expect(report.ok).toBe(true);
  });
});
