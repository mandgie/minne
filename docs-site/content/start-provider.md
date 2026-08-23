---
title: Choose your AI
description: Minne has no model of its own. Sign in with a subscription you already pay for, bring an API key, or point it at a model on your own machine.
---

Minne is the memory and the machinery; the thinking is done by a model you
choose. There is no Minne account and no Minne billing, because there is no
Minne server for a model to live on.

The choice lives in **Settings → Account** ("Which AI Minne thinks with"), and
it is the first thing first-run asks you. Four cards:

| Card | What it means |
| --- | --- |
| **Claude (Pro/Max)** | Sign in with your Claude subscription. Nothing extra to pay for. |
| **ChatGPT (Plus/Pro)** | Sign in with your ChatGPT subscription. |
| **Local (Ollama)** | Talk to a model on this Mac. Nothing leaves the machine. |
| **API key** | Pay per token with a key from Anthropic or OpenAI. |

One model serves everything — chat, the Minne key, and the sync pass that
distils captures into wiki pages. That is one function in the code rather than
a convention, so there is no way for the three to drift apart.

## Signing in with a subscription

Pick the card and press **Sign In**. Minne opens your browser at the provider's
own authorization page; you approve there, and the browser hands a token back to
a listener on `127.0.0.1`. Minne never sees your password.

If the browser hand-back does not complete — some setups block the loopback
listener — the sign-in also accepts the authorization code pasted back into the
app. Whichever finishes first wins.

:::warn
Using a Claude or ChatGPT subscription from a third-party app is a grey area
under those providers' terms. You authenticate with your own account and the
risk sits with that account. The API-key and local-model paths raise no such
question.
:::

## Using an API key

Pick **API key**, choose Anthropic or OpenAI in the "Key from:" popup, paste the
key, and press **Use This Account**. Nothing goes over the network during
sign-in — the key is written straight to disk.

It lands in `~/Library/Application Support/Minne/auth.json`, a file created
`0600` in a `0700` directory: readable by your user account and nobody else.
Billing is the provider's, per token.

## Running a local model

Pick **Local (Ollama)**, type the server address, press **Use This Server**.
There is no sign-in step, because there is nobody to sign in to.

The default address is `http://localhost:11434/v1` — Ollama's
OpenAI-compatible endpoint. Any OpenAI-compatible server works: vLLM, LM
Studio, whatever you run. Minne talks `/chat/completions` to it.

:::warn
The address needs its scheme. `localhost:11434` is rejected —
`http://localhost:11434/v1` is what the field wants.
:::

Two things worth knowing before you commit to local:

- **The model must be able to call tools.** Every Minne feature runs an agent
  loop with the memory tools attached; a model that cannot make tool calls
  cannot read or write the wiki, and nothing in the app will warn you about it.
- **The default local model is `llama3.1`, and there is no picker for it.** The
  card's only field is the server address. To use a different local model, edit
  `ollama.model` in `config.json` — see
  [CLI and environment](/reference/cli#config-json).

In exchange: nothing leaves the Mac. Not the captures, not the drafts, not the
questions.

## Choosing a model

The provider card has a **Model:** popup listing that provider's catalogue. It
works before you sign in — the catalogue is static — and changing it while the
provider is already in use applies immediately, with no re-sign-in.

Left alone, each provider uses a sensible mid-tier default: `claude-sonnet-5`
for Anthropic, `gpt-5.5` for OpenAI. Mid-tier on purpose: the same model does
chat, drafting and the background distillation, and the distillation runs
whether you are watching or not.

## Switching, and signing out

Switching providers is picking a different card. Signing out clears the stored
credential for the current provider.

:::note
Deleting `auth.json` by hand does **not** sign you out of a running Minne — the
brain holds the credential in memory as well. Use Sign Out.
:::

Revoking the grant on the provider's side (in your Anthropic or OpenAI account
settings) is a separate act, and one Minne cannot do for you.

## What each choice sends where

Every path, in detail, is on [What leaves your Mac](/privacy). In short: model
requests go to `api.anthropic.com`, `chatgpt.com/backend-api`,
`api.openai.com`, or the local address you set — and to nowhere else.
