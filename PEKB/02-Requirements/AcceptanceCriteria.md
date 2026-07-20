# Project Echo — Acceptance Criteria

## Document Metadata

| Field | Value |
|---|---|
| Document ID | PEKB-02-REQ-007 |
| Document Title | Acceptance Criteria |
| PEKB Section | 02-Requirements |
| Version | 0.2.0 |
| Status | Draft |
| Classification | Internal — Requirements |
| Owner Role | QA Lead |
| Approval Required From | Principal Software Architect, Security Architect, Privacy Officer, Product Manager |
| Related Documents | Scope.md (01-Product); ADR-001–ADR-004 (00-Governance/Decisions); SecurityRequirements.md, PrivacyRequirements.md, FunctionalRequirements.md, AIRequirements.md, NonFunctionalRequirements.md, UXRequirements.md (02-Requirements); AssumptionsRegister.md (00-Governance) |
| Original Creator | Dr Ziyaad Moolla |
| Creator ID | ZM |
| Document Provenance | PE-2026.001-ZM |

---

## 1. Purpose and Scope of This Document

This document defines how Project Echo's requirements will be verified and accepted. It converts requirements from `SecurityRequirements.md`, `PrivacyRequirements.md`, `FunctionalRequirements.md`, `AIRequirements.md`, `NonFunctionalRequirements.md`, and `UXRequirements.md` into measurable acceptance conditions. It does not create implementation tests, select testing tools, or define automation frameworks — those belong to `09-Testing/TestPlan.md` and `05-Engineering/TestingStrategy.md`, to be authored only once these acceptance criteria are approved.

This document uses the identifier format `AC-<###>` (Acceptance Criterion), following the `SR-###`/`PR-###`/`FR-###`/`AI-###`/`NFR-###`/`UX-###` precedent established in `SecurityRequirements.md` §2. This document closes out the `02-Requirements/` phase; it is the last document in that section per the completed foundation listed above.

## 2. Acceptance Criteria Principles

**AC-P1 — Objective Verification.** Every acceptance criterion shall be phrased so that its satisfaction can be determined by observation of system behavior or produced evidence, not by subjective judgment of intent.
*Traceability:* EngineeringPrinciples.md §6 ("Explicit over implicit").

**AC-P2 — Traceability.** Every acceptance criterion shall reference at least one specific requirement ID from `SecurityRequirements.md`, `PrivacyRequirements.md`, `FunctionalRequirements.md`, `AIRequirements.md`, `NonFunctionalRequirements.md`, or `UXRequirements.md`. No acceptance criterion in this document introduces a new obligation beyond what its referenced requirement(s) already state.
*Traceability:* EngineeringPrinciples.md §3 (Traceability Discipline).

**AC-P3 — Repeatability.** An acceptance criterion shall be structured (via its Given/When/Then scenario) so that verifying it produces the same result on repeated evaluation, given the same starting conditions.
*Traceability:* 09-Testing/TestPlan.md (pending; this principle constrains its future content).

**AC-P4 — Human Review.** Where a requirement concerns AI-generated output, Human Authority, or an approval/consequential action, the corresponding acceptance criterion shall verify that human review/confirmation occurred as part of the expected result — automated output alone shall never be accepted as satisfying such a requirement.
*Traceability:* ProjectConstitution.md §3.2; SecurityRequirements.md SR-038; AIRequirements.md AI-002.

## 3. Requirement Verification Model

### 3.1 Requirement ID Mapping

Each acceptance criterion in Sections 4–9 states a **Related Requirement** field referencing one or more requirement IDs (e.g., `SR-001`, `PR-014`, `FR-030`, `AI-021`, `NFR-008`, `UX-025`). Where a criterion verifies a cross-cutting combination of requirements, all relevant IDs are listed.

### 3.2 Acceptance Status Model

Each acceptance criterion carries one of the following statuses, tracked at verification time (not fixed in this document, which defines the criteria themselves):

| Status | Meaning |
|---|---|
| **Not Yet Verified** | No verification attempt has occurred. |
| **Verified** | The Given/When/Then scenario was executed and the Expected Result was observed. |
| **Failed** | The scenario was executed and the Expected Result was not observed. |
| **Blocked** | Verification cannot proceed because a dependency (e.g., an unresolved assumption per Section 10) prevents it. |

This document does not itself assign a status to any criterion — status assignment occurs during `09-Testing/TestPlan.md` execution, once implementation exists.

