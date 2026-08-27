---
title: CLI and environment
description: The one flag the brain takes, the config file behind Settings, and every environment variable the two halves of Minne read.
---

Minne is two programs. The Swift app owns the menu bar, the permissions and
the keys; a compiled TypeScript binary called the brain owns the model calls
and the wiki. They speak JSON-lines over stdio, and the app launches the brain
for you.

None of this is required to use Minne. It is here for development, for MCP
clients, and for the two or three settings that have no switch.

## The brain binary

```
/Applications/Minne.app/Contents/MacOS/minne-brain
```

It sits in `Contents/MacOS` rather than `Contents/Resources` because a nested
executable has to be signed as code; under `Resources` it would be sealed as a
resource, and codesign and notarization both object.

It takes **exactly one flag**:

| Flag | Effect |
| --- | --- |
| `--mcp` | Start the read-only MCP server over stdio. |
| *(none)* | Speak Minne's own JSON-lines app protocol over stdio. |

The two modes are mutually exclusive — `--mcp` returns without ever
constructing the protocol server or its scheduler. There is no `--version`, no
`--help`, and no other flag; anything else on the command line is ignored.

Running it by hand with no flag is not useful: it waits for an app on the
other end of stdin. `--mcp` is the mode you would type deliberately, and
[Minne in Claude Desktop](/guides/mcp) covers how to wire it up.

## stdout is protocol, stderr is logs

The rule holds in both modes: **stdout carries protocol only**. Every log line
goes to stderr, prefixed `[minne-brain]`.

```
[minne-brain] starting (protocol 1, brain 0.1.5)
```

This is not tidiness. A stray `console.log` in the brain corrupts the JSON-RPC
or JSON-lines stream the client is parsing, and the failure looks like a
protocol bug rather than a print statement. If you are debugging, redirect
stderr and leave stdout alone.

## config.json

```
~/Library/Application Support/Minne/config.json
```

The brain's persisted settings. Plain JSON, written atomically — to a `.tmp`
file and then renamed — so a crash mid-write cannot leave a half-file behind.
Secrets are not in here; they live in `auth.json` next to it.

If the file is missing, unreadable or not valid JSON, the brain silently falls
back to the defaults. There is no error and no prompt.

| Key | Type | Default |
| --- | --- | --- |
| `provider` | string | `"anthropic"` |
| `model` | string or null | `null` — the provider's own default |
| `ollama.baseUrl` | string | `"http://localhost:11434/v1"` |
| `ollama.model` | string | `"llama3.1"` |

Merging is per key: anything absent, empty or of the wrong type falls back to
its default rather than failing the whole file. Unknown keys are read and then
dropped — the next save writes only the four above.

The practical reason to open this file is `ollama.model`. Settings' local
provider card has one field, the server address, so changing which local model
Minne talks to has no UI at all:

```json
{
  "provider": "ollama",
  "model": null,
  "ollama": {
    "baseUrl": "http://localhost:11434/v1",
    "model": "qwen3:14b"
  }
}
```

See [Choose your AI](/start/provider) for what that model has to be capable
of — tool calling is not optional.

## The brain's environment variables

| Variable | Meaning | Default |
| --- | --- | --- |
| `MINNE_MEMORY_ROOT` | The markdown memory root. | `~/Minne` |
| `MINNE_APP_SUPPORT_DIR` | Where `auth.json`, `config.json`, `sync-state.json` and `minne.db` live. | `~/Library/Application Support/Minne` |
| `MINNE_SYNC_INTERVAL_MS` | How often the sync pass runs. `0` disables the timer. | `1800000` (30 minutes) |
| `MINNE_LINT_INTERVAL_MS` | How often the lint pass runs. `0` disables it. | `604800000` (7 days) |
| `MINNE_SYNC_BATCH_SIZE` | Snapshots per model turn. | `12` |
| `MINNE_SYNC_MAX_BATCHES` | Turns per pass; the rest waits for the next one. | `4` |
| `MINNE_SYNC_SNAPSHOT_CHARS` | Characters of each capture sent to the model. | `4000` |
| `MINNE_SYNC_MAX_TURNS` | Tool round trips the agent gets per batch. | `12` |
| `MINNE_UPDATE_INTERVAL_MS` | How often the daily version check may hit the network. `0` disables it. | `86400000` (24 hours) |
| `MINNE_UPDATE_CHECK_URL` | Where the latest release is asked for. | GitHub's `releases/latest` API |
| `MINNE_UPDATE_TIMEOUT_MS` | Deadline for that request. | `10000` |
| `MINNE_BRAIN_PATH` | Read by the **app**: which brain to launch. A path ending `.ts` is run through `bun run`. | — |

