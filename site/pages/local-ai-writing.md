---
slug: local-ai-writing
title: A local, open-source AI writing assistant for your Mac — Minne
h1: A local, open-source AI writing assistant for your Mac
description: Minne is a free, MIT-licensed writing assistant that keeps its memory as plain markdown on your Mac — and, pointed at Ollama, runs entirely against a model on your own machine. Offline, no cloud, no account.
published: 2026-08-26
---

Minne is a free, MIT-licensed AI writing assistant for macOS. It remembers
what you work on — as a folder of plain markdown in `~/Minne` — and writes
from that memory wherever you type: tap right-Option in any text field and
the draft is there. Point it at [Ollama](https://ollama.com) on localhost and
the whole loop runs on your own machine. No account, no Minne server, no
telemetry — and with a local model, no network traffic at all.

> A writing assistant is only as private as its two halves: the context it
> writes from, and the model it writes with. Minne keeps the first on your
> disk always, and lets you keep the second there too.

## What "local" means here, exactly

"Local" gets claimed loosely, so here is Minne's version, feature by feature.
The only network traffic Minne ever makes is model requests to the one AI
provider you configured — there is no other endpoint in the code:

- **Draft** sends the field you are writing in, the window around it, and the
  notes Minne recalls — one model request.
- **Chat** sends your question and the notes the answer needs.
- **Memory sync** sends recent captures, already masked, to be distilled into
  notes.
- **Never:** the `~/Minne` folder itself. No backup, no cloud sync, no upload
  path in the code.

Set the provider to a model on localhost and even that traffic stays home.
The full ledger, host by host, is in
[What leaves your Mac](https://docs.minne.sh/privacy).

## Running Minne on Ollama

Pick **Local (Ollama)** in Settings → Account and give it the server address —
`http://localhost:11434/v1`, Ollama's OpenAI-compatible endpoint, is the
default. Any OpenAI-compatible server works: vLLM, LM Studio, whatever you
run. There is no sign-in step, because there is nobody to sign in to.

Two things to know before you commit to local, both from
[the provider guide](https://docs.minne.sh/start/provider):

- **The model must be able to call tools.** Every Minne feature runs an agent
  loop with memory tools attached; a model that cannot make tool calls cannot
  read or write the wiki.
- **The default local model is `llama3.1`.** To use a different one, set
  `ollama.model` in `config.json`.

Prefer a frontier model? Bring an API key from Anthropic or OpenAI — it is
stored on your Mac, readable by your user account and nobody else, and billed
per token by the provider. Your memory stays local either way; only the model
requests travel.

## The memory is files, not a service

What Minne writes from is not an embedding index in someone's cloud. It is a
wiki you can open:

```
~/Minne/
  SCHEMA.md              the rules — yours to edit
  sources/               raw captures, masked before they land
  wiki/ingrid-berg.md    one page per person, project, topic
  wiki/style/style-mail.md   how you write, learned from your writing
```

It is an Obsidian vault as it stands, it greps, and it goes under git if you
want a history. [Your memory folder](https://docs.minne.sh/guides/memory) documents
every file and field.

## Why open source matters for a tool like this

An app that reads the text of your windows is asking for real trust, and
"trust us" is not an audit. Minne's claim is checkable instead: the Swift app
links no networking API at all, and the only code in the project that opens a
socket is the provider layer, talking to the AI you chose. The whole thing is
[MIT-licensed and readable](https://github.com/mandgie/minne), and you can
[build it from source](https://docs.minne.sh/reference/build) and confirm the
app you run is the code you read.

That is also your exit: the app is free, the format is markdown, and leaving
is copying a folder.

## Where to go next

Minne runs on macOS 14 and later —
[download it](https://github.com/mandgie/minne/releases/latest/download/Minne.dmg)
and point it at whatever model you trust. If you came here escaping a
screen-recording tool, read [the Rewind alternative page](/rewind-alternative);
for what the capture layer can and cannot see,
[your Mac's AI memory doesn't need a screen recorder](/ai-without-screen-recording).