### 3.3 Evidence Expectations

Every acceptance criterion shall state, in its **Evidence Required** field, what artifact demonstrates satisfaction (e.g., an audit log entry, a UI state observation, a specific error message). Evidence shall be reproducible and, where the requirement concerns a Critical or High priority security/privacy control, retainable for audit purposes consistent with `SecurityRequirements.md` SR-041–SR-044.

## 4. Security Acceptance Criteria

**AC-001**
*Related Requirement:* SR-011
*Scenario:* Given no user account exists for a new individual, When an Organization Administrator attempts to create a shared or anonymous account, Then the system shall reject the creation.
*Expected Result:* Account creation fails with a clear rejection; no shared/anonymous account is created.
*Evidence Required:* System rejection message; absence of a corresponding account record.

**AC-002**
*Related Requirement:* SR-014, ADR-004 §4.1
*Scenario:* Given a user holding only the Knowledge Consumer role, When they attempt to access a transcript in Draft Transcript state that they were not assigned to review, Then access shall be denied.
*Expected Result:* Access denied; no transcript content is returned.
*Evidence Required:* Denial response; corresponding audit log entry per AC-013.

**AC-003**
*Related Requirement:* SR-018, SR-019, ADR-004 §4.3
*Scenario:* Given a user holds only the System Administrator role with no separately granted content-access role, When they attempt to open a transcript's content, Then the system shall deny content access while still permitting infrastructure-level administrative actions.
*Expected Result:* Content access denied; administrative functions remain available to the same user.
*Evidence Required:* Denial response for content access; success response for an administrative action performed in the same session.

**AC-004**
*Related Requirement:* SR-019, ADR-004 §4.3.2
*Scenario:* Given an organization has not configured a Reviewer/Approver combination exception, When a single user who is the sole assigned Reviewer of a transcript attempts to approve that same transcript, Then the system shall deny the approval action.
*Expected Result:* Approval denied by default; approval succeeds only if the organization has explicitly configured and visibly flagged the exception.
*Evidence Required:* Denial response in default configuration; audit log entry showing the exception flag when configured.

**AC-005**
*Related Requirement:* SR-023, SR-025
*Scenario:* Given a recording or transcript is stored on an end-user device, When the storage medium is examined outside the running application (e.g., direct file inspection), Then the content shall not be readable in plaintext.
*Expected Result:* Content is encrypted at rest; no plaintext meeting content is recoverable without the applicable key.
*Evidence Required:* Storage inspection result showing encrypted content.

**AC-006**
*Related Requirement:* SR-041, SR-042
*Scenario:* Given any Critical-priority action defined in `SecurityRequirements.md` §15 (e.g., approval, deletion, export, role change) occurs, When the corresponding audit log is inspected, Then an entry shall exist recording the acting individual's identity, role/scope at time of action, the action taken, the affected data, and a timestamp.
*Expected Result:* A complete, attributable audit log entry exists for every such action.
*Evidence Required:* Audit log entry matching the required fields per SR-042.

**AC-007**
*Related Requirement:* SR-043
*Scenario:* Given an audit log entry exists, When a user holding System Administrator or Organization Administrator role attempts to modify or delete that entry, Then the system shall deny the action.
*Expected Result:* Audit log entries remain immutable regardless of the acting role.
*Evidence Required:* Denial response; unchanged audit log content upon re-inspection.

**AC-008**
*Related Requirement:* SR-036, SR-037, ADR-001 §4
*Scenario:* Given an organization has not enabled the networked AI processing opt-in, When transcription is performed, Then no meeting content shall be transmitted externally during processing.
*Expected Result:* Processing completes using the offline path only; no outbound transmission of meeting content is observed.
*Evidence Required:* Network traffic observation (absence of outbound meeting-content transmission) during processing.

## 5. Privacy Acceptance Criteria

**AC-009**
*Related Requirement:* PR-015, PrivacyRequirements.md §6
*Scenario:* Given a new category of product data is introduced, When it is reviewed against the classification framework, Then it shall be assignable to exactly one of C1, C2, C3, or C4 per `PrivacyRequirements.md` §6.1.
*Expected Result:* Every data category in active use has an assigned classification level; none remains unclassified.
*Evidence Required:* Data classification mapping record covering all active data categories.

