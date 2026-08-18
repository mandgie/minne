// `minne-brain --mcp` (US-110): a read-only stdio MCP server over the memory.
//
// Any MCP client (Claude Desktop first) gets exactly the three read-only
// memory tools — search_memory, read_page, list_index — as Minne's own agents
// see them: the same AgentTool definitions, the same Memory methods, the same
// rendered text. The write tools are never served, under any name; an MCP
// client may read this memory, only Minne changes it.
//
// stdout discipline is absolute here too: the SDK's stdio transport owns
// stdout for MCP JSON-RPC, so all logging goes to stderr via `deps.log`.
import { validateToolArguments } from "@earendil-works/pi-ai";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolResult,
  type Tool as McpTool,
} from "@modelcontextprotocol/sdk/types.js";
import { Readable } from "node:stream";
import { stdinChunks } from "./jsonlines";
import type { Memory } from "./memory";
import { readOnlyMemoryTools } from "./memory-tools";

export interface McpDeps {
  memory: Memory;
  brainVersion: string;
  log: (...args: unknown[]) => void;
}

/** A tool failure the client should see as a result, not a dead server. */
function refusal(message: string): CallToolResult {
  return { content: [{ type: "text", text: message }], isError: true };
}

/**
 * Serves the read-only memory tools over stdio until the client disconnects
 * or stdin closes. Never returns while the server is healthy.
 */
export async function runMcpServer(deps: McpDeps): Promise<void> {
  const tools = readOnlyMemoryTools(deps.memory);
  const server = new Server(
    { name: "minne-brain", version: deps.brainVersion },
    {
      capabilities: { tools: {} },
      instructions:
        "Read-only view of the user's Minne memory: a markdown wiki distilled from what has " +
        "been on their screen, plus the raw captures it cites. Start with list_index for the " +
        "map or search_memory for a topic; read_page fetches one file in full.",
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, () => ({
    // typebox parameter schemas are plain JSON Schema objects (plus symbol
    // keys, which serialization drops), so the agent's own schemas serve
    // as the MCP inputSchema unchanged.
    tools: tools.map(
      (tool): McpTool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.parameters as unknown as McpTool["inputSchema"],
      }),
    ),
  }));

  let calls = 0;
  server.setRequestHandler(CallToolRequestSchema, async (request): Promise<CallToolResult> => {
    const name = request.params.name;
    const tool = tools.find((candidate) => candidate.name === name);
    if (tool === undefined) {
      return refusal(
        `unknown tool "${name}" — this server is read-only and has exactly ` +
          `search_memory, read_page and list_index`,
      );
    }
    const callId = `mcp-${++calls}`;
    try {
      // The same validation the agent loop runs before execute: a tool never
      // sees wrong types, and an UnsafePathError from memory-path.ts surfaces
      // below as a refusal rather than an escape or a crash.
      const args = validateToolArguments(tool, {
        type: "toolCall",
        id: callId,
        name,
        arguments: request.params.arguments ?? {},
      });
      const result = await tool.execute(callId, args);
      return { content: result.content as CallToolResult["content"] };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      deps.log(`mcp: ${name} refused — ${message}`);
      return refusal(message);
    }
  });

  // Bun 1.2.x buffers a piped process.stdin until EOF (see jsonlines.ts),
  // which would deadlock the SDK's default transport mid-handshake; hand it
  // the fd-0 reader the protocol mode already relies on.
  const stdin = Readable.from(stdinChunks());
  const transport = new StdioServerTransport(stdin, process.stdout);
  await server.connect(transport);
  deps.log(`mcp: serving ${tools.map((tool) => tool.name).join(", ")} over ${deps.memory.root}`);

  await new Promise<void>((resolve) => {
    server.onclose = resolve;
    stdin.on("end", resolve);
  });
  await server.close();
}
