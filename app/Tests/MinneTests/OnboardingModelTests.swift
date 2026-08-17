import XCTest

@testable import Minne

final class OnboardingModelTests: XCTestCase {
    func testStartsOnWelcome() {
        let state = OnboardingState(permission: .missing)
        XCTAssertEqual(state.step, .welcome)
        XCTAssertEqual(state.page?.primaryAction, .advance)
    }

    func testWelcomeExplainsCaptureAndTheNevers() throws {
        let page = try XCTUnwrap(OnboardingModel.page(for: .welcome))
        let positives = page.bullets.filter(\.isPositive).map(\.text).joined(separator: " ")
        let negatives = page.bullets.filter { !$0.isPositive }.map(\.text).joined(separator: " ")

        XCTAssertTrue(positives.contains("foreground window"))
        XCTAssertTrue(positives.contains("~/Minne"))
        XCTAssertTrue(negatives.contains("screenshots"))
        XCTAssertTrue(negatives.contains("cloud"))
        XCTAssertNil(page.secondaryTitle)
        XCTAssertFalse(page.isWaiting)
    }

    func testWelcomeAdvancesToRequestWhenPermissionMissing() {
        var state = OnboardingState(permission: .missing)
        state.advance()
        XCTAssertEqual(state.step, .requestPermission)
        XCTAssertEqual(state.page?.primaryAction, .openSystemSettings)
        XCTAssertEqual(state.page?.secondaryTitle, "Set Up Later")
        XCTAssertEqual(state.page?.isWaiting, true)
    }

    func testWelcomeSkipsRequestScreenWhenAlreadyTrusted() {
        var state = OnboardingState(permission: .granted)
        state.advance()
        XCTAssertEqual(state.step, .granted)
    }

    func testPrimaryOnRequestScreenDoesNotAdvanceByItself() {
        var state = OnboardingState(permission: .missing, step: .requestPermission)
        state.advance()
        XCTAssertEqual(state.step, .requestPermission, "only an observed grant may advance")
    }

    func testObservedGrantAdvancesAutomatically() {
        var state = OnboardingState(permission: .missing, step: .requestPermission)
        XCTAssertTrue(state.permissionObserved(.granted))
        XCTAssertEqual(state.step, .granted)
        XCTAssertEqual(state.page?.primaryAction, .finish)
    }

    func testRepeatedPollsWithoutChangeReportNoTransition() {
        var state = OnboardingState(permission: .missing, step: .requestPermission)
        XCTAssertFalse(state.permissionObserved(.missing))
        XCTAssertTrue(state.permissionObserved(.granted))
        XCTAssertFalse(state.permissionObserved(.granted))
        XCTAssertEqual(state.step, .granted)
    }

    func testRevokedPermissionReturnsToRequestScreen() {
        var state = OnboardingState(permission: .granted, step: .granted)
        XCTAssertTrue(state.permissionObserved(.missing))
        XCTAssertEqual(state.step, .requestPermission)
    }

    func testFinishFromGrantedScreen() {
        var state = OnboardingState(permission: .granted, step: .granted)
        state.advance()
        XCTAssertEqual(state.step, .finished)
        XCTAssertNil(state.page, "no page means the window closes")
    }

    func testSkipLeavesFlowFinishedWithPermissionStillMissing() {
        var state = OnboardingState(permission: .missing, step: .requestPermission)
        state.skip()
        XCTAssertEqual(state.step, .finished)
        XCTAssertEqual(state.permission, .missing)
        XCTAssertNil(state.page)
    }

    func testFinishedIsTerminal() {
        var state = OnboardingState(permission: .missing, step: .finished)
        state.advance()
        XCTAssertEqual(state.step, .finished)
        XCTAssertFalse(state.permissionObserved(.granted))
        XCTAssertEqual(state.step, .finished)
    }

    func testCapturePermissionStateFromTrustFlag() {
        XCTAssertEqual(CapturePermissionState(isTrusted: true), .granted)
        XCTAssertEqual(CapturePermissionState(isTrusted: false), .missing)
        XCTAssertTrue(CapturePermissionState.granted.isGranted)
        XCTAssertFalse(CapturePermissionState.missing.isGranted)
    }
}
