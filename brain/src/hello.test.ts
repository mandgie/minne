import { expect, test } from "bun:test";
import { helloLine } from "./hello";

test("helloLine is a single JSON line with type hello", () => {
  const line = helloLine();
  expect(line).not.toContain("\n");
  expect(JSON.parse(line)).toEqual({ type: "hello" });
});
