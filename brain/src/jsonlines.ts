import { read } from "node:fs";

/**
 * Reads stdin (fd 0) chunk by chunk, promptly as data arrives.
 *
 * Bun 1.2.x buffers a piped stdin until EOF for `Bun.stdin.stream()`,
 * `for await (const line of console)`, and node-style `process.stdin` events —
 * which deadlocks a request/response protocol. read(2) on fd 0 via node:fs
 * returns as soon as bytes are available, so we use that instead.
 */
export async function* stdinChunks(): AsyncGenerator<Uint8Array, void, undefined> {
  while (true) {
    const chunk = await new Promise<Uint8Array | null>((resolve, reject) => {
      const buffer = Buffer.alloc(65536);
      read(0, buffer, 0, buffer.length, null, (err, bytesRead) => {
        if (err) return reject(err);
        resolve(bytesRead === 0 ? null : buffer.subarray(0, bytesRead));
      });
    });
    if (chunk === null) return;
    yield chunk;
  }
}

// Incremental line splitter over a chunked byte source. Yields complete lines
// without their newline; a trailing unterminated line is yielded at stream end.
export async function* readLines(
  chunks: AsyncIterable<Uint8Array>,
): AsyncGenerator<string, void, undefined> {
  const decoder = new TextDecoder();
  let buffer = "";
  for await (const chunk of chunks) {
    buffer += decoder.decode(chunk, { stream: true });
    let newline: number;
    while ((newline = buffer.indexOf("\n")) !== -1) {
      yield buffer.slice(0, newline);
      buffer = buffer.slice(newline + 1);
    }
  }
  buffer += decoder.decode();
  if (buffer.length > 0) {
    yield buffer;
  }
}
