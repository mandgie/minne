# Minne as an MCP server

`minne-brain --mcp` serves your Minne memory to any MCP client over stdio —
read-only. The client gets exactly three tools, the same ones Minne's own
agents use to consult the memory:

| Tool | What it does |
| --- | --- |
| `search_memory` | Search the wiki pages and the raw screen captures. Words are ANDed and matched whole; end a word with `*` for a prefix match. |
| `read_page` | Read one file of the memory in full, by its memory-root-relative path (`wiki/oslo-trip.md`, `index.md`, or a `sources/…` citation). |
| `list_index` | The map of the wiki: `index.md` plus every page with its type, summary and last update. |

The write tools are never exposed: an MCP client may read this memory, only
Minne changes it. Paths are contained to the memory root — traversal, absolute
paths and symlinks pointing out are refused.

## Claude Desktop

Add Minne to `~/Library/Application Support/Claude/claude_desktop_config.json`
(create the file if it does not exist), then restart Claude Desktop:

```json
{
  "mcpServers": {
    "minne": {
      "command": "/Applications/Minne.app/Contents/MacOS/minne-brain",
      "args": ["--mcp"]
    }
  }
}
```

The path points at the brain binary inside the installed app bundle. If you run
Minne from somewhere else, adjust the `command` accordingly.

## Non-default memory root

The server reads `~/Minne` by default — the same root the app writes. If your
memory lives elsewhere (you set `MINNE_MEMORY_ROOT` for the app), give the
server the same override:

```json
{
  "mcpServers": {
    "minne": {
      "command": "/Applications/Minne.app/Contents/MacOS/minne-brain",
      "args": ["--mcp"],
      "env": {
        "MINNE_MEMORY_ROOT": "/path/to/your/memory"
      }
    }
  }
}
```

## Other MCP clients

Any client that speaks MCP over stdio works the same way: run
`/Applications/Minne.app/Contents/MacOS/minne-brain` with the single argument
`--mcp` and talk JSON-RPC on its stdio. Without `--mcp` the binary speaks
Minne's own app protocol instead — the two modes are mutually exclusive.
