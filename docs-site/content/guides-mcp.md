---
title: Minne in Claude Desktop
description: Serve your memory read-only to Claude Desktop, or any other MCP client, over local stdio.
---

The brain binary has a second mode. Run it with `--mcp` and instead of speaking
Minne's own app protocol it becomes an [MCP](https://modelcontextprotocol.io)
server, handing your memory to any MCP client over stdio — read-only.

The client gets exactly three tools, the same ones Minne's own agents use to
consult the memory.

| Tool | What it does |
| --- | --- |
| `search_memory` | Search the wiki pages and the raw captures. Words are ANDed and matched whole; end a word with `*` for a prefix match. |
| `read_page` | Read one file of the memory in full, by its memory-root-relative path — `wiki/oslo-trip.md`, `index.md`, or a `sources/…` citation. |
| `list_index` | The map of the wiki: `index.md` plus every page with its type, summary and last update. |

The write tools are never exposed. An MCP client may read this memory; only
Minne changes it. Paths are contained to the memory root — traversal, absolute
paths and symlinks pointing outward are all refused.

## Claude Desktop

Add Minne to
`~/Library/Application Support/Claude/claude_desktop_config.json`, creating the
file if it does not exist, then restart Claude Desktop:

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

The path points at the brain binary inside the installed app bundle. If Minne
lives somewhere other than `/Applications`, adjust `command` to match.

## A memory that is not in `~/Minne`

The server reads `~/Minne` by default — the same root the app writes. If you
moved your memory with `MINNE_MEMORY_ROOT`, give the server the same override:

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

## Any other MCP client

Any client that speaks MCP over stdio works identically: run
`/Applications/Minne.app/Contents/MacOS/minne-brain` with the single argument
`--mcp` and talk JSON-RPC on its stdio. Without `--mcp` the binary speaks
Minne's app protocol instead — the two modes are mutually exclusive.

:::warn
This is the one place where Minne's privacy story hands off to somebody else's.
Nothing listens on the network and the server itself sends nothing anywhere,
but what the *client* does with the memory it reads is governed by that client.
Connect Claude Desktop and your memory excerpts travel wherever Claude Desktop
sends them. See [What leaves your Mac](/privacy).
:::