**AC-010**
*Related Requirement:* PR-025, PR-026
*Scenario:* Given an organization has not explicitly enabled C3-level capabilities (e.g., persistent speaker recognition, if offered), When a meeting is recorded, Then no C3-classified processing shall occur for that meeting.
*Expected Result:* Only C1/C2-level processing occurs by default; C3 processing occurs only where explicitly opted in.
*Evidence Required:* Configuration record showing opt-in status; absence of C3-level data generation when not opted in.

**AC-011**
*Related Requirement:* PR-041, PR-040
*Scenario:* Given an organization has configured a retention period for Approved transcripts, When that period elapses, Then the transcript shall transition toward Archived state (or deletion, per organizational configuration) consistent with the configured rule, and shall not remain indefinitely in Approved state by silent default.
*Expected Result:* Retention rule is applied at the configured time; no indefinite silent retention occurs absent explicit configuration.
*Evidence Required:* Workflow-state timestamp showing the transition aligned with the configured retention period.

**AC-012**
*Related Requirement:* PR-043, PR-044
*Scenario:* Given an authorized deletion of a transcript is executed, When the audit log is subsequently inspected, Then the audit record describing the deletion shall still exist, even though the transcript content itself is gone.
*Expected Result:* Content is deleted; the audit record of the deletion persists.
*Evidence Required:* Confirmation of content removal; persisting audit log entry per SR-044.

**AC-013**
*Related Requirement:* PR-047, PR-048, SR-048–SR-050
*Scenario:* Given a user with delegated export authority requests export of C3-classified content, When the export is attempted, Then the system shall require the additional explicit approval step defined in PR-048 before the export proceeds.
*Expected Result:* Export is blocked pending the additional approval; proceeds only once granted.
*Evidence Required:* Approval-gate interaction record; audit log entry for both the approval and the resulting export.

**AC-014**
*Related Requirement:* PR-049, PR-050
*Scenario:* Given an organization needs to respond to a data-subject access request, When an authorized user searches for all C1–C3 data associated with a specific identifiable individual, Then the system shall provide the technical means to locate that data within the organization's isolated deployment.
*Expected Result:* All applicable data associated with the individual is discoverable through the provided mechanism.
*Evidence Required:* Search/location result set; the specific interface/process remains subject to AR-064 (see Section 10).

## 6. Functional Acceptance Criteria

The authoritative transcript lifecycle, defined in `FunctionalRequirements.md` §3.1, governs the scenarios in this section:

```
Recording Received → Processing → Draft Transcript → Review Required → Reviewed → Approved → Archived
```

**AC-015**
*Related Requirement:* FR-011, FR-017, FR-023
*Scenario:* Given a Recorder ends a live capture, When the recording is accepted by the system, Then the meeting shall transition to Recording Received state and automatically proceed to Processing without further user action.
*Expected Result:* State transitions occur automatically and in the defined order.
*Evidence Required:* Workflow-state history showing Recording Received followed by Processing.

**AC-016**
*Related Requirement:* FR-018, FR-019
*Scenario:* Given an authorized user imports a previously created recording, When the import completes, Then the resulting meeting record shall be subject to the same notification, classification, and ownership requirements as a live-captured recording (per FR-015, FR-022).
*Expected Result:* Imported and live-captured recordings are governed identically from Recording Received onward.
*Evidence Required:* Meeting record metadata showing classification and ownership fields populated identically for both capture sources.

**AC-017**
*Related Requirement:* FR-030, FR-031
*Scenario:* Given processing completes successfully, When the Draft Transcript is presented to the Meeting Owner and assigned Reviewer, Then AI-generated content shall be visually distinguishable from any human-confirmed content (of which there is none yet at this state).
*Expected Result:* All content is marked as AI-generated/unreviewed at Draft Transcript state.
*Evidence Required:* UI state showing the AI-generated indicator applied to all transcript content at this state.

**AC-018**
*Related Requirement:* FR-034, FR-035, FR-038
*Scenario:* Given a transcript is in Review Required state, When a Reviewer corrects transcript text and speaker labels, Then each edit shall be attributed to the Reviewer and timestamped, and the original AI-generated version shall remain retrievable via revision history.
*Expected Result:* Edits are attributed; original version remains accessible.
*Evidence Required:* Revision history entries showing both the original and corrected versions with attribution.

**AC-019**
*Related Requirement:* FR-048, Section 3.1 (transcript lifecycle)
*Scenario:* Given a Reviewer submits their review, When the submission is processed, Then the transcript shall transition from Review Required to Reviewed state, becoming visible to the Approver.
*Expected Result:* State transitions correctly; Approver gains visibility.
*Evidence Required:* Workflow-state history; Approver-facing queue showing the transcript.

