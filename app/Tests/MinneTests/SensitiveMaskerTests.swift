import XCTest

@testable import Minne

/// Every value in here is a published test vector or a hand-built one; none of
/// them belong to anybody.
final class SensitiveMaskerTests: XCTestCase {
    private let token = SensitiveMasker.token

    private func kinds(_ text: String) -> [SensitiveMasker.Kind] {
        SensitiveMasker.matches(in: text).map(\.kind)
    }

    private func assertMasked(
        _ text: String, _ kind: SensitiveMasker.Kind, file: StaticString = #filePath,
        line: UInt = #line
    ) {
        XCTAssertEqual(kinds(text), [kind], "\(text)", file: file, line: line)
        XCTAssertTrue(
            SensitiveMasker.mask(text).contains(token), "\(text)", file: file, line: line)
    }

    private func assertUntouched(
        _ text: String, file: StaticString = #filePath, line: UInt = #line
    ) {
        XCTAssertEqual(SensitiveMasker.mask(text), text, file: file, line: line)
    }

    // MARK: - Credit cards

    func testCreditCardsAreMaskedInEveryPrintedForm() {
        for card in [
            "4111111111111111",  // Visa
            "4111 1111 1111 1111",
            "4111-1111-1111-1111",
            "5500 0000 0000 0004",  // Mastercard
            "378282246310005",  // Amex, 15 digits
            "6011 1111 1111 1117",  // Discover
        ] {
            assertMasked("Card on file: \(card) exp 04/29", .creditCard)
        }
    }

    func testDigitRunsThatFailLuhnAreLeftAlone() {
        // One digit off a valid Visa test number: a 16-digit invoice number,
        // not a card.
        assertUntouched("reference 4111111111111112 on the invoice")
        assertUntouched("order 1234567812345678 shipped")
    }

    func testLongDigitRunsAreNotSlicedIntoACard() {
        // A 22-digit id must match nothing at all, rather than having a valid
        // 16-digit window carved out of its middle.
        assertUntouched("build 4111111111111111222222 finished")
    }

    func testShortNumbersAreNotCards() {
        assertUntouched("total 123456789012 SEK")  // 12 digits, under the floor
    }

    func testCardsPrintedInAmexGroupingAreMasked() {
        assertMasked("Amex 3782 822463 10005 on file", .creditCard)
    }

    func testAdjacentNumbersAreNotGluedIntoACard() {
        // A column of unrelated numbers whose digits happen to concatenate to
        // sixteen Luhn-valid ones. Only a real card layout — one run, or
        // groups of four to six — is masked.
        assertUntouched("474 1973060 632084")
    }

    func testACardFollowedByOtherDigitsIsStillFoundExactly() {
        // The greedy pattern swallows the trailing number; the card must be
        // re-cut out of it rather than lost.
        XCTAssertEqual(
            SensitiveMasker.mask("4111 1111 1111 1111 123"), "\(token) 123")
        XCTAssertEqual(
            SensitiveMasker.mask("ref 99 4111 1111 1111 1111"), "ref 99 \(token)")
    }

    func testMaskingAFullSizedSnapshotStaysFast() {
        // Masking runs on the main thread for every accepted snapshot, so a
        // pattern that backtracks catastrophically would be felt as a hang.
        // The bound is ~50× the measured cost of the worst sample.
        let numbers = (0..<6000).map { "\($0 % 10)\($0 % 7)\($0 % 3)\($0)" }.joined(separator: " ")
        let sample = CaptureScheduler.cap(numbers, toBytes: 50_000).text
        let began = Date()
        _ = SensitiveMasker.mask(sample)
        XCTAssertLessThan(Date().timeIntervalSince(began), 2)
    }

    // MARK: - CVV

    func testCVVIsMaskedButItsLabelSurvives() {
        XCTAssertEqual(SensitiveMasker.mask("CVV: 123"), "CVV: \(token)")
        XCTAssertEqual(SensitiveMasker.mask("cvc 4321"), "cvc \(token)")
        XCTAssertEqual(SensitiveMasker.mask("Security code = 987"), "Security code = \(token)")
        XCTAssertEqual(
            SensitiveMasker.mask("card verification value 4567"),
            "card verification value \(token)")
        XCTAssertEqual(kinds("CVV: 123"), [.cvv])
    }

    func testBareShortNumbersAreNotCVVs() {
        // Without the keyword there is nothing to distinguish a CVV from any
        // other three-digit number, and masking every one of them would gut
        // the memory.
        assertUntouched("room 402, gate 123, seat 21B")
    }

    // MARK: - IBAN

    func testIBANIsMaskedGroupedOrCompact() {
        assertMasked("Pay to GB82 WEST 1234 5698 7654 32 please", .iban)
        assertMasked("Pay to GB82WEST12345698765432 please", .iban)
        assertMasked("IBAN DE89 3704 0044 0532 0130 00", .iban)
        assertMasked("IBAN SE45 5000 0000 0583 9825 7466", .iban)
    }

    func testIBANWithABadCheckDigitIsLeftAlone() {
        assertUntouched("Pay to GB82 WEST 1234 5698 7654 33 please")
    }

    func testIBANIsMaskedWholeRatherThanHavingItsDigitsClaimedByTheCardRule() {
        let masked = SensitiveMasker.mask("IBAN SE45 5000 0000 0583 9825 7466 done")
        XCTAssertEqual(masked, "IBAN \(token) done")
    }

