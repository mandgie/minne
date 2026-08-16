// Shared harness for protocol-level subprocess tests: spawn the brain with the
// mock provider (MINNE_MOCK_PROVIDER=1) and an isolated data dir, then speak
// JSON-lines over its stdio. Not a test file itself — imported by *.test.ts.
import { expect } from "bun:test";
import { PROTOCOL_VERSION, type BrainEvent } from "./protocol";

const BRAIN_DIR = new URL("..", import.meta.url).pathname;

function spawnBrain(dataDir: string, env?: Record<string, string | undefined>) {
  return Bun.spawn(["bun", "run", "src/main.ts"], {
    cwd: BRAIN_DIR,
    stdin: "pipe" as const,
    stdout: "pipe" as const,
    stderr: "ignore" as const,
    env: { ...process.env, MINNE_APP_SUPPORT_DIR: dataDir, MINNE_MOCK_PROVIDER: "1", ...env },
  });
}

/** Interactive JSON-lines session against a live brain subprocess. */
export class BrainSession {
  private proc: ReturnType<typeof spawnBrain>;
  // Structural type: Bun's own reader typings require a read() argument.
  private reader: { read(): Promise<{ done: boolean; value?: Uint8Array }>; releaseLock(): void };
  private buffer = "";
  private queue: BrainEvent[] = [];

  constructor(dataDir: string, env?: Record<string, string | undefined>) {
    this.proc = spawnBrain(dataDir, env);
    this.reader = this.proc.stdout.getReader() as unknown as typeof this.reader;
  }

  send(message: Record<string, unknown>): void {
    this.proc.stdin.write(JSON.stringify(message) + "\n");
    void this.proc.stdin.flush();
  }

  /** Next event, in stdout order. */
  async next(): Promise<BrainEvent> {
    while (this.queue.length === 0) {
      const { done, value } = await this.reader.read();
      if (done) throw new Error("brain stdout closed while awaiting an event");
      this.buffer += new TextDecoder().decode(value);
      let newline: number;
      while ((newline = this.buffer.indexOf("\n")) !== -1) {
        const line = this.buffer.slice(0, newline);
        this.buffer = this.buffer.slice(newline + 1);
        if (line !== "") this.queue.push(JSON.parse(line) as BrainEvent);
      }
    }
    return this.queue.shift()!;
  }

  /** Collects events until the terminal (done/error) for `id`; returns all seen. */
  async collectUntilTerminal(id: string): Promise<BrainEvent[]> {
    const events: BrainEvent[] = [];
    for (;;) {
      const event = await this.next();
      events.push(event);
      if (event.id === id && (event.type === "done" || event.type === "error")) return events;
    }
  }

  async request(message: Record<string, unknown>): Promise<BrainEvent[]> {
    this.send(message);
    return this.collectUntilTerminal(message["id"] as string);
  }

  async close(): Promise<number> {
    await this.proc.stdin.end();
    const code = await this.proc.exited;
    this.reader.releaseLock();
    return code;
  }
}

export async function hello(session: BrainSession): Promise<void> {
  const events = await session.request({
    type: "hello",
    id: "h",
    protocolVersion: PROTOCOL_VERSION,
    client: "bun-test",
  });
  expect(events.at(-1)).toMatchObject({ type: "done", id: "h" });
}