**AC-020**
*Related Requirement:* FR-050, FR-053, FR-054
*Scenario:* Given a transcript is in Reviewed state, When an Approver approves it, Then the transcript shall transition to Approved state and become locked against in-place editing, requiring the re-opening mechanism for any further correction.
*Expected Result:* Approval succeeds; subsequent in-place edit attempts are rejected; re-opening mechanism succeeds only for Approver-level authority.
*Evidence Required:* State transition record; rejected in-place edit attempt; successful re-opening action log entry.

**AC-021**
*Related Requirement:* FR-055, PR-041, Section 3.1 (transcript lifecycle)
*Scenario:* Given an Approved transcript reaches its organization-configured retention threshold, When the retention rule is evaluated, Then the transcript shall transition to Archived state.
*Expected Result:* Archival transition occurs consistent with configuration.
*Evidence Required:* Workflow-state history showing the Approved → Archived transition timestamp.

**AC-022**
*Related Requirement:* FR-051, Section 3.1 (backward transitions)
*Scenario:* Given an Approver requests changes on a Reviewed transcript, When the request is submitted with comments, Then the transcript shall return to Review Required state with the Approver's comments visible to the Reviewer.
*Expected Result:* Backward transition occurs; comments are visible.
*Evidence Required:* Workflow-state history showing Reviewed → Review Required; comment record attributed to the Approver.

## 7. AI Acceptance Criteria

**AC-023**
*Related Requirement:* AI-007, FR-030
*Scenario:* Given a completed meeting recording enters Processing, When transcription completes, Then a Draft Transcript shall be produced using the offline processing path unless the networked opt-in is enabled for that organization.
*Expected Result:* Transcript is produced via the applicable path per organization configuration.
*Evidence Required:* Processing path indicator recorded with the resulting transcript.

**AC-024**
*Related Requirement:* AI-011, AI-012, FR-058
*Scenario:* Given a transcript reaches Reviewed or Approved state, When a summary is generated, Then the summary shall inherit the classification level of its source transcript.
*Expected Result:* Summary classification matches or exceeds source classification; never lower.
*Evidence Required:* Classification metadata comparison between transcript and generated summary.

**AC-025**
*Related Requirement:* AI-015, AI-016, FR-060, FR-061
*Scenario:* Given a transcript reaches Reviewed or Approved state, When action items are generated, Then each shall be presented as a draft suggestion requiring explicit human confirmation before being treated as a commitment.
*Expected Result:* Unconfirmed action items are visually marked as draft; only confirmed action items are treated as commitments.
*Evidence Required:* UI state distinguishing draft vs. confirmed action items; confirmation attribution record for confirmed items.

**AC-026**
*Related Requirement:* AI-051, AI-022, SR-038
*Scenario:* Given any AI-generated artifact (transcript, summary, action item) has not yet been human-reviewed, When it is displayed to a user, Then it shall carry a visible AI-generated indicator.
*Expected Result:* Indicator is present on all unreviewed AI-generated content, absent (or replaced by a confirmed indicator) once reviewed.
*Evidence Required:* UI state observation across the review lifecycle.

**AC-027**
*Related Requirement:* AI-030, AI-031, AI-032
*Scenario:* Given a Reviewer makes a recurring type of correction across multiple transcripts, When this pattern is detected, Then no automatic model or behavior change shall occur without passing through the human-approved, version-controlled AI Improvement Loop.
*Expected Result:* No unapproved behavioral change occurs; any change that does occur is traceable to an approval and version record.
*Evidence Required:* Absence of undocumented behavior change; version-control record for any change that does occur.

**AC-028**
*Related Requirement:* AI-047, AI-048
*Scenario:* Given meeting content contains text attempting to instruct an AI capability to bypass review requirements or disclose unauthorized data (a prompt-injection attempt), When that content is processed, Then the AI capability shall not execute the embedded instruction and shall not alter system configuration, role assignments, or security controls as a result.
*Expected Result:* The embedded instruction has no effect beyond being treated as ordinary transcript content; no privileged action occurs.
*Evidence Required:* Processing output showing the injected instruction was not acted upon; absence of any configuration/role change.

