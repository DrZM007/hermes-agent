# Project Echo — Deployment Architecture

## Document Metadata

| Field | Value |
|---|---|
| Document ID | PEKB-03-ARC-002 |
| Document Title | Deployment Architecture |
| PEKB Section | 03-Architecture |
| Version | 0.1.0 |
| Status | Draft |
| Classification | Internal — Architecture |
| Owner Role | Principal Software Architect |
| Approval Required From | Security Architect, DevOps/Deployment Engineer, Privacy Officer |
| Related Documents | ADR-001–ADR-004 (00-Governance/Decisions); SecurityRequirements.md, PrivacyRequirements.md, NonFunctionalRequirements.md (02-Requirements); ThreatModel.md (03-Architecture); AssumptionsRegister.md (00-Governance) |
| Original Creator | Dr Ziyaad Moolla |
| Creator ID | ZM |
| Document Provenance | PE-2026.001-ZM |

---

## 1. Purpose and Scope of This Document

This document defines how Project Echo is deployed, operated, updated, and isolated within organizational environments: deployment topology, organizational isolation, update strategy, network boundaries, and operational placement. It does not choose programming languages, UI frameworks, databases, cloud vendors, or encryption algorithms — those belong to `DesktopArchitecture.md`, `DatabaseArchitecture.md`, `SecurityArchitecture.md`, and `05-Engineering/`, which this document constrains but does not replace.

This document uses the identifier format `DA-<###>` (Deployment Architecture requirement/decision), following the established PEKB precedent. This document resolves the previously deferred **AR-044** (deployment topology) and **AR-045** (isolation boundary technical definition), as anticipated by ADR-002 §4.4 and the `RequirementsBaselineReview.md` §7 architecture sequence.

## 2. Deployment Principles

**DA-001** — The deployment architecture shall treat privacy as the default outcome of deployment structure, not a policy layered on top of it: no deployment pattern considered in this document may require data to leave the organization's environment as a precondition of ordinary operation.
*Priority:* Critical. *Rationale:* Directly implements Privacy First and ADR-002's isolation default. *Traceability:* ProjectConstitution.md §3.1; ADR-002 §4.

**DA-002** — The deployment architecture shall enforce organizational isolation as a structural property: no deployment pattern shall place two organizations' data within a shared, undifferentiated storage or processing context by default.
*Priority:* Critical. *Traceability:* ADR-002 §4.

**DA-003** — The deployment architecture shall treat offline operation as the default mode for all core functionality (capture, transcription, review, approval), consistent with ADR-001 §4.1; connectivity shall be additive, not required.
*Priority:* Critical. *Traceability:* ADR-001 §4.1.

**DA-004** — Any network connectivity used by the deployment shall be controlled and purposeful: a deployment pattern that establishes open-ended or unnecessary network dependencies (e.g., a permanently required connection for functionality not related to the governed networked AI opt-in or organization-approved export) shall not be adopted.
*Priority:* High. *Traceability:* ADR-001 §4.2; SecurityRequirements.md SR-003.

## 3. Deployment Model (Resolving ADR-002)

### 3.1 What "Per-Organization Isolated Deployment" Means Technically

ADR-002 established that each organization's deployment is isolated by default but deliberately left the technical topology to this document (ADR-002 §9). This document defines the isolation boundary as follows:

**DA-005 (resolves AR-045)** — The organizational isolation boundary shall be defined as: *all infrastructure — end-user devices and any organization-operated shared component — that is provisioned, controlled, and administered exclusively by a single adopting organization, together with the network perimeter surrounding that infrastructure.* A boundary violation is any flow of C1–C4 classified data (per `PrivacyRequirements.md` §6.1) across this perimeter that has not passed through one of the explicitly governed exception mechanisms already established: Controlled Export (`SecurityRequirements.md` §17), the ADR-001 §4.2 networked AI processing opt-in, or a future-approved integration.
*Priority:* Critical. *Traceability:* ADR-002 §4, §9; AssumptionsRegister.md AR-045.

**DA-006** — No component of Project Echo — whether running on an end-user device or an organization-operated shared component — shall be reachable by, or share a data store with, any component belonging to a different organization's deployment.
*Priority:* Critical. *Traceability:* DA-005 (this document); ADR-002 §4.

### 3.2 Ownership and Organizational Responsibility