An empty value counts as unset.

### Bad values are ignored, not rejected

Each of the six numeric variables has a minimum, and a value that is not an
integer or falls below it is **silently discarded** — the default is used and
nothing is logged.

| Variable | Minimum |
| --- | --- |
| `MINNE_SYNC_INTERVAL_MS` | `0` |
| `MINNE_LINT_INTERVAL_MS` | `0` |
| `MINNE_SYNC_BATCH_SIZE` | `1` |
| `MINNE_SYNC_MAX_BATCHES` | `1` |
| `MINNE_SYNC_SNAPSHOT_CHARS` | `200` |
| `MINNE_SYNC_MAX_TURNS` | `1` |

So `MINNE_SYNC_INTERVAL_MS=60s` and `MINNE_SYNC_SNAPSHOT_CHARS=50` both leave
you on the defaults. If a knob appears to have had no effect, that is the
first thing to check.

`MINNE_BRAIN_PATH` is the app's variable, not the brain's. It is how
`scripts/dev.sh` runs the debug app against uncompiled TypeScript:

```sh
MINNE_BRAIN_PATH="$ROOT/brain/src/main.ts" exec "$APP_BIN"
```

Left unset, the app looks for `minne-brain` beside its own executable, then
walks up from there looking for `brain/src/main.ts`.

## Both halves must agree

`MINNE_MEMORY_ROOT` and `MINNE_APP_SUPPORT_DIR` are read by the app *and* by
the brain, and they resolve them the same way on purpose. If you set them, set
them for both.

The failure mode is quiet. Point an MCP client at a custom memory root while
leaving the app-support directory at its default and it will read `minne.db`
from the wrong place — a search index built over a different set of captures.
Search returns confident answers about pages that are not there.

:::warn
`Minne.app` launched from the Finder or the Dock inherits **no shell
environment**. Nothing in your `.zshrc` reaches it. These variables therefore
matter for terminal launches, `scripts/dev.sh`, and MCP clients — not for
ordinary use of the app.
:::

The brain inherits its environment from whatever launched it, so setting a
variable for the app sets it for the brain too.

## Credentials from the environment

The agent layer Minne is built on ([pi](https://github.com/badlogic/pi-mono))
falls back to the usual provider variables when no credential is stored in
`auth.json`:

- `ANTHROPIC_API_KEY`, `ANTHROPIC_AUTH_TOKEN`, `ANTHROPIC_OAUTH_TOKEN`
- `OPENAI_API_KEY`

A credential you signed in with takes precedence; the environment is the
fallback, not an override. And the same caveat applies — a GUI-launched Minne
sees none of these, so this is a development and terminal convenience rather
than a way to configure the app. Settings → Account is the supported route.
See [Choose your AI](/start/provider).

## Files these variables move

| Path | What it is |
| --- | --- |
| `~/Minne/sources/` | Raw captures, one directory per day. Immutable. |
| `~/Minne/wiki/` | The agent-maintained pages. |
| `~/Minne/SCHEMA.md` | The human-owned contract the wiki is kept against. |
| `~/Library/Application Support/Minne/auth.json` | The credential. `0600` in a `0700` directory. |
| `~/Library/Application Support/Minne/config.json` | The settings above. |
| `~/Library/Application Support/Minne/sync-state.json` | The sync watermark and last-pass summary. |
| `~/Library/Application Support/Minne/minne.db` | The full-text search index over every snapshot. |

[Files and paths](/reference/files) goes through each of them properly.

## Test-only knobs

A handful of other `MINNE_*` variables exist to drive the test suite — a mock
provider, a prompt dump. They are deliberately undocumented as features, are
not stable between releases, and are visible in the source for anyone who
needs them. [Build from source](/reference/build) is the starting point.
