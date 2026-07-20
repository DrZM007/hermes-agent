# Project Echo — Non-Functional Requirements

## Document Metadata

| Field | Value |
|---|---|
| Document ID | PEKB-02-REQ-005 |
| Document Title | Non-Functional Requirements |
| PEKB Section | 02-Requirements |
| Version | 0.1.0 |
| Status | Draft |
| Classification | Internal — Requirements |
| Owner Role | Principal Software Architect |
| Approval Required From | Security Architect, DevOps/Deployment Engineer, QA Lead, Product Manager |
| Related Documents | ProjectConstitution.md, ProjectPhilosophy.md (00-Governance); ADR-001–ADR-004 (00-Governance/Decisions); SecurityRequirements.md, PrivacyRequirements.md, FunctionalRequirements.md, AIRequirements.md (02-Requirements); AssumptionsRegister.md (00-Governance) |
| Original Creator | Dr Ziyaad Moolla |
| Creator ID | ZM |
| Document Provenance | PE-2026.001-ZM |

---

## 1. Purpose and Scope of This Document

This document defines the measurable quality attributes and operational expectations Project Echo must satisfy: how well the system must operate, including performance, reliability, scalability, maintainability, and operational constraints. It does not choose technologies, design architecture, select vendors, or define implementation — those belong to `03-Architecture/` and `05-Engineering/`.

This document uses the requirement identifier format `NFR-<###>` (Non-Functional Requirement), following the `SR-###`/`PR-###`/`FR-###`/`AI-###` precedent established in `SecurityRequirements.md` §2. Consistent with the instruction governing this document, where a specific quantitative target (e.g., an exact latency or storage figure) is not yet established by governance, an ADR, or a prior requirements document, this document does not invent one — it states the qualitative requirement and records the specific target as a new assumption.

## 2. Priority Definitions

Priority levels are as defined in `SecurityRequirements.md` §3 (Critical / High / Medium / Low), reused without redefinition per `00-Governance/DocumentStandards.md` §5.

## 3. Performance Requirements

**NFR-001** — Application startup shall complete within a time perceived as prompt by a non-technical user, consistent with the Simplicity and Accessibility commitments; the specific maximum startup time is not yet defined.
*Priority:* High. *Traceability:* ProjectConstitution.md §3.6–§3.7.

**NFR-002** — The application shall remain responsive to user input (navigation, transcript scrolling, comment entry) during background operations such as transcription processing, and shall not block the interface for the duration of a long-running AI operation.
*Priority:* Critical. *Rationale:* An interface that freezes during processing would directly undermine the Reviewer and Meeting Owner personas' stated need for a low-friction experience (`01-Product/Personas.md` §3–§4). *Traceability:* Personas.md §3–§4; FunctionalRequirements.md §7.

**NFR-003** — Transcript processing (Recording Received → Draft Transcript, per `FunctionalRequirements.md` §3.1) shall complete within a duration proportionate to recording length, and the system shall present progress status throughout, consistent with `FunctionalRequirements.md` FR-025.
*Priority:* High. *Traceability:* FunctionalRequirements.md FR-025, §3.1.

**NFR-004** — Search (per `FunctionalRequirements.md` §13) shall return results within a time perceived as responsive by the searching user, without requiring the user to understand the underlying search mechanism.
*Priority:* High. *Traceability:* FunctionalRequirements.md §13.

**NFR-005** — Transcript editing actions (text correction, comment addition, per `FunctionalRequirements.md` §9) shall be reflected in the interface without perceptible delay, to support an efficient Reviewer correction experience.
*Priority:* High. *Traceability:* FunctionalRequirements.md §9; Personas.md §4.

**NFR-006** — Export operations (per `FunctionalRequirements.md` §14) shall complete within a time proportionate to the volume of exported content, with progress visibility for larger exports.
*Priority:* Medium. *Traceability:* FunctionalRequirements.md §14.

**NFR-007** — Specific quantitative performance targets (maximum startup time, processing time per minute of recording, search response time, edit-action latency, export time per volume) are not yet defined and must not be assumed; they are recorded as a new assumption in Section 15.
*Priority:* N/A (deferral notice). *Traceability:* Section 15 (this document).

