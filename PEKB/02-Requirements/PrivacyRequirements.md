# Project Echo — Privacy Requirements

## Document Metadata

| Field | Value |
|---|---|
| Document ID | PEKB-02-REQ-002 |
| Document Title | Privacy Requirements |
| PEKB Section | 02-Requirements |
| Version | 0.1.0 |
| Status | Draft |
| Classification | Internal — Requirements |
| Owner Role | Privacy Officer |
| Approval Required From | Principal Software Architect, Security Architect, Product Manager |
| Related Documents | ProjectConstitution.md, ProjectPhilosophy.md (00-Governance); ADR-001-004 (00-Governance/Decisions); SecurityRequirements.md (02-Requirements); Scope.md, Stakeholders.md (01-Product); AssumptionsRegister.md (00-Governance) |
| Original Creator | Dr Ziyaad Moolla |
| Creator ID | ZM |
| Document Provenance | PE-2026.001-ZM |

---

## 1. Purpose and Scope of This Document

This document defines the privacy requirements Project Echo must satisfy. It states **what** must be true of the system's handling of personal and organizational information, traceable to governance principles, the four ratified Architecture Decision Records (ADR-001–ADR-004), and `SecurityRequirements.md`. It does not design architecture, select technologies or vendors, or specify implementation mechanisms — those belong to `03-Architecture/` and `05-Engineering/`, and to the future `07-Privacy-Compliance/` documents, which this document's requirements constrain but do not replace.

This document uses the requirement identifier format `PR-<###>` (Privacy Requirement), following the `SR-###` precedent established in `SecurityRequirements.md` §2.

## 2. Priority Definitions

Priority levels are as defined in `SecurityRequirements.md` §3 (Critical / High / Medium / Low), reused here without redefinition, per the Single Source of Truth rule in `00-Governance/DocumentStandards.md` §5.

## 3. Privacy Objectives

**PR-001** — Project Echo shall treat meeting content as confidential and personal-information-bearing by default, requiring no user action to obtain the more protective handling.
*Priority:* Critical. *Rationale:* Implements Privacy First's default-safe posture. *Traceability:* ProjectConstitution.md §3.1; ProjectPhilosophy.md §3.1.

**PR-002** — Project Echo shall support organizations in demonstrating POPIA-aligned handling of personal information captured, processed, or derived through meetings, without itself constituting a legal compliance certification.
*Priority:* Critical. *Rationale:* Distinguishes product capability from legal determination, consistent with `00-Governance/Glossary.md` §7 ("POPIA-Aligned"). *Traceability:* ProjectConstitution.md (Privacy Requirements); Glossary.md §7.

**PR-003** — Privacy protections defined in this document shall apply consistently regardless of which AI processing path (offline default or governed networked opt-in) is active under ADR-001.
*Priority:* Critical. *Traceability:* ADR-001 §4.

## 4. POPIA Alignment Principles

**PR-004** — Project Echo shall support the POPIA principle of accountability by ensuring every processing action is attributable to an identifiable human actor and role, reusing the accountability mechanism already required by `SecurityRequirements.md` SR-002 and SR-041–SR-042.
*Priority:* Critical. *Traceability:* SecurityRequirements.md SR-002, SR-041; ADR-004 §4.4.

**PR-005** — Project Echo shall support the POPIA principle of processing limitation by ensuring personal information is processed only for purposes consistent with the in-scope capabilities defined in `01-Product/Scope.md` §2.
*Priority:* Critical. *Traceability:* Scope.md §2; ProjectConstitution.md §3.1.

**PR-006** — Project Echo shall support the POPIA principle of purpose specification by making clear, at the point of configuration, what each in-scope AI capability (transcription, speaker identification, summarization, action item extraction, insights/search) does with personal information.
*Priority:* High. *Rationale:* Implements Transparency alongside POPIA's purpose-specification expectation. *Traceability:* ProjectConstitution.md §3.8.

**PR-007** — Project Echo shall support the POPIA principle of further processing limitation: the optional networked AI processing path (ADR-001 §4.2) shall not be used to process personal information for a purpose beyond what the organization explicitly approved when enabling it.
*Priority:* Critical. *Traceability:* ADR-001 §4.2; SecurityRequirements.md SR-037.

**PR-008** — Project Echo shall support the POPIA principle of information quality by providing the correction mechanisms already required by the Review Workflow (editing, commenting, revision comparison), ensuring personal information within a transcript can be corrected before being treated as an approved record.
*Priority:* High. *Traceability:* ProjectConstitution.md (Review Workflow Requirements); ADR-003 §4.2–§4.3.