**DA-007** — All infrastructure within the isolation boundary (Section 3.1) is provisioned and controlled by the adopting organization, not by Project Echo as a vendor; this is a direct architectural expression of ADR-003's organization-owns/platform-processes model — Project Echo software runs within infrastructure the organization controls, rather than the organization's data running within infrastructure Project Echo controls.
*Priority:* Critical. *Traceability:* ADR-003 §4.1, §4.5; ADR-002 §4.

**DA-008** — The organization is responsible for provisioning, securing (at the infrastructure level), and maintaining the infrastructure within its isolation boundary; Project Echo's software is responsible for enforcing the access-control, encryption, and audit behaviors required by `SecurityRequirements.md` and `PrivacyRequirements.md` within that infrastructure.
*Priority:* High. *Traceability:* ADR-003 §4.5–§4.6; SecurityRequirements.md (entire document).

## 4. Deployment Topology Options

Three candidate topology patterns were evaluated against the constraints in Section 1 of this document's governing instructions (managed Windows environments, no administrator rights for normal users, no Docker dependency, restricted enterprise networks, offline-first operation, per-organization isolation) and against the functional need — established in `FunctionalRequirements.md` §13 — for a Knowledge Consumer to search across Approved/Archived records they did not personally create.

### 4.1 Option A — Fully Local Workstation Deployment (No Shared Component)

Every user's endpoint operates entirely independently: capture, processing, storage, and review all occur locally per device, with no organization-wide shared component.

- **Pros:** Simplest possible topology; maximizes offline operation; no server-side infrastructure for the organization to provision.
- **Cons:** Cannot satisfy `FunctionalRequirements.md` FR-042 (search across records visible to a Knowledge Consumer who did not personally capture them) or FR-010 (Organization Administrator managing role assignments centrally) without an ad hoc, unreliable file-sharing mechanism outside Project Echo's control — this would undermine the access-control and audit guarantees required by `SecurityRequirements.md` §8–9, §15. Rejected as insufficient for the approved functional scope.

### 4.2 Option B — Organization-Managed Central Server Deployment (Server-First)

All meeting data, processing, and review occur on an organization-operated central server; end-user devices act only as thin clients with no local processing or storage.

- **Pros:** Centralizes access control, audit, and search naturally; simplifies enforcement of DA-005/DA-006.
- **Cons:** Directly contradicts ADR-001's offline-first default (DA-003) — a thin client with no local processing has no offline capability at all, since every capture/review action would depend on server reachability. Rejected as incompatible with ADR-001.

### 4.3 Option C — Hybrid: Local-First Desktop Client with an Organization-Controlled Shared Component

Each end-user device runs a full desktop client capable of independent offline capture, transcription, and review (satisfying ADR-001 and the Recorder/Reviewer/Approver workflows locally). An organization-operated shared component — provisioned and controlled by the adopting organization within its own isolation boundary, not by Project Echo as a vendor — provides the services that inherently require a shared, organization-wide view: cross-user search over Approved/Archived records, centralized role/policy configuration (Organization Administrator functions), audit log aggregation, and long-term archival storage.

- **Pros:** Preserves ADR-001's offline-first default for the core capture/review/approval workflow (DA-003), since these do not depend on the shared component's availability for an individual user's own assigned work; satisfies the cross-user search and centralized administration requirements that Option A cannot; keeps the shared component within the organization's own isolation boundary (DA-005), not a Project-Echo-hosted service, consistent with ADR-002 and ADR-003.
- **Cons:** Introduces more architectural surface than Option A (two component types instead of one); requires the organization to provision and maintain a shared component, which has some operational cost — though this is the same cost any enterprise software with multi-user administration and search would carry, not a cost specific to Project Echo's design choices.

### 4.4 Decision

**DA-009 (resolves AR-044) — Project Echo adopts Option C: a hybrid local-first desktop client with an organization-controlled shared component**, both situated within the single isolation boundary defined in DA-005.
*Priority:* Critical. *Rationale:* Option A cannot satisfy already-approved functional requirements (cross-user search, centralized administration) without an ungoverned workaround; Option B contradicts the already-ratified ADR-001 offline-first default. Option C is the only pattern consistent with both ADR-001 (offline-first) and the functional requirements already approved in `FunctionalRequirements.md`. *Traceability:* ADR-001 §4.1; ADR-002 §4, §9; FunctionalRequirements.md FR-010, FR-042; AssumptionsRegister.md AR-044.

**DA-010** — The specific technology used to implement the organization-controlled shared component (e.g., a particular server runtime, containerization approach, or managed service type) is not decided by this document and is deferred to `03-Architecture/SystemArchitecture.md` and `05-Engineering/`; this document establishes only that such a component exists, is organization-controlled, and is not a Project-Echo-hosted multi-tenant service.
*Priority:* N/A (scope boundary). *Traceability:* DA-009 (this document).

