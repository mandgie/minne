import { describe, expect, test } from "bun:test";
import {
  PROTOCOL_VERSION,
  decodeRequest,
  doneEvent,
  encodeEvent,
  errorEvent,
} from "./protocol";

describe("decodeRequest", () => {
  test("decodes every request type", () => {
    const valid = [
      { type: "hello", id: "1", protocolVersion: PROTOCOL_VERSION, client: "test" },
      { type: "hello", id: "2", protocolVersion: PROTOCOL_VERSION },
      { type: "chat", id: "3", message: "hi", newChat: true },
      { type: "chat", id: "4", message: "hi" },
      { type: "abort", id: "5", targetId: "3" },
      { type: "login", id: "6", provider: "anthropic" },
      { type: "login", id: "6b", provider: "anthropic", method: "oauth" },
      { type: "login", id: "6c", provider: "openai", method: "api_key" },
      { type: "logout", id: "7", provider: "anthropic" },
      { type: "logout", id: "8" },
      { type: "ingest", id: "9" },
      { type: "ingest", id: "9b", mode: "sync" },
      { type: "ingest", id: "9c", mode: "lint" },
      { type: "status", id: "10" },
      { type: "auth_reply", id: "11", targetId: "6", promptId: "6:1", value: "code" },
      { type: "auth_reply", id: "12", targetId: "6", promptId: "6:1", cancel: true },
      { type: "configure", id: "13", provider: "ollama", model: "qwen3", baseUrl: "http://x/v1" },
      { type: "configure", id: "14" },
      { type: "search_sources", id: "15", query: "oslo trip" },
      { type: "search_sources", id: "16", query: "oslo", limit: 5 },
    ];
    for (const message of valid) {
      const decoded = decodeRequest(JSON.stringify(message));
      expect(decoded.ok).toBe(true);
      if (decoded.ok) expect(decoded.request).toEqual(message as never);
    }
  });

  test("rejects malformed JSON with invalid_json and empty id", () => {
    const decoded = decodeRequest("{nope");
    expect(decoded.ok).toBe(false);
    if (!decoded.ok) {
      expect(decoded.error.code).toBe("invalid_json");
      expect(decoded.error.id).toBe("");
    }
  });

  test("rejects non-object messages", () => {
    for (const line of ['"str"', "42", "[1,2]", "null", "true"]) {
      const decoded = decodeRequest(line);
      expect(decoded.ok).toBe(false);
      if (!decoded.ok) expect(decoded.error.code).toBe("invalid_request");
    }
  });

  test("rejects missing or empty id", () => {
    for (const line of ['{"type":"status"}', '{"type":"status","id":""}', '{"type":"status","id":7}']) {
      const decoded = decodeRequest(line);
      expect(decoded.ok).toBe(false);
      if (!decoded.ok) {
        expect(decoded.error.code).toBe("invalid_request");
        expect(decoded.error.id).toBe("");
      }
    }
  });

  test("rejects unknown type, preserving the id for correlation", () => {
    const decoded = decodeRequest('{"type":"reboot","id":"x1"}');
    expect(decoded.ok).toBe(false);
    if (!decoded.ok) {
      expect(decoded.error.code).toBe("invalid_request");
      expect(decoded.error.id).toBe("x1");
    }
  });

  test("rejects per-type field violations", () => {
    const bad = [
      '{"type":"hello","id":"a"}',
      '{"type":"hello","id":"a","protocolVersion":"1"}',
      '{"type":"hello","id":"a","protocolVersion":1.5}',
      '{"type":"hello","id":"a","protocolVersion":1,"client":5}',
      '{"type":"chat","id":"a"}',
      '{"type":"chat","id":"a","message":1}',
      '{"type":"chat","id":"a","message":"m","newChat":"yes"}',
      '{"type":"abort","id":"a"}',
      '{"type":"abort","id":"a","targetId":""}',
      '{"type":"login","id":"a"}',
      '{"type":"login","id":"a","provider":"p","method":"password"}',
      '{"type":"logout","id":"a","provider":3}',
      '{"type":"auth_reply","id":"a","promptId":"p"}',
      '{"type":"auth_reply","id":"a","targetId":"t","promptId":"p"}',
      '{"type":"auth_reply","id":"a","targetId":"t","promptId":"p","cancel":false}',
      '{"type":"auth_reply","id":"a","targetId":"t","promptId":"p","value":7}',
      '{"type":"configure","id":"a","provider":""}',
      '{"type":"configure","id":"a","model":3}',
      '{"type":"search_sources","id":"a"}',
      '{"type":"search_sources","id":"a","query":"   "}',
      '{"type":"search_sources","id":"a","query":"x","limit":0}',
      '{"type":"search_sources","id":"a","query":"x","limit":2.5}',
      '{"type":"ingest","id":"a","mode":"compost"}',
      '{"type":"ingest","id":"a","mode":1}',
    ];
    for (const line of bad) {
      const decoded = decodeRequest(line);
      expect(decoded.ok).toBe(false);
      if (!decoded.ok) {
        expect(decoded.error.code).toBe("invalid_request");
        expect(decoded.error.id).toBe("a");
      }
    }
  });
});

describe("encodeEvent", () => {
  test("produces a single JSON line that parses back", () => {
    const events = [
      doneEvent("1", { protocolVersion: PROTOCOL_VERSION }),
      doneEvent("2"),
      errorEvent("3", "unimplemented", "not yet"),
      { type: "text_delta", id: "4", delta: "hel\nlo" } as const,
      { type: "progress", id: "5", message: "working", fraction: 0.5 } as const,
    ];
    for (const event of events) {
      const line = encodeEvent(event);
      expect(line).not.toContain("\n");
      expect(JSON.parse(line)).toEqual(JSON.parse(JSON.stringify(event)));
    }
  });

  test("doneEvent omits result when undefined", () => {
    expect("result" in doneEvent("1")).toBe(false);
    expect(doneEvent("1", null).result).toBe(null);
  });
});