**PR-009** — Project Echo shall support the POPIA principle of openness by making available, to the adopting organization, a clear description of what personal information categories are processed and how (per the classification framework in Section 6).
*Priority:* High. *Traceability:* Section 6 (this document).

**PR-010** — Project Echo shall support the POPIA principle of security safeguards by relying on, and not weakening, the protections already required in `SecurityRequirements.md` (encryption, access control, audit logging).
*Priority:* Critical. *Traceability:* SecurityRequirements.md SR-023–SR-025, SR-014–SR-017, SR-041–SR-044.

**PR-011** — Project Echo shall support the POPIA principle of data subject participation by providing the mechanisms defined in Section 16 (Data Subject Rights) of this document.
*Priority:* Critical. *Traceability:* Section 16 (this document).

**Note:** PR-004–PR-011 map Project Echo's product-level support to the eight POPIA conditions for lawful processing at a principle level. Formal legal alignment determination remains the responsibility of `07-Privacy-Compliance/POPIAFramework.md` (pending) and the adopting organization's own compliance function, consistent with ADR-003 §4.10.

## 5. Data Ownership and Responsibility

**PR-012** — Project Echo shall implement the ownership and responsibility model defined in ADR-003: the adopting organization owns all recordings, transcripts, summaries, and AI-generated outputs; Project Echo acts as processor only; individual users act under organization-delegated authority.
*Priority:* Critical. *Traceability:* ADR-003 §4.

**PR-013** — Project Echo shall not claim, assert, or technically enforce any ownership interest in organizational data or its derived outputs, consistent with ADR-003 §4.4.
*Priority:* Critical. *Traceability:* ADR-003 §4.4.

**PR-014** — Project Echo shall provide the technical means for the organization to fulfill its privacy responsibilities (Section 4; ADR-003 §4.5) without itself independently deciding what those responsibilities require in a specific jurisdiction — that determination belongs to the organization and, at PEKB level, to `07-Privacy-Compliance/POPIAFramework.md`.
*Priority:* High. *Traceability:* ADR-003 §4.5–§4.6.

## 6. Data Classification Framework

This section resolves the previously open data classification question tracked as **AR-005** and **AR-028**, and satisfies the requirement in `SecurityRequirements.md` SR-027 that a formal scheme exist before retention and access-control requirements are considered complete.

> **Two-axis model (per ADR-006).** The C1–C4 levels defined below are **Axis 1 (Data Classification — privacy/data-type character)** of Project Echo's two-axis classification model. A second, orthogonal **Axis 2 (Sensitivity Label — business handling sensitivity: Public / Internal / Confidential / Restricted / Highly Restricted)** is established by `00-Governance/Decisions/ADR-006-DataClassificationTwoAxisModel.md` and drives permissions, watermarking, export eligibility, approval, and printing rules through the governance/policy engine. The two axes are independent; every meeting/artifact carries one value on each; where a control is driven by both, the **more restrictive of the two governs**. This section remains the authoritative home for Axis 1 only. Axis 2's per-label handling requirements are authored in `SecurityRequirements.md` (and, for sensitivity-based retention defaults, this document), and are currently **requirements-pending** per ADR-006 §9.

### 6.1 Classification Levels

| Level | Definition | Examples Within Project Echo | Baseline Handling Expectation |
|---|---|---|---|
| **C1 — Organizational Confidential** | Data whose exposure would harm the organization's interests but carries limited direct personal-information sensitivity. | Meeting metadata not containing personal content (e.g., meeting title, date, duration), non-personal action items. | Access controlled per ADR-004; encrypted per `SecurityRequirements.md` SR-023; audited per SR-041. |
| **C2 — Personal Information** | Data that identifies or relates to an identifiable individual, per POPIA's general definition of personal information. | Transcript text containing a participant's statements, participant names/roles in a meeting, comments attributing views to a named individual. | All C1 handling, plus: subject to Data Subject Rights (Section 16), Consent/Notification requirements (Sections 8–9), and Retention limits (Section 13). |
| **C3 — Sensitive Personal Information** | Personal information falling within a heightened-sensitivity category (e.g., information revealing health, biometric data, or other categories POPIA treats as "special personal information"), or third-party-referenced personal information about someone not present to consent. | Persistent, cross-meeting biometric-style speaker identification data (if enabled, per ADR-001/AR-012/AR-026); meeting content referencing a third party's health, disciplinary, or similarly sensitive circumstances. | All C2 handling, plus: disabled by default (opt-in only), subject to heightened approval per Section 10 and Section 11, and prioritized in retention minimization (Section 13). |
| **C4 — Audit and Governance Metadata** | Records of system and human actions, not meeting content itself. | Audit logs, role-assignment records, approval/deletion/export logs. | Protected against modification/deletion per `SecurityRequirements.md` SR-043; retained independently of the content it describes per SR-044. |