## 5. Component Placement

The following components are placed conceptually, without selecting implementing technology:

| Component | Conceptual Placement | Rationale |
|---|---|---|
| Desktop client | End-user managed device (per organization) | Must operate offline per ADR-001; must not require administrator rights per governing constraints. |
| Local processing engine (offline AI path) | End-user managed device | ADR-001 §4.1 requires the default path to require no external connectivity; co-locating processing with capture satisfies this directly. |
| Local cache/working storage | End-user managed device | Supports in-progress capture/review before a transcript reaches a state requiring shared visibility (e.g., before Approved). |
| Organization-controlled shared component | Organization-operated infrastructure, within the isolation boundary (DA-005) | Required for cross-user search, centralized RBAC configuration, and audit aggregation (Section 4.3). |
| Long-term archival storage | Organization-controlled shared component (or organization-designated archival infrastructure within the same boundary) | Archived-state records (per `FunctionalRequirements.md` §3.1) benefit from centralized retention/deletion enforcement rather than per-device management. |
| Optional networked AI processing path | Outside the isolation boundary, reached only via the governed ADR-001 §4.2 opt-in | By definition a boundary-crossing exception, not a default-placed component. |
| Update mechanism | Delivered to the desktop client and shared component via a channel the organization controls or approves (Section 6) | Must operate without requiring end-user administrator rights, per governing constraints. |

**DA-011** — No component listed as "End-user managed device" in this table shall depend on the organization-controlled shared component being reachable in order to perform capture, offline transcription, or the individual review/approval actions of a user acting on content already assigned to them.
*Priority:* Critical. *Traceability:* ADR-001 §4.1; DA-003 (this document).

## 6. Network Architecture

**DA-012** — The default network mode for the desktop client shall be offline: no outbound network connection is required for capture, offline transcription, local review, or local approval actions, consistent with ADR-001 §4.1.
*Priority:* Critical. *Traceability:* ADR-001 §4.1.

**DA-013** — Permitted network paths, when connectivity is available or required for a specific function, are limited to: (a) communication between the desktop client and the organization-controlled shared component (Section 4.3), entirely within the isolation boundary; (b) the optional networked AI processing path, only when the organization has enabled the ADR-001 §4.2 opt-in; (c) the update channel (Section 7); and (d) any organization-approved Controlled Export destination.
*Priority:* Critical. *Traceability:* ADR-001 §4.2; SecurityRequirements.md §17.

**DA-014** — The optional networked AI processing path (DA-013b) shall require the same Organization Administrator-level configuration and audit logging already mandated by `SecurityRequirements.md` SR-037 and `AIRequirements.md` AI-036; this document does not introduce a separate approval mechanism for it.
*Priority:* Critical. *Traceability:* SecurityRequirements.md SR-037; AIRequirements.md AI-036.

**DA-015** — No network path other than those enumerated in DA-013 shall exist by default; any additional path (e.g., a future third-party integration) requires a formal amendment to this document, consistent with `00-Governance/RevisionPolicy.md` §5.
*Priority:* High. *Traceability:* RevisionPolicy.md §5.

## 7. Update and Maintenance Model

**DA-016** — Updates to the desktop client and the organization-controlled shared component shall be deliverable without requiring end-user administrator rights, consistent with `SecurityRequirements.md` SR-051 and `NonFunctionalRequirements.md` NFR-054.
*Priority:* Critical. *Traceability:* SecurityRequirements.md SR-051; NonFunctionalRequirements.md NFR-054; AssumptionsRegister.md AR-007.

**DA-017** — Updates shall be verified (e.g., integrity/authenticity checked) before being applied, consistent with `SecurityRequirements.md` SR-051 and the supply-chain threat identified in `ThreatModel.md` TM-010.
*Priority:* Critical. *Traceability:* SecurityRequirements.md SR-051; ThreatModel.md TM-010.

**DA-018** — An applied update found to introduce a defect shall be capable of being rolled back to the prior version, consistent with `NonFunctionalRequirements.md` NFR-053.
*Priority:* High. *Traceability:* NonFunctionalRequirements.md NFR-053.

**DA-019** — Updates shall not silently alter protective defaults established elsewhere in this document (e.g., DA-003's offline-by-default operation, DA-012's default-offline network mode) without explicit release documentation, consistent with `SecurityRequirements.md` SR-052.
*Priority:* Critical. *Traceability:* SecurityRequirements.md SR-052.

