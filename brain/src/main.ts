// minne-brain entrypoint. stdout is reserved for protocol JSON-lines;
// all logging goes to stderr.
import { helloLine } from "./hello";

console.error("[minne-brain] starting");
process.stdout.write(helloLine() + "\n");
console.error("[minne-brain] exiting");
