// minne-brain entrypoint: JSON-lines protocol server over stdio.
// stdout is reserved for protocol events; ALL logging goes to stderr.
import { readLines, stdinChunks } from "./jsonlines";
import { appSupportDir, memoryRoot } from "./paths";
import { PROTOCOL_VERSION, decodeRequest, encodeEvent, errorEvent, type BrainEvent } from "./protocol";
import { MinneBrain } from "./service";
// The repo-root VERSION file is the single source of the release version (it
// also becomes CFBundleShortVersionString in scripts/build.sh). Imported as
// text so `bun build --compile` embeds it, like the wiki templates.
import versionFile from "../../VERSION" with { type: "text" };

const BRAIN_VERSION = versionFile.trim();

function log(...args: unknown[]): void {
  console.error("[minne-brain]", ...args);
}

function send(event: BrainEvent): void {
  process.stdout.write(encodeEvent(event) + "\n");
}

log(`starting (protocol ${PROTOCOL_VERSION}, brain ${BRAIN_VERSION})`);

const brain = new MinneBrain({
  send,
  log,
  dataDir: appSupportDir(),
  memoryRoot: memoryRoot(),
  brainVersion: BRAIN_VERSION,
});

// The ingestion job runs on its own timers from here on; a tick with nothing
// new past the watermark costs one count(*) and calls no model.
brain.startScheduler();

// Handlers run concurrently: a login parks on an auth_prompt that is answered
// by a later auth_reply request, so the read loop must never await a handler.
const inFlight = new Set<Promise<void>>();

for await (const line of readLines(stdinChunks())) {
  if (line.trim() === "") continue;
  const decoded = decodeRequest(line);
  if (!decoded.ok) {
    log(`rejected input: ${decoded.error.message}`);
    send(decoded.error);
    continue;
  }
  const request = decoded.request;
  const task = brain
    .handle(request)
    .catch((err: unknown) => {
      log("handler failed:", err);
      send(errorEvent(request.id, "internal", err instanceof Error ? err.message : String(err)));
    })
    .finally(() => inFlight.delete(task));
  inFlight.add(task);
}

// Let in-flight handlers emit their terminal events before exiting; logins
// still waiting on user input are aborted, they can't be answered anymore.
brain.shutdown();
await Promise.allSettled(inFlight);
log("stdin closed, exiting");
