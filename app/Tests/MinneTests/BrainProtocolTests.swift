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
