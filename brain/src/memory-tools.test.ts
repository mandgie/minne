// The pi adapter layer: every tool is executed exactly the way the agent loop
// executes it — by name, with an argument object — so the wiring is covered
// without an LLM in the room.
import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Memory } from "./memory";
import { memoryTools } from "./memory-tools";
import { bootstrapWiki } from "./wiki";

let dirs: string[] = [];

function tempDir(prefix = "minne-tools-"): string {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  dirs.push(dir);
  return dir;
}

interface Harness {
  memory: Memory;
  /** Runs a tool by name the way the agent loop would, returning its text. */
  call(name: string, args: Record<string, unknown>): Promise<string>;
  details(name: string, args: Record<string, unknown>): Promise<unknown>;
}

function harness(): Harness {
  const root = tempDir();
  bootstrapWiki(root);
  const memory = new Memory({
    root,
    dataDir: root,
    now: () => new Date("2026-08-18T09:15:07"),
  });
  const tools = new Map(memoryTools(memory).map((tool) => [tool.name, tool]));
  const run = async (name: string, args: Record<string, unknown>) => {
    const tool = tools.get(name);
    if (tool === undefined) throw new Error(`no tool named ${name}`);
    return tool.execute(`call-${name}`, args);
  };
  return {
    memory,
    call: async (name, args) => {
      const result = await run(name, args);
      return result.content.map((part) => (part.type === "text" ? part.text : "")).join("");
    },
    details: async (name, args) => (await run(name, args)).details,
  };
}

afterEach(() => {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true });
  dirs = [];
});

describe("the tool set", () => {
  test("is the five memory tools, each with a described object schema", () => {
    const tools = memoryTools(new Memory({ root: tempDir(), dataDir: tempDir() }));
    expect(tools.map((tool) => tool.name)).toEqual([
      "search_memory",
      "read_page",
      "list_index",
      "write_page",
      "append_log",
    ]);
    for (const tool of tools) {
      expect(tool.label).not.toBe("");
      expect(tool.description.length).toBeGreaterThan(40);
      expect(tool.parameters).toMatchObject({ type: "object" });
      expect(typeof tool.execute).toBe("function");
    }
  });

  test("write_page's schema names the required arguments and the page types", () => {
    const tools = memoryTools(new Memory({ root: tempDir(), dataDir: tempDir() }));
    const write = tools.find((tool) => tool.name === "write_page");
    const schema = write?.parameters as { required: string[]; properties: Record<string, unknown> };
    expect(schema.required.sort()).toEqual(["summary", "title", "type"]);
    expect(JSON.stringify(schema.properties["type"])).toContain("daily");
  });
});

describe("write_page and append_log", () => {
  test("write a page, an index entry and a log line the agent can read back", async () => {
    const tools = harness();
    const written = await tools.call("write_page", {
      type: "person",
      title: "Ingrid Berg",
      summary: "Colleague; runs the Oslo migration.",
      sources: [],
      body: "# Ingrid Berg\n\nOslo, mostly.",
    });
    expect(written).toContain("Created wiki/ingrid-berg.md (last_updated 2026-08-18)");
    expect(written).toContain("index.md entry added");
    expect(written).toContain("warning: wiki/ingrid-berg.md");

    const logged = await tools.call("append_log", {
      pass: "chat",
      message: "Wrote [[Ingrid Berg]] from what the user told me.",
    });
    expect(logged).toContain("— chat");

    expect(await tools.call("read_page", { path: "wiki/ingrid-berg.md" })).toContain("Oslo, mostly.");
    expect(await tools.call("read_page", { path: "log.md" })).toContain("[[Ingrid Berg]]");
    expect(await tools.call("list_index", {})).toContain(
      "wiki/ingrid-berg.md — Ingrid Berg (person, 0 citations, updated 2026-08-18)",
    );
  });

  test("a refused write comes back as a thrown error, which the loop shows the model", async () => {
    const tools = harness();
    await expect(
      tools.call("write_page", {
        type: "topic",
        title: "Oslo",
        summary: "A city.",
        body: "# Oslo\n\nWhere [[Ingrid Berg]] lives.",
      }),
    ).rejects.toThrow(/broken_link/);
    await expect(tools.call("append_log", { pass: "chat", message: "" })).rejects.toThrow(
      "log entry needs something to say",
    );
  });
});

describe("search_memory and read_page", () => {
  test("render hits the model can act on, labelled by layer", async () => {
    const tools = harness();
    await tools.call("write_page", {
      type: "project",
      title: "Oslo Trip",
      summary: "Moving the team in September.",
      body: "# Oslo Trip\n\nFlights are booked.",
    });
    const found = await tools.call("search_memory", { query: "flights" });
    expect(found).toContain("[wiki] wiki/oslo-trip.md — Oslo Trip (project)");
    expect(found).toContain("**Flights**");
    expect(await tools.call("search_memory", { query: "bergen" })).toContain("No matches.");
  });

  test("scope and limit reach the search", async () => {
    const tools = harness();
    await tools.call("write_page", { type: "topic", title: "Oslo", summary: "A city." });
    const details = (await tools.details("search_memory", {
      query: "oslo",
      scope: "wiki",
      limit: 5,
    })) as { scope: string; results: unknown[] };
    expect(details.scope).toBe("wiki");
    expect(details.results).toHaveLength(1);
  });

  test("an unsearchable query is an error, not an empty answer", async () => {
    const tools = harness();
    await expect(tools.call("search_memory", { query: "***" })).rejects.toThrow("no searchable terms");
  });
});

describe("path traversal, through the tools", () => {
  test.each([
    ["../../../etc/passwd", "absolute"],
    ["/etc/passwd", "absolute"],
    ["wiki/../../escape.md", ".."],
    ["~/.ssh/id_rsa", "absolute"],
    ["", "empty"],
  ])("read_page refuses %j", async (path) => {
    const tools = harness();
    await expect(tools.call("read_page", { path })).rejects.toThrow(/absolute|\.\.|empty/);
  });

  test("read_page refuses a symlink out of the memory", async () => {
    const tools = harness();
    const outside = tempDir("minne-outside-");
    writeFileSync(join(outside, "secrets.md"), "not yours\n");
    symlinkSync(join(outside, "secrets.md"), join(tools.memory.root, "wiki", "leak.md"));
    await expect(tools.call("read_page", { path: "wiki/leak.md" })).rejects.toThrow(
      "outside the memory root",
    );
  });

  test.each(["../escape.md", "/tmp/escape.md", "sources/2026-08-17/1400-mail.md", "log.md"])(
    "write_page refuses to write %j",
    async (path) => {
      const tools = harness();
      await expect(
        tools.call("write_page", { type: "topic", title: "X", summary: "y", path }),
      ).rejects.toThrow();
    },
  );
});