### 6.2 Justification for This Structure

1. Four levels are used, rather than a single "confidential" designation, because `SecurityRequirements.md` SR-027 and the Foundation Review both identified that retention, consent, and access-control requirements differ materially between ordinary transcript content (C2) and heightened-sensitivity content such as biometric speaker data or third-party health information (C3) — collapsing these into one level would either over-restrict ordinary content or under-protect sensitive content.
2. C4 (audit/governance metadata) is separated from C1–C3 because its retention and deletion rules are deliberately different — per `SecurityRequirements.md` SR-044, audit records must outlive the content they describe, which would be contradictory if classified the same as the content itself.
3. This structure directly supports the classification-dependent requirements already anticipated in ADR-001 (biometric/hybrid processing sensitivity) and ADR-003 (ownership/responsibility), without inventing categories beyond what those documents already imply.

**PR-015** — Every category of product data defined in `01-Product/Scope.md` §2 shall be assigned one of the classification levels in Section 6.1 before `07-Privacy-Compliance/DataGovernance.md` and `RetentionPolicy.md` are finalized.
*Priority:* Critical. *Traceability:* Section 6.1 (this document); Scope.md §2.

## 7. Personal Information Handling

**PR-016** — Personal information (C2/C3) shall be processed only to the extent necessary for the in-scope capability generating or using it, consistent with data minimization (Section 12).
*Priority:* Critical. *Traceability:* ProjectConstitution.md §3.1; Section 12 (this document).

**PR-017** — Personal information shall not be used to train, fine-tune, or otherwise improve AI models without passing through the governed AI Improvement Loop (human-approved, version-controlled) defined in `00-Governance/ProjectConstitution.md` §5.4.
*Priority:* Critical. *Traceability:* ProjectConstitution.md §5.4; AssumptionsRegister.md AR-008.

**PR-018** — Access to personal information shall be governed by the role and scope model in ADR-004, with no role granted personal-information access beyond its defined boundary.
*Priority:* Critical. *Traceability:* ADR-004 §4.1; SecurityRequirements.md SR-014.

## 8. Meeting Recording Privacy

**PR-019** — A meeting recording shall be classified no lower than C2 (Personal Information) by default, given that it inherently captures participants' voices and statements.
*Priority:* Critical. *Traceability:* Section 6.1 (this document).

**PR-020** — Recording shall not begin without the notification mechanism defined in Section 9 having been satisfied for the meeting in question.
*Priority:* Critical. *Traceability:* Section 9 (this document); ADR-004 §4.1 (Recorder row).

