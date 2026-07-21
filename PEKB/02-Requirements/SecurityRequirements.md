# Project Echo — Security Requirements

## Document Metadata

| Field | Value |
|---|---|
| Document ID | PEKB-02-REQ-001 |
| Document Title | Security Requirements |
| PEKB Section | 02-Requirements |
| Version | 0.2.0 |
| Status | Draft |
| Classification | Internal — Requirements |
| Owner Role | Security Architect |
| Approval Required From | Principal Software Architect, Privacy Officer, Product Manager |
| Related Documents | ProjectConstitution.md, ProjectPhilosophy.md (00-Governance); ADR-001-AIProcessingModel.md, ADR-002-DeploymentModel.md, ADR-003-DataOwnershipGovernance.md, ADR-004-AccessControlRBACModel.md (00-Governance/Decisions); Scope.md, Stakeholders.md (01-Product); AssumptionsRegister.md (00-Governance) |
| Original Creator | Dr Ziyaad Moolla |
| Creator ID | ZM |
| Document Provenance | PE-2026.001-ZM |

---

## 1. Purpose and Scope of This Document

This document defines the security requirements Project Echo must satisfy. It states **what** must be true of the system's security posture, traceable to governance principles and the four ratified Architecture Decision Records (ADR-001–ADR-004). It does not select technologies, vendors, or specific implementation mechanisms — those belong to `03-Architecture/SecurityArchitecture.md` and `05-Engineering/`, to be authored only once these requirements are approved.

Requirements in this document apply within the per-organization isolated deployment boundary established in ADR-002, and assume the offline-first hybrid AI processing model of ADR-001, the organization-owns/platform-processes model of ADR-003, and the role taxonomy of ADR-004.

## 2. Requirement ID Convention

Requirements in this document use the identifier format `SR-<###>` (Security Requirement), assigned sequentially in authoring order. This is the first requirement-numbering convention established in the PEKB and partially resolves the open Requirement ID format question tracked as **AR-021**; it should be treated as the precedent pattern for subsequent `02-Requirements/` documents (e.g., a future `PR-###` for Privacy Requirements, `FR-###` for Functional Requirements) unless a future governance decision generalizes it differently.

Each requirement is stated with a **Priority** (Critical / High / Medium / Low, per Section 3), a **Rationale**, and **Traceability** references.

## 3. Priority Definitions

| Priority | Definition |
|---|---|
| Critical | Failure to meet this requirement creates an unacceptable risk of confidential meeting data exposure, unauthorized access, or loss of human accountability. Must be satisfied before any production release. |
| High | Significant risk if unmet; required for production release absent a documented, approved risk acceptance. |
| Medium | Important for a mature security posture; may be phased in across releases with a documented plan. |
| Low | Improves security posture but does not represent a significant standalone exposure if deferred. |

## 4. Security Objectives

**SR-001** — Project Echo shall ensure that confidential meeting content is never exposed to a party — human or system — that has not been granted access consistent with the role model in ADR-004.
*Priority:* Critical. *Rationale:* Directly implements Privacy First and Security by Design. *Traceability:* ProjectConstitution.md §3.1, §3.3; ADR-004.

**SR-002** — Project Echo shall ensure that no consequential action affecting meeting data (approval, deletion, export, boundary-crossing configuration) occurs without an identifiable, accountable human actor.
*Priority:* Critical. *Rationale:* Implements Human Authority and Auditability. *Traceability:* ProjectConstitution.md §3.2; ADR-003 §4; ADR-004 §4.4.

**SR-003** — Project Echo shall ensure that its default configuration is the most protective configuration (offline processing, isolated deployment, no cross-boundary data flow), with any weaker configuration requiring explicit, organization-level, audited opt-in.
*Priority:* Critical. *Rationale:* Directly implements the "isolated/offline by default, governed exception" pattern established across ADR-001 and ADR-002. *Traceability:* ADR-001 §4; ADR-002 §4.

**SR-004** — Project Echo shall be deployable and operable within the constrained enterprise environment described in governance (no administrator rights required for core use, no mandatory container runtime, no mandatory constant connectivity) without weakening SR-001–SR-003.
*Priority:* High. *Rationale:* Implements Enterprise First without trading away security defaults. *Traceability:* ProjectConstitution.md §3.5; ProjectIntent.md (Target Environment Constraints).

