# Project Echo — System Architecture

## Document Metadata

| Field | Value |
|---|---|
| Document ID | PEKB-03-ARC-003 |
| Document Title | System Architecture |
| PEKB Section | 03-Architecture |
| Version | 0.1.0 |
| Status | Draft |
| Classification | Internal — Architecture |
| Owner Role | Principal Software Architect |
| Approval Required From | Security Architect, AI/ML Architect, Database Architect, DevOps/Deployment Engineer |
| Related Documents | ProjectConstitution.md (00-Governance); ADR-001–ADR-004 (00-Governance/Decisions); all 02-Requirements documents; ThreatModel.md, DeploymentArchitecture.md (03-Architecture); AssumptionsRegister.md (00-Governance) |
| Original Creator | Dr Ziyaad Moolla |
| Creator ID | ZM |
| Document Provenance | PE-2026.001-ZM |

---

## 1. Purpose and Scope of This Document

This document defines the high-level architecture of Project Echo: system components, component responsibilities, relationships, information flows, and architectural boundaries. It does not select a programming language, desktop framework, database technology, AI model implementation, or encryption algorithms — those belong to `DesktopArchitecture.md`, `DatabaseArchitecture.md`, `AIArchitecture.md`, and `SecurityArchitecture.md`, which this document constrains but does not replace.

This document uses the identifier format `SA-<###>` (System Architecture requirement/decision), following the established PEKB precedent. It adopts, without re-deciding, the deployment topology already resolved in `DeploymentArchitecture.md` DA-009 (hybrid local-first desktop client with an organization-controlled shared component) and the isolation boundary defined in DA-005.

## 2. Architecture Principles

**SA-001** — The system architecture shall express, as structural component design, the Foundational Commitments defined in `00-Governance/ProjectConstitution.md` §3: Privacy First, Human Authority, Security by Design, Offline First, Enterprise First, Simplicity, Accessibility, Transparency, and Longevity.
*Priority:* Critical. *Traceability:* ProjectConstitution.md §3.

**SA-002** — The system architecture shall implement ADR-001's offline-first hybrid AI processing model as a structural property of the AI Processing Layer (Section 3.3), not as a configurable afterthought.
*Priority:* Critical. *Traceability:* ADR-001 §4.

**SA-003** — The system architecture shall implement ADR-002's per-organization isolation as a structural property spanning every component, consistent with the isolation boundary already defined in `DeploymentArchitecture.md` DA-005.
*Priority:* Critical. *Traceability:* ADR-002 §4; DeploymentArchitecture.md DA-005.

**SA-004** — The system architecture shall implement ADR-003's organization-owns/platform-processes model by ensuring no component architecturally represents Project Echo (the platform/vendor) as a data controller or owner of any organizational data.
*Priority:* Critical. *Traceability:* ADR-003 §4.

**SA-005** — The system architecture shall implement ADR-004's role and separation-of-duties model as a structural property of the Identity and Access Layer (Section 3.5), enforced consistently regardless of which other component a request originates from.
*Priority:* Critical. *Traceability:* ADR-004 §4.

## 3. System Context

**SA-006** — The system's context includes the following external parties, none of which are architecturally part of Project Echo itself: **Users** (holding one or more of the eight ADR-004 roles), the **adopting organization's own IT/security/compliance functions** (per `01-Product/Stakeholders.md` §4), and, only where explicitly enabled, an **external networked AI processing service** reached solely via the governed ADR-001 §4.2 opt-in.
*Priority:* Critical. *Traceability:* Stakeholders.md §3–§4; ADR-001 §4.2.

**SA-007** — The organization environment (per `DeploymentArchitecture.md` DA-005) is the container within which all Project Echo components for a given organization exist; no component crosses this boundary except through the three governed network paths already enumerated in `DeploymentArchitecture.md` DA-013.
*Priority:* Critical. *Traceability:* DeploymentArchitecture.md DA-005, DA-013.

**SA-008** — Optional external services (the networked AI processing path, and any future approved integration) are context-level participants, not trusted components of the system itself; they are treated in this architecture as external systems the organization has chosen to interact with under governance, not as part of Project Echo's trust boundary.
*Priority:* High. *Traceability:* ADR-001 §4.2; ThreatModel.md §5 (Optional networked AI processing boundary).

## 4. Logical Component Architecture