## 4. AI Processing Performance

**NFR-008** — The default offline AI processing path (ADR-001 §4.1) shall complete transcription and, where applicable, per-meeting speaker labeling without requiring external connectivity, consistent with `AIRequirements.md` AI-034.
*Priority:* Critical. *Traceability:* ADR-001 §4.1; AIRequirements.md AI-034.

**NFR-009** — Acceptable processing delay for the offline path shall be proportionate to recording duration and shall not be assumed to match the latency achievable by the optional networked path (ADR-001 §4.2); any material difference in processing time between the two paths shall be disclosed to the organization when the networked opt-in is being considered.
*Priority:* High. *Rationale:* An organization approving the networked opt-in (per `AIRequirements.md` AI-035–AI-036) should understand the performance trade-off it is accepting, not only the privacy trade-off. *Traceability:* AIRequirements.md AI-035–AI-036; ADR-001 §4.

**NFR-010** — The offline AI processing path's resource usage (CPU, memory, storage) shall be designed to operate within the constraints of a managed enterprise laptop as described in `00-Governance/ProjectIntent.md` (Target Environment Constraints), without requiring dedicated specialized hardware.
*Priority:* Critical. *Traceability:* ProjectIntent.md (Target Environment Constraints); ADR-001 §4.

**NFR-011** — The system shall account for variability in end-user device hardware capability (e.g., differing CPU/memory availability across an organization's fleet of managed laptops) such that offline processing remains functional, if not equally fast, across the range of hardware an adopting organization is expected to deploy.
*Priority:* High. *Traceability:* ProjectIntent.md (Target Environment Constraints).

**NFR-012** — Specific offline processing time targets (e.g., a maximum ratio of processing time to recording duration), and specific resource-usage ceilings (CPU/memory/storage thresholds), are not yet defined and must not be assumed; they are recorded as a new assumption in Section 15, consistent with the previously tracked **AR-042**.
*Priority:* N/A (deferral notice). *Traceability:* AssumptionsRegister.md AR-042.

## 5. Endpoint Requirements

**NFR-013** — The system's end-user client shall operate within the resource constraints of a managed Windows laptop, without requiring administrator rights for ordinary use, consistent with `00-Governance/ProjectIntent.md` and `SecurityRequirements.md` SR-004.
*Priority:* Critical. *Traceability:* ProjectIntent.md; SecurityRequirements.md SR-004.

**NFR-014** — CPU usage during background operations (e.g., offline transcription processing) shall be managed such that the endpoint remains usable for the user's other ordinary work during processing, to the extent technically feasible.
*Priority:* High. *Traceability:* NFR-002 (this document); ProjectIntent.md.

**NFR-015** — Memory usage shall be managed such that the application does not degrade overall system performance on a typical managed enterprise laptop to a degree that would be noticeable to a non-technical user in the course of ordinary use.
*Priority:* High. *Traceability:* ProjectIntent.md; NFR-010.

**NFR-016** — Storage usage on the end-user device (for locally cached recordings/transcripts pending processing or sync, if applicable) shall be bounded and shall not be permitted to grow without a defined management mechanism, consistent with `PrivacyRequirements.md` §14 (Data Minimization) and Section 9 of this document.
*Priority:* High. *Traceability:* PrivacyRequirements.md §14; Section 9 (this document).

**NFR-017** — Background operation (processing occurring while the application is not in active foreground use) shall have a defined, bounded impact on battery consumption for laptop users, to the extent technically feasible; the specific acceptable impact level is not yet defined.
*Priority:* Medium. *Traceability:* ProjectIntent.md.

**NFR-018** — This document does not specify particular hardware models, minimum specifications, or device requirements; endpoint requirements are stated as behavioral constraints the system must satisfy across the range of managed devices an adopting organization deploys, consistent with the instruction governing this document.
*Priority:* N/A (scope clarification).

**NFR-019** — Specific CPU/memory/storage/battery-impact numeric thresholds are not yet defined and must not be assumed; they are recorded as a new assumption in Section 15.
*Priority:* N/A (deferral notice). *Traceability:* Section 15 (this document).

## 6. Meeting Scale Requirements

**NFR-020** — The system shall support meeting recordings of a duration consistent with typical organizational meetings, without an arbitrarily low ceiling that would exclude common use cases (e.g., extended workshops or training sessions).
*Priority:* High. *Traceability:* Scope.md §2.1; AssumptionsRegister.md AR-022.

**NFR-021** — The system shall support a number of meeting participants consistent with typical organizational meetings, including larger group meetings, without an arbitrarily low participant ceiling.
*Priority:* Medium. *Traceability:* Scope.md §2.1.

**NFR-022** — Recording file size shall be accommodated up to a defined maximum consistent with the maximum supported meeting duration (NFR-020); the specific maximum file size is not yet defined.
*Priority:* Medium. *Traceability:* NFR-020 (this document).

**NFR-023** — The system shall support simultaneous processing of multiple meetings' recordings within a single organization's isolated deployment (ADR-002), consistent with realistic enterprise usage where multiple meetings may conclude around the same time.
*Priority:* High. *Traceability:* ADR-002 §4; Scope.md §2.

**NFR-024** — Specific maximum recording duration, maximum participant count, maximum file size, and maximum simultaneous processing capacity are not yet defined and must not be assumed; they are recorded as a new assumption in Section 15, consistent with the previously tracked **AR-022**.
*Priority:* N/A (deferral notice). *Traceability:* AssumptionsRegister.md AR-022.

## 7. Reliability Requirements

**NFR-025** — The system shall recover gracefully from an application crash without loss of a meeting recording already captured, consistent with `FunctionalRequirements.md` FR-027 (a failed processing attempt shall not delete the underlying recording).
*Priority:* Critical. *Traceability:* FunctionalRequirements.md FR-027.

**NFR-026** — Where a capture is interrupted (e.g., application crash during active recording), the system shall preserve the portion of the recording captured up to the point of interruption, to the extent technically feasible.
*Priority:* High. *Traceability:* FunctionalRequirements.md §6 (Recording Capture).

**NFR-027** — Processing failures shall be recoverable without requiring re-capture of the meeting, consistent with `FunctionalRequirements.md` FR-028.
*Priority:* High. *Traceability:* FunctionalRequirements.md FR-028.

**NFR-028** — Data integrity shall be maintained across the transcript lifecycle (`FunctionalRequirements.md` §3.1): no transition, edit, or system failure shall silently corrupt or partially apply a change to transcript content or its revision history.
*Priority:* Critical. *Traceability:* FunctionalRequirements.md §3.1, FR-038 (version history integrity); SecurityRequirements.md SR-043.

**NFR-029** — Error conditions encountered during any workflow (capture, processing, review, approval, export) shall be handled per the error-handling and user-messaging requirements already defined in `FunctionalRequirements.md` §7 (FR-026) and `AIRequirements.md` §6, not through undefined or silent failure.
*Priority:* Critical. *Traceability:* FunctionalRequirements.md FR-026; AIRequirements.md §6.

## 8. Availability Requirements

**NFR-030** — Core functionality (capture, offline transcription, review, approval) shall be available without dependency on external network connectivity, consistent with the Offline First commitment and ADR-001 §4.1.
*Priority:* Critical. *Traceability:* ProjectConstitution.md §3.4; ADR-001 §4.1.

**NFR-031** — Where the organization has enabled the networked AI processing opt-in (ADR-001 §4.2) and connectivity is unavailable, the system shall degrade gracefully to the offline processing path rather than failing entirely, consistent with the Offline First default.
*Priority:* High. *Rationale:* An organization that has opted into a performance/capability enhancement should not lose core functionality when that enhancement's connectivity is temporarily unavailable. *Traceability:* ADR-001 §4.1–§4.2.

**NFR-032** — Specific application uptime targets (e.g., an availability percentage) are most applicable to any centrally-operated component of a deployment (as opposed to the per-organization isolated deployment model in ADR-002, where availability is largely a function of the organization's own infrastructure); this document does not assume a specific uptime figure and defers it to Section 15.
*Priority:* N/A (deferral notice). *Traceability:* ADR-002 §4; Section 15 (this document).

**NFR-033** — Degraded-mode behavior (e.g., read-only access to previously processed content when some subsystem is unavailable) shall be defined such that a user is not left without any access to already-approved records due to a transient failure elsewhere in the system.
*Priority:* High. *Traceability:* ADR-003 §4.1 (organization owns its records regardless of system state).

## 9. Security Quality Requirements

**NFR-034** — The system shall operate securely by default, consistent with every requirement defined in `SecurityRequirements.md`, without this document introducing any operational shortcut that would weaken those requirements for the sake of performance or convenience.
*Priority:* Critical. *Traceability:* SecurityRequirements.md (entire document).

**NFR-035** — Audit logging (per `SecurityRequirements.md` §15) shall be reliable: a logging failure shall not silently drop a required log entry, and the system shall not permit a logged action to proceed if the corresponding audit record cannot be reliably written, consistent with the criticality of SR-041–SR-044.
*Priority:* Critical. *Rationale:* An audit trail that can silently fail undermines the Auditability commitment as much as one that is never implemented. *Traceability:* SecurityRequirements.md SR-041–SR-044.

**NFR-036** — Software updates shall be applied without compromising the security posture established in `SecurityRequirements.md` §18 (Update Security), and shall not silently alter protective defaults (e.g., the offline-by-default AI processing path) without explicit release documentation, per SR-052.
*Priority:* Critical. *Traceability:* SecurityRequirements.md SR-051–SR-052.

**NFR-037** — Specific quantitative security-quality targets (e.g., maximum acceptable audit-log write latency) are not yet defined and are deferred to Section 15.
*Priority:* N/A (deferral notice).

## 10. Scalability Requirements

**NFR-038** — The system shall accommodate organizations ranging from small teams to larger enterprise organizations within a single isolated deployment (ADR-002), without requiring a fundamentally different architecture for different organization sizes.
*Priority:* High. *Traceability:* ADR-002 §4; Stakeholders.md §4.

**NFR-039** — The system shall accommodate growth in the number of users within an organization's deployment over time without requiring a redesign of the role/authorization model defined in ADR-004.
*Priority:* High. *Traceability:* ADR-004 §4.1.

**NFR-040** — The system shall accommodate growth in transcript volume (number of meetings processed and archived over time) without a defined organization-size ceiling that would be reached during ordinary long-term use, consistent with the Longevity commitment.
*Priority:* High. *Traceability:* ProjectConstitution.md §3.9.

**NFR-041** — Archive growth (Archived-state transcripts accumulating over years, per the transcript lifecycle in `FunctionalRequirements.md` §3.1) shall not degrade search or retrieval performance (Section 3, NFR-004) to a degree that undermines the Knowledge Consumer persona's ability to find historical records.
*Priority:* High. *Traceability:* FunctionalRequirements.md §3.1; Personas.md §6.

**NFR-042** — Specific scalability targets (maximum users per organization, maximum transcript volume, maximum archive size before performance degradation) are not yet defined and are deferred to Section 15.
*Priority:* N/A (deferral notice).

## 11. Storage Requirements

**NFR-043** — Storage growth shall be managed in coordination with the retention rules defined in `PrivacyRequirements.md` §15 (Retention Requirements): archived content approaching or exceeding a configured retention limit shall be identifiable for organizational action, not left to grow indefinitely by default.
*Priority:* High. *Traceability:* PrivacyRequirements.md PR-041.

**NFR-044** — The system shall provide the organization visibility into current storage consumption attributable to Project Echo data, to support capacity planning within the organization's own infrastructure (per ADR-002's isolated deployment model).
*Priority:* Medium. *Traceability:* ADR-002 §4.

**NFR-045** — Deletion actions (per `PrivacyRequirements.md` §16) shall result in a corresponding reduction in storage consumption within a defined timeframe, not an indefinite delay between logical deletion and actual storage reclamation.
*Priority:* Medium. *Traceability:* PrivacyRequirements.md §16.

**NFR-046** — Specific storage growth-rate expectations and reclamation timeframes are not yet defined and are deferred to Section 15.
*Priority:* N/A (deferral notice).

## 12. Maintainability Requirements

**NFR-047** — The system shall be accompanied by documentation sufficient for a future maintainer with no prior involvement in its development to understand its behavior, consistent with the Documentation Equals Code commitment.
*Priority:* Critical. *Traceability:* ProjectConstitution.md §3.10.

**NFR-048** — The system shall provide diagnostic information (e.g., logs, status indicators) sufficient to investigate a reported issue without requiring access to organizational meeting content, consistent with the System Administrator role's content-access boundary in ADR-004 §4.5.
*Priority:* High. *Traceability:* ADR-004 §4.5; SecurityRequirements.md SR-018.

**NFR-049** — The system shall be supportable by an adopting organization's IT function using the diagnostic information in NFR-048 and documentation to be defined in `08-Operations/AdministratorGuide.md`.
*Priority:* High. *Traceability:* Stakeholders.md §4 (IT Administrator).

**NFR-050** — Upgrades to the system shall be deliverable consistent with the Update Requirements in Section 11 of this document, without requiring a full reinstallation or data migration that risks data loss, to the extent technically feasible.
*Priority:* High. *Traceability:* Section 11 (this document, NFR-051–NFR-054).

## 13. Update Requirements

**NFR-051** — Software updates shall be securely delivered and verified before application, consistent with `SecurityRequirements.md` SR-051–SR-052.
*Priority:* Critical. *Traceability:* SecurityRequirements.md SR-051–SR-052.

**NFR-052** — An update shall maintain compatibility with existing organizational data (recordings, transcripts, revision history, audit logs) such that previously Approved and Archived records remain accessible and unaltered after an update.
*Priority:* Critical. *Traceability:* ADR-003 §4.2–§4.3 (record integrity); NFR-028 (this document).

**NFR-053** — An update found to introduce a defect affecting the requirements in this document or `SecurityRequirements.md`/`PrivacyRequirements.md` shall be capable of being rolled back to the prior version, consistent with `AIRequirements.md` AI-057's rollback principle generalized to the whole system, not only AI behavior changes.
*Priority:* High. *Traceability:* AIRequirements.md AI-057; SecurityRequirements.md SR-052.

**NFR-054** — Updates shall be deliverable within the constrained enterprise environment described in `00-Governance/ProjectIntent.md` (no administrator rights assumed for end users), consistent with `SecurityRequirements.md` SR-051 and the previously tracked **AR-007**.
*Priority:* High. *Traceability:* SecurityRequirements.md SR-051; AssumptionsRegister.md AR-007.

## 14. Accessibility and Usability Quality

**NFR-055** — The system shall satisfy the accessibility requirements defined in `FunctionalRequirements.md` §18 as a measurable quality attribute, not only a functional checkbox: accessibility shall be verified through defined testing, not assumed from feature presence alone.
*Priority:* Critical. *Traceability:* FunctionalRequirements.md §18; ProjectConstitution.md §3.7.

**NFR-056** — Interface simplicity and clarity (per `FunctionalRequirements.md` FR-096) shall be evaluated against the stated personas in `01-Product/Personas.md`, particularly the assumption that no persona should be treated as technically expert by default (`Personas.md` §7).
*Priority:* Critical. *Traceability:* FunctionalRequirements.md FR-096; Personas.md §7.

**NFR-057** — Beginner-user usability (per `FunctionalRequirements.md` FR-091) shall be validated through usability review involving representative novice-user scenarios before release, not assumed from design intent alone.
*Priority:* High. *Traceability:* FunctionalRequirements.md FR-091.

**NFR-058** — The specific accessibility conformance target and usability testing methodology are not yet defined and remain tracked as the previously recorded **AR-070** and **AR-067**.
*Priority:* N/A (deferral notice). *Traceability:* AssumptionsRegister.md AR-070, AR-067.

## 15. Compliance Quality Requirements

**NFR-059** — The system shall generate the evidence necessary to support an adopting organization's POPIA-aligned compliance posture, consistent with `PrivacyRequirements.md` §4 (POPIA Alignment Principles), as a measurable operational property (evidence exists and is retrievable), not only a stated design intent.
*Priority:* Critical. *Traceability:* PrivacyRequirements.md §4.

**NFR-060** — Auditability (per `SecurityRequirements.md` §15 and `PrivacyRequirements.md` §19) shall be verifiable: an organization's Auditor shall be able to reliably produce a complete audit record for any given time period or data subject upon request, without gaps caused by system operation.
*Priority:* Critical. *Traceability:* SecurityRequirements.md SR-041–SR-044; PrivacyRequirements.md §19.

**NFR-061** — Evidence generation supporting a data-subject request (per `PrivacyRequirements.md` §16 (Data Subject Rights)) shall be timely enough to support the organization's own regulatory response timelines; the specific timeframe is not yet defined and is deferred to Section 15's assumption list, consistent with the previously tracked **AR-064**.
*Priority:* High. *Traceability:* PrivacyRequirements.md §18; AssumptionsRegister.md AR-064.

## 16. Traceability Summary

Every requirement in this document traces to at least one of: `00-Governance/ProjectConstitution.md`, `00-Governance/ProjectPhilosophy.md`, ADR-001–ADR-004, `SecurityRequirements.md`, `PrivacyRequirements.md`, or `FunctionalRequirements.md`/`AIRequirements.md`, per the inline Traceability references above. Consistent with the instruction governing this document, no specific quantitative technical target has been invented; every numeric threshold referenced as needed is instead recorded as a new assumption in Section 17.

## 17. Open Items and New Assumptions

The following items are referenced in this document as deferred to existing assumptions and require no new entry: AR-007 (update delivery mechanism), AR-022 (meeting scope boundaries, now specifically tied to scale limits), AR-042 (offline resource thresholds), AR-064 (data-subject response timeline), AR-067/AR-070 (review completeness/accessibility conformance).

The following new items are introduced by this document and must be added to `00-Governance/AssumptionsRegister.md`:

1. Specific quantitative performance targets (startup time, processing time ratio, search response time, edit latency, export time) are undefined (Section 3, NFR-007).
2. Specific offline AI processing time targets and resource-usage ceilings (CPU/memory/storage) are undefined (Section 4, NFR-012).
3. Specific endpoint CPU/memory/storage/battery-impact numeric thresholds are undefined (Section 5, NFR-019).
4. Specific maximum recording duration, participant count, file size, and simultaneous processing capacity are undefined (Section 6, NFR-024).
5. Specific uptime/availability targets for any centrally-operated component are undefined (Section 8, NFR-032).
6. Specific security-quality quantitative targets (e.g., audit-log write latency) are undefined (Section 9, NFR-037).
7. Specific scalability targets (max users, max transcript volume, max archive size before degradation) are undefined (Section 10, NFR-042).
8. Specific storage growth-rate expectations and deletion-to-reclamation timeframes are undefined (Section 11, NFR-046).

These are consolidated into `AssumptionsRegister.md` as AR-075–AR-082 (see completion summary).

## 18. Relationship to Other PEKB Documents

- This document derives its authority from `00-Governance/ProjectConstitution.md`, `00-Governance/ProjectPhilosophy.md`, ADR-001–ADR-004, `SecurityRequirements.md`, `PrivacyRequirements.md`, `FunctionalRequirements.md`, and `AIRequirements.md`; it does not introduce new governance principles.
- `03-Architecture/` documents (pending) must design to satisfy these quality attributes without contradicting the qualitative requirements stated here; where a specific numeric target is needed for architecture design, it must first be resolved as an assumption (Section 17) and formally adopted, not invented ad hoc during architecture work.
- `09-Testing/TestPlan.md` (pending) must define how each measurable quality attribute in this document is verified.

---

*End of Document — PEKB-02-REQ-005 — Project Echo Non-Functional Requirements — PE-2026.001-ZM*
