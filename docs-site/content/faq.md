---
title: FAQ
description: The questions people ask before they install Minne, and a few they ask afterwards.
---

## Does Minne record my screen?

No. It reads the *text* of the focused window through the macOS Accessibility
APIs — the same interface a screen reader uses. There are no screenshots and no
screen recording, and Minne never asks for Screen Recording permission, so the
purple recording indicator will never appear because of it.

## Where does my memory live?

`~/Minne`. It is a folder of plain markdown: `wiki/` for the pages the agent
maintains, `sources/` for the raw captures they were built from, and
`SCHEMA.md`, which is yours. Open it in Obsidian, grep it, put it in a git
repository if you like. See [Your memory folder](/guides/memory).

## Is there an account? A server? A subscription?

None of the three. Minne is free and MIT-licensed. It has no backend at all —
the only network traffic it makes is model requests to whichever AI provider
you signed in with, on your own account. See
[What leaves your Mac](/privacy).

## Then what does it cost to run?

Whatever your AI provider costs you. If you already pay for Claude Pro/Max or
ChatGPT Plus/Pro, signing in with that subscription costs nothing extra. An API
key is billed per token by that provider. A local model through Ollama costs
electricity. See [Choose your AI](/start/provider).

## Is using my Claude or ChatGPT subscription allowed?

It is a grey area. Providers' terms are written with their own clients in mind,
and using a subscription from a third-party app sits outside that. You
authenticate with your own account and the risk sits with that account. The
API-key and local-model paths raise no such question, and Minne supports both
as first-class options.

## Does it work offline?

Capture does — that is all local. Drafting and chat need whatever model you
pointed Minne at, so they work offline only if that model is on your machine
(Ollama, or any OpenAI-compatible server on localhost).

## Windows? Linux? iOS?

No. Minne is macOS 14 and later, and the capture layer is built directly on
macOS's Accessibility APIs, so there is no quick port.

## Can I read my memory from Claude Desktop or another AI client?

Yes, read-only, over local stdio. See
[Minne in Claude Desktop](/guides/mcp).

## Will it capture my passwords?

Password fields — anything macOS marks as a secure text field — are skipped
entirely. Card numbers, personal identity numbers and IBANs are masked before
anything is written to disk. And the blacklist lets you exclude whole apps from
capture: put your password manager and your bank in it. See
[Settings → Privacy](/reference/settings#privacy).

## Can I edit what it remembers?

Yes — they are markdown files and nothing stops you opening one and fixing it.
`SCHEMA.md` is the more powerful lever: it tells the agent what is worth keeping
and how pages should be shaped, and it is human-owned by design. See
[Steering with SCHEMA.md](/guides/schema).

## How do I delete everything?

Delete `~/Minne`, or use the wipe in Settings. There is no server-side copy, so
that is genuinely all of it. It cannot be undone.

## Why "Minne"?

It is Swedish and Norwegian for *memory*.

## Something is wrong / missing / broken.

[Troubleshooting](/troubleshooting) first, then
[open an issue](https://github.com/mandgie/minne/issues). It is early software
built in the open, and the code is the final word on anything these docs claim.
