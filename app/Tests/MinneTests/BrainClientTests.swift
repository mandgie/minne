import XCTest

@testable import Minne

/// Round-trip tests against the real brain (`bun run src/main.ts`).
/// Requires bun on PATH and the repo checkout layout; skipped otherwise.
final class BrainClientTests: XCTestCase {
    private static var brainMain: URL {
        // <root>/app/Tests/MinneTests/BrainClientTests.swift -> <root>/brain/src/main.ts
        URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()  // MinneTests/
            .deletingLastPathComponent()  // Tests/
            .deletingLastPathComponent()  // app/
            .deletingLastPathComponent()  // <root>/
            .appendingPathComponent("brain/src/main.ts")
    }

    private func makeClient() throws -> BrainClient {
        try XCTSkipUnless(
            FileManager.default.fileExists(atPath: Self.brainMain.path),
            "brain sources not found at \(Self.brainMain.path)")
        return BrainClient(launch: .bunScript(Self.brainMain), clientName: "MinneTests")
    }

    func testHandshakeAndStatusRoundTrip() async throws {
        let client = try makeClient()
        let hello = try await client.start()
        XCTAssertEqual(hello.protocolVersion, BrainProtocol.version)
        XCTAssertFalse(hello.brainVersion.isEmpty)

        let status = try await client.status()
        guard let object = status?.objectValue else {
            return XCTFail("status result is not an object: \(String(describing: status))")
        }
        XCTAssertEqual(object["state"]?.stringValue, "idle")

        await client.stop()
    }

    func testUnimplementedRequestSurfacesTypedError() async throws {
        let client = try makeClient()
        _ = try await client.start()
        do {
            _ = try await client.request(.chat(id: UUID().uuidString, message: "hi", newChat: nil))
            XCTFail("chat should not be implemented yet")
        } catch let BrainClientError.brain(code, _) {
            XCTAssertEqual(code, "unimplemented")
        }
        await client.stop()
    }
}
