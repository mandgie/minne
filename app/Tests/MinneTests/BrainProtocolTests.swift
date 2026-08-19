import XCTest

@testable import Minne

/// Codable checks for the messages added in US-003; keeps the Swift mirror
/// honest against brain/src/protocol.ts.
final class BrainProtocolTests: XCTestCase {
    private func encodeToJSON(_ request: BrainRequest) throws -> [String: Any] {
        let data = try JSONEncoder().encode(request)
        return try XCTUnwrap(JSONSerialization.jsonObject(with: data) as? [String: Any])
    }

    func testLoginEncodesOptionalMethod() throws {
        let bare = try encodeToJSON(.login(id: "l1", provider: "anthropic", method: nil))
        XCTAssertEqual(bare["type"] as? String, "login")
        XCTAssertEqual(bare["provider"] as? String, "anthropic")
        XCTAssertNil(bare["method"])

        let keyed = try encodeToJSON(.login(id: "l2", provider: "openai", method: "api_key"))
        XCTAssertEqual(keyed["method"] as? String, "api_key")
    }

    func testAuthReplyEncoding() throws {
        let reply = try encodeToJSON(
            .authReply(id: "r1", targetId: "l1", promptId: "l1:1", value: "424242", cancel: nil))
        XCTAssertEqual(reply["type"] as? String, "auth_reply")
        XCTAssertEqual(reply["targetId"] as? String, "l1")
        XCTAssertEqual(reply["promptId"] as? String, "l1:1")
        XCTAssertEqual(reply["value"] as? String, "424242")
        XCTAssertNil(reply["cancel"])

        let cancel = try encodeToJSON(
            .authReply(id: "r2", targetId: "l1", promptId: "l1:1", value: nil, cancel: true))
        XCTAssertEqual(cancel["cancel"] as? Bool, true)
        XCTAssertNil(cancel["value"])
    }

    func testConfigureEncoding() throws {
        let configure = try encodeToJSON(
            .configure(
                id: "c1", provider: "ollama", model: "qwen3", baseUrl: "http://localhost:9999/v1"))
        XCTAssertEqual(configure["type"] as? String, "configure")
        XCTAssertEqual(configure["provider"] as? String, "ollama")
        XCTAssertEqual(configure["model"] as? String, "qwen3")
        XCTAssertEqual(configure["baseUrl"] as? String, "http://localhost:9999/v1")
    }

    /// A first press sends nothing about reworking — the brain builds the plain
    /// prompt from the absence of these fields, so an empty array on the wire
    /// would be a different request.
    @MainActor
    func testAFirstDraftSendsNoReworkFields() throws {
        let context = MinneKeyController.context(
            for: CaretTarget(
                bundleIdentifier: "com.apple.Mail", appName: "Mail",
                anchor: CaretAnchor(rect: .zero, source: .caret)),
            mode: .infer)
        let json = try encodeToJSON(.draft(id: "d1", context: context))
        XCTAssertEqual(json["type"] as? String, "draft")
        XCTAssertNil(json["previousDraft"])
        XCTAssertNil(json["guidance"])
        XCTAssertNil(json["regenerate"])
        // A native app has no page; the key must be absent, not null.
        XCTAssertNil(json["url"])
    }

    /// Web content carries its page address — the register signal a browser's
    /// app name cannot give.
    @MainActor
    func testWebContentSendsItsPageURL() throws {
        var target = CaretTarget(
            bundleIdentifier: "com.google.Chrome", appName: "Google Chrome",
            anchor: CaretAnchor(rect: .zero, source: .caret))
        target.isWebContent = true
        target.pageURL = "https://x.com/sweatystartup/status/1"
        let json = try encodeToJSON(.draft(id: "d3", context: MinneKeyController.context(for: target, mode: .infer)))
        XCTAssertEqual(json["url"] as? String, "https://x.com/sweatystartup/status/1")
    }

    @MainActor
    func testAReworkedDraftCarriesThePreviousDraftAndTheSteers() throws {
        let context = MinneKeyController.context(
            for: CaretTarget(
                bundleIdentifier: "com.apple.Mail", appName: "Mail",
                anchor: CaretAnchor(rect: .zero, source: .caret)),
            mode: .infer, previousDraft: "Torsdag passer fint.", guidance: ["warmer"],
            regenerate: true)
        let json = try encodeToJSON(.draft(id: "d2", context: context))
        XCTAssertEqual(json["previousDraft"] as? String, "Torsdag passer fint.")
        XCTAssertEqual(json["guidance"] as? [String], ["warmer"])
        XCTAssertEqual(json["regenerate"] as? Bool, true)
    }

