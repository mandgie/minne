---
slug: vs/goldfish
title: Minne vs Goldfish — which Mac AI memory is for you?
h1: Minne and Goldfish — which one is for you?
description: An honest comparison of the two closest neighbours. Both are Mac AI memories that draft where you type from text captured via the Accessibility APIs. The real differences: who runs the model, what the memory is stored as, and whether you can read the code.
published: 2026-08-27
checked: 2026-08-27
---

Of everything Minne gets compared to, [Goldfish](https://goldfish.sh) is the
closest. Both are lightweight Mac apps that quietly build a memory of your
work and draft from it, in your tone, when you press Option in a text field.
Both read the *text* of your windows through the Accessibility APIs — no
screenshots, no screen recording, in Goldfish's case in its own words. Both
keep the memory on your machine, auto-generate a browsable wiki from it, and
serve it to Claude Desktop over local MCP.

So the choice is not about the idea — it is the same idea. It comes down to
three things: **who runs the model**, **what the memory is stored as**, and
**whether you can read the code**.

> When two tools share an idea, compare their defaults: where the model runs,
> what format the memory takes, and what you can verify. That is where alike
> products stop being alike.

## What Goldfish does well

From Goldfish's own site and Product Hunt page, checked at the date in the
footer:

- **The same one-key promise, polished.** Press ⌥ Option anywhere you type to
  reply, write, summarise or continue, with the context already in front of
  you — plus a chat "aquarium" in the notch.
- **More than drafting.** It identifies your repetitive workflows, notices
  forgotten follow-ups and nudges you, and does voice dictation.
- **A clear privacy posture.** Its privacy policy is plainly written: memory
  in a local SQLite database on your device, capture via the accessibility
  APIs — "No screenshots. No screen recording. Just text." — with pause,
  per-app and per-domain exclusions, and delete controls.
- **Real traction.** #1 Product of the Day on Product Hunt (16 June 2026),
  987 upvotes and a 5.0 rating across its first 7 reviews at time of
  checking. Built by Joel and Kaspian, two Swedes in San Francisco.
- **A Windows build**, alongside the Mac one. Free while in beta; post-beta
  pricing is not yet published.

## Where Minne differs

- **You choose — and can keep — the model.** Goldfish routes every AI request
  through its own Azure OpenAI deployment, with zero data retention per its
  policy; there is no bring-your-own-model option on its site. Minne has no
  deployment to route through: bring an Anthropic or OpenAI key, sign in with
  a subscription, or point it at [Ollama on your own machine](/local-ai-writing)
  — in which case nothing leaves it at all.
- **The memory is markdown files, not a database.** Goldfish stores memory in
  a local SQLite database and lets you browse its wiki in the app. Minne's
  wiki *is* the files: one page per person, project and topic in `~/Minne`,
  open-in-Obsidian compatible, greppable, git-able, with
  [a schema file you own](https://docs.minne.sh/guides/schema) governing what
  gets kept. [The folder is the product](/second-brain).
- **No account, no telemetry.** Goldfish's policy describes optional accounts,
  Stripe billing plumbing and limited event-only telemetry. Minne has none of
  the three — there is no Minne server for any of it to talk to, and
  [the egress ledger](https://docs.minne.sh/privacy) is the complete list of
  what travels.
- **You can read the code.** Minne is
  [MIT-licensed and public](https://github.com/mandgie/minne); every claim
  above is checkable against the source. Goldfish's code is not published as
  of this check. For a category this intimate, that is the deepest
  difference: one product asks for trust, the other shows its work.

## Choose Goldfish if…

- You want the most polished version of this idea today, with workflow
  detection, follow-up nudges and dictation on top.
- You like AI being handled for you — one deployment, zero configuration,
  free while the beta lasts.
- You need Windows.

## Choose Minne if…

- You want to pick the model — including a fully local one — rather than use
  the vendor's.
- You want the memory as plain files you can open, edit and take with you,
  not a database inside an app.
- You want open source, no account and no telemetry, and are comfortable
  with early software — Minne is young and says so.

It is genuinely pleasing that the closest product to Minne shares its
text-not-pixels conviction — [the case for that approach](/ai-without-screen-recording)
applies to both. For what either kind of tool should be measured against,
start at [what is a personal AI memory?](/what-is-ai-memory); for the other
neighbours, see [Minne and Elephas](/vs/elephas) and
[Minne and Raycast AI](/vs/raycast-ai).
