// US-110: the read-only MCP server, exercised as a real subprocess speaking
// JSON-RPC over stdio — initialize, tools/list, tools/call — against a scratch
// memory. Requests are answered while stdin is still open, so the Bun piped-
// stdin EOF-buffering regression (US-002) is covered here too.
import { afterAll, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Memory } from "./memory";
import { renderIndex, renderPageContents, renderSearch } from "./memory-tools";
import { bootstrapWiki } from "./wiki";

const BRAIN_DIR = new URL("..", import.meta.url).pathname;

const dirs: string[] = [];
afterAll(() => {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true });
});

interface JsonRpcMessage {
  jsonrpc: "2.0";
  id?: number;
  result?: Record<string, unknown>;
  error?: { code: number; message: string };
}

interface ToolCallResult {
  content: { type: string; text: string }[];
  isError?: boolean;
}

/** A scratch data dir whose memory holds one bootstrapped wiki page. */
function seededDir(): { dir: string; memoryRoot: string } {
  const dir = mkdtempSync(join(tmpdir(), "minne-mcp-"));
  dirs.push(dir);
  const memoryRoot = join(dir, "memory");
  bootstrapWiki(memoryRoot);
  new Memory({ root: memoryRoot, dataDir: dir }).writePage({
    type: "topic",
    title: "Oslo Trip",
    summary: "Planning a September trip to Oslo.",
    body: "# Oslo Trip\n\nFlights booked for September; morning departure preferred.\n",
  });
  return { dir, memoryRoot };
}

// Wrapping Bun.spawn in a plain function keeps its result typed usefully
// under strict TS (the US-003 gotcha) — same pattern as test-support.ts.
function spawnMcpServer(dataDir: string, memoryRoot: string) {
  return Bun.spawn(["bun", "run", "src/main.ts", "--mcp"], {
    cwd: BRAIN_DIR,
    stdin: "pipe" as const,
    stdout: "pipe" as const,
    stderr: "ignore" as const,
    env: {
      ...process.env,
      MINNE_APP_SUPPORT_DIR: dataDir,
      MINNE_MEMORY_ROOT: memoryRoot,
      ANTHROPIC_API_KEY: undefined,
      OPENAI_API_KEY: undefined,
    },
  });
}

/** JSON-RPC session against `minne-brain --mcp`, stdin held open throughout. */
class McpSession {
  private proc: ReturnType<typeof spawnMcpServer>;
  private reader: { read(): Promise<{ done: boolean; value?: Uint8Array }>; releaseLock(): void };
  private buffer = "";
  private queue: JsonRpcMessage[] = [];
  private nextId = 0;

  constructor(dataDir: string, memoryRoot: string) {
    this.proc = spawnMcpServer(dataDir, memoryRoot);
    this.reader = this.proc.stdout.getReader() as unknown as typeof this.reader;
  }

  private send(message: Record<string, unknown>): void {
    this.proc.stdin.write(JSON.stringify({ jsonrpc: "2.0", ...message }) + "\n");
    void this.proc.stdin.flush();
  }

  /** Next stdout message; every non-empty line must parse as JSON-RPC. */
  private async next(): Promise<JsonRpcMessage> {
    while (this.queue.length === 0) {
      const { done, value } = await this.reader.read();
      if (done) throw new Error("mcp server stdout closed while awaiting a response");
      this.buffer += new TextDecoder().decode(value);
      let newline: number;
      while ((newline = this.buffer.indexOf("\n")) !== -1) {
        const line = this.buffer.slice(0, newline);
        this.buffer = this.buffer.slice(newline + 1);
        if (line !== "") this.queue.push(JSON.parse(line) as JsonRpcMessage);
      }
    }
    return this.queue.shift()!;
  }

  async request(method: string, params?: Record<string, unknown>): Promise<JsonRpcMessage> {
    const id = ++this.nextId;
    this.send({ id, method, ...(params === undefined ? {} : { params }) });
    for (;;) {
      const message = await this.next();
      if (message.id === id) return message;
    }
  }

  async initialize(): Promise<JsonRpcMessage> {
    const response = await this.request("initialize", {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: { name: "bun-test", version: "0" },
    });
    this.send({ method: "notifications/initialized" });
    return response;
  }

