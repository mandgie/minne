import XCTest

@testable import Minne

/// What of a page's address one press may send. The path is context; the
/// query and fragment are liability (session tokens, search terms), and
/// non-web schemes say nothing about register.
final class PageURLTests: XCTestCase {
    func testKeepsSchemeHostAndPathOnly() {
        XCTAssertEqual(
            PageURL.sanitize("https://x.com/sweatystartup/status/208?s=20&t=abc#reply"),
            "https://x.com/sweatystartup/status/208")
        XCTAssertEqual(
            PageURL.sanitize("https://github.com/mandgie/minne/pull/2#discussion_r1"),
            "https://github.com/mandgie/minne/pull/2")
    }

    func testAWebRootSurvives() {
        XCTAssertEqual(PageURL.sanitize("https://mail.google.com"), "https://mail.google.com")
        XCTAssertEqual(PageURL.sanitize("http://localhost:3000/app"), "http://localhost:3000/app")
    }

    func testNonWebSchemesAreDropped() {
        XCTAssertNil(PageURL.sanitize("chrome://newtab/"))
        XCTAssertNil(PageURL.sanitize("file:///Users/x/notes.html"))
        XCTAssertNil(PageURL.sanitize("about:blank"))
    }

    func testGarbageIsDroppedNotThrown() {
        XCTAssertNil(PageURL.sanitize(""))
        XCTAssertNil(PageURL.sanitize("https://"))
        XCTAssertNil(PageURL.sanitize("not a url at all"))
    }
}
