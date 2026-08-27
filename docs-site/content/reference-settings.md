---
title: Settings
description: Every pane, every control, every default — Account, Privacy, Memory and General.
---

Settings opens with `⌘,`, or from **Settings…** in the menu bar. Four panes in
the toolbar: Account, Privacy, Memory, General. It opens on Account.

## Account

**Which AI Minne thinks with.** Chat and the memory sync pass both use this
account and model.

Four provider cards:

| Card | What it is |
| --- | --- |
| **Claude (Pro/Max)** | Sign in with your Claude subscription. Nothing extra to pay for. |
| **ChatGPT (Plus/Pro)** | Sign in with your ChatGPT subscription. |
| **Local (Ollama)** | Talk to a model on this Mac. Nothing leaves the machine. Takes a **Server:** address; the placeholder is `http://localhost:11434/v1`. |
| **API key** | Pay per token with a key from Anthropic or OpenAI. A **Key from:** popup picks which. |

A **Model:** popup lists that provider's catalogue — it works before you sign
in, and changing it while the provider is in use applies at once, with no
re-sign-in. Buttons are **Sign In** / **Sign Out**, or **Use This Server** for
the local card.

The full story, including what each choice costs and sends where, is on
[Choose your AI](/start/provider).

## Privacy

### Accessibility access

A status line — *"Accessibility access granted — Minne can read the window you
are working in"*, or *"Accessibility access missing — Minne captures nothing"*
— with two buttons:

- **Open Accessibility Settings**, shown only when the grant is missing. Fires
  the macOS prompt, then opens the right pane of System Settings.
- **Setup Guide…**, which reopens first-run onboarding from the beginning.
  That is also where the stale-grant repair lives; see
  [First run](/start/first-run#when-the-switch-is-on-but-nothing-works).

### Capture

**Capture:** — a popup with four states.

| Option | Effect |
| --- | --- |
| **Capturing** | The default. Minne reads the foreground window. |
| **Paused for 15 minutes** | Auto-resumes. |
| **Paused for 1 hour** | Auto-resumes. |
| **Paused until I resume** | Stays paused. The line beside it reads *"Nothing is being captured."* |

This is the same state as the menu bar's pause submenu — one setting, two
places to reach it. A timed pause shows *"Resumes in N min."* as it counts down.

**Keep raw captures for:** *N* **days (0 = forever)** — default **90**, range
0–3650, stepping by 5. The line under it says what that means:

> Raw captures older than 90 days are deleted. Wiki pages are never deleted.

That is the whole point of distilling: the pages outlive the captures they came
from. Lowering the number sweeps immediately rather than at the next daily tick.

### Never capture these

> Windows of these apps, and browser tabs on these domains, produce no snapshot
> at all.

Two lists, each with **Add** and **Remove**:

- **Apps** — bundle identifiers, e.g. `com.1password.1password`. Matched
  case-insensitively and exactly.
- **Domains** — e.g. `bank.example`. **Blocks subdomains too**, and accepts a
  bare domain, a leading dot, or a whole pasted URL.

Minne ships with both lists populated — password managers, the system keychain,
the vault websites, and the credential pages of the identity providers most
people pass through daily:

```
com.1password.1password        1password.com
com.agilebits.onepassword7     bitwarden.com
com.agilebits.onepassword-osx  lastpass.com
com.bitwarden.desktop          keepersecurity.com
com.lastpass.lastpassmacdesktop  dashlane.com
org.keepassxc.keepassxc        accounts.google.com
com.apple.keychainaccess       login.microsoftonline.com
com.apple.Passwords            appleid.apple.com
```

**Restore Default Lists** puts back the shipped set, including any default you
had removed. It is enabled only once you have edited a list.

Edits reach the running capture engine within a tick — no relaunch.

:::note
The blacklist governs the Minne key as well as capture: an app whose contents
may not become memory may not become a prompt either.
:::

### What leaves this Mac

A paragraph rather than a control, and an audited one. It is reproduced and
expanded on [What leaves your Mac](/privacy).

### Delete all memory

> Removes the wiki, every raw capture, the search index and your stored
> sign-in. There is no undo.

**Delete All Memory…** raises a sheet that asks you to type `delete` before the
destructive button becomes live. It then signs you out through the brain,
deletes `~/Minne`, the search index, the sync state and `auth.json`, and
re-seeds an empty memory. `config.json` survives — which provider you picked is
a preference, not a memory.

:::warn
There is no undo and no server-side copy to restore from. There is also no
partial version: no "delete captures only", no "delete the wiki only".
:::

## Memory

### Your memory

> Plain markdown you own. Open the folder in Finder, or point Obsidian at it as
> a vault.

Shows the path to `~/Minne/wiki` and opens it with **Open Wiki Folder**. (The
menu bar's **Open Memory Folder** opens the root, one level up.)

### Syncing

> Minne digests what it captured into wiki pages on a schedule. You can run a
> pass now.

Two status lines — when the last pass ran and what it did, and how much is
waiting — plus **Sync Now**, which runs a pass immediately instead of waiting
for the timer. Afterwards it reports, e.g. *"Digested 14 captures into 3
pages."* or *"Nothing new to digest."*

The schedule is every 30 minutes and is not a setting in the UI; it can be
changed with an environment variable, see
[CLI and environment](/reference/cli#the-brains-environment-variables).

## General

### Startup

**Launch Minne at login** — off on a fresh install. It is backed by macOS's own
login-item service, so the checkbox reflects what launchd actually thinks. It
is disabled, with an explanatory tooltip, when Minne is running as a bare
executable rather than from `Minne.app`.

### Updates

**Check for new versions** — on by default. Once a day the brain asks GitHub
for the latest release tag; a newer one shows as **Update Available** in the
menu bar, which opens the release page. The request is anonymous — nothing
about you or your memory rides on it — and nothing ever downloads itself.
Turning the checkbox off stops the check entirely and clears the row.

### Shortcuts

Four rows stating what is bound to what — see
[Keys and shortcuts](/reference/shortcuts) for the full list — and two controls:

**Open chat with ⌥Space** — on by default. The note underneath tells the truth
about the registration: if another app already owns ⌥Space, it says so rather
than leaving you pressing a dead key.

**Wake Minne at the caret with** — a popup offering **Right Option (⌥)** (the
default) and **Off**. Off tears the key tap down entirely and right-Option goes
back to being an ordinary Option key.

The note beneath changes with the state, and is worth reading once:

> Tap right-Option in any text field to bring Minne to your caret. A bare tap
> only: typing with it held — @, €, ~ on international (AltGr) layouts — works
> as it always did.

If Accessibility is missing it says so instead, because the key cannot work
without it.

## Where settings are stored

In `UserDefaults` under `sh.minne.app` — not in `~/Minne`, which holds memory
only.

| Key | Default |
| --- | --- |
| `blacklistBundleIdentifiers`, `blacklistDomains` | the shipped lists |
| `chatHotKeyEnabled` | `true` |
| `updateCheckEnabled` | `true` |
| `minneKeyTrigger` | `rightOption` |
| `retentionDays` | `90` |
| `onboardingSeen` | `false` |

Provider and model are the brain's, in `config.json` — see
[Files and paths](/reference/files).