  /** tools/call unwrapped to its result; JSON-RPC-level errors throw. */
  async call(name: string, args: Record<string, unknown> = {}): Promise<ToolCallResult> {
    const response = await this.request("tools/call", { name, arguments: args });
    if (response.error !== undefined) throw new Error(response.error.message);
    return response.result as unknown as ToolCallResult;
  }

  async close(): Promise<number> {
    await this.proc.stdin.end();
    const code = await this.proc.exited;
    this.reader.releaseLock();
    return code;
  }
}

function textOf(result: ToolCallResult): string {
  return result.content.map((part) => (part.type === "text" ? part.text : "")).join("");
}

describe("minne-brain --mcp", () => {
  test("initializes and serves exactly the three read-only tools", async () => {
    const { dir, memoryRoot } = seededDir();
    const session = new McpSession(dir, memoryRoot);
    try {
      const initialized = await session.initialize();
      expect(initialized.result).toMatchObject({
        serverInfo: { name: "minne-brain" },
        capabilities: { tools: {} },
      });

      const listed = await session.request("tools/list");
      const tools = (listed.result as { tools: { name: string; inputSchema: unknown }[] }).tools;
      expect(tools.map((tool) => tool.name)).toEqual([
        "search_memory",
        "read_page",
        "list_index",
      ]);
      for (const tool of tools) {
        expect(tool.inputSchema).toMatchObject({ type: "object" });
      }
    } finally {
      expect(await session.close()).toBe(0);
    }
  }, 15000);

  test("the three tools answer with the same text the agent's tools render", async () => {
    const { dir, memoryRoot } = seededDir();
    // The same files through the same class in-process: the MCP text must be
    // byte-identical to what chat and the drafting key would see.
    const memory = new Memory({ root: memoryRoot, dataDir: dir });
    const session = new McpSession(dir, memoryRoot);
    try {
      await session.initialize();

      const search = await session.call("search_memory", { query: "oslo" });
      expect(search.isError).toBeUndefined();
      expect(textOf(search)).toBe(renderSearch(memory.search("oslo")));
      expect(textOf(search)).toContain("wiki/oslo-trip.md");

      const page = await session.call("read_page", { path: "wiki/oslo-trip.md" });
      expect(textOf(page)).toBe(renderPageContents(memory.read("wiki/oslo-trip.md")));
      expect(textOf(page)).toContain("Flights booked for September");

      const index = await session.call("list_index");
      expect(textOf(index)).toBe(renderIndex(memory.listIndex()));
      expect(textOf(index)).toContain("wiki/oslo-trip.md");
    } finally {
      expect(await session.close()).toBe(0);
    }
  }, 15000);

  test("refuses traversal and absolute paths cleanly, and keeps serving", async () => {
    const { dir, memoryRoot } = seededDir();
    const session = new McpSession(dir, memoryRoot);
    try {
      await session.initialize();

      const traversal = await session.call("read_page", { path: "../../etc/passwd" });
      expect(traversal.isError).toBe(true);
      expect(textOf(traversal)).toContain("memory root");
      expect(textOf(traversal)).not.toContain("root:");

      const absolute = await session.call("read_page", { path: "/etc/passwd" });
      expect(absolute.isError).toBe(true);
      expect(textOf(absolute)).toContain("memory root");

      // The refusals were results, not a crash: the server still answers.
      const index = await session.call("list_index");
      expect(index.isError).toBeUndefined();
      expect(textOf(index)).toContain("wiki/oslo-trip.md");
    } finally {
      expect(await session.close()).toBe(0);
    }
  }, 15000);

  test("write tools are refused by name, and bad arguments are a result too", async () => {
    const { dir, memoryRoot } = seededDir();
    const session = new McpSession(dir, memoryRoot);
    try {
      await session.initialize();

      for (const name of ["write_page", "append_log"]) {
        const refused = await session.call(name, { title: "Sneaky", summary: "no" });
        expect(refused.isError).toBe(true);
        expect(textOf(refused)).toContain("read-only");
      }

      const badArgs = await session.call("search_memory", { query: { not: "a string" } });
      expect(badArgs.isError).toBe(true);
      expect(textOf(badArgs)).toContain("Validation failed");
    } finally {
      expect(await session.close()).toBe(0);
    }
  }, 15000);
});