The following criteria (AC-042–AC-047) verify the six hard prohibitions consolidated in `00-Governance/EthicalAICharter.md` §4 and stated as requirements in `AIRequirements.md` §6A. They are safety-critical (per EthicalAICharter §6.2) and are the acceptance criteria referenced by AI-063.

**AC-042**
*Related Requirement:* AI-020, EthicalAICharter §4.1
*Scenario:* Given AI transcript-quality assistance identifies a possible correction, When it produces that output, Then the transcript text shall not be modified until a human explicitly applies the change; the output shall be presented only as a suggestion.
*Expected Result:* No AI-authored change reaches the transcript text without a human action; the suggestion is visibly a suggestion.
*Evidence Required:* Revision history showing no AI-applied in-place edit; UI state showing the suggestion as unapplied.

**AC-043**
*Related Requirement:* AI-026, EthicalAICharter §4.2
*Scenario:* Given a segment of audio the AI cannot confidently transcribe, When the Draft Transcript is produced, Then that segment shall be marked as uncertain (or as inaudible) rather than filled with invented text presented as confident.
*Expected Result:* Low-confidence/inaudible segments are marked uncertain; no fabricated confident text appears in their place.
*Evidence Required:* Transcript segment showing the uncertainty/inaudible marker; confidence metadata for the segment.

**AC-044**
*Related Requirement:* AI-061, EthicalAICharter §4.3
*Scenario:* Given a confidential value (e.g., a participant ID or number) is absent or unclear in the source audio, When AI output is produced, Then the AI shall not supply an invented plausible value; the absence shall be preserved or the segment marked uncertain.
*Expected Result:* No fabricated confidential value appears; absence/uncertainty is preserved.
*Evidence Required:* Output showing the value absent or marked uncertain, compared against the source segment.

**AC-045**
*Related Requirement:* AI-060, EthicalAICharter §4.4
*Scenario:* Given overlapping or ambiguous speech the AI cannot confidently attribute, When speaker labeling is produced, Then the uncertain attribution shall be marked as uncertain rather than silently merged into or assigned to a definite speaker.
*Expected Result:* Uncertain speaker attributions are surfaced as uncertain; no silent definite assignment occurs.
*Evidence Required:* Speaker-labeling output showing the uncertainty indicator on the ambiguous segment.

**AC-046**
*Related Requirement:* AI-059, EthicalAICharter §4.5
*Scenario:* Given the AI has reworded, normalized, or summarized a passage, When that content is displayed or exported, Then it shall not be labeled or exported as a verbatim quotation; only human-verified source text may be presented as verbatim.
*Expected Result:* AI-transformed text is never presented as verbatim; verbatim output corresponds to verified source text.
*Evidence Required:* Export/label metadata distinguishing AI-transformed text from verbatim source.

**AC-047**
*Related Requirement:* AI-062, EthicalAICharter §4.6
*Scenario:* Given the AI identifies content as a candidate for removal, When no human has applied the removal, Then the content shall remain present; and When a human does apply it, Then the removal shall create an append-only revision and an attributable audit entry, never an in-place deletion.
*Expected Result:* AI never removes content on its own; human-applied removals are append-only and audited.
*Evidence Required:* Revision history showing content retained pending human action; audit entry and append-only revision for a human-applied removal.

## 8. Performance Acceptance Criteria

**AC-029**
*Related Requirement:* NFR-002
*Scenario:* Given transcription processing is running in the background, When a user navigates, scrolls, or enters a comment in the interface, Then the interface shall remain responsive and shall not block on the background operation.
*Expected Result:* User interactions are processed without the interface freezing.
*Evidence Required:* Observed interface responsiveness during a concurrent background processing operation.

**AC-030**
*Related Requirement:* NFR-008, NFR-030, ADR-001 §4.1
*Scenario:* Given external network connectivity is unavailable, When a meeting is captured and processed using the default configuration, Then transcription and per-meeting speaker labeling shall complete successfully using the offline path.
*Expected Result:* Processing succeeds with no external connectivity present.
*Evidence Required:* Successful Draft Transcript production with network connectivity disabled during the test.

**AC-031**
*Related Requirement:* NFR-014, NFR-015
*Scenario:* Given offline transcription processing is running on a representative managed-laptop-class device, When the user performs other ordinary work concurrently, Then the device shall remain usable without a degree of degradation noticeable to a non-technical user.
*Expected Result:* Concurrent usability is maintained; specific quantitative thresholds remain subject to AR-076 (see Section 10).
*Evidence Required:* Qualitative usability observation during concurrent processing; quantitative thresholds pending AR-076 resolution.

