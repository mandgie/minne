// minne-brain entrypoint: JSON-lines protocol server over stdio.
// stdout is reserved for protocol events; ALL logging goes to stderr.
import { readLines, stdinChunks } from "./jsonlines";
import { appSupportDir } from "./paths";
import { PROTOCOL_VERSION, decodeRequest, encodeEvent, errorEvent, type BrainEvent } from "./protocol";
import { MinneBrain } from "./service";

const BRAIN_VERSION = "0.1.0";

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
  brainVersion: BRAIN_VERSION,
});

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