**DA-020** — The specific technical mechanism for update delivery (e.g., an enterprise software distribution tool the organization already operates, a self-contained updater, or another mechanism) is not selected by this document and remains deferred, consistent with the previously tracked **AR-007**; this document establishes only that whichever mechanism is chosen must satisfy DA-016–DA-019.
*Priority:* N/A (deferral notice). *Traceability:* AssumptionsRegister.md AR-007.

## 8. Security Deployment Considerations

This section addresses deployment-level implications of `ThreatModel.md`'s findings, without redesigning the mitigations already required there.

**DA-021** — The deployment topology (Section 4) shall not introduce a new device-compromise exposure beyond what `ThreatModel.md` TM-001 and TM-006 already anticipate: local storage on end-user devices remains subject to the encryption-at-rest requirement (`SecurityRequirements.md` SR-023), regardless of whether the organization-controlled shared component also exists.
*Priority:* Critical. *Traceability:* ThreatModel.md TM-001, TM-006; SecurityRequirements.md SR-023.

**DA-022** — The organization-controlled shared component (Section 4.3) introduces an additional asset requiring the same protection as any other C1–C4 data store per `PrivacyRequirements.md` §6.1 and `SecurityRequirements.md` §10–11; its introduction shall not be treated as reducing the protection level required for data that resides on it.
*Priority:* Critical. *Rationale:* Centralizing data for search/administration purposes (Section 4.3) must not become a rationale for weaker per-record protection than the local-device default. *Traceability:* PrivacyRequirements.md §6.1; SecurityRequirements.md §10–11.

**DA-023** — Unauthorized access to either component type (end-user device or shared component) shall be governed by the same authorization model (ADR-004) regardless of which component holds the accessed data, consistent with `ThreatModel.md` TM-004 (System Administrator boundary) and TM-006 (unauthorized insider via direct access).
*Priority:* Critical. *Traceability:* ThreatModel.md TM-004, TM-006; ADR-004 §4.1.

**DA-024** — Deployment integrity (i.e., confidence that the deployed components are the legitimate, unmodified Project Echo software) shall be maintained through the update verification required in DA-017, addressing `ThreatModel.md` TM-010 and TM-016 (model manipulation) at the deployment level.
*Priority:* High. *Traceability:* ThreatModel.md TM-010, TM-016.

## 9. Data Isolation Model (Resolving Elements of ADR-003)

**DA-025** — Storage separation between organizations shall be structural: no storage mechanism used by the organization-controlled shared component (Section 4.3) shall be shared, pooled, or multi-tenant across organizations, consistent with ADR-002 §4 and DA-006 of this document.
*Priority:* Critical. *Traceability:* ADR-002 §4; ADR-003 §4.1.

**DA-026** — Cross-boundary controls (i.e., anything permitting data to leave the isolation boundary defined in DA-005) shall be limited to the three governed mechanisms enumerated in DA-013: Controlled Export, the ADR-001 §4.2 networked AI opt-in, and the update channel (which carries software, not organizational data, outward — DA-016–DA-019 govern its integrity in the other direction).
*Priority:* Critical. *Traceability:* DA-005, DA-013 (this document); SecurityRequirements.md §17.

**DA-027** — Data ownership within the isolation boundary remains with the organization at all times, consistent with ADR-003 §4.1–§4.2, regardless of whether the data resides on an end-user device or the organization-controlled shared component.
*Priority:* Critical. *Traceability:* ADR-003 §4.1–§4.2.

## 10. Operational Responsibilities

**DA-028** — The Organization Administrator role (per ADR-004 §4.1) is responsible, within the deployment architecture defined here, for: configuring role assignments across both the desktop client and shared component, approving boundary-crossing configuration (ADR-001 §4.2 opt-in, Controlled Export policy), and overseeing the organization-controlled shared component's operational configuration (not its underlying infrastructure, which is Section 10's System Administrator responsibility).
*Priority:* High. *Traceability:* ADR-004 §4.1; DA-007 (this document).

**DA-029** — The System Administrator role (per ADR-004 §4.1, §4.5) is responsible, within the deployment architecture defined here, for the infrastructure-level operation of both end-user devices and the organization-controlled shared component (provisioning, updates per Section 7, backup/recovery per `SecurityRequirements.md` §21), without gaining implicit content access to data held on either, consistent with ADR-004 §4.5.
*Priority:* Critical. *Traceability:* ADR-004 §4.1, §4.5; SecurityRequirements.md §21.