## 5. Threat Landscape

**SR-005** — A formal Threat Model shall be produced (`06-Security/ThreatModel.md`) before `03-Architecture/SecurityArchitecture.md` is finalized, and all security controls in that architecture shall be traceable to a specific identified threat.
*Priority:* Critical. *Rationale:* Security controls asserted without a threat basis cannot be verified as sufficient or as avoiding wasted effort on non-threats. *Traceability:* Foundation Review v0.1 (Security Risks); AssumptionsRegister.md AR-009.

**SR-006** — The threat landscape shall, at minimum, consider: (a) loss or theft of a managed end-user device holding local recordings/transcripts; (b) an insider with legitimate but excessive access (addressed structurally by ADR-004's separation of duties); (c) unauthorized network exfiltration attempts where the optional networked AI path (ADR-001) is enabled; (d) compromise of a System Administrator account (mitigated structurally by ADR-004 §4.5's content-access separation); (e) tampering with audit logs; (f) supply-chain risk in any AI model or component used for local processing.
*Priority:* Critical. *Rationale:* Establishes the minimum threat categories a future Threat Model must not omit, derived directly from risks already identified in ADR-001 through ADR-004 and Foundation Review v0.1. *Traceability:* ADR-001 §7; ADR-002 §7; ADR-004 §7.

**AR reference:** SR-005 and SR-006 do not themselves resolve AR-009 (no Threat Model yet exists); they define what the Threat Model must cover once authored. AR-009 remains **Open**.

## 6. Security Principles

**SR-007** — Project Echo shall apply least privilege as a structural default: every role defined in ADR-004 shall be granted only the permissions defined in its boundary, with no implicit escalation.
*Priority:* Critical. *Traceability:* ADR-004 §4.1, §4.5.

**SR-008** — Project Echo shall enforce the mandatory separations of duties defined in ADR-004 §4.3 as non-bypassable defaults, with any exception requiring explicit, visible, audited configuration.
*Priority:* Critical. *Traceability:* ADR-004 §4.3.

**SR-009** — Security controls shall be designed as intrinsic properties of the system's architecture, not as features added after core functionality is implemented.
*Priority:* High. *Rationale:* Restates Security by Design as an enforceable requirement, not only a principle. *Traceability:* ProjectConstitution.md §3.3.

**SR-010** — Where a security control would be technically feasible only by weakening the Offline First default (ADR-001) or the deployment isolation default (ADR-002), the control shall be redesigned to preserve those defaults rather than trading them away, unless a formal ADR amendment authorizes the trade-off.
*Priority:* High. *Traceability:* ADR-001 §4; ADR-002 §4; RevisionPolicy.md §5.

## 7. Authentication Requirements

**SR-011** — Every individual accessing Project Echo shall be authenticated as a uniquely identifiable person; shared or anonymous accounts shall not be permitted for any role defined in ADR-004.
*Priority:* Critical. *Rationale:* Human accountability (SR-002) is unachievable without unique identity. *Traceability:* ADR-004 §4.4; ProjectConstitution.md §3.2.

**SR-012** — Authentication shall integrate with an adopting organization's existing enterprise identity management practices where such practices exist, consistent with Enterprise First; the specific mechanism (e.g., federated identity, directory integration) is deferred to `03-Architecture/SecurityArchitecture.md`.
*Priority:* High. *Rationale:* Avoids requiring organizations to manage a parallel, disconnected identity system. *Traceability:* ProjectConstitution.md §3.5; ProjectIntent.md.

**SR-013** — Authentication credentials or session material shall not be usable to bypass the role and scope boundaries defined in ADR-004.
*Priority:* Critical. *Traceability:* ADR-004 §4.1.

**AR reference:** The specific authentication mechanism/protocol is an open item, tracked as a new assumption in Section 20.

## 8. Authorization Requirements

**SR-014** — Every access to meeting recordings, transcripts, summaries, comments, or derived AI outputs shall be evaluated against the accessing individual's assigned role and scope, per ADR-004 §4.1.
*Priority:* Critical. *Traceability:* ADR-004 §4.1; SR-001.

**SR-015** — Authorization scope shall support assignment at the level of an individual meeting or transcript, not only organization-wide, consistent with ADR-004 §4.2.3.
*Priority:* Critical. *Traceability:* ADR-004 §4.2; AssumptionsRegister.md AR-048.

