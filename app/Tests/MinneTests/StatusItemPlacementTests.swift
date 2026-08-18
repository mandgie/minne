import XCTest

@testable import Minne

final class StatusItemPlacementTests: XCTestCase {
    private static let suiteName = "sh.minne.tests.status-item-placement"
    private var defaults: UserDefaults!

    override func setUp() {
        super.setUp()
        defaults = UserDefaults(suiteName: Self.suiteName)
        defaults.removePersistentDomain(forName: Self.suiteName)
    }

    override func tearDown() {
        defaults.removePersistentDomain(forName: Self.suiteName)
        super.tearDown()
    }

    // MARK: - The decision

    func testSeedsTheMeasuredOffsetOnAFreshNotchedInstall() {
        XCTAssertEqual(
            StatusItemPlacement.seedPosition(
                hasStoredPosition: false, hasNotch: true, screenWidth: 1512),
            290)
    }

    func testAStoredPositionAlwaysWins() {
        XCTAssertNil(
            StatusItemPlacement.seedPosition(
                hasStoredPosition: true, hasNotch: true, screenWidth: 1512),
            "once macOS has a position — ours or a ⌘-drag — it must never be overwritten")
    }

    func testANotchlessScreenIsLeftAlone() {
        XCTAssertNil(
            StatusItemPlacement.seedPosition(
                hasStoredPosition: false, hasNotch: false, screenWidth: 1512),
            "without a notch the default leftmost slot renders fine")
    }

    func testClampsToAQuarterOfANarrowScreen() {
        // A 14" scaled down to 1024 pt: 290 stays inside the right auxiliary
        // area anyway, but the clamp keeps the guarantee explicit.
        XCTAssertEqual(
            StatusItemPlacement.seedPosition(
                hasStoredPosition: false, hasNotch: true, screenWidth: 1024),
            256)
    }

    func testStandardNotchedWidthsAllGetTheMeasuredOffset() {
        // Air 13.6" / MBP 14" / Air 15" / MBP 16" default resolutions.
        for width in [1470.0, 1512.0, 1710.0, 1728.0] {
            XCTAssertEqual(
                StatusItemPlacement.seedPosition(
                    hasStoredPosition: false, hasNotch: true, screenWidth: width),
                290, "width \(width)")
        }
    }

    func testZeroWidthSeedsNothing() {
        XCTAssertNil(
            StatusItemPlacement.seedPosition(
                hasStoredPosition: false, hasNotch: true, screenWidth: 0))
    }

    // MARK: - The write

    @MainActor
    func testWritesTheKeyOnlyWhenAbsentAndNotched() {
        StatusItemPlacement.applyDefaultIfNeeded(defaults: defaults, notchedScreenWidth: 1512)
        XCTAssertEqual(
            defaults.double(forKey: StatusItemPlacement.preferredPositionKey), 290)
    }

    @MainActor
    func testDoesNotOverwriteAnExistingPosition() {
        // The user ⌘-dragged the item; macOS stored 123.
        defaults.set(123.0, forKey: StatusItemPlacement.preferredPositionKey)
        StatusItemPlacement.applyDefaultIfNeeded(defaults: defaults, notchedScreenWidth: 1512)
        XCTAssertEqual(
            defaults.double(forKey: StatusItemPlacement.preferredPositionKey), 123)
    }

    @MainActor
    func testWritesNothingWithoutANotch() {
        StatusItemPlacement.applyDefaultIfNeeded(defaults: defaults, notchedScreenWidth: nil)
        XCTAssertNil(defaults.object(forKey: StatusItemPlacement.preferredPositionKey))
    }
}