Eight components are defined at logical level. Each is described by Purpose, Responsibilities, Interfaces, and Trust Level (per `ThreatModel.md` §4–§5's actor/boundary analysis).

### 4.1 Desktop Client

**SA-009**
*Purpose:* The primary interface through which a user (in any ADR-004 role) interacts with Project Echo on a managed end-user device.
*Responsibilities:* Presents role-scoped UI (per `UXRequirements.md`); initiates and confirms local capture; hosts the Local Processing Layer's client-facing surface; performs transcript editing, review, and approval interactions; enforces role/scope restrictions at the presentation layer (defense in depth, not the sole enforcement point — see Section 3.5).
*Interfaces:* To the Local Processing Layer (local, in-process or local-IPC — mechanism deferred); to the Organization Shared Component (network, within the isolation boundary, per DeploymentArchitecture.md Section 5); to the Identity and Access Layer (for authentication/authorization checks).
*Trust Level:* Operates within the isolation boundary; trusted to enforce UI-level role restrictions, but not the sole authority for access decisions (final enforcement belongs to the Identity and Access Layer, consistent with defense-in-depth).
*Traceability:* DeploymentArchitecture.md §5 (Desktop client); FunctionalRequirements.md (entire document, as the primary interaction surface); UXRequirements.md (entire document).

### 4.2 Local Processing Layer

**SA-010**
*Purpose:* Performs capture handling and coordinates offline AI processing on the end-user device.
*Responsibilities:* Validates received recordings (per `FunctionalRequirements.md` FR-024); invokes the offline path of the AI Processing Layer; manages local working storage for in-progress captures/transcripts prior to states requiring shared visibility.
*Interfaces:* To the Desktop Client (local); to the AI Processing Layer (local, offline path); to the Storage Layer (local partition); to the Organization Shared Component (network, once content reaches a state requiring shared visibility, e.g., assignment to a Reviewer not on the same device).
*Trust Level:* Fully within the isolation boundary and the local device trust boundary defined in `ThreatModel.md` §5; no external network dependency for its core function, per ADR-001 §4.1.
*Traceability:* DeploymentArchitecture.md §5 (Local processing engine); ADR-001 §4.1; FunctionalRequirements.md §7.

### 4.3 AI Processing Layer

**SA-011**
*Purpose:* Provides the AI capability catalogue defined in `AIRequirements.md` §4 (transcription, speaker labeling, summarization, key point/decision/action item extraction, search assistance, transcript quality assistance) via two paths: a default offline path and a governed optional networked path.
*Responsibilities:* Produces draft, human-review-pending outputs only (never autonomous final outputs, per `AIRequirements.md` AI-002); marks low-confidence segments (AI-026); never executes a privileged action (AI-048); enforces that the offline path requires no external connectivity (ADR-001 §4.1) and that the networked path activates only under Organization Administrator-configured, audited opt-in (ADR-001 §4.2).
*Interfaces:* To the Local Processing Layer (offline path, local); to the Organization Shared Component (for the networked opt-in path's egress point, and for retrieval of prior context needed for cross-meeting search, subject to authorization); to the external networked AI processing service (only when opted in, crossing the organization boundary per SA-008).
*Trust Level:* The offline path is fully within the local device/isolation boundary. The networked path is a deliberate, governed boundary-crossing exception, not part of the default trust boundary — it is trusted only to the extent the organization has explicitly approved, consistent with `ThreatModel.md` §5.
*Traceability:* ADR-001 (entire document); AIRequirements.md (entire document); ThreatModel.md §7 (TM-007, TM-015–TM-020).

### 4.4 Organization Shared Component

**SA-012**
*Purpose:* Provides the organization-wide services that inherently require a shared view, per `DeploymentArchitecture.md` §4.3: cross-user search over Approved/Archived records, centralized role/policy configuration, audit log aggregation, and long-term archival storage.
*Responsibilities:* Hosts the authoritative copy of Approved/Archived transcripts and their metadata once they reach a state requiring organization-wide visibility; aggregates audit records from the Desktop Client/Local Processing Layer; enforces Organization Administrator-configured role assignments and retention policy; serves search requests (per `FunctionalRequirements.md` §13) subject to the Identity and Access Layer's authorization.
*Interfaces:* To the Desktop Client (network, within the isolation boundary); to the Storage Layer (its own partition, per `DeploymentArchitecture.md` DA-022); to the Identity and Access Layer; to the Audit Layer.
*Trust Level:* Fully within the isolation boundary (`DeploymentArchitecture.md` DA-005); organization-controlled, not Project-Echo-hosted, per DA-007.
*Traceability:* DeploymentArchitecture.md §4.3, §4.4; FunctionalRequirements.md §13, §16.

### 4.5 Storage Layer

**SA-013**
*Purpose:* Persists recordings, transcripts, summaries, action items, comments, and configuration, at both the end-user device (local working storage) and the Organization Shared Component (shared/archival storage).
*Responsibilities:* Applies the classification-appropriate handling defined in `PrivacyRequirements.md` §6.1 to every stored asset; enforces encryption at rest (mechanism deferred to `SecurityArchitecture.md`, per `SecurityRequirements.md` SR-023); maintains revision history immutably (per `SecurityRequirements.md` SR-043, `FunctionalRequirements.md` FR-041).
*Interfaces:* To the Local Processing Layer and Organization Shared Component (read/write, subject to Identity and Access Layer authorization).
*Trust Level:* Storage itself is not a trust decision-maker; it relies on the Identity and Access Layer for authorization and on `SecurityArchitecture.md`'s (not-yet-defined) encryption mechanism for confidentiality at rest.
*Traceability:* PrivacyRequirements.md §6.1; SecurityRequirements.md SR-023, SR-043; ThreatModel.md TM-001, TM-006.

### 4.6 Identity and Access Layer

**SA-014**
*Purpose:* Authenticates users and enforces the ADR-004 role/scope authorization model across every other component.
*Responsibilities:* Verifies user identity (mechanism deferred, per AR-051); evaluates every access request against the requester's assigned role(s) and scope; enforces the mandatory separations of duties defined in `ADR-004-AccessControlRBACModel.md` §4.3 (System Administrator content-access exclusion, Reviewer/Approver separation, Auditor independence) as non-bypassable defaults; supports Organization Administrator-driven role assignment and delegation.
*Interfaces:* Queried by every other component (Desktop Client, Local Processing Layer, AI Processing Layer, Organization Shared Component, Storage Layer) before any action affecting classified data or a consequential workflow transition.
*Trust Level:* The single authoritative point of authorization decision-making in the architecture; every other component defers to it rather than independently implementing access logic, to avoid inconsistent enforcement (a specific risk flagged in `DeploymentArchitecture.md` §11.1).
*Traceability:* ADR-004 (entire document); SecurityRequirements.md §7–9.

### 4.7 Audit Layer

**SA-015**
*Purpose:* Records every consequential action (authentication events, role changes, workflow transitions, approvals, deletions, exports, boundary-crossing configuration changes) as required by `SecurityRequirements.md` §15.
*Responsibilities:* Writes immutable, attributable log entries (per `SecurityRequirements.md` SR-042–SR-043); aggregates entries from both the Desktop Client/Local Processing Layer and the Organization Shared Component; serves Auditor-role queries without exposing underlying meeting content (per ADR-004 §4.1, Auditor row).
*Interfaces:* Written to by every other component; read by users holding the Auditor role via the Identity and Access Layer's authorization.
*Trust Level:* Must remain tamper-resistant even against System Administrator and Organization Administrator access, per `SecurityRequirements.md` SR-043 — the Audit Layer is architecturally independent of the roles it records, not merely policy-independent.
*Traceability:* SecurityRequirements.md §15; ADR-004 §4.1, §4.3.3; ThreatModel.md TM-011.

### 4.8 Update Management

**SA-016**
*Purpose:* Delivers and verifies software updates to the Desktop Client and Organization Shared Component, per `DeploymentArchitecture.md` §7.
*Responsibilities:* Verifies update authenticity/integrity before application (per `DeploymentArchitecture.md` DA-017); supports rollback (DA-018); does not alter protective defaults silently (DA-019).
*Interfaces:* To the Desktop Client and Organization Shared Component; to the update channel (external to the organization boundary, per `DeploymentArchitecture.md` DA-013c).
*Trust Level:* A boundary-crossing component by necessity (software must arrive from outside the organization at some point); its trust is established through the verification mechanism required in DA-017, not through implicit trust of the channel itself.
*Traceability:* DeploymentArchitecture.md §7; ThreatModel.md TM-010.

## 5. Component Interaction Model

**SA-017** — The system shall implement the transcript lifecycle defined in `FunctionalRequirements.md` §3.1 as a cross-component flow:

```
Recording Received (Desktop Client / Local Processing Layer)
       ↓
Processing (Local Processing Layer → AI Processing Layer, offline path by default)
       ↓
Draft Transcript (Storage Layer, local; visible to Desktop Client)
       ↓
Review Required (Desktop Client; may involve Organization Shared Component if Reviewer is a different user/device than Meeting Owner)
       ↓
Reviewed (Desktop Client → Organization Shared Component, once Approver visibility is required)
       ↓
Approved (Organization Shared Component becomes the authoritative copy; Storage Layer locks against in-place edit per SecurityRequirements.md SR-035)
       ↓
Archived (Organization Shared Component, long-term storage per retention configuration)
```

*Priority:* Critical. *Rationale:* This flow directly implements the authoritative state machine already defined in `FunctionalRequirements.md` §3.1, mapped onto the components defined in Section 4 of this document, without redefining the states themselves. *Traceability:* FunctionalRequirements.md §3.1; DeploymentArchitecture.md §5.

**SA-018** — At every transition in SA-017, the Identity and Access Layer shall be consulted to confirm the acting user holds the role/scope required for that transition, per `ADR-004-AccessControlRBACModel.md` §4.1's Roles Permitted mapping already defined in `FunctionalRequirements.md` §3.1.
*Priority:* Critical. *Traceability:* FunctionalRequirements.md §3.1; ADR-004 §4.1.

**SA-019** — At every transition in SA-017, the Audit Layer shall record the transition, consistent with `SecurityRequirements.md` SR-041.
*Priority:* Critical. *Traceability:* SecurityRequirements.md SR-041.

## 6. Data Flow Architecture

**SA-020** — Audio recordings shall flow from the Desktop Client (capture) to the Local Processing Layer (validation, per `FunctionalRequirements.md` FR-024) to the AI Processing Layer (transcription), remaining within the local device trust boundary throughout this flow unless the networked opt-in is active.
*Priority:* Critical. *Traceability:* PrivacyRequirements.md §6.1 (C2/C3 classification of recordings); FunctionalRequirements.md §7–8.

**SA-021** — Transcripts shall flow from the AI Processing Layer (Draft Transcript) through the Desktop Client (review/correction) to the Organization Shared Component (once Reviewed/Approved), with each flow governed by the classification level assigned per `PrivacyRequirements.md` §6.1 and the authorization check in SA-018.
*Priority:* Critical. *Traceability:* PrivacyRequirements.md §6.1; FunctionalRequirements.md §3.1.

**SA-022** — AI outputs (summaries, action items, key points, decisions) shall inherit the classification level of their source transcript as they flow between the AI Processing Layer, Storage Layer, and Organization Shared Component, consistent with `PrivacyRequirements.md` PR-036.
*Priority:* High. *Traceability:* PrivacyRequirements.md PR-036.

**SA-023** — Metadata (meeting title, date, Meeting Owner, role assignments, retention configuration) shall flow primarily through the Organization Shared Component and Identity and Access Layer, classified per `PrivacyRequirements.md` §6.1 (typically C1, unless it embeds personal information, in which case C2).
*Priority:* Medium. *Traceability:* PrivacyRequirements.md §6.1; FunctionalRequirements.md §5.

**SA-024** — Audit records shall flow from every component (Section 4) to the Audit Layer only, classified as C4 per `PrivacyRequirements.md` §6.1, and shall not flow back into any component in a form that would grant content access as a side effect of audit aggregation.
*Priority:* Critical. *Traceability:* PrivacyRequirements.md §6.1 (C4); SecurityRequirements.md SR-020.

## 7. Offline and Networked Operation

**SA-025** — The Local Processing Layer and the offline path of the AI Processing Layer shall function without any dependency on the Organization Shared Component or any external network path being reachable, for the specific actions of capturing, processing, and reviewing/approving content already assigned to the acting user, consistent with `DeploymentArchitecture.md` DA-011.
*Priority:* Critical. *Traceability:* ADR-001 §4.1; DeploymentArchitecture.md DA-003, DA-011.

**SA-026** — The controlled network path connecting the Desktop Client to the Organization Shared Component (used for cross-user visibility, centralized administration, and search) is within the isolation boundary and is not the same boundary-crossing concern as the optional networked AI processing path (SA-011); this document does not treat ordinary Desktop Client ↔ Organization Shared Component traffic as requiring the ADR-001 §4.2 opt-in, since it does not leave the organization's isolation boundary.
*Priority:* High. *Rationale:* Clarifies a potential point of confusion: not every network connection is a "networked AI processing" concern — only the one that crosses the organizational boundary is. *Traceability:* ADR-001 §4.2; DeploymentArchitecture.md DA-005, DA-013.

**SA-027** — The optional networked AI processing path shall activate only following Organization Administrator-level configuration and shall be logged as a boundary-crossing event, consistent with `SecurityRequirements.md` SR-037 and `DeploymentArchitecture.md` DA-014; this document introduces no additional approval mechanism beyond what is already required there.
*Priority:* Critical. *Traceability:* SecurityRequirements.md SR-037; DeploymentArchitecture.md DA-014.

## 8. Security Boundaries

**SA-028** — The system's trust boundaries are exactly those defined in `ThreatModel.md` §5 (local device, organization environment, optional networked AI processing, update channel, storage) and `DeploymentArchitecture.md` §3.1 (the isolation boundary, DA-005); this document does not introduce additional trust boundaries, only maps the logical components (Section 4) onto them.
*Priority:* Critical. *Traceability:* ThreatModel.md §5; DeploymentArchitecture.md §3.1.

**SA-029** — Every threat cataloged in `ThreatModel.md` §7–9 that references a specific component behavior (e.g., TM-004's System Administrator/content-access separation, TM-011's audit tamper-resistance) is addressed by the corresponding component's Responsibilities in Section 4 of this document; no component definition in Section 4 permits a behavior `ThreatModel.md` identifies as a threat.
*Priority:* Critical. *Traceability:* ThreatModel.md §7–9; Section 4 (this document).

**SA-030** — The Identity and Access Layer (SA-014) and Audit Layer (SA-015) are architecturally independent components, not sub-functions of the Organization Shared Component or Desktop Client, specifically so that their integrity (authorization correctness, audit immutability) does not depend on the trust level of the components they govern.
*Priority:* Critical. *Rationale:* Directly addresses `ThreatModel.md` TM-004 and TM-011 architecturally, ensuring the layer that decides "who may do what" and the layer that records "what was done" cannot be compromised merely by compromising the component performing the action. *Traceability:* ThreatModel.md TM-004, TM-011.

## 9. Human Authority Model

**SA-031** — The AI Processing Layer (SA-011) shall be architecturally incapable of transitioning a transcript to Reviewed, Approved, or Archived state; only a human user acting through the Desktop Client, authorized via the Identity and Access Layer, may perform these transitions, consistent with `FunctionalRequirements.md` §3.1's Roles Permitted column.
*Priority:* Critical. *Traceability:* ProjectConstitution.md §3.2; FunctionalRequirements.md §3.1; AIRequirements.md AI-002.

**SA-032** — Every output produced by the AI Processing Layer shall be architecturally tagged as AI-generated/unreviewed until a human review action (via the Desktop Client, authorized via the Identity and Access Layer) changes that status; this tag is a structural data property, not merely a UI presentation choice, so that no downstream component can mistake unreviewed content for approved content.
*Priority:* Critical. *Traceability:* SecurityRequirements.md SR-038; AIRequirements.md AI-021–AI-022.

**SA-033** — The AI Improvement Loop (per `ProjectConstitution.md` §5.4 and `AIRequirements.md` §7, §12) shall be architecturally represented as a process entirely separate from the AI Processing Layer's runtime operation: detection of recurring corrections may occur as an analysis process, but any resulting behavior change reaches the AI Processing Layer only through a version-controlled update (Section 4.8, Update Management), never through a runtime self-modification path.
*Priority:* Critical. *Traceability:* ProjectConstitution.md §5.4; AIRequirements.md AI-003, AI-030–AI-032.

## 10. Scalability Considerations

**SA-034** — The architecture (Sections 4–5) shall accommodate organizations of varying size without requiring a different component structure per size tier, consistent with `NonFunctionalRequirements.md` NFR-038–NFR-039.
*Priority:* High. *Traceability:* NonFunctionalRequirements.md NFR-038–NFR-039.

**SA-035** — The Organization Shared Component's capacity requirements (users, transcript volume, archive growth) are not sized by this document; specific scalability targets remain deferred, consistent with the previously tracked **AR-081**, and this document does not invent numeric thresholds in their absence.
*Priority:* N/A (deferral notice). *Traceability:* AssumptionsRegister.md AR-081.

**SA-036** — The logical separation between Local Processing Layer (per-device) and Organization Shared Component (per-organization) established in Section 4 is intended to allow the two to scale independently — an increase in the number of end-user devices does not, by this architecture's structure, require a proportional redesign of the shared component, and vice versa — but this document does not quantify the specific scaling behavior, which is deferred to `DatabaseArchitecture.md` once AR-081 is resolved.
*Priority:* Medium. *Traceability:* AssumptionsRegister.md AR-081; Section 4 (this document).

## 11. Architectural Risks and Deferred Decisions

### 11.1 Architectural Risks

| Risk | Likelihood | Impact | Notes |
|---|---|---|---|
| Distributing authorization checks (SA-018) across many interaction points (every transcript lifecycle transition) risks inconsistent enforcement if the Identity and Access Layer is not consistently consulted by every component. | Medium | Critical | Directly mitigated by SA-014's design as the single authoritative point of authorization; must be verified during `SecurityArchitecture.md` and implementation, not merely assumed from this document's intent. |
| The Organization Shared Component (SA-012) becomes a natural single point of failure for cross-user functionality (search, centralized administration) within an organization, even though core per-user capture/review/approval remains unaffected (SA-025). | Medium | Medium | Accepted trade-off already identified in `DeploymentArchitecture.md` §11.1; to be addressed operationally in `08-Operations/DisasterRecovery.md`. |
| The AI Processing Layer's two paths (offline default, networked opt-in) could diverge in output quality or behavior in ways not obvious to users, if not made visible per `SecurityRequirements.md` SR-037 and `UXRequirements.md` UX-051. | Medium | Medium | Mitigated by the transparency requirements already established in those documents; this architecture must ensure the component design surfaces which path was used, not merely that it exists. |

### 11.2 Deferred Decisions

- **Specific technology** for each component (Desktop Client framework, Organization Shared Component runtime, Storage Layer database, AI model implementations, encryption algorithms) — deferred to `DesktopArchitecture.md`, `DatabaseArchitecture.md`, `AIArchitecture.md`, and `SecurityArchitecture.md` respectively.
- **Specific authentication mechanism** for the Identity and Access Layer — deferred, per **AR-051**.
- **Specific encryption/key management mechanism** for the Storage Layer — deferred, per **AR-010/AR-052**.
- **Specific scalability targets** — deferred, per **AR-081** (SA-035–SA-036).
- **Specific cross-organization isolation mechanism** for any shared infrastructure underlying the networked AI opt-in — deferred to `AIArchitecture.md`, per **AR-073**.

### 11.3 Assumptions Referenced Without Resolution

This document references, without resolving: AR-010, AR-044 (resolved by `DeploymentArchitecture.md`, adopted here), AR-045 (resolved by `DeploymentArchitecture.md`, adopted here), AR-051, AR-052, AR-073, AR-081. No new assumption is introduced by this document — every open question identified during authoring was already tracked in the Assumptions Register.

## 12. Traceability Summary

Every requirement/decision in this document traces to at least one of: `00-Governance/ProjectConstitution.md`, ADR-001–ADR-004, the seven `02-Requirements/` documents, or `ThreatModel.md`/`DeploymentArchitecture.md`, per the inline Traceability references above. This document selects no programming language, framework, database, AI model implementation, or encryption algorithm, consistent with the instruction governing it.

## 13. Relationship to Other PEKB Documents

- This document adopts, without re-deciding, the deployment topology and isolation boundary already resolved in `DeploymentArchitecture.md`.
- `03-Architecture/SecurityArchitecture.md` (pending) must design the Identity and Access Layer's and Audit Layer's implementation mechanisms consistent with SA-014–SA-015, SA-030.
- `03-Architecture/DatabaseArchitecture.md` (pending) must design the Storage Layer's implementation consistent with SA-013, SA-020–SA-024.
- `03-Architecture/AIArchitecture.md` (pending) must design the AI Processing Layer's implementation consistent with SA-011, SA-031–SA-033, resolving AR-073 and adopting a provisional position on AR-076 if not otherwise resolved.
- `03-Architecture/DesktopArchitecture.md` (pending) must design the Desktop Client and Local Processing Layer's implementation consistent with SA-009–SA-010, SA-025.

---

*End of Document — PEKB-03-ARC-003 — Project Echo System Architecture — PE-2026.001-ZM*
