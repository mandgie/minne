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
        XCTAssertEqual(state.page?.primaryAction, .advance)
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

    // MARK: - Provider step (US-014)

    func testGrantedContinuesToTheProviderStep() {
        var state = OnboardingState(permission: .granted, step: .granted)
        state.advance()
        XCTAssertEqual(state.step, .chooseProvider)
        XCTAssertEqual(state.page?.kind, .providers)
        XCTAssertEqual(state.page?.secondaryTitle, "Set Up Later")
    }

    func testEveryStepBeforeTheProviderStepIsStaticText() {
        for step in [OnboardingStep.welcome, .requestPermission, .granted, .ready] {
            XCTAssertEqual(OnboardingModel.page(for: step)?.kind, .info, "\(step)")
        }
    }

    func testSigningInAdvancesPastTheProviderStep() {
        var state = OnboardingState(permission: .granted, step: .chooseProvider)
        XCTAssertTrue(state.signedIn("Claude (Pro/Max) — Claude Sonnet 5"))
        XCTAssertEqual(state.step, .ready)
        // The closing screen names the account that was just set up.
        XCTAssertEqual(state.page?.body.contains("Claude Sonnet 5"), true)
        XCTAssertEqual(state.page?.primaryAction, .finish)
    }

    func testSigningInAgainOnALaterStepDoesNotMoveTheFlowBack() {
        var state = OnboardingState(permission: .granted, step: .ready)
        XCTAssertFalse(state.signedIn("Local (Ollama) — llama3.1"))
        XCTAssertEqual(state.step, .ready)
        XCTAssertEqual(state.page?.body.contains("llama3.1"), true)
    }

    func testDoneOnTheProviderStepFinishesWithoutSigningIn() {
        var state = OnboardingState(permission: .granted, step: .chooseProvider)
        state.advance()
        XCTAssertEqual(state.step, .finished)
        XCTAssertNil(state.page, "no page means the window closes")
    }

    func testFinishFromTheReadyScreen() {
        var state = OnboardingState(permission: .granted, step: .ready)
        state.advance()
        XCTAssertEqual(state.step, .finished)
        XCTAssertNil(state.page, "no page means the window closes")
    }

    /// Reopening onboarding straight at the provider step is how the menu bar
    /// gets to "switch provider" before Settings exists.
    func testFlowCanStartAtTheProviderStep() {
        let state = OnboardingState(permission: .granted, step: .chooseProvider)
        XCTAssertEqual(state.page?.kind, .providers)
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
