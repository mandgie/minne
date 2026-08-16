// minne-brain entrypoint: JSON-lines protocol server over stdio.
// stdout is reserved for protocol events; ALL logging goes to stderr.
import { readLines, stdinChunks } from "./jsonlines";
import {
  PROTOCOL_VERSION,
  decodeRequest,
  doneEvent,
  encodeEvent,
  errorEvent,
  type BrainEvent,
  type BrainRequest,
} from "./protocol";

const BRAIN_VERSION = "0.1.0";

function log(...args: unknown[]): void {
  console.error("[minne-brain]", ...args);
}

function send(event: BrainEvent): void {
  process.stdout.write(encodeEvent(event) + "\n");
}

function handle(request: BrainRequest): void {
  switch (request.type) {
    case "hello": {
      if (request.protocolVersion !== PROTOCOL_VERSION) {
        send(
          errorEvent(
            request.id,
            "unsupported_version",
            `client speaks protocol ${request.protocolVersion}, brain speaks ${PROTOCOL_VERSION}`,
          ),
        );
        return;
      }
      log(`hello from ${request.client ?? "unknown client"} (protocol ${request.protocolVersion})`);
      send(
        doneEvent(request.id, {
          protocolVersion: PROTOCOL_VERSION,
          brain: "minne-brain",
          brainVersion: BRAIN_VERSION,
        }),
      );
      return;
    }
    case "status":
      // Stub payload until US-003 wires real provider/auth state.
      send(doneEvent(request.id, { state: "idle", providers: [], model: null }));
      return;
    default:
      send(errorEvent(request.id, "unimplemented", `"${request.type}" is not implemented yet`));
  }
}

log(`starting (protocol ${PROTOCOL_VERSION}, brain ${BRAIN_VERSION})`);

for await (const line of readLines(stdinChunks())) {
  if (line.trim() === "") continue;
  const decoded = decodeRequest(line);
  if (!decoded.ok) {
    log(`rejected input: ${decoded.error.message}`);
    send(decoded.error);
    continue;
  }
  try {
    handle(decoded.request);
  } catch (err) {
    log("handler failed:", err);
    send(
      errorEvent(
        decoded.request.id,
        "internal",
        err instanceof Error ? err.message : String(err),
      ),
    );
  }
}

log("stdin closed, exiting");
