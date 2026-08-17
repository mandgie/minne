import XCTest

@testable import Minne

final class TextSimilarityTests: XCTestCase {
    func testIdenticalTextIsOne() {
        XCTAssertEqual(TextSimilarity.similarity("one two three four", "one two three four"), 1)
    }

    func testCaseAndWhitespaceAreIgnored() {
        XCTAssertEqual(
            TextSimilarity.similarity("One  two\nthree\tfour", "one two three four"), 1)
    }

    func testDisjointTextIsZero() {
        XCTAssertEqual(TextSimilarity.similarity("alpha beta gamma", "delta epsilon zeta"), 0)
    }

    func testTwoEmptyTextsAreIdenticalAndEmptyAgainstNonEmptyIsNot() {
        XCTAssertEqual(TextSimilarity.similarity("", ""), 1)
        XCTAssertEqual(TextSimilarity.similarity("", "anything at all here"), 0)
    }

    func testScrolledDocumentStaysAboveTheDuplicateThreshold() {
        let lines = (1...200).map { "line \($0) of the document" }
        let before = lines.joined(separator: " ")
        let after = lines.dropFirst(6).joined(separator: " ")
        XCTAssertGreaterThan(TextSimilarity.similarity(before, after), 0.9)
    }

    func testRewrittenContentFallsBelowTheDuplicateThreshold() {
        let before = (1...50).map { "line \($0) of the document" }.joined(separator: " ")
        let after = (1...50).map { "row \($0) in a spreadsheet" }.joined(separator: " ")
        XCTAssertLessThan(TextSimilarity.similarity(before, after), 0.9)
    }

    func testReorderingChangesSimilarityUnlikeABagOfWords() {
        // The whole reason for shingles: these two share every word.
        let a = "alpha beta gamma delta epsilon zeta eta theta"
        let b = "theta eta zeta epsilon delta gamma beta alpha"
        XCTAssertLessThan(TextSimilarity.similarity(a, b), 0.2)
    }

    func testTextsShorterThanTheShingleWidthFallBackToWords() {
        XCTAssertEqual(TextSimilarity.similarity("hello", "hello"), 1)
        XCTAssertEqual(TextSimilarity.similarity("hello", "goodbye"), 0)
        XCTAssertEqual(TextSimilarity.similarity("a b", "a b"), 1)
    }

    func testSimilarityIsSymmetric() {
        let a = "the quick brown fox jumps over the lazy dog"
        let b = "the quick brown cat jumps over the lazy dog"
        XCTAssertEqual(
            TextSimilarity.similarity(a, b), TextSimilarity.similarity(b, a), accuracy: 0.0001)
    }

    func testShinglesUseThreeWordWindows() {
        XCTAssertEqual(
            TextSimilarity.shingles("one two three four"), ["one two three", "two three four"])
    }
}
