# Project Echo — UX Requirements

## Document Metadata

| Field | Value |
|---|---|
| Document ID | PEKB-02-REQ-006 |
| Document Title | UX Requirements |
| PEKB Section | 02-Requirements |
| Version | 0.1.0 |
| Status | Draft |
| Classification | Internal — Requirements |
| Owner Role | UX Lead |
| Approval Required From | Product Manager, Accessibility Specialist, Security Architect, Privacy Officer |
| Related Documents | Personas.md (01-Product); ADR-004-AccessControlRBACModel.md (00-Governance/Decisions); FunctionalRequirements.md, NonFunctionalRequirements.md, SecurityRequirements.md, PrivacyRequirements.md (02-Requirements); AssumptionsRegister.md (00-Governance) |
| Original Creator | Dr Ziyaad Moolla |
| Creator ID | ZM |
| Document Provenance | PE-2026.001-ZM |

---

## 1. Purpose and Scope of This Document

This document defines the user experience requirements Project Echo must satisfy: user interaction expectations, interface behavior, guidance systems, and accessibility expectations. Its objective, as directed, is a system that is powerful for enterprise users while remaining simple and accessible for users with limited technical experience. It does not design screens, choose UI frameworks, or define implementation — those belong to `04-Design/` and `05-Engineering/`.

This document uses the requirement identifier format `UX-<###>` (UX Requirement), following the `SR-###`/`PR-###`/`FR-###`/`AI-###`/`NFR-###` precedent established in `SecurityRequirements.md` §2. Every requirement traces to `01-Product/Personas.md`, `FunctionalRequirements.md`, `NonFunctionalRequirements.md`, ADR-004, `PrivacyRequirements.md`, or `SecurityRequirements.md`. Consistent with the instruction governing this document, no unresolved design decision (e.g., specific visual treatment, exact wording, or interaction pattern) is invented here — such decisions are recorded as new assumptions where a requirement depends on one.

## 2. Priority Definitions

Priority levels are as defined in `SecurityRequirements.md` §3 (Critical / High / Medium / Low), reused without redefinition per `00-Governance/DocumentStandards.md` §5.

## 3. UX Principles

**UX-001** — The interface shall prioritize simplicity: where two designs would satisfy the same functional requirement, the system shall favor the design with fewer steps, fewer concepts, and less required prior knowledge, consistent with the Simplicity commitment.
*Priority:* Critical. *Traceability:* ProjectConstitution.md §3.6; Personas.md §1–§2.

**UX-002** — The interface shall present information with clarity: labels, states, and actions shall use plain, unambiguous language, avoiding technical or platform-internal terminology in user-facing text.
*Priority:* Critical. *Traceability:* ProjectConstitution.md (User Experience Principles); Glossary.md (internal terms not to leak into UI).

**UX-003** — The interface shall be designed to build user trust by making system behavior predictable: identical user actions shall produce identical, expected results, and the system shall not surprise a user with undisclosed side effects.
*Priority:* Critical. *Rationale:* Directly implements the "predictability" component of trust defined in `00-Governance/ProjectPhilosophy.md` §5. *Traceability:* ProjectPhilosophy.md §5.

**UX-004** — The interface shall support transparency by making visible, at the point of relevant action, what the system is doing and why (e.g., why a transcript is in a given state, why an action requires approval), consistent with the Transparency commitment.
*Priority:* Critical. *Traceability:* ProjectConstitution.md §3.8.

**UX-005** — The interface shall support user confidence by giving users clear feedback that an action they took was received and is being (or has been) acted upon, avoiding ambiguous or silent states.
*Priority:* High. *Traceability:* ProjectConstitution.md (User Experience Principles); NonFunctionalRequirements.md NFR-002, NFR-005.

## 4. User Personas