    // MARK: - US SSN

    func testSSNIsMaskedInItsPrintedForm() {
        assertMasked("SSN 123-45-6789 on file", .ssn)
        assertMasked("SSN 123 45 6789 on file", .ssn)
    }

    func testSSNRequiresSeparatorsAndAPlausibleAreaNumber() {
        // A bare nine-digit run has no checksum and no shape to appeal to.
        assertUntouched("id 123456789 assigned")
        // Structurally impossible SSNs: area 000/666, zero group, zero serial.
        assertUntouched("000-45-6789")
        assertUntouched("666-45-6789")
        assertUntouched("123-00-6789")
        assertUntouched("123-45-0000")
        // Mixed separators are a date range or a version string, not an SSN.
        assertUntouched("123-45 6789")
    }

    // MARK: - Swedish personnummer

    func testPersonnummerIsMaskedInAllCommonForms() {
        for number in [
            "811218-9876",  // ten digits with the usual separator
            "8112189876",
            "19811218-9876",  // twelve digits, century included
            "198112189876",
            "811218+9876",  // "+" marks someone over 100
            "900101-0017",
        ] {
            assertMasked("Personnummer \(number) noterat", .personnummer)
        }
    }

    func testPersonnummerWithABadChecksumIsLeftAlone() {
        assertUntouched("Personnummer 811218-9875 noterat")
    }

    func testImpossibleDatesAreNotPersonnummer() {
        assertUntouched("ref 811318-9876")  // month 13
        assertUntouched("ref 811200-9876")  // day 00
    }

    func testSamordningsnummerIsMasked() {
        // A coordination number is a personnummer with 60 added to the day; it
        // carries the same checksum, so it must be caught by the same rule.
        let candidates = (0...9999).map { String(format: "811278%04d", $0) }
        guard let valid = candidates.first(where: SensitiveMasker.isPersonnummerValid) else {
            return XCTFail("no valid coordination number could be constructed")
        }
        assertMasked("Samordningsnummer \(valid)", .personnummer)
    }

    // MARK: - Whole-document behaviour

    func testSurroundingTextIsPreservedExactly() {
        XCTAssertEqual(
            SensitiveMasker.mask("Betala med 4111 1111 1111 1111 innan fredag."),
            "Betala med \(token) innan fredag.")
    }

    func testEveryPatternInOneDocumentIsMaskedInOrder() {
        let document = """
            Kort 4111 1111 1111 1111
            CVV 123
            IBAN GB82 WEST 1234 5698 7654 32
            SSN 123-45-6789
            Personnummer 811218-9876
            """
        XCTAssertEqual(kinds(document), [.creditCard, .cvv, .iban, .ssn, .personnummer])
        let masked = SensitiveMasker.mask(document)
        for secret in ["4111", "9876", "6789", "WEST", "123-45"] {
            XCTAssertFalse(masked.contains(secret), "\(secret) survived masking")
        }
        XCTAssertTrue(masked.contains("Personnummer \(token)"))
    }

    func testMaskingIsIdempotent() {
        let once = SensitiveMasker.mask("card 4111 1111 1111 1111 cvv 123")
        XCTAssertEqual(SensitiveMasker.mask(once), once)
    }

    func testCleanTextIsReturnedUnchanged() {
        assertUntouched("")
        assertUntouched("Notes from the Tuesday standup — nothing sensitive here.")
        XCTAssertTrue(SensitiveMasker.matches(in: "plain text").isEmpty)
    }

    func testMaskingDoesNotCorruptSurroundingUnicode() {
        XCTAssertEqual(
            SensitiveMasker.mask("🇸🇪 kort 4111-1111-1111-1111 — klart ✅"),
            "🇸🇪 kort \(token) — klart ✅")
    }

    // MARK: - Checksums

    func testLuhn() {
        XCTAssertTrue(SensitiveMasker.isLuhnValid("4111111111111111"))
        XCTAssertTrue(SensitiveMasker.isLuhnValid("378282246310005"))
        XCTAssertFalse(SensitiveMasker.isLuhnValid("4111111111111112"))
        XCTAssertFalse(SensitiveMasker.isLuhnValid(""))
        XCTAssertFalse(SensitiveMasker.isLuhnValid("4"))
        XCTAssertFalse(SensitiveMasker.isLuhnValid("41a1"))
    }

    func testIBANChecksum() {
        XCTAssertTrue(SensitiveMasker.isIBANValid("GB82WEST12345698765432"))
        XCTAssertTrue(SensitiveMasker.isIBANValid("gb82 west 1234 5698 7654 32"))
        XCTAssertFalse(SensitiveMasker.isIBANValid("GB82WEST12345698765433"))
        XCTAssertFalse(SensitiveMasker.isIBANValid("GB82WEST"))  // too short
        XCTAssertFalse(SensitiveMasker.isIBANValid("1234WEST12345698765432"))  // no country
    }

    func testPersonnummerChecksum() {
        XCTAssertTrue(SensitiveMasker.isPersonnummerValid("811218-9876"))
        XCTAssertTrue(SensitiveMasker.isPersonnummerValid("198112189876"))
        XCTAssertFalse(SensitiveMasker.isPersonnummerValid("811218-9875"))
        XCTAssertFalse(SensitiveMasker.isPersonnummerValid("81121898"))
    }
}
