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
        XCTAssertEqual(state.page?.account?.contains("Claude Sonnet 5"), true)
        XCTAssertEqual(state.page?.primaryAction, .finish)
    }

    func testSigningInAgainOnALaterStepDoesNotMoveTheFlowBack() {
        var state = OnboardingState(permission: .granted, step: .ready)
        XCTAssertFalse(state.signedIn("Local (Ollama) — llama3.1"))
        XCTAssertEqual(state.step, .ready)
        XCTAssertEqual(state.page?.account?.contains("llama3.1"), true)
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

    // MARK: - Stale-grant escalation (first-run hardening)

    private let t0 = Date(timeIntervalSinceReferenceDate: 1_000_000)

    private func stuckState() -> OnboardingState {
        var state = OnboardingState(permission: .missing, step: .requestPermission)
        state.sentToSettings(now: t0)
        return state
    }

    func testNoEscalationBeforeSystemSettingsWasOpened() {
        var state = OnboardingState(permission: .missing, step: .requestPermission)
        XCTAssertFalse(state.tick(now: t0.addingTimeInterval(3600)))
        XCTAssertEqual(state.repair, .idle)
    }

    func testPatienceClockEscalatesAStuckGrant() {
        var state = stuckState()
        XCTAssertEqual(state.repair, .waiting(since: t0))
        XCTAssertFalse(state.tick(now: t0.addingTimeInterval(5)), "5s is just slow")
        XCTAssertTrue(state.tick(now: t0.addingTimeInterval(OnboardingState.repairPatience)))
        XCTAssertEqual(state.repair, .escalated)
        XCTAssertFalse(
            state.tick(now: t0.addingTimeInterval(60)), "already escalated — no re-render")
    }

    func testReturningFromSettingsWithoutTheGrantEscalatesEarly() {
        var state = stuckState()
        XCTAssertFalse(
            state.returnedFromSettings(now: t0.addingTimeInterval(1)),
            "an immediate bounce back is not a failed attempt")
        XCTAssertTrue(state.returnedFromSettings(now: t0.addingTimeInterval(6)))
        XCTAssertEqual(state.repair, .escalated)
    }

    func testTheGrantResolvesTheEscalation() {
        var state = stuckState()
        state.tick(now: t0.addingTimeInterval(20))
        XCTAssertEqual(state.repair, .escalated)
        XCTAssertTrue(state.permissionObserved(.granted))
        XCTAssertEqual(state.step, .granted)
        XCTAssertEqual(state.repair, .idle)
    }

    func testRepairRoundTripReturnsToWaitingAndCanEscalateAgain() {
        var state = stuckState()
        state.tick(now: t0.addingTimeInterval(20))
        state.repairStarted()
        XCTAssertEqual(state.repair, .repairing)
        XCTAssertFalse(state.tick(now: t0.addingTimeInterval(120)), "no clock while repairing")
        let t1 = t0.addingTimeInterval(30)
        state.repairFinished(now: t1)
        XCTAssertEqual(state.repair, .waiting(since: t1))
        // Still stuck after the repair: the escalation comes back on its own.
        XCTAssertTrue(state.tick(now: t1.addingTimeInterval(OnboardingState.repairPatience)))
        XCTAssertEqual(state.repair, .escalated)
    }

    func testReopeningSettingsWhileEscalatedKeepsTheRepairOffer() {
        var state = stuckState()
        state.tick(now: t0.addingTimeInterval(20))
        state.sentToSettings(now: t0.addingTimeInterval(25))
        XCTAssertEqual(
            state.repair, .escalated,
            "pressing the grant button again is not evidence the stale entry healed")
    }

    func testGrantDuringRepairResolves() {
        var state = stuckState()
        state.tick(now: t0.addingTimeInterval(20))
        state.repairStarted()
        XCTAssertTrue(state.permissionObserved(.granted))
        XCTAssertEqual(state.repair, .idle)
        state.repairFinished(now: t0.addingTimeInterval(40))
        XCTAssertEqual(state.repair, .idle, "a finished repair must not revive the watchdog")
    }

    func testEscalationIsConfinedToThePermissionStep() {
        var state = OnboardingState(permission: .missing, step: .welcome)
        state.sentToSettings(now: t0)
        XCTAssertEqual(state.repair, .idle)
        XCTAssertFalse(state.tick(now: t0.addingTimeInterval(3600)))
        XCTAssertFalse(state.returnedFromSettings(now: t0.addingTimeInterval(3600)))
    }

    func testDebugForceEscalationOnlyOnThePermissionStep() {
        var state = OnboardingState(permission: .missing, step: .requestPermission)
        state.debugForceEscalation()
        XCTAssertEqual(state.repair, .escalated)
        var welcome = OnboardingState(permission: .missing, step: .welcome)
        welcome.debugForceEscalation()
        XCTAssertEqual(welcome.repair, .idle)
    }

    // MARK: - What the escalation and the dialog guidance render

    func testEscalatedPageOffersTheRepairInUserWords() throws {
        var state = stuckState()
        state.tick(now: t0.addingTimeInterval(20))
        let repair = try XCTUnwrap(state.page?.repair)
        XCTAssertTrue(repair.body.contains("look on"), "names the stale-switch symptom")
        XCTAssertTrue(repair.body.contains("old copy"), "blames the old copy, not the user")
        XCTAssertEqual(repair.buttonTitle, "Repair Permission")
        XCTAssertFalse(repair.inProgress)
    }

    func testRepairingPageDisablesTheButton() throws {
        var state = stuckState()
        state.tick(now: t0.addingTimeInterval(20))
        state.repairStarted()
        let repair = try XCTUnwrap(state.page?.repair)
        XCTAssertTrue(repair.inProgress)
        XCTAssertEqual(repair.buttonTitle, "Repairing…")
    }

    func testWaitingPageShowsNoRepairSection() {
        XCTAssertNil(stuckState().page?.repair)
        XCTAssertNil(OnboardingModel.page(for: .requestPermission)?.repair)
    }

    func testPermissionStepFootnoteExplainsTheLingeringDialog() throws {
        let page = try XCTUnwrap(OnboardingModel.page(for: .requestPermission))
        let footnote = try XCTUnwrap(page.footnote)
        XCTAssertTrue(footnote.contains("does not close by itself"))
        XCTAssertTrue(footnote.contains("safe to close"))
    }

    func testGrantedPageSaysThePermissionLandedAndTheDialogCanGo() throws {
        let page = try XCTUnwrap(OnboardingModel.page(for: .granted))
        XCTAssertTrue(page.body.contains("permission landed"))
        XCTAssertTrue(page.body.contains("close"))
        XCTAssertNil(page.footnote, "the footnote belongs to the request step only")
    }

    func testMidFlowStepsCarryNoFootnote() {
        for step in [OnboardingStep.welcome, .granted, .chooseProvider] {
            XCTAssertNil(OnboardingModel.page(for: step)?.footnote, "\(step)")
        }
    }

    func testClosingStepPointsAtSettingsRatherThanRepeatingItself() throws {
        let page = try XCTUnwrap(OnboardingModel.page(for: .ready))
        let footnote = try XCTUnwrap(page.footnote)
        XCTAssertTrue(footnote.contains("Settings"))
        XCTAssertEqual(page.hint?.isEmpty, false, "the closing screen teaches the shortcut")
    }

    func testEveryVisibleStepLightsExactlyOneRailEntry() {
        let expected: [OnboardingStep: OnboardingRailStep] = [
            .welcome: .privacy,
            // `granted` is the accessibility step's confirmation, so the rail
            // must not advance for it — the user has not started the next job.
            .requestPermission: .accessibility,
            .granted: .accessibility,
            .chooseProvider: .provider,
            .ready: .ready,
        ]
        for (step, rail) in expected {
            XCTAssertEqual(OnboardingModel.page(for: step)?.rail, rail, "\(step)")
        }
        XCTAssertNil(OnboardingModel.page(for: .finished), "the finished step has no page at all")
    }

    /// The promise list carries its own sense: what Minne does reads as a
    /// statement, what it never does begins with "Never". Nothing labels the
    /// two halves, so the copy itself has to keep them apart.
    func testPromiseListSpeaksForItselfWithoutCaptions() throws {
        for step in [OnboardingStep.welcome, .requestPermission] {
            let page = try XCTUnwrap(OnboardingModel.page(for: step))
            XCTAssertTrue(page.bullets.contains(where: \.isPositive), "\(step)")
            XCTAssertTrue(page.bullets.contains { !$0.isPositive }, "\(step)")
        }
        let welcome = try XCTUnwrap(OnboardingModel.page(for: .welcome))
        for bullet in welcome.bullets where !bullet.isPositive {
            XCTAssertTrue(
                bullet.text.hasPrefix("Never"),
                "an uncaptioned negative has to say so itself: \(bullet.text)")
        }
    }
}