**SR-016** — All role assignment, grant, and revocation actions shall originate only from an Organization Administrator (or, for System Administrator assignment, the organization's own IT governance process), consistent with ADR-003's delegated-authority model.
*Priority:* Critical. *Traceability:* ADR-003 §4.7; ADR-004 §4.2.

**SR-017** — Authorization decisions shall default to deny; access is granted only by explicit, logged assignment, never by omission or default openness.
*Priority:* Critical. *Rationale:* Directly implements Privacy First's "safe by default" posture. *Traceability:* ProjectPhilosophy.md §3.1.

## 9. Role Security

**SR-018** — System Administrator role assignment shall not, by itself, grant read access to meeting recordings, transcripts, summaries, or comments, per ADR-004 §4.1 and §4.5.
*Priority:* Critical. *Traceability:* ADR-004 §4.1, §4.5.

**SR-019** — Reviewer and Approver roles shall be enforced as distinct for a given transcript by default; combining them for a specific transcript shall require an explicit, visibly flagged, audited exception, per ADR-004 §4.3.2.
*Priority:* Critical. *Traceability:* ADR-004 §4.3.2.

**SR-020** — Auditor role access shall be limited to audit metadata (who did what, when, under what role/scope) and shall not include meeting content by default, per ADR-004 §4.1.
*Priority:* Critical. *Traceability:* ADR-004 §4.1, §4.4.

**SR-021** — An Auditor shall not concurrently hold System Administrator, Organization Administrator, Meeting Owner, Reviewer, or Approver authority over the same scope they audit, per ADR-004 §4.3.3.
*Priority:* High. *Traceability:* ADR-004 §4.3.3.

**SR-022** — A mechanism shall exist for a System Administrator to obtain content access for a specific, bounded support/investigation purpose, requiring separate grant and generating a distinct audit record; this shall not be the System Administrator role's default state.
*Priority:* High. *Rationale:* Addresses the legitimate support-access need identified in ADR-004 §7 without weakening SR-018. *Traceability:* ADR-004 §4.5, §7; AssumptionsRegister.md AR-049.

## 10. Encryption Requirements

**SR-023** — Meeting recordings, transcripts, summaries, comments, and derived AI outputs shall be encrypted at rest on any device or storage location within the organization's isolated deployment boundary.
*Priority:* Critical. *Rationale:* Directly addresses the lost/stolen managed-device threat identified in SR-006(a). *Traceability:* ADR-002 §4; Foundation Review v0.1 (Security Risks); AssumptionsRegister.md AR-010.

**SR-024** — Any data transmitted across the organizational boundary under a governed exception (ADR-001's networked AI processing opt-in, Controlled Export) shall be encrypted in transit.
*Priority:* Critical. *Traceability:* ADR-001 §4; ADR-002 §4.

**SR-025** — Encryption key management shall ensure that loss or theft of a single end-user device does not, by itself, expose the encryption keys needed to read that device's stored meeting data.
*Priority:* Critical. *Rationale:* Directly mitigates SR-006(a). *Traceability:* AssumptionsRegister.md AR-010.

**AR reference:** SR-023–SR-025 establish the requirement; specific encryption algorithms, key management architecture, and lost-device recovery procedures remain open, tracked as AR-010 (existing) — this document does not resolve AR-010, it scopes what its resolution must satisfy.

## 11. Data Protection Requirements

**SR-026** — Project Echo shall apply data minimization: only data necessary to fulfill an in-scope capability (per `01-Product/Scope.md` §2) shall be collected, processed, or retained.
*Priority:* Critical. *Traceability:* ProjectConstitution.md §3.1; ProjectPhilosophy.md §3.1.

**SR-027** — A formal data classification scheme shall be defined and applied to all categories of product data (recordings, transcripts, summaries, comments, exports, audit logs) before retention and access-control requirements are considered complete.
*Priority:* Critical. *Rationale:* Retention and access-control requirements cannot be meaningfully finalized without knowing what categories of data exist and their relative sensitivity. *Traceability:* Foundation Review v0.1 (Recommendation #3); AssumptionsRegister.md AR-005, AR-028.

**AR reference:** SR-027 does not itself define the classification scheme; AR-005 and AR-028 remain **Open** pending that definition, which this document recommends be completed jointly with `PrivacyRequirements.md`.

**SR-028** — Data belonging to one organization's isolated deployment shall never be accessible, readable, or derivable by another organization, consistent with ADR-002's isolation boundary.
*Priority:* Critical. *Traceability:* ADR-002 §4.

**SR-029** — The technical definition of what constitutes a violation of the organizational isolation boundary (SR-028) shall be established before `03-Architecture/DeploymentArchitecture.md` is finalized.
*Priority:* Critical. *Traceability:* ADR-002 §9; AssumptionsRegister.md AR-045.

## 12. Recording Security

**SR-030** — Meeting recordings shall be accessible, from the moment of capture, only to individuals holding a role and scope (per ADR-004) that includes recording access — the Recorder role's confirmation-of-capture access shall not extend to ongoing playback/download rights beyond what is needed to confirm the capture succeeded.
*Priority:* High. *Traceability:* ADR-004 §4.1 (Recorder row).

**SR-031** — A recording shall be cryptographically or otherwise verifiably associated with its originating meeting and Meeting Owner, such that its provenance within the organization's records is not ambiguous.
*Priority:* Medium. *Rationale:* Supports auditability and prevents recordings from being orphaned or misattributed. *Traceability:* ADR-003 §4.1; ADR-004 §4.4.

**SR-032** — Deletion of a recording shall require authority consistent with ADR-003 §4.8 (organization-held deletion authority) and shall be logged per SR-002.
*Priority:* Critical. *Traceability:* ADR-003 §4.8; ADR-004 §4.4.

## 13. Transcript Security

**SR-033** — Access to a transcript at any Review Workflow state (Draft, Reviewed, Approved, Archived) shall be governed by the role and scope model in ADR-004, and shall not implicitly widen as the transcript progresses through states.
*Priority:* Critical. *Traceability:* ADR-004 §4.1.

**SR-034** — Every edit, comment, and state transition applied to a transcript shall be attributable to a specific, authenticated individual and role, and shall be retained as part of the transcript's revision history.
*Priority:* Critical. *Rationale:* Supports both the Review Workflow's "compare revisions / track changes" product requirement and the Auditability commitment. *Traceability:* ProjectConstitution.md §3.2, §3.8; ADR-004 §4.4.

**SR-035** — A transcript's Approved state shall be protected against silent post-approval modification; any correction after approval shall require an explicit, auditable re-opening of the review workflow, not an in-place edit.
*Priority:* Critical. *Rationale:* Preserves the integrity of the organizational record established by ADR-003's ownership model. *Traceability:* ADR-003 §4.2, §4.3.

## 14. AI Processing Security

**SR-036** — The default (offline) AI processing path defined in ADR-001 §4.1 shall be verifiable as not transmitting meeting content externally during normal operation.
*Priority:* Critical. *Traceability:* ADR-001 §4.1.

**SR-037** — Enabling the optional networked AI processing path (ADR-001 §4.2) shall require Organization Administrator-level configuration, shall be logged as a boundary-crossing configuration change per SR-002, and shall be visibly indicated wherever it is active, consistent with the Transparency commitment.
*Priority:* Critical. *Traceability:* ADR-001 §4.2; ProjectConstitution.md §3.8; ADR-004 §4.2.

**SR-038** — AI-generated outputs (transcripts, summaries, action items, insights) shall be distinguishable from human-confirmed content until reviewed, so that no AI output is mistaken for an approved organizational statement.
*Priority:* Critical. *Rationale:* Directly implements Human Authority — an AI draft must never be indistinguishable from a human-approved record. *Traceability:* ProjectConstitution.md §3.2; ADR-003 §4.3–§4.4.

**SR-039** — Any AI Improvement Loop action (per ProjectConstitution.md §5.4: detecting recurring corrections, suggesting improvements) shall not modify AI behavior without human approval and shall be version-controlled once approved.
*Priority:* Critical. *Traceability:* ProjectConstitution.md §5.4; AssumptionsRegister.md AR-008.

**SR-040** — Where speaker identification involves persistent, cross-meeting biometric-style recognition, this capability shall be subject to explicit organization-level configuration and shall not be enabled by default, pending resolution of the open privacy question in AR-012/AR-026.
*Priority:* High. *Rationale:* Treats the unresolved biometric-sensitivity question conservatively (opt-in, not default) until formally resolved, consistent with SR-003's "protective default" principle. *Traceability:* AssumptionsRegister.md AR-012, AR-026.

## 15. Audit Logging Requirements

**SR-041** — The following actions shall be logged, at minimum: authentication events (success and failure), role assignment/grant/revocation, transcript state transitions, approvals, deletions, exports, boundary-crossing configuration changes (ADR-001, ADR-002), and any separation-of-duties exception (ADR-004 §4.3).
*Priority:* Critical. *Traceability:* ADR-004 §4.4; ProjectConstitution.md §3.8.

**SR-042** — Each audit log entry shall record: the acting individual's identity, their role and scope at time of action, the action taken, the affected data or configuration, and a timestamp.
*Priority:* Critical. *Traceability:* ADR-004 §4.4.

**SR-043** — Audit logs shall be protected against modification or deletion by any role defined in ADR-004, including System Administrator and Organization Administrator, consistent with least privilege.
*Priority:* Critical. *Traceability:* ADR-004 §4.4.

**SR-044** — Audit logs shall be retained according to a defined retention period, to be specified in `07-Privacy-Compliance/RetentionPolicy.md`, and shall not be deleted as a side effect of deleting the meeting content they describe.
*Priority:* High. *Rationale:* An audit trail describing a now-deleted record remains necessary for accountability; deleting content should not erase the record that it was deleted, by whom, and why. *Traceability:* ADR-003 §4.8; ProjectConstitution.md §3.8.

## 16. Access Monitoring

**SR-045** — Repeated failed authentication attempts against a single identity shall be detectable and shall not silently continue indefinitely without triggering a defined organizational response.
*Priority:* High. *Traceability:* SR-005/SR-006 (threat landscape); SR-011.

**SR-046** — Access patterns inconsistent with a user's assigned role and scope (e.g., repeated attempts to access content outside assigned meetings) shall be detectable through the audit log defined in Section 15, to support the Auditor role's oversight function.
*Priority:* Medium. *Traceability:* ADR-004 §4.1 (Auditor row).

**SR-047** — The specific mechanism and thresholds for access-monitoring alerting are not yet defined and are deferred to `03-Architecture/SecurityArchitecture.md` and `06-Security/SecurityControls.md`.
*Priority:* N/A (deferral notice). *Traceability:* Section 20 (new assumption).

## 17. Export Controls

**SR-048** — Any export of meeting data across the organizational isolation boundary (ADR-002) shall require the Controlled Export governance already established in `01-Product/Scope.md` §2.11: explicit organization-level configuration, approval, and audit logging.
*Priority:* Critical. *Traceability:* ADR-002 §4; ADR-003 §4.9; Scope.md §2.11.

**SR-049** — Export authority shall be governed by ADR-003 §4.9 and ADR-004's role model: an individual user may export only to the extent the organization's configuration delegates that authority to them.
*Priority:* Critical. *Traceability:* ADR-003 §4.9; ADR-004 §4.2.

**SR-050** — Every export action shall be logged per Section 15, including what was exported, by whom, under what authority, and to where (in general terms, e.g., "external destination configured by Organization Administrator" — not requiring destination-specific technical detail at requirements level).
*Priority:* Critical. *Traceability:* ADR-003 §4.9; SR-041.

## 18. Update Security

**SR-051** — Software updates shall be deliverable within the constrained enterprise environment described in governance (no administrator rights assumed for end users), consistent with Enterprise First.
*Priority:* High. *Traceability:* ProjectIntent.md (Target Environment Constraints); AssumptionsRegister.md AR-007.

**SR-052** — Updates shall not silently alter security-relevant defaults established in this document (e.g., SR-003's protective defaults) without explicit release documentation of the change and, where the change is substantive, a corresponding governance review.
*Priority:* High. *Traceability:* RevisionPolicy.md §5; SR-003.

**SR-053** — The specific update delivery mechanism (e.g., IT-managed enterprise software distribution) remains undefined and is deferred to `03-Architecture/DeploymentArchitecture.md`; this requirement establishes only that the mechanism must satisfy SR-051–SR-052.
*Priority:* N/A (deferral notice). *Traceability:* AssumptionsRegister.md AR-007.

## 19. Vulnerability Management

**SR-054** — A process shall exist for identifying, assessing, and remediating security vulnerabilities in Project Echo's own codebase and any incorporated components, appropriate to the organization's isolated deployment model (ADR-002).
*Priority:* High. *Traceability:* ProjectConstitution.md §3.3; ADR-002.

**SR-055** — Vulnerabilities assessed as Critical or High severity affecting confidentiality of meeting data shall be remediated or mitigated on a timeline defined in `05-Engineering/Operations.md` (pending), consistent with the criticality of the data Project Echo processes.
*Priority:* High. *Traceability:* SR-001; SR-005.

**SR-056** — The specific vulnerability management process, tooling, and disclosure handling are not yet defined and are deferred to `05-Engineering/Operations.md` and `06-Security/SecurityControls.md`.
*Priority:* N/A (deferral notice). *Traceability:* Section 20 (new assumption).

## 20. Incident Response Expectations

**SR-057** — A defined incident response process shall exist, covering at minimum: detection, containment, organizational notification, and post-incident review, for incidents involving confidentiality, integrity, or availability of meeting data.
*Priority:* Critical. *Traceability:* ProjectConstitution.md §3.3, §3.8; `06-Security/IncidentResponse.md` (pending).

**SR-058** — Where an incident may involve exposure of personal information within meeting content, the incident response process shall support the adopting organization's ability to meet its own POPIA-aligned notification obligations, consistent with ADR-003 §4.10's organization-as-responsible-party framing.
*Priority:* Critical. *Traceability:* ADR-003 §4.10; AssumptionsRegister.md AR-006.

**SR-059** — The specific incident response procedure, escalation paths, and notification templates are not yet defined and are deferred to `06-Security/IncidentResponse.md`.
*Priority:* N/A (deferral notice).

## 21. Backup and Recovery Security

**SR-060** — Any backup of meeting data shall be subject to the same encryption (SR-023–SR-025), access control (Section 9), and organizational isolation (SR-028) requirements as the primary data it backs up.
*Priority:* Critical. *Traceability:* ADR-002 §4; SR-023, SR-028.

**SR-061** — Recovery procedures shall not provide a path that bypasses the role/authorization model in ADR-004 (e.g., a "recovery mode" must not grant unscoped access without the same authorization checks as normal operation).
*Priority:* Critical. *Traceability:* ADR-004 §4.1; SR-007.

**SR-062** — Specific backup frequency, retention, and disaster-recovery procedures are not yet defined and are deferred to `08-Operations/DisasterRecovery.md`.
*Priority:* N/A (deferral notice).

## 22. Secure Development Requirements

**SR-063** — Engineering work on Project Echo shall follow the workflow defined in `00-Governance/EngineeringPrinciples.md` §2, including identification of applicable security requirements before implementation begins.
*Priority:* Critical. *Traceability:* EngineeringPrinciples.md §2, §5.

**SR-064** — Changes affecting any Critical-priority requirement in this document shall require Security Architect review before merge/release, consistent with the multidisciplinary review requirement in `00-Governance/EngineeringPrinciples.md` §5.
*Priority:* Critical. *Traceability:* EngineeringPrinciples.md §5.

**SR-065** — Specific secure coding standards, static/dynamic analysis tooling, and code review gating mechanics are not yet defined and are deferred to `05-Engineering/CodingStandards.md` and `05-Engineering/TestingStrategy.md`.
*Priority:* N/A (deferral notice).

## 22A. Sensitivity-Label Handling (Axis 2 — realizing ADR-006)

This section defines the handling controls driven by the **Axis-2 Sensitivity Labels** established in `00-Governance/Decisions/ADR-006-DataClassificationTwoAxisModel.md` (Public, Internal, Confidential, Restricted, Highly Restricted). It is the "Axis-2 handling matrix" that ADR-006 §6 and `GovernanceEngineRequirements.md` GE-008 mark as pending. Axis 1 (C1–C4) remains governed by `PrivacyRequirements.md` §6.

**SR-066** — Every meeting and derived artifact shall carry exactly one Axis-2 Sensitivity Label as explicit, inspectable state, assigned by the Meeting Owner (optionally defaulted by meeting template) and constrained by organization policy; the label shall never be inferred from Axis-1 classification or vice versa.
*Priority:* High. *Traceability:* ADR-006 §4.2–§4.3; DesignPrinciples.md §3.12.

**SR-067** — Each Sensitivity Label shall drive a defined handling profile covering, at minimum: who may view/edit/export/print, whether watermarking is applied, whether external sharing is permitted, and what approval is required to release. Higher labels shall impose progressively more restrictive handling; the specific per-label control values are configured through the Governance & Policy Engine (`GovernanceEngineRequirements.md`) within the bounds of this section.
*Priority:* High. *Traceability:* ADR-006 §4.1; briefing V12/V16; GE-008.

**SR-068** — Where a single control is driven by both a record's Axis-1 classification and its Axis-2 label, the system shall apply the **more restrictive** of the two requirements; an Axis-2 label shall never relax a control required by the Axis-1 classification, and Axis-1 shall never relax a control required by the Axis-2 label.
*Priority:* Critical. *Traceability:* ADR-006 §4.4.

**SR-069** — A change to a record's Sensitivity Label shall be an authorized, audited action, and shall never lower the effective handling below what the record's Axis-1 classification independently requires.
*Priority:* High. *Traceability:* ADR-006 §4.4; SR-041–SR-043 (audit).

## 22B. Custom-Role Validation (realizing ADR-008)

This section defines the enforcement of the constrained custom-role capability established in `00-Governance/Decisions/ADR-008-ConstrainedCustomRoles.md`, referenced by `GovernanceEngineRequirements.md` GE-010.

**SR-070** — A custom role's permission set shall be admitted only if it is a subset of the union of the baseline-role permissions it composes; the system shall reject any custom role that would grant a capability no baseline role holds.
*Priority:* Critical. *Traceability:* ADR-008 §4.2.

**SR-071** — The system shall validate every custom-role definition at definition time against the mandatory separations of duties (ADR-004 §4.3) and the two-axis classification limits (ADR-006), and shall reject — fail-restrictively, with a plain-language explanation of the failed constraint — any definition that would violate them or that would grant content access to an infrastructure-only or audit-only composition.
*Priority:* Critical. *Traceability:* ADR-008 §4.3–§4.4; ADR-004 §4.3, §4.5; DesignPrinciples.md §3.9.

**SR-072** — Custom-role definition, modification, assignment, and deletion shall be Organization Administrator authorities, isolated per deployment, and each shall be a logged, attributable action; the custom-role validator is safety-critical and shall not be disabled by configuration, feature flag, or extension.
*Priority:* Critical. *Traceability:* ADR-008 §4.5; ADR-004 §4.2, §4.4; EthicalAICharter.md §6.2 (safety-critical discipline).

## 22C. Elevated and Emergency Access (extending ADR-004)

This section defines the elevated-access mechanisms referenced by `EvidenceComplianceRequirements.md` EV-010 and the briefing (V16): break-glass emergency access, approval delegation, and time-bound exceptions. All extend, and none weakens, the ADR-004 model.

**SR-073** — The system shall support a controlled **break-glass emergency access** mechanism requiring: explicit justification, a multi-step confirmation, enhanced audit logging, automatic notification to designated administrators, temporary duration, and automatic expiration. Emergency access shall never become standing access.
*Priority:* Critical. *Traceability:* ADR-004 §4.5; briefing V16.

**SR-074** — The system shall support **approval/authority delegation** (e.g., during leave) that is explicitly time-bounded, automatically expires, and is fully audited, and that cannot delegate an authority the delegator does not hold or that would breach a mandatory separation of duties.
*Priority:* High. *Traceability:* ADR-004 §4.2–§4.3; briefing V16.

**SR-075** — The system shall support time-bound **access exceptions** (e.g., a temporary export permission) that automatically expire and are logged; no exception mechanism shall produce a permanent privilege escalation, and every exception shall be visibly distinct from standing authority while active.
*Priority:* High. *Traceability:* ADR-004 §4.3; briefing V16; DesignPrinciples.md §3.9.

## 22D. Records Disposal Authority (realizing ADR-007)

This section defines the authorization around governed disposal introduced by `00-Governance/Decisions/ADR-007-TranscriptRecordLifecycle.md`, referenced by `EvidenceComplianceRequirements.md` EV-002 and the lifecycle's Disposed state.

**SR-076** — Executing the Disposed transition on a record shall require explicit authorization subject to separation of duties (the authorizer of a disposal shall be distinguishable from, and where policy requires separate from, the role that requested it); every disposal shall record who authorized it, what was disposed, when, why, the governing retention policy, and an audit reference.
*Priority:* Critical. *Traceability:* ADR-007 §4.1; PrivacyRequirements.md PR-044; SR-041–SR-043.

**SR-077** — Disposal shall be blocked while a Legal Hold is in effect (per ADR-007 §4.4), shall produce a disposal certificate, and shall retain the C4 audit record and certificate after the C1–C3 content is destroyed; secure destruction shall be documented as governed best-effort per storage medium/OS, never claimed as cryptographic erasure.
*Priority:* Critical. *Traceability:* ADR-007 §4.1, §4.4; PrivacyRequirements.md PR-044; EvidenceComplianceRequirements.md EV-002.

## 23. Traceability Summary

Every requirement in this document traces to at least one of: `00-Governance/ProjectConstitution.md`, `00-Governance/ProjectPhilosophy.md`, ADR-001, ADR-002, ADR-003, ADR-004, and (for the v0.2.0 additions in §22A–§22D) ADR-005, ADR-006, ADR-007, and ADR-008, per the inline Traceability references above. No requirement in this document introduces an obligation without a governance or ADR basis; where no such basis existed for a plausible security concern, it has been recorded as an assumption in Section 24 rather than asserted as a requirement.

## 24. Open Items and New Assumptions

The following new items are introduced by this document and must be added to `00-Governance/AssumptionsRegister.md`:

1. Specific authentication mechanism/protocol (SR-012, SR-013) is undefined.
2. Specific encryption algorithms, key management architecture, and lost-device key recovery procedure (SR-023–SR-025) remain undefined — this document scopes the requirement (AR-010) but does not resolve it.
3. Specific access-monitoring mechanism and alert thresholds (SR-047) are undefined.
4. Specific vulnerability management process and tooling (SR-056) are undefined.
5. Specific incident response procedure and escalation paths (SR-059) are undefined.
6. Specific backup/disaster-recovery procedures (SR-062) are undefined.
7. Specific secure development tooling/gating mechanics (SR-065) are undefined.

These are consolidated into `AssumptionsRegister.md` as AR-051–AR-057 (see completion summary).

## 25. Relationship to Other PEKB Documents

- This document derives its authority from `00-Governance/ProjectConstitution.md`, `00-Governance/ProjectPhilosophy.md`, and ADR-001–ADR-004; it does not introduce new governance principles.
- `02-Requirements/PrivacyRequirements.md` (pending) must be authored jointly with, or immediately following, this document, since SR-027 (data classification) is a shared prerequisite.
- `03-Architecture/SecurityArchitecture.md` (pending) must implement the mechanisms this document requires without contradicting ADR-001–ADR-004.
- `06-Security/ThreatModel.md`, `06-Security/SecurityControls.md`, and `06-Security/IncidentResponse.md` (pending) elaborate Sections 5, 16, 19, and 20 respectively.
- The v0.2.0 additions (§22A–§22D) provide the security enforcement the new-module requirement documents depend on: `GovernanceEngineRequirements.md` (GE-008/GE-010), `EvidenceComplianceRequirements.md` (EV-002/EV-010), `RedactionSecureSharingRequirements.md`, and the ADR-006/007/008 amendments.

## 26. Revision History

| Version | Date | Summary | Author |
|---|---|---|---|
| 0.1.0 | 2026 (initial) | Initial Security Requirements SR-001–SR-065 across authentication, authorization, role security, encryption, data protection, recording/transcript/AI security, audit, monitoring, export, update, vulnerability, incident response, backup, and secure development. | Dr Ziyaad Moolla (ZM) |
| 0.2.0 | 2026-07-20 | Added §22A Sensitivity-Label Handling (SR-066–SR-069, the Axis-2 handling matrix realizing ADR-006 with the more-restrictive-governs rule); §22B Custom-Role Validation (SR-070–SR-072, realizing ADR-008); §22C Elevated and Emergency Access (SR-073–SR-075: break-glass, delegation, time-bound exceptions extending ADR-004); §22D Records Disposal Authority (SR-076–SR-077, realizing ADR-007 with separation of duties, Legal Hold blocking, disposal certificate, and honest best-effort framing). Updated traceability to include ADR-005–ADR-008. These fill the security dependencies referenced by the new-module requirement documents. | Dr Ziyaad Moolla (ZM) |

---

*End of Document — PEKB-02-REQ-001 — Project Echo Security Requirements — PE-2026.001-ZM*
