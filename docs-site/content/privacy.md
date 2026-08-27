---
title: What leaves your Mac
description: An audited claim, not an aspiration — every byte Minne sends anywhere, per feature, and everything that never moves.
---

Minne has no backend. There is no Minne server to sign into, no telemetry
endpoint, no analytics, no crash reporter, and no cloud copy of your memory.
The Swift app links no networking API at all; the only code in the project that
opens a socket is the brain's provider layer, talking to the one AI provider
you configured.

That is a checkable claim rather than a promise — the app is
[MIT-licensed and readable](https://github.com/mandgie/minne).

## What travels, feature by feature

Everything below goes to **your** AI provider, under your own account or key,
and nowhere else.

| Feature | What is sent |
| --- | --- |
| **The Minne key** | The focused field's text, your selection, the visible text of the window around it, and the wiki pages Minne recalled for grounding — clipped, inside one model request. |
| **Chat** | Your messages, plus whatever memory excerpts the assistant reads through its search and read tools while answering. |
| **Memory sync** | Recent raw captures, in batches, so the agent can distil them into wiki pages. Masking happens before a capture touches disk, so what is sent is already masked. |
| **Sign-in** | One OAuth exchange with that provider's own auth endpoints, or nothing at all for an API key. |

One request does not go to your provider: once a day, the brain asks GitHub
for the latest release tag so the menu bar can say **Update Available** — an
anonymous GET with no account, no identifier and nothing of yours in it.
Settings → General turns it off.

And the one that matters most:

| Never sent | |
| --- | --- |
| **The `~/Minne` folder** | There is no backup, no sync, and no code path that uploads your memory anywhere. Pages are read into model prompts as excerpts when a feature needs them. That is the only way any of it travels. |

## The hosts Minne can contact

Model requests go to the provider's public API host:

- Anthropic — `api.anthropic.com`
- OpenAI — `chatgpt.com/backend-api`, `api.openai.com`
- Local — the base URL you set, `http://localhost:11434/v1` by default

Sign-in adds those providers' own auth endpoints: `claude.ai` and
`platform.claude.com` for Anthropic, `auth.openai.com` for OpenAI.

The daily version check goes to `api.github.com` — and stops entirely when
you switch it off in Settings → General.

:::tip
Want even the model traffic to stay home? Point Minne at Ollama on your own
machine in Settings → Account. Then nothing leaves the Mac at all. See
[Choose your AI](/start/provider).
:::

## Text, never pictures

Minne reads through the macOS Accessibility APIs — the same mechanism a screen
reader uses. It asks the focused window for its text. It does not take
screenshots, does not record the screen, and does not request Screen Recording
permission, so macOS will never show you the purple recording indicator because
of Minne.

## Masked before it is written

Five kinds of number are replaced with `▮▮▮` at capture time, before anything is
written to disk: card numbers, CVVs, IBANs, Swedish personal identity numbers
and US social security numbers. The masked form is what lands in
`~/Minne/sources/`, and therefore what a sync batch later sends to your
provider. The capture records only *how many* spans were replaced, never what
they were.

The design rule is *validate, don't just match*. A regex alone would mask any
sixteen-digit run — order numbers, build ids, phone lists — and a memory full of
`▮▮▮` is worse than useless. So every pattern with a checksum is checked against
it (Luhn for cards and personnummer, mod-97 for IBAN), and the two without one
are anchored on a separator or a nearby keyword instead. The cost is accepted
false negatives; the benefit is a memory that still reads like the screen it
came from.

Password fields — anything macOS marks as a secure text field — are skipped
whole, with their entire subtree, before a single attribute is read. They are
never read-then-masked.

## Excluding things from capture

The blacklist in Settings → Privacy takes apps you never want read and domains
you never want read in a browser. Those windows produce no snapshot at all —
this is a harder rule than masking, which cleans a snapshot after the fact.

Minne ships with the list already populated: the password managers, the system
keychain, the vault websites, and the credential pages of the identity providers
most people pass through daily. Add your bank, your therapist's portal, whatever
you would rather it did not see. Edits reach the running capture engine
immediately.

Private and incognito browser windows are skipped on their titles, without being
on any list.

**Pausing** is the blunt version: the menu bar and Settings both offer 15
minutes, an hour, or until you say otherwise.

## Erasing it

Almost everything Minne knows is `~/Minne`. Delete the folder and that part is
gone — there is no server-side copy to also delete, because there is no server.

Two things live outside it, in
`~/Library/Application Support/Minne`: the search index over your captures, and
your stored sign-in. **Delete All Memory…** in Settings → Privacy removes all of
it in one go — the folder, the index, the sync state and the credential, in and
out of memory — and starts you over from an empty wiki. It asks you to type
`delete` first.

Your provider and model choice survives, deliberately: which AI you picked is a
preference, not a memory.

:::warn
A wipe is final. There is no undo, no trash, and no server-side copy to restore
from — that is the whole point of the design.
:::

## What an MCP client changes

`minne-brain --mcp` serves your memory read-only to an MCP client you configure,
over local stdio. Nothing listens on the network. But what that client then
sends to *its* model is governed by the client, not by Minne — if you connect
Claude Desktop, memory excerpts travel wherever Claude Desktop sends them. See
[Minne in Claude Desktop](/guides/mcp).

## A note on subscription sign-in

Using a Claude or ChatGPT subscription from a third-party app is a grey area
under those providers' terms of service. You authenticate with your own account
and the risk sits with that account. The API-key and local-model paths carry no
such question.