**PR-021** — Access to a raw recording shall follow `SecurityRequirements.md` SR-030 (Recorder's access limited to capture confirmation) and the broader role model in ADR-004.
*Priority:* Critical. *Traceability:* SecurityRequirements.md SR-030.

## 9. Participant Notification Requirements

**PR-022** — Meeting participants shall be notified, before or at the start of a recorded meeting, that the meeting is being recorded and processed by Project Echo, consistent with the openness and purpose-specification principles in Section 4.
*Priority:* Critical. *Traceability:* PR-006, PR-009; ProjectConstitution.md §3.8.

**PR-023** — Notification content shall, at minimum, indicate that a recording and transcript will be produced and reviewed by designated organizational roles (per ADR-004), without requiring participants to understand the platform's internal architecture.
*Priority:* High. *Traceability:* ProjectConstitution.md §3.8 (Transparency); User Experience Principles (governance context).

**PR-024** — The specific mechanism by which notification is delivered and confirmed (e.g., a pre-meeting notice, a recording indicator) is not yet defined and is deferred to `02-Requirements/UXRequirements.md` and future `04-Design/` work.
*Priority:* N/A (deferral notice). *Traceability:* Section 20 (new assumption).

## 10. Consent Requirements

**PR-025** — Where consent is the applicable lawful basis for processing a given meeting's personal information (as determined by the adopting organization, per ADR-003 §4.5's organizational responsibility), Project Echo shall provide the technical means to record that consent status in association with the meeting.
*Priority:* Critical. *Rationale:* Project Echo does not itself determine the applicable lawful basis (this is the organization's responsibility under POPIA-aligned principles), but must support whichever basis the organization determines applies. *Traceability:* ADR-003 §4.5; PR-002.

**PR-026** — Enabling C3 (Sensitive Personal Information) capabilities, including persistent biometric-style speaker identification (per AR-012/AR-026), shall require explicit, organization-level opt-in consistent with `SecurityRequirements.md` SR-040, and shall not be inferred from general meeting-recording consent.
*Priority:* Critical. *Traceability:* SecurityRequirements.md SR-040; Section 6.1 (C3).

**PR-027** — The specific consent-capture mechanism, its granularity (per-meeting vs. per-participant vs. organization-wide default), and withdrawal handling are not yet defined and are deferred to future requirements refinement.
*Priority:* N/A (deferral notice). *Traceability:* AssumptionsRegister.md AR-006.

## 11. Third-Party Information Handling

**PR-028** — Personal information about a third party referenced within meeting content (someone discussed but not present, e.g., a client or candidate named in discussion) shall be classified no lower than C2, and no lower than C3 where it falls within a sensitive category (Section 6.1).
*Priority:* High. *Traceability:* Section 6.1; AssumptionsRegister.md AR-036.

**PR-029** — Project Echo shall not provide a mechanism that treats third-party-referenced information as exempt from the access-control, retention, or data-subject-rights requirements applicable to personal information generally, solely because the third party was not a meeting participant.
*Priority:* High. *Traceability:* PR-028; Section 16 (this document).

**PR-030** — The specific mechanism by which a third party (not a platform user) could exercise a data-subject request regarding information about them referenced in a meeting is not yet defined and is deferred to `07-Privacy-Compliance/DataGovernance.md`.
*Priority:* N/A (deferral notice). *Traceability:* AssumptionsRegister.md AR-036.

## 12. Speaker Identification Privacy

**PR-031** — Per-meeting speaker labeling (distinguishing "Speaker A" from "Speaker B" within a single meeting, without persistent cross-meeting identity linkage) shall be classified as C2 and enabled by default as part of the in-scope Speaker Identification capability.
*Priority:* High. *Traceability:* Scope.md §2.3; Section 6.1 (C2).

**PR-032** — Persistent, cross-meeting biometric-style speaker recognition shall be classified as C3, shall be disabled by default, and shall require the explicit organization-level opt-in defined in PR-026.
*Priority:* Critical. *Traceability:* SecurityRequirements.md SR-040; AssumptionsRegister.md AR-012, AR-026.

**PR-033** — Whether persistent speaker recognition is offered as a capability at all in the initial release, versus deferred entirely, remains an open product decision and is not resolved by this document.
*Priority:* N/A (deferral notice). *Traceability:* AssumptionsRegister.md AR-012, AR-026, AR-035.

## 13. AI Processing Privacy

**PR-034** — The default offline AI processing path (ADR-001 §4.1) shall be the path used for all personal information processing (C2/C3) unless the organization has explicitly enabled the networked opt-in per ADR-001 §4.2.
*Priority:* Critical. *Traceability:* ADR-001 §4.1–§4.2; SecurityRequirements.md SR-036–SR-037.

**PR-035** — Where the networked AI processing opt-in is enabled, the organization shall be informed of the categories of personal information (per Section 6.1) that will be processed via that path, consistent with purpose specification (PR-005) and openness (PR-009).
*Priority:* Critical. *Traceability:* ADR-001 §4.2; PR-005, PR-009.

**PR-036** — AI-generated outputs derived from personal information (summaries, action items, insights) shall inherit the classification level of the source content they were derived from, not a lower default level.
*Priority:* High. *Rationale:* Prevents classification laundering, where a summary of sensitive content is treated as less sensitive than its source. *Traceability:* Section 6.1 (this document).

## 14. Data Minimization

**PR-037** — Project Echo shall not collect or retain personal information beyond what is necessary for the in-scope capabilities in `01-Product/Scope.md` §2.
*Priority:* Critical. *Traceability:* ProjectConstitution.md §3.1; PR-016.

**PR-038** — Where a capability can be satisfied with de-identified or aggregated information (e.g., organization-level usage statistics not tied to specific meeting content), Project Echo shall prefer that form over retaining identifiable personal information.
*Priority:* Medium. *Traceability:* ProjectPhilosophy.md §3.1.

**PR-039** — Specific technical de-identification or aggregation methods are not yet defined and are deferred to `03-Architecture/AIArchitecture.md` and `DatabaseArchitecture.md`.
*Priority:* N/A (deferral notice).

## 15. Retention Requirements

**PR-040** — Retention periods shall be defined per classification level (Section 6.1) and per Review Workflow state, with C4 (audit metadata) retained independently of, and potentially longer than, the C1–C3 content it describes, consistent with `SecurityRequirements.md` SR-044.
*Priority:* Critical. *Traceability:* SecurityRequirements.md SR-044; Section 6.1.

**PR-041** — Retention periods and rules shall be organization-configurable within product-defined minimum and maximum bounds, consistent with the organization-owns-the-data model in ADR-003, but shall not permit indefinite retention as a silent default.
*Priority:* Critical. *Rationale:* Indefinite retention by default is a privacy anti-pattern the product explicitly seeks to avoid, per Foundation Review v0.1. *Traceability:* ADR-003 §4.1–§4.5; Foundation Review v0.1 (Privacy Risks).

**PR-042** — Specific retention period values (minimums, maximums, defaults) for each classification level are not yet defined and are deferred to `07-Privacy-Compliance/RetentionPolicy.md`.
*Priority:* N/A (deferral notice). *Traceability:* Section 20 (new assumption).

## 16. Deletion Requirements

**PR-043** — Deletion authority shall follow ADR-003 §4.8 and ADR-004's role model: deletion is authorized at the organizational level, exercised by roles the organization designates (e.g., Organization Administrator, Meeting Owner within their scope).
*Priority:* Critical. *Traceability:* ADR-003 §4.8; ADR-004 §4.1.

**PR-044** — Deletion of C1–C3 content shall not delete the C4 audit record describing that the deletion occurred, consistent with `SecurityRequirements.md` SR-044.
*Priority:* Critical. *Traceability:* SecurityRequirements.md SR-044; Section 6.1 (C4).

**PR-045** — Where a data subject request (Section 16... see Section 17 below) results in an approved deletion, Project Echo shall provide the technical means to execute that deletion across all classification levels affected, without requiring the organization to manually locate every copy.
*Priority:* High. *Traceability:* ADR-003 §4.8; Section 17 (this document).

**PR-046** — The specific technical deletion mechanism (e.g., how deletion is propagated across primary storage and backups) is not yet defined and is deferred to `03-Architecture/DatabaseArchitecture.md` and `08-Operations/DisasterRecovery.md`.
*Priority:* N/A (deferral notice). *Traceability:* AssumptionsRegister.md AR-056.

## 17. Export Requirements

**PR-047** — Export of C2/C3 personal information across the organizational isolation boundary shall follow the Controlled Export governance in `01-Product/Scope.md` §2.11 and `SecurityRequirements.md` SR-048–SR-050.
*Priority:* Critical. *Traceability:* SecurityRequirements.md SR-048–SR-050.

**PR-048** — Export of C3 (Sensitive Personal Information) shall require an additional, explicit approval step beyond the baseline Controlled Export approval required for C1/C2, consistent with the heightened handling expectation in Section 6.1.
*Priority:* High. *Traceability:* Section 6.1 (C3); SecurityRequirements.md SR-048.

## 18. Data Subject Rights

**PR-049** — Project Echo shall provide the adopting organization with the technical means to locate, within its own isolated deployment, all C1–C3 data associated with a specific identifiable individual, in support of that organization's obligation to respond to data-subject access, correction, or deletion requests.
*Priority:* Critical. *Rationale:* The organization, not Project Echo, is responsible for deciding how to respond to a data-subject request (per ADR-003 §4.10), but Project Echo must make that response technically possible. *Traceability:* ADR-003 §4.10; AssumptionsRegister.md AR-006.

**PR-050** — Correction requests from a data subject regarding their own recorded statements shall be handled through the existing Review Workflow correction mechanisms (editing, commenting) where the transcript has not yet reached Approved status, and through the post-approval re-opening mechanism (`SecurityRequirements.md` SR-035) where it has.
*Priority:* High. *Traceability:* SecurityRequirements.md SR-035; ProjectConstitution.md (Review Workflow Requirements).

**PR-051** — The specific process, timeline, and interface by which a data subject submits a request, and by which the organization responds, are not yet defined and are deferred to `07-Privacy-Compliance/DataGovernance.md`.
*Priority:* N/A (deferral notice). *Traceability:* AssumptionsRegister.md AR-006.

## 19. Privacy Audit Requirements

**PR-052** — Every access to, export of, or deletion of C2/C3 personal information shall be captured in the audit logging already required by `SecurityRequirements.md` Section 15 (SR-041–SR-044), with the classification level of the affected data included in the log entry.
*Priority:* Critical. *Traceability:* SecurityRequirements.md SR-041–SR-042; Section 6.1 (this document).

**PR-053** — The Auditor role (ADR-004 §4.1) shall be able to review privacy-relevant audit records (access, export, deletion, consent status changes) without gaining direct read access to the underlying personal information content itself, consistent with `SecurityRequirements.md` SR-020.
*Priority:* Critical. *Traceability:* ADR-004 §4.1; SecurityRequirements.md SR-020.

**PR-054** — A mechanism shall exist for an organization to periodically review whether its retention, consent, and classification configuration remains consistent with this document's requirements; the specific review cadence and process are deferred to `08-Operations/AdministratorGuide.md`.
*Priority:* Medium. *Traceability:* Section 20 (new assumption).

## 20. Privacy Incident Handling

**PR-055** — A privacy incident (unauthorized access to, or exposure of, C2/C3 personal information) shall be handled through the incident response process required by `SecurityRequirements.md` SR-057–SR-059, with privacy-specific escalation to the organization's designated privacy/compliance function.
*Priority:* Critical. *Traceability:* SecurityRequirements.md SR-057–SR-058.

**PR-056** — Where a privacy incident may trigger a POPIA-aligned notification obligation, Project Echo's incident response support shall provide the organization with sufficient detail (what data, what classification level, how many data subjects potentially affected) to make its own notification determination, consistent with ADR-003 §4.10.
*Priority:* Critical. *Traceability:* ADR-003 §4.10; SecurityRequirements.md SR-058.

**PR-057** — The specific notification templates, timelines, and regulator-facing procedures are not yet defined and are deferred to `06-Security/IncidentResponse.md` and `07-Privacy-Compliance/POPIAFramework.md`.
*Priority:* N/A (deferral notice). *Traceability:* AssumptionsRegister.md AR-055.

## 21. Traceability Summary

Every requirement in this document traces to at least one of: `00-Governance/ProjectConstitution.md`, `00-Governance/ProjectPhilosophy.md`, ADR-001–ADR-004, or `SecurityRequirements.md`, per the inline Traceability references above. Section 6 (Data Classification Framework) resolves AR-005 and AR-028; no requirement in this document asserts an obligation without a governance, ADR, or security-requirements basis — where none existed for a plausible privacy concern, it is recorded as a deferral notice and a new assumption in Section 22 rather than invented.

## 22. Open Items and New Assumptions

The following new items are introduced by this document and must be added to `00-Governance/AssumptionsRegister.md`:

1. Specific participant-notification delivery/confirmation mechanism (PR-024) is undefined.
2. Specific consent-capture mechanism, granularity, and withdrawal handling (PR-027) is undefined.
3. Whether persistent cross-meeting speaker recognition is offered at all in initial release (PR-033) remains undecided.
4. Specific de-identification/aggregation methods (PR-039) are undefined.
5. Specific retention period values per classification level (PR-042) are undefined.
6. Specific technical deletion propagation mechanism (PR-046) is undefined.
7. Specific data-subject-request process, timeline, and interface (PR-051) is undefined.
8. Specific configuration-review cadence/process (PR-054) is undefined.

These are consolidated into `AssumptionsRegister.md` as AR-058–AR-065 (see completion summary).

## 23. Relationship to Other PEKB Documents

- This document derives its authority from `00-Governance/ProjectConstitution.md`, `00-Governance/ProjectPhilosophy.md`, ADR-001–ADR-004, and `SecurityRequirements.md`; it does not introduce new governance principles.
- Section 6 (Data Classification Framework) is now the authoritative source for classification levels referenced by `SecurityRequirements.md`, future `07-Privacy-Compliance/DataGovernance.md`, and `RetentionPolicy.md` — those documents must reference, not redefine, these levels, per `00-Governance/DocumentStandards.md` §5.
- `07-Privacy-Compliance/POPIAFramework.md` (pending) must build on Section 4 (POPIA Alignment Principles) to define formal legal-alignment detail.
- `02-Requirements/FunctionalRequirements.md` and `UXRequirements.md` (pending) must implement the notification, consent, and data-subject-request mechanisms this document requires but does not specify.

---

*End of Document — PEKB-02-REQ-002 — Project Echo Privacy Requirements — PE-2026.001-ZM*