**DA-030** — The Auditor role (per ADR-004 §4.1) is responsible, within the deployment architecture defined here, for reviewing audit records aggregated at the organization-controlled shared component (Section 4.3), without requiring direct access to end-user devices.
*Priority:* Medium. *Traceability:* ADR-004 §4.1 (Auditor row); Section 4.3 (this document).

**DA-031** — Users holding content-facing roles (Meeting Owner, Recorder, Reviewer, Approver, Knowledge Consumer) are responsible, within the deployment architecture defined here, only for actions within their assigned scope on whichever component (device or shared component) their role's workflow touches; they hold no deployment-level operational responsibility.
*Priority:* Low. *Traceability:* ADR-004 §4.1.

**DA-032** — This document assigns operational responsibility to roles, not to named individuals or organizational job titles; each adopting organization determines which personnel fill these roles, consistent with ADR-004 §4.2's organization-scoped role assignment.
*Priority:* N/A (scope clarification). *Traceability:* ADR-004 §4.2.

## 11. Deployment Risks and Open Decisions

### 11.1 Deployment-Specific Risks

| Risk | Likelihood | Impact | Notes |
|---|---|---|---|
| The organization-controlled shared component (Section 4.3), being a new architectural element beyond a pure per-device model, could be under-resourced by a smaller adopting organization, weakening the search/administration benefits it exists to provide. | Medium | Medium | To be addressed in `08-Operations/AdministratorGuide.md` (pending) as an operational sizing consideration, not a reason to revisit DA-009. |
| If the update mechanism (Section 7, AR-007) selected during `05-Engineering/ReleaseStrategy.md` authoring cannot satisfy DA-016 (no administrator rights required) for a given organization's IT policy, updates could stall, weakening DA-019's "no silent default erosion" guarantee by leaving organizations on stale, unpatched versions instead. | Medium | High | Must be a hard constraint on update-mechanism selection, not a risk accepted after the fact. |
| Two-component topology (Section 4.3) increases the number of places encryption, access control, and audit logging must each be correctly and consistently implemented (device and shared component), compared to Option A. | Medium | Medium | Accepted as the necessary cost of satisfying already-approved functional requirements (Section 4.4 rationale); must be tracked explicitly in `SecurityArchitecture.md` to avoid inconsistent implementation between the two component types. |

### 11.2 Deferred Decisions (Not Resolved by This Document)

- **DA-010**: Specific technology for the organization-controlled shared component — deferred to `SystemArchitecture.md`/`05-Engineering/`.
- **DA-020**: Specific update delivery mechanism — deferred, per **AR-007**.
- Specific sizing/capacity planning for the shared component — deferred to `DatabaseArchitecture.md`, informed by **AR-081** (scalability targets).

### 11.3 Resolved by This Document

- **AR-044** (deployment topology) — resolved: hybrid local-first client with organization-controlled shared component (DA-009).
- **AR-045** (isolation boundary technical definition) — resolved: defined in DA-005.

## 12. Traceability Summary

Every requirement/decision in this document traces to at least one of: ADR-001–ADR-004, `SecurityRequirements.md`, `PrivacyRequirements.md`, `NonFunctionalRequirements.md`, or `ThreatModel.md`, per the inline Traceability references above. This document resolves AR-044 and AR-045 with explicit architectural justification (Section 4.4, DA-005), consistent with the instruction not to resolve assumptions without such justification, and does not select any technology, language, database, vendor, or encryption algorithm.

## 13. Relationship to Other PEKB Documents

- This document derives its authority from ADR-001–ADR-004, `SecurityRequirements.md`, `PrivacyRequirements.md`, `NonFunctionalRequirements.md`, and `ThreatModel.md`.
- `03-Architecture/SystemArchitecture.md` (pending) should adopt the topology defined here (Section 4) as its starting structure, rather than independently deciding topology.
- `03-Architecture/SecurityArchitecture.md` (pending) must design controls consistent with the isolation boundary (DA-005) and component placement (Section 5) defined here.
- `03-Architecture/DatabaseArchitecture.md` (pending) must design storage consistent with the component placement in Section 5 and the isolation requirements in Section 9.
- `05-Engineering/ReleaseStrategy.md` (pending) must select the update mechanism satisfying DA-016–DA-020.

---

*End of Document — PEKB-03-ARC-002 — Project Echo Deployment Architecture — PE-2026.001-ZM*