**UX-006** — UX design and evaluation shall be conducted against the five Direct User personas defined in `01-Product/Personas.md`: Meeting Owner, Reviewer, Approver, Knowledge Consumer, and the Recorder role defined in `ADR-004-AccessControlRBACModel.md` §4.1 (not separately profiled as a persona in `Personas.md`, but sharing the Meeting Owner persona's context where the same individual holds both).
*Priority:* Critical. *Traceability:* Personas.md §3–§6; ADR-004 §4.1.

**UX-007** — Where the Recorder role (ADR-004 §4.1) is held by an individual distinct from the Meeting Owner, the interface presented to them shall be scoped to the narrow capture-confirmation permission boundary defined for that role, and shall not expose Reviewer/Approver-level functionality they are not authorized to use.
*Priority:* High. *Traceability:* ADR-004 §4.1 (Recorder row); SecurityRequirements.md SR-030.

**UX-008** — No persona defined in `01-Product/Personas.md` shall be assumed to have advanced technical skill by default, consistent with `Personas.md` §7; UX design shall treat the stated skill levels as a ceiling, not a floor.
*Priority:* Critical. *Traceability:* Personas.md §7; FunctionalRequirements.md FR-099.

**UX-009** — Personas used for UX design and evaluation remain illustrative and provisional per `Personas.md` §1; this document's requirements shall be re-validated against real user research once available, consistent with the previously tracked **AR-039**.
*Priority:* N/A (scope clarification). *Traceability:* AssumptionsRegister.md AR-039.

## 5. Navigation and Interface Simplicity

**UX-010** — The interface shall provide navigation that allows a user to determine their current location within a workflow (e.g., which transcript, which state per `FunctionalRequirements.md` §3.1) without needing to consult external documentation.
*Priority:* Critical. *Traceability:* FunctionalRequirements.md §3.1.

**UX-011** — Workflows (capture initiation, review, approval, search, export) shall follow a predictable structure: a given type of action shall be reachable through a consistent interaction pattern across the application, not a different pattern per feature.
*Priority:* High. *Traceability:* UX-003 (this document).

**UX-012** — The interface shall minimize the number of concepts a user must understand to complete their role's core task (e.g., a Reviewer should be able to correct and submit a transcript without needing to understand the underlying RBAC model, per `FunctionalRequirements.md` FR-009).
*Priority:* Critical. *Traceability:* FunctionalRequirements.md FR-009, FR-042.

**UX-013** — The interface shall avoid exposing functionality a user is not authorized to use (per their role and scope in ADR-004), rather than exposing it in a disabled or confusing state; unauthorized functionality shall be absent, not merely inactive, wherever feasible.
*Priority:* High. *Rationale:* Reduces cognitive load and avoids a novice user wondering why a visible control does not work. *Traceability:* ADR-004 §4.1; UX-001 (this document).

## 6. First-Time User Experience

**UX-014** — The system shall provide an interactive walkthrough for a user's first encounter with each major role interface (Meeting Owner, Reviewer, Approver, Knowledge Consumer), consistent with `FunctionalRequirements.md` FR-088.
*Priority:* High. *Traceability:* FunctionalRequirements.md FR-088.

**UX-015** — A walkthrough shall be dismissible at any point without blocking access to the underlying feature, consistent with `FunctionalRequirements.md` FR-089.
*Priority:* Critical. *Traceability:* FunctionalRequirements.md FR-089.

**UX-016** — A dismissed walkthrough shall be restartable voluntarily by the user (e.g., from a help menu), consistent with `FunctionalRequirements.md` FR-090.
*Priority:* High. *Traceability:* FunctionalRequirements.md FR-090.

**UX-017** — Walkthroughs shall never block or interrupt an experienced user who has already dismissed them; a walkthrough shall not reappear automatically once dismissed, except where the user explicitly re-opens it (UX-016) or a materially new capability is introduced.
*Priority:* Critical. *Traceability:* ProjectConstitution.md (User Experience Principles — "Ability to close walkthroughs easily").

**UX-018** — Onboarding shall include illustrative examples of the core workflow (e.g., an example transcript showing Draft vs. reviewed content) to support guided learning, consistent with the novice-user support objective.
*Priority:* Medium. *Traceability:* Personas.md §7.

**UX-019** — Whether "materially new capability" (per UX-017) triggering a re-shown walkthrough is determined automatically or requires organizational configuration is not yet defined and is deferred — see Section 12 (new assumption).
*Priority:* N/A (deferral notice).

## 7. Tooltips and Contextual Guidance

**UX-020** — The interface shall provide contextual tooltips explaining non-obvious controls or states, consistent with `FunctionalRequirements.md` FR-087.
*Priority:* High. *Traceability:* FunctionalRequirements.md FR-087.

**UX-021** — Tooltips shall appear without requiring a user to leave their current task, and shall not obstruct the content the user is actively working with.
*Priority:* Medium. *Traceability:* UX-001 (this document).

**UX-022** — Contextual help hints shall be available for each major workflow action (e.g., what "Approve" does, what "Re-open" does), consistent with `FunctionalRequirements.md` FR-092.
*Priority:* High. *Traceability:* FunctionalRequirements.md FR-092.

**UX-023** — Warnings shall be presented distinctly from informational tooltips, reserved for situations with a meaningful consequence (e.g., an irreversible or hard-to-reverse action, per Section 8 of this document).
*Priority:* High. *Traceability:* Section 8 (this document).

**UX-024** — Explanations accompanying AI-generated content (e.g., why a segment is flagged as low-confidence, per `AIRequirements.md` AI-019) shall be presented in plain language, not technical AI/ML terminology.
*Priority:* High. *Traceability:* AIRequirements.md AI-019, AI-024.

## 8. Transcript Review UX

**UX-025** — The Reviewer interface shall support synchronized playback of source audio alongside the corresponding transcript text, consistent with `FunctionalRequirements.md` FR-043–FR-044.
*Priority:* Critical. *Traceability:* FunctionalRequirements.md FR-043–FR-044.

**UX-026** — Corrections to transcript text shall be made directly in place within the synchronized review interface, without requiring the Reviewer to switch to a separate editing context, consistent with `FunctionalRequirements.md` FR-045.
*Priority:* High. *Traceability:* FunctionalRequirements.md FR-045.

**UX-027** — Annotations and comments (per `FunctionalRequirements.md` §12) shall be visually anchored to the specific transcript location they relate to, distinguishable from the transcript text itself.
*Priority:* High. *Traceability:* FunctionalRequirements.md FR-056.

**UX-028** — Change tracking shall make clear, at a glance, which portions of a transcript are original AI-generated text, which have been human-edited, and which remain flagged as uncertain (per `FunctionalRequirements.md` FR-037 and `SecurityRequirements.md` SR-038).
*Priority:* Critical. *Traceability:* SecurityRequirements.md SR-038; FunctionalRequirements.md FR-037.

**UX-029** — Confidence indicators (where produced by AI processing, per `AIRequirements.md` AI-024) shall be visually distinguishable without requiring the Reviewer to interpret a numeric score; the specific visual treatment is not yet defined and is deferred to `04-Design/`.
*Priority:* High. *Traceability:* AIRequirements.md AI-024–AI-025.

**UX-030** — The Reviewer interface shall present review progress (what has and has not been examined) consistent with `FunctionalRequirements.md` FR-030 and the Transcript Reviewer persona's stated need in `Personas.md` §4.
*Priority:* High. *Traceability:* FunctionalRequirements.md FR-030; Personas.md §4.

## 9. Approval UX

**UX-031** — The Approver interface shall present the current workflow state and review completeness summary clearly before allowing an approval action, consistent with `FunctionalRequirements.md` FR-052.
*Priority:* Critical. *Traceability:* FunctionalRequirements.md FR-052; Personas.md §5.

**UX-032** — Approval shall require an explicit confirming action distinct from simply viewing the transcript, so that approval cannot occur accidentally.
*Priority:* Critical. *Traceability:* ADR-003 §4.2 (approval finalizes the organizational record).

**UX-033** — Actions that lock a transcript against in-place editing (i.e., approval itself, per `FunctionalRequirements.md` FR-053) shall be presented with a clear warning of this consequence before the user confirms, distinguishing it from an easily reversible action.
*Priority:* Critical. *Rationale:* Approval is a hard-to-reverse action (requiring the distinct re-opening mechanism in `SecurityRequirements.md` SR-035) and must be communicated as such, not presented identically to a routine save action. *Traceability:* FunctionalRequirements.md FR-053; SecurityRequirements.md SR-035.

**UX-034** — Re-opening an Approved transcript (per `SecurityRequirements.md` SR-035) shall likewise require an explicit confirming action with a warning explaining that this reverses the record's finalized status.
*Priority:* High. *Traceability:* SecurityRequirements.md SR-035; FunctionalRequirements.md FR-054.

**UX-035** — Rejecting a Reviewed transcript or requesting changes (`FunctionalRequirements.md` FR-051) shall require the Approver to provide comments explaining what is required, rather than allowing a bare rejection with no guidance for the Reviewer.
*Priority:* High. *Traceability:* FunctionalRequirements.md FR-051.

## 10. Error Handling Experience

**UX-036** — Error messages shall be presented in plain language explaining what happened and, where possible, what the user can do next, consistent with `FunctionalRequirements.md` FR-093.
*Priority:* Critical. *Traceability:* FunctionalRequirements.md FR-093, FR-026.

**UX-037** — Where an error condition offers a corrective action (e.g., retrying a failed processing attempt per `FunctionalRequirements.md` FR-027), that action shall be presented directly alongside the error message, not requiring the user to seek it separately.
*Priority:* High. *Traceability:* FunctionalRequirements.md FR-027.

**UX-038** — The interface shall prevent likely user mistakes proactively where feasible (e.g., confirming before an approval or re-opening action per Section 9 of this document), rather than relying solely on post-hoc error messages.
*Priority:* High. *Traceability:* Section 9 (this document); UX-032–UX-034.

**UX-039** — Where a mistake cannot be prevented proactively, the interface shall make the recovery path (e.g., reverting a comment, requesting a transcript be returned to Review Required) discoverable without requiring external support.
*Priority:* Medium. *Traceability:* FunctionalRequirements.md §11 (backward transitions).

## 11. Accessibility

**UX-040** — The interface shall support full keyboard-only operation of all core workflows (capture initiation, review, approval, search), consistent with `FunctionalRequirements.md` FR-097.
*Priority:* Critical. *Traceability:* FunctionalRequirements.md FR-097.

**UX-041** — The interface shall be compatible with commonly used assistive technologies (e.g., screen readers) to the extent technically feasible, consistent with `FunctionalRequirements.md` FR-098.
*Priority:* Critical. *Traceability:* FunctionalRequirements.md FR-098.

**UX-042** — Visual presentation (text size, contrast, layout clarity) shall support readability for users with a range of visual abilities, consistent with the Accessibility commitment.
*Priority:* Critical. *Traceability:* ProjectConstitution.md §3.7; FunctionalRequirements.md FR-095.

**UX-043** — Accessibility shall be treated as a measurable quality attribute verified through defined testing, consistent with `NonFunctionalRequirements.md` NFR-055, not assumed from feature presence alone.
*Priority:* Critical. *Traceability:* NonFunctionalRequirements.md NFR-055.

**UX-044** — The specific accessibility conformance target (e.g., a named standard/level) remains undefined and is not resolved by this document; it is tracked as the previously recorded **AR-070**.
*Priority:* N/A (deferral notice). *Traceability:* AssumptionsRegister.md AR-070.

## 12. Beginner User Support

**UX-045** — All user-facing text shall use plain language, avoiding jargon specific to AI/ML, security, or the platform's internal architecture, consistent with UX-002 of this document.
*Priority:* Critical. *Traceability:* UX-002 (this document); Personas.md §7.

**UX-046** — Core workflows (capture, review, approval) shall be completable by a first-time, non-technical user through guided interaction (tooltips, walkthroughs per Sections 6–7) without requiring prior training, consistent with the novice-user support objective governing this document.
*Priority:* Critical. *Traceability:* FunctionalRequirements.md FR-091; Personas.md §7.

**UX-047** — The system shall offer a reduced-complexity presentation option (per `FunctionalRequirements.md` FR-091's "beginner mode or equivalent") for first-time or infrequent users; the specific form (a literal mode toggle vs. progressive disclosure) is not decided by this document and remains tracked as the previously recorded **AR-069**.
*Priority:* High. *Traceability:* FunctionalRequirements.md FR-091; AssumptionsRegister.md AR-069.

**UX-048** — Beginner-user usability shall be validated through usability review involving representative novice-user scenarios before release, consistent with `NonFunctionalRequirements.md` NFR-057.
*Priority:* High. *Traceability:* NonFunctionalRequirements.md NFR-057.

## 13. Trust and Transparency

**UX-049** — AI-generated content shall carry a clear, consistent visual indicator distinguishing it from human-confirmed content, consistent with `SecurityRequirements.md` SR-038 and `AIRequirements.md` AI-022.
*Priority:* Critical. *Traceability:* SecurityRequirements.md SR-038; AIRequirements.md AI-022.

**UX-050** — Where an artifact (transcript, summary, action item) is derived through AI processing, the interface shall make discoverable which AI capability produced it, consistent with `AIRequirements.md` AI-052.
*Priority:* High. *Traceability:* AIRequirements.md AI-052.

**UX-051** — Where the organization has enabled the networked AI processing opt-in (`ADR-001-AIProcessingModel.md` §4.2), this shall be visibly indicated to users interacting with content processed via that path, consistent with `SecurityRequirements.md` SR-037.
*Priority:* Critical. *Traceability:* SecurityRequirements.md SR-037; ADR-001 §4.2.

**UX-052** — Automated outputs (summaries, action items, key points, decisions per `AIRequirements.md` §4) shall be accompanied by a plain-language explanation that they are AI-generated drafts requiring human confirmation, not an assumption the user is expected to already understand.
*Priority:* Critical. *Traceability:* AIRequirements.md AI-021, AI-051.

**UX-053** — Users shall be able to discover, in plain language, what personal information a given feature processes and how, consistent with `PrivacyRequirements.md` PR-006 and PR-009 (purpose specification and openness).
*Priority:* High. *Traceability:* PrivacyRequirements.md PR-006, PR-009.

**UX-054** — Meeting participants shall receive the notification required by `PrivacyRequirements.md` PR-022 in a form that is clear without requiring an understanding of the platform's internal architecture, consistent with PR-023.
*Priority:* Critical. *Traceability:* PrivacyRequirements.md PR-022–PR-023.

## 14. Traceability Summary

Every requirement in this document traces to at least one of: `01-Product/Personas.md`, `FunctionalRequirements.md`, `NonFunctionalRequirements.md`, ADR-004, `PrivacyRequirements.md`, or `SecurityRequirements.md`, per the inline Traceability references above. Consistent with the instruction governing this document, no unresolved design decision (specific visual treatment, exact interaction pattern, or wording) has been invented; each is recorded as a deferral notice and, where new, an assumption in Section 15.

## 15. Open Items and New Assumptions

The following items are referenced in this document as deferred to existing assumptions and require no new entry: AR-039 (personas are illustrative, pending validation), AR-069 (beginner-mode form), AR-070 (accessibility conformance target).

The following new item is introduced by this document and must be added to `00-Governance/AssumptionsRegister.md`:

1. Whether a "materially new capability" (per UX-017) triggering a re-shown walkthrough is determined automatically by the system or requires organizational configuration is undefined (UX-019).

This is consolidated into `AssumptionsRegister.md` as AR-083 (see completion summary).

## 16. Relationship to Other PEKB Documents

- This document derives its authority from `01-Product/Personas.md`, `FunctionalRequirements.md`, `NonFunctionalRequirements.md`, ADR-004, `PrivacyRequirements.md`, and `SecurityRequirements.md`; it does not introduce new governance principles.
- `04-Design/UXPrinciples.md`, `UIStandards.md`, `Accessibility.md`, `HelpSystem.md`, and `Walkthroughs.md` (pending) must design to satisfy these requirements without contradicting them.
- `02-Requirements/AcceptanceCriteria.md` (pending) must derive testable UX acceptance criteria from this document's requirements.

---

*End of Document — PEKB-02-REQ-006 — Project Echo UX Requirements — PE-2026.001-ZM*