**AC-032**
*Related Requirement:* NFR-025, NFR-027
*Scenario:* Given a processing attempt fails partway through, When the failure is investigated, Then the original recording shall remain intact and available for a retry without requiring re-capture.
*Expected Result:* Recording is preserved; retry succeeds using the same recording.
*Evidence Required:* Recording integrity check post-failure; successful retry using the preserved recording.

## 9. UX Acceptance Criteria

**AC-033**
*Related Requirement:* UX-014, UX-015, UX-016, UX-017
*Scenario:* Given a first-time user encounters their role's interface, When the walkthrough is presented, Then the user shall be able to dismiss it at any point without being blocked from the underlying feature, and shall be able to voluntarily re-open it later; it shall not reappear automatically once dismissed.
*Expected Result:* Dismiss, feature-access, and re-open behaviors all function as specified; no unwanted reappearance occurs.
*Evidence Required:* Interaction trace showing dismiss, subsequent feature use, and voluntary re-open.

**AC-034**
*Related Requirement:* UX-020, UX-022
*Scenario:* Given a user hovers over or otherwise activates a control with an associated tooltip, When the tooltip is displayed, Then it shall explain the control's function in plain language without obstructing the user's current content.
*Expected Result:* Tooltip appears, is legible, plain-language, and non-obstructive.
*Evidence Required:* UI state observation of tooltip display and content.

**AC-035**
*Related Requirement:* UX-040, UX-041, FR-097, FR-098
*Scenario:* Given a user relies solely on keyboard navigation or an assistive technology (e.g., screen reader), When they perform a core workflow (capture initiation, review, approval, search), Then the workflow shall be fully completable without pointer-device input and shall be compatible with the assistive technology to the extent technically feasible.
*Expected Result:* Core workflow completes successfully via keyboard/assistive technology alone.
*Evidence Required:* Completed workflow trace using only keyboard/assistive-technology input; specific conformance target remains subject to AR-070 (see Section 10).

**AC-036**
*Related Requirement:* UX-046, FR-091
*Scenario:* Given a first-time, non-technical user attempts a core workflow with no prior training, When they use the available guidance (tooltips, walkthroughs), Then they shall be able to complete the workflow.
*Expected Result:* Task completion without external training or support; specific usability-testing methodology remains subject to AR-067/AR-070 (see Section 10).
*Evidence Required:* Usability review session record involving a representative novice-user scenario.

**AC-037**
*Related Requirement:* UX-025, UX-028
*Scenario:* Given a Reviewer opens a transcript for review, When they play the source audio, Then the transcript text shall be presented in synchronization with playback, and the interface shall visually distinguish original AI-generated text, human-edited text, and uncertainty-flagged segments.
*Expected Result:* Synchronization and visual distinctions are both observable during the review session.
*Evidence Required:* UI state observation during a review session.

## 10. Failure and Recovery Acceptance Criteria

**AC-038**
*Related Requirement:* FR-026, FR-027, NFR-025
*Scenario:* Given a processing failure occurs (e.g., unusable audio input), When the Meeting Owner is notified, Then the notification shall use plain, non-technical language, and the underlying recording shall not be deleted as a result of the failure.
*Expected Result:* Clear notification is delivered; recording remains intact for retry.
*Evidence Required:* Notification content record; recording integrity confirmation.

**AC-039**
*Related Requirement:* NFR-026
*Scenario:* Given active recording capture is interrupted (e.g., application crash), When the application is restarted, Then the portion of the recording captured up to the point of interruption shall be preserved, to the extent technically feasible.
*Expected Result:* Partial recording is recoverable and accessible.
*Evidence Required:* Recovered recording artifact matching the pre-interruption capture duration.

**AC-040**
*Related Requirement:* NFR-028, SR-043, FR-041
*Scenario:* Given a system failure occurs during a transcript edit or state transition, When the system recovers, Then the transcript's content and revision history shall not be left in a partially applied or corrupted state.
*Expected Result:* Transcript content and history are fully consistent post-recovery; no partial application observed.
*Evidence Required:* Data integrity check comparing pre-failure and post-recovery transcript state.