    func testAuthPromptDecoding() throws {
        let json = """
            {"type":"auth_prompt","id":"l1","promptId":"l1:1","prompt":"Enter the code",\
            "promptType":"manual_code","placeholder":"000000"}
            """
        let event = try JSONDecoder().decode(BrainEvent.self, from: Data(json.utf8))
        guard case let .authPrompt(id, promptId, prompt, promptType, placeholder, options) = event
        else {
            return XCTFail("expected auth_prompt, got \(event)")
        }
        XCTAssertEqual(id, "l1")
        XCTAssertEqual(promptId, "l1:1")
        XCTAssertEqual(prompt, "Enter the code")
        XCTAssertEqual(promptType, "manual_code")
        XCTAssertEqual(placeholder, "000000")
        XCTAssertNil(options)
    }

    func testChatDoneResultDecoding() throws {
        // Terminal event of an aborted chat, as emitted by the US-004 brain.
        let json = """
            {"type":"done","id":"c1","result":{"model":"mock-model","stopReason":"aborted",\
            "aborted":true,"usage":{"input":3,"output":12,"totalTokens":15}}}
            """
        let event = try JSONDecoder().decode(BrainEvent.self, from: Data(json.utf8))
        guard case let .done(id, result) = event else {
            return XCTFail("expected done, got \(event)")
        }
        XCTAssertEqual(id, "c1")
        let object = try XCTUnwrap(result?.objectValue)
        XCTAssertEqual(object["model"]?.stringValue, "mock-model")
        XCTAssertEqual(object["stopReason"]?.stringValue, "aborted")
        XCTAssertEqual(object["aborted"], .bool(true))
        let usage = try XCTUnwrap(object["usage"]?.objectValue)
        XCTAssertEqual(usage["totalTokens"]?.intValue, 15)
    }

    /// The draft done result as the brain sends it since 2026-08-18: the pages
    /// that grounded the draft ride along with the text.
    func testDraftDoneResultCarriesItsGrounding() throws {
        let json = """
            {"type":"done","id":"d1","result":{"mode":"infer","text":"Torsdag passer fint.",\
            "model":"mock-model","stopReason":"stop","stylePage":"wiki/style/style-slack.md",\
            "memoryPages":["wiki/ingrid-berg.md","wiki/oslo-trip.md"],\
            "usage":{"input":3,"output":9,"totalTokens":12}}}
            """
        let event = try JSONDecoder().decode(BrainEvent.self, from: Data(json.utf8))
        guard case let .done(_, result) = event else {
            return XCTFail("expected done, got \(event)")
        }
        let reply = try XCTUnwrap(DraftReply(result))
        XCTAssertEqual(reply.text, "Torsdag passer fint.")
        XCTAssertEqual(reply.stylePage, "wiki/style/style-slack.md")
        XCTAssertEqual(reply.memoryPages, ["wiki/ingrid-berg.md", "wiki/oslo-trip.md"])
    }

    /// An older brain sends neither grounding field, and a null stylePage is
    /// what the current one sends when the user has no style page yet — both
    /// must still decode as a draft.
    func testDraftDoneWithoutGroundingFieldsStillDecodes() throws {
        let json = """
            {"type":"done","id":"d2","result":{"mode":"infer","text":"Torsdag passer fint.",\
            "model":"mock-model","stopReason":"stop","stylePage":null}}
            """
        let event = try JSONDecoder().decode(BrainEvent.self, from: Data(json.utf8))
        guard case let .done(_, result) = event else {
            return XCTFail("expected done, got \(event)")
        }
        let reply = try XCTUnwrap(DraftReply(result))
        XCTAssertEqual(reply.text, "Torsdag passer fint.")
        XCTAssertNil(reply.stylePage)
        XCTAssertEqual(reply.memoryPages, [])
    }

    /// The US-108 protocol addition: `memory_recent` carries nothing but its id.
    func testMemoryRecentEncoding() throws {
        let json = try encodeToJSON(.memoryRecent(id: "m1"))
        XCTAssertEqual(json["type"] as? String, "memory_recent")
        XCTAssertEqual(json["id"] as? String, "m1")
        XCTAssertEqual(json.count, 2)
    }

    func testAuthPromptSelectDecoding() throws {
        let json = """
            {"type":"auth_prompt","id":"l1","promptId":"l1:2","prompt":"Pick one",\
            "promptType":"select","options":[{"id":"a","label":"Option A"},\
            {"id":"b","label":"Option B","description":"the other one"}]}
            """
        let event = try JSONDecoder().decode(BrainEvent.self, from: Data(json.utf8))
        guard case let .authPrompt(_, _, _, promptType, placeholder, options) = event else {
            return XCTFail("expected auth_prompt, got \(event)")
        }
        XCTAssertEqual(promptType, "select")
        XCTAssertNil(placeholder)
        XCTAssertEqual(
            options,
            [
                AuthPromptOption(id: "a", label: "Option A", description: nil),
                AuthPromptOption(id: "b", label: "Option B", description: "the other one"),
            ])
    }
}