**AC-041**
*Related Requirement:* SR-060, SR-061
*Scenario:* Given a backup of meeting data is restored, When the restored data is accessed, Then it shall be subject to the same encryption, access control, and organizational isolation requirements as the original data, with no bypass of the ADR-004 role/authorization model during recovery.
*Expected Result:* Restored data is governed identically to primary data; no unscoped "recovery mode" access exists.
*Evidence Required:* Access-control verification against restored data using the standard authorization checks.

## 11. Traceability Matrix Preparation

This document does not itself contain a populated traceability matrix (which requires implementation and test-execution evidence that does not yet exist), but defines the structure future verification work must populate:

```
Requirement (SR-###/PR-###/FR-###/AI-###/NFR-###/UX-###)
       ↓
Acceptance Criterion (AC-###, this document)
       ↓
Test Evidence (produced during 09-Testing/TestPlan.md execution)
       ↓
Release (per 05-Engineering/ReleaseStrategy.md, referencing satisfied AC-### entries)
```

**AC-P5** — Every requirement ID referenced in `SecurityRequirements.md` through `UXRequirements.md` with a Critical or High priority shall have at least one corresponding acceptance criterion in Sections 4–9 of this document before `03-Architecture/` work is considered complete for that requirement's domain; any Critical/High requirement without a corresponding AC-### by that point shall be treated as a documentation gap, not an implicit pass.
*Traceability:* EngineeringPrinciples.md §3.

**AC-P6** — `09-Testing/TestPlan.md` (pending) shall reference each AC-### by ID when defining its test cases, rather than restating the scenario in different terms, consistent with the Single Source of Truth rule in `00-Governance/DocumentStandards.md` §5.
*Traceability:* DocumentStandards.md §5.

## 12. Coverage Note

This document provides representative acceptance criteria for the highest-priority requirements across each domain; it is not an exhaustive one-to-one mapping of every requirement ID in `SecurityRequirements.md` through `UXRequirements.md`. Completing full coverage (per AC-P5) is deferred to an iterative pass during `03-Architecture/` and `09-Testing/TestPlan.md` authoring, tracked as a new assumption in Section 13.

## 13. Open Items and New Assumptions

The following items are referenced in this document as deferred to existing assumptions and require no new entry: AR-064 (data-subject-request interface, AC-014), AR-076 (offline resource thresholds, AC-031), AR-070 (accessibility conformance target, AC-035), AR-067 (review completeness criteria, AC-036).

The following new item is introduced by this document and must be added to `00-Governance/AssumptionsRegister.md`:

1. Full one-to-one acceptance-criteria coverage for every Critical/High requirement across `SecurityRequirements.md` through `UXRequirements.md` has not yet been completed; this document provides representative coverage only, per Section 12.

This is consolidated into `AssumptionsRegister.md` as AR-084 (see completion summary).

## 14. Relationship to Other PEKB Documents

- This document derives its authority from `SecurityRequirements.md`, `PrivacyRequirements.md`, `FunctionalRequirements.md`, `AIRequirements.md`, `NonFunctionalRequirements.md`, and `UXRequirements.md`; it does not introduce new requirements, only verification conditions for existing ones.
- This document closes the `02-Requirements/` phase. `03-Architecture/` documents (pending) must be designed to satisfy the requirements this document verifies.
- `09-Testing/TestPlan.md` and `09-Testing/AcceptanceTesting.md` (pending) must implement test cases referencing each AC-### by ID, per AC-P6.
- `05-Engineering/ReleaseStrategy.md` (pending) must gate release readiness on AC-### satisfaction for Critical/High priority requirements, per AC-P5.

## 15. Revision History

| Version | Date | Summary | Author |
|---|---|---|---|
| 0.1.0 | 2026 (initial) | Initial Acceptance Criteria: principles (AC-P1–AC-P6), verification model, and representative criteria AC-001–AC-041 across security, privacy, functional, AI, performance, UX, and failure/recovery domains. | Dr Ziyaad Moolla (ZM) |
| 0.2.0 | 2026-07-20 | Added AC-042–AC-047 verifying the six Ethical AI Charter §4 hard prohibitions (no silent alteration, no fabricated/guessed speech, no fabricated confidential values, speaker-merge uncertainty, no verbatim misrepresentation, no removal without human action), each tracing to AIRequirements §6A (AI-020, AI-026, AI-059–AI-062). Added Revision History per DocumentStandards v0.2.0. | Dr Ziyaad Moolla (ZM) |

---

*End of Document — PEKB-02-REQ-007 — Project Echo Acceptance Criteria — PE-2026.001-ZM*
