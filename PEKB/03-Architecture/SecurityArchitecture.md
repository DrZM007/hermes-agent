# Project Echo — Security Architecture

## Document Metadata

| Field | Value |
|---|---|
| Document ID | PEKB-03-ARC-004 |
| Document Title | Security Architecture |
| PEKB Section | 03-Architecture |
| Version | 0.1.0 |
| Status | Draft |
| Classification | Internal — Architecture / Security |
| Owner Role | Security Architect |
| Approval Required From | Principal Software Architect, Privacy Officer, DevOps/Deployment Engineer |
| Related Documents | ProjectConstitution.md (00-Governance); ADR-004-AccessControlRBACModel.md (00-Governance/Decisions); SecurityRequirements.md, PrivacyRequirements.md (02-Requirements); ThreatModel.md, DeploymentArchitecture.md, SystemArchitecture.md (03-Architecture); AssumptionsRegister.md (00-Governance) |
| Original Creator | Dr Ziyaad Moolla |
| Creator ID | ZM |
| Document Provenance | PE-2026.001-ZM |

---

## 1. Purpose and Scope of This Document

This document defines the security architecture required to protect Project Echo's assets, users, workflows, and organizational boundaries. It does not select programming languages, libraries, vendors, or cloud providers, and does not write implementation code — those belong to `05-Engineering/` and to specific component architecture documents (`DesktopArchitecture.md`, `DatabaseArchitecture.md`). This document defines architectural patterns and mechanisms at a conceptual level sufficient to guide those later, more specific decisions.

This document uses the identifier format `SEC-<###>` (Security Architecture requirement/decision), following the established PEKB precedent. It resolves the previously tracked **AR-051** (authentication mechanism) and **AR-052** (encryption/key management approach), and advances (without fully resolving) **AR-010** (encryption-at-rest/key management strategy — now substantially specified at architecture level, with final algorithm selection remaining out of scope per the constraints governing this document) and **AR-048** (technical authorization mechanism for scoped role assignment).

## 2. Security Architecture Principles

**SEC-001** — The security architecture shall implement Security by Design (`ProjectConstitution.md` §3.3) as an architectural property of every component defined in `SystemArchitecture.md` §4, not as a layer added after those components are otherwise complete.
*Priority:* Critical. *Traceability:* ProjectConstitution.md §3.3; SystemArchitecture.md §4.

**SEC-002** — Every security control defined in this document shall be traceable to a specific threat cataloged in `ThreatModel.md` §7–9, consistent with `SecurityRequirements.md` SR-005's requirement that controls be threat-derived, not asserted independently.
*Priority:* Critical. *Traceability:* SecurityRequirements.md SR-005; ThreatModel.md §7–9.

**SEC-003** — The security architecture shall default to the most protective configuration at every decision point, consistent with `SecurityRequirements.md` SR-003 and `SystemArchitecture.md` SA-002–SA-003, requiring explicit organization-level action to adopt any less protective alternative.
*Priority:* Critical. *Traceability:* SecurityRequirements.md SR-003; SystemArchitecture.md SA-002–SA-003.

**SEC-004** — The security architecture shall apply least privilege and defense in depth: no single component's compromise (per the component trust levels defined in `SystemArchitecture.md` §4) shall by itself expose data or authority beyond that component's own defined boundary.
*Priority:* Critical. *Traceability:* SecurityRequirements.md SR-007; SystemArchitecture.md §4 (Trust Level fields).

## 3. Identity Architecture (Resolving AR-051)

### 3.1 Authentication Model

**SEC-005** — Project Echo shall authenticate users through **federated delegation to the adopting organization's existing enterprise identity system**, rather than maintaining an independent, Project-Echo-specific credential store as the primary authentication mechanism.
*Priority:* Critical. *Rationale:* This resolves **AR-051** at the architectural-pattern level (a category of mechanism, not a specific product or protocol implementation, consistent with the constraint against vendor/technology selection). Federated delegation directly satisfies `SecurityRequirements.md` SR-012 ("integrate with an adopting organization's existing enterprise identity management practices"), avoids requiring organizations to manage a second, parallel identity system (Enterprise First), and keeps credential custody with the organization's own identity system rather than introducing a new credential store as an additional attack surface (`ThreatModel.md` TM-002, TM-012). *Traceability:* SecurityRequirements.md SR-011–SR-013; AssumptionsRegister.md AR-051; ThreatModel.md TM-002, TM-012.

**SEC-006** — Following successful federated authentication, the Identity and Access Layer (`SystemArchitecture.md` SA-014) shall establish a local session bound to the authenticated identity, scoped to the Desktop Client instance and, where applicable, the Organization Shared Component.
*Priority:* Critical. *Traceability:* SystemArchitecture.md SA-014; SecurityRequirements.md SR-011.

**SEC-007** — Because core capture/processing/review functionality must operate offline by default (`ADR-001-AIProcessingModel.md` §4.1, `SystemArchitecture.md` SA-025), the authentication model shall support a bounded-validity cached session that permits continued local operation without requiring re-federation for every action, while requiring periodic re-authentication against the organization's identity system when connectivity is available.
*Priority:* Critical. *Rationale:* Without this, offline operation (already a Critical requirement elsewhere in the PEKB) would be impossible for any action requiring authentication, which is nearly all of them. *Traceability:* ADR-001 §4.1; SystemArchitecture.md SA-025; NonFunctionalRequirements.md NFR-030.

**SEC-008** — No shared or anonymous credential shall be usable to establish a session, consistent with `SecurityRequirements.md` SR-011; the federated identity system's own uniqueness guarantees are relied upon rather than re-implemented by Project Echo.
*Priority:* Critical. *Traceability:* SecurityRequirements.md SR-011.

### 3.2 Identity Lifecycle

**SEC-009** — User account lifecycle (creation, deactivation, reactivation, per `FunctionalRequirements.md` FR-002–FR-003) shall be represented within Project Echo as a local record referencing the federated identity, not as an independent identity Project Echo itself issues; deactivating a Project Echo account record shall not require or imply any action on the organization's underlying identity system.
*Priority:* High. *Traceability:* FunctionalRequirements.md FR-002–FR-003; SEC-005 (this document).

**SEC-010** — Role and scope assignments (`ADR-004-AccessControlRBACModel.md` §4.1–§4.2) shall be maintained by the Identity and Access Layer as attributes of the local account record, separate from the federated identity's own attributes, so that Project Echo's role model remains fully governed by ADR-004 regardless of what the organization's identity system natively supports.
*Priority:* Critical. *Traceability:* ADR-004 §4.1–§4.2.

### 3.3 Session Principles

**SEC-011** — Sessions shall be scoped to a single authenticated identity and shall not be transferable between users or devices.
*Priority:* Critical. *Traceability:* SecurityRequirements.md SR-013.

**SEC-012** — Session validity duration, and the specific re-authentication trigger conditions for the offline-cached session (SEC-007), are not fixed numeric values in this document and remain deferred, consistent with the general pattern of not inventing unresolved quantitative targets established in `NonFunctionalRequirements.md`.
*Priority:* N/A (deferral notice). *Traceability:* NonFunctionalRequirements.md §17.

### 3.4 Credential Protection

**SEC-013** — Project Echo shall not itself store long-term reusable passwords or equivalent primary credentials, consistent with the federated model (SEC-005); only session-scoped tokens or equivalent short-lived proof-of-authentication artifacts are held locally, and these shall be protected using the endpoint protection mechanisms defined in Section 6.
*Priority:* Critical. *Traceability:* SEC-005 (this document); Section 6 (this document).

## 4. Authorization Architecture (Advancing AR-048)

**SEC-014** — Authorization shall be enforced through **claims-based, scope-qualified access evaluation**: every request to read, edit, approve, export, or delete an asset carries (or is evaluated against) the requesting identity's assigned role(s) and the specific scope (organization-wide or meeting/transcript-specific) that role was granted, per `ADR-004-AccessControlRBACModel.md` §4.1–§4.2.
*Priority:* Critical. *Rationale:* This advances **AR-048** by naming the architectural pattern (claims/scope evaluation) capable of expressing the per-meeting scoping ADR-004 §4.2 requires, without selecting a specific token format, protocol, or library — those remain implementation decisions for `05-Engineering/`. *Traceability:* ADR-004 §4.1–§4.2; AssumptionsRegister.md AR-048.

**SEC-015** — The Identity and Access Layer (`SystemArchitecture.md` SA-014) shall be the sole component that evaluates these claims/scope checks; other components (Desktop Client, Organization Shared Component, Storage Layer) shall defer to it rather than independently implementing authorization logic, consistent with `SystemArchitecture.md` SA-014 and the risk identified in `SystemArchitecture.md` §11.1 (inconsistent enforcement).
*Priority:* Critical. *Traceability:* SystemArchitecture.md SA-014, §11.1.

**SEC-016** — The mandatory separations of duties defined in `ADR-004-AccessControlRBACModel.md` §4.3 (System Administrator content-access exclusion, Reviewer/Approver separation, Auditor independence) shall be enforced as non-bypassable rules within the Identity and Access Layer's evaluation logic, not as configuration options that could be disabled outright; only the specific, visibly-flagged exception mechanism already defined in ADR-004 §4.3.2 (Reviewer/Approver combination) is a permitted deviation.
*Priority:* Critical. *Traceability:* ADR-004 §4.3; SecurityRequirements.md SR-018–SR-021.

**SEC-017** — Delegation of role assignment authority shall flow only from the Organization Administrator role (per `ADR-003-DataOwnershipGovernance.md` §4.7 and `ADR-004-AccessControlRBACModel.md` §4.2); the authorization architecture shall provide no mechanism by which a user can grant themselves or another user a role or scope beyond what an Organization Administrator has assigned.
*Priority:* Critical. *Traceability:* ADR-003 §4.7; ADR-004 §4.2; SecurityRequirements.md SR-016.

**SEC-018** — Authorization evaluation shall default to deny: absence of an explicit, current role/scope grant for a given resource results in denied access, consistent with `SecurityRequirements.md` SR-017.
*Priority:* Critical. *Traceability:* SecurityRequirements.md SR-017.

## 5. Encryption Architecture (Resolving AR-052, Advancing AR-010)

### 5.1 Encryption Requirements Recap

**SEC-019** — All C2/C3-classified assets (per `PrivacyRequirements.md` §6.1) shall be encrypted at rest on every component of the Storage Layer (`SystemArchitecture.md` SA-013), whether located on an end-user device or the Organization Shared Component, consistent with `SecurityRequirements.md` SR-023.
*Priority:* Critical. *Traceability:* SecurityRequirements.md SR-023; PrivacyRequirements.md §6.1.

### 5.2 Key Management Architecture

**SEC-020** — Encryption shall follow an **envelope key hierarchy**: each individual asset (recording, transcript, etc.) is encrypted with its own data encryption key (DEK); DEKs are themselves encrypted ("wrapped") by a key-encryption key (KEK) that is never stored alongside the data it protects.
*Priority:* Critical. *Rationale:* This resolves the architectural portion of **AR-052** by defining a key hierarchy pattern that separates data custody from key custody, directly addressing `ThreatModel.md` TM-001 and TM-006 (device loss/theft or direct storage access should not, by itself, yield readable content). It does not select a specific encryption algorithm, consistent with the constraint governing this document. *Traceability:* SecurityRequirements.md SR-023, SR-025; ThreatModel.md TM-001, TM-006; AssumptionsRegister.md AR-052.

**SEC-021** — KEKs shall be scoped per organization (for content held at or synchronized to the Organization Shared Component) and per end-user device (for content held only in local working storage prior to reaching a shared state), such that compromise of one device's KEK does not expose another device's or the organization's shared-component content.
*Priority:* Critical. *Traceability:* SEC-020 (this document); ADR-002 §4 (isolation).

**SEC-022** — Device-scoped KEKs shall rely on platform-provided secure key storage where the endpoint device offers it (a general architectural expectation, not a specific vendor API selection), consistent with operating within the managed-Windows-laptop constraint without requiring administrator rights.
*Priority:* High. *Traceability:* SecurityRequirements.md SR-004; ProjectIntent.md (Target Environment Constraints).

**SEC-023** — Organization-scoped KEKs (for the Organization Shared Component) shall be held separately from the Storage Layer's data partitions, consistent with `DeploymentArchitecture.md` DA-022's requirement that centralizing data not reduce its protection level.
*Priority:* Critical. *Traceability:* DeploymentArchitecture.md DA-022; SEC-020 (this document).

### 5.3 Key Lifecycle

**SEC-024** — Keys shall be rotatable (a new KEK/DEK generation can supersede a prior one) without requiring re-authorization of already-granted access, so that key rotation is an operational security hygiene action, not a disruptive re-permissioning event.
*Priority:* High. *Traceability:* SecurityRequirements.md SR-009 (Security by Design as an ongoing property, not a one-time state).

**SEC-025** — Revoking a user's access (e.g., deactivation, per `FunctionalRequirements.md` FR-002–FR-003) shall not require re-encrypting all content that user could access, provided the authorization check (Section 4) independently denies the deactivated user; key rotation is reserved for suspected key compromise, not routine access changes, to avoid unnecessary re-encryption overhead.
*Priority:* Medium. *Traceability:* SEC-014–SEC-018 (this document); FunctionalRequirements.md FR-002–FR-003.

### 5.4 Recovery Considerations

**SEC-026** — Content held only within a device-scoped KEK (local working storage prior to reaching the Organization Shared Component) is, by design, at risk of becoming unrecoverable if that specific device and its key storage are destroyed before the content reaches shared/archival storage; this is an accepted architectural trade-off given the offline-first requirement, not an oversight, and is mitigated by ensuring content reaches the Organization Shared Component (with organization-scoped KEK escrow, SEC-027) as early in the lifecycle as the workflow allows (i.e., no later than Reviewed state, per `FunctionalRequirements.md` §3.1).
*Priority:* High. *Rationale:* This is the necessary consequence of genuinely supporting offline-first operation (a device that never connects cannot have its sole copy of data escrowed elsewhere) balanced against data durability; the mitigation is procedural (get content to shared storage promptly) rather than eliminating the offline capability. *Traceability:* ADR-001 §4.1; FunctionalRequirements.md §3.1.

**SEC-027** — Organization-scoped KEKs (protecting content at the Organization Shared Component, including all Approved/Archived records) shall support an organization-controlled key escrow or recovery mechanism, so that the loss of a single administrator's access credentials does not render the organization's own approved records permanently unrecoverable.
*Priority:* Critical. *Rationale:* Since ADR-003 establishes the organization as owner of its records, an architecture that could permanently and irrecoverably lose approved organizational records due to a single lost credential would conflict with that ownership guarantee. *Traceability:* ADR-003 §4.1–§4.2; SEC-020–SEC-021 (this document).

**SEC-028** — The specific technical mechanism for key escrow/recovery (e.g., a specific secret-sharing scheme, hardware security module pattern, or organizational process) is not selected by this document and is deferred to `05-Engineering/` implementation design, consistent with the constraint against selecting specific technologies.
*Priority:* N/A (deferral notice). *Traceability:* Section 1 (this document, scope constraint).

## 6. Audit Security Architecture

**SEC-029** — The Audit Layer (`SystemArchitecture.md` SA-015) shall remain architecturally independent of every role it records, including System Administrator and Organization Administrator, such that no privileged role can modify or delete an audit entry through any code path, consistent with `SecurityRequirements.md` SR-043 and directly addressing `ThreatModel.md` TM-011.
*Priority:* Critical. *Traceability:* SecurityRequirements.md SR-043; ThreatModel.md TM-011; SystemArchitecture.md SA-015, SA-030.

**SEC-030** — Events captured by the Audit Layer shall include, at minimum, the set already required by `SecurityRequirements.md` SR-041: authentication events (success and failure), role assignment/grant/revocation, transcript state transitions, approvals, deletions, exports, boundary-crossing configuration changes (ADR-001/ADR-002-relevant), and separation-of-duties exceptions (`ADR-004-AccessControlRBACModel.md` §4.3.2).
*Priority:* Critical. *Traceability:* SecurityRequirements.md SR-041; ADR-004 §4.3.2.

**SEC-031** — Privileged activity — specifically actions taken by System Administrator and Organization Administrator roles — shall be logged with the same completeness as any other role's actions, with no privileged-role exemption from audit capture, directly addressing the "compromised administrator" threats cataloged in `ThreatModel.md` TM-002 and TM-004.
*Priority:* Critical. *Traceability:* ThreatModel.md TM-002, TM-004; SecurityRequirements.md SR-041.

**SEC-032** — The Auditor role's query interface to the Audit Layer shall return audit metadata only, never the underlying meeting content, consistent with `SecurityRequirements.md` SR-020 and `ADR-004-AccessControlRBACModel.md` §4.1's Auditor row; this is enforced by the Audit Layer's own data model (it does not store content, only references and event metadata), not merely by a UI-level restriction.
*Priority:* Critical. *Traceability:* SecurityRequirements.md SR-020; ADR-004 §4.1.

## 7. Endpoint Security

**SEC-033** — Loss or theft of a managed end-user device shall not expose C2/C3 content, relying on the device-scoped KEK architecture (Section 5.2) and the requirement that device-scoped keys rely on platform-provided secure storage (SEC-022), directly addressing `ThreatModel.md` TM-001.
*Priority:* Critical. *Traceability:* ThreatModel.md TM-001; SEC-020–SEC-022 (this document).

**SEC-034** — Unauthorized local access to a running or logged-in device (e.g., an unauthorized insider attempting to use an unattended, unlocked session) shall be mitigated through session-timeout behavior at the Identity and Access Layer (specific timeout duration deferred, per SEC-012) and through the underlying operating system's own device-lock mechanisms, which Project Echo relies upon rather than reimplements.
*Priority:* High. *Traceability:* ThreatModel.md TM-006; SEC-006–SEC-007 (this document).

**SEC-035** — Endpoint operation shall remain consistent with the managed-Windows-laptop constraint: no security control defined in this document may require administrator rights for ordinary end-user operation, consistent with `SecurityRequirements.md` SR-004.
*Priority:* Critical. *Traceability:* SecurityRequirements.md SR-004; ProjectIntent.md (Target Environment Constraints).

## 8. Network Security

**SEC-036** — The security architecture shall enforce that no core function (capture, offline transcription, local review, local approval) depends on network reachability, consistent with `DeploymentArchitecture.md` DA-012 and `SystemArchitecture.md` SA-025.
*Priority:* Critical. *Traceability:* ADR-001 §4.1; DeploymentArchitecture.md DA-012; SystemArchitecture.md SA-025.

**SEC-037** — The only network paths permitted are those already enumerated in `DeploymentArchitecture.md` DA-013 (Desktop Client ↔ Organization Shared Component within the isolation boundary; the governed networked AI opt-in; the update channel; approved Controlled Export destinations); this document adds no additional network path.
*Priority:* Critical. *Traceability:* DeploymentArchitecture.md DA-013.

**SEC-038** — All network communication crossing the organizational isolation boundary (the networked AI opt-in and Controlled Export paths specifically) shall be encrypted in transit, consistent with `SecurityRequirements.md` SR-024; communication between the Desktop Client and Organization Shared Component, while within the isolation boundary, shall also be encrypted in transit as a defense-in-depth measure against an unauthorized insider positioned on the internal network (`ThreatModel.md` §4.2).
*Priority:* Critical. *Traceability:* SecurityRequirements.md SR-024; ThreatModel.md §4.2 (unauthorized insider).

**SEC-039** — Activation of the optional networked AI processing path shall require Organization Administrator-level configuration and generate an audit event, consistent with `SecurityRequirements.md` SR-037 and `DeploymentArchitecture.md` DA-014; this document introduces no additional gating mechanism beyond what those documents already require.
*Priority:* Critical. *Traceability:* SecurityRequirements.md SR-037; DeploymentArchitecture.md DA-014.

## 9. AI Security Architecture

**SEC-040** — The AI Processing Layer (`SystemArchitecture.md` SA-011) shall be protected against unauthorized modification of its model artifacts or configuration, through the same update-verification mechanism defined for the rest of the system (`DeploymentArchitecture.md` DA-017), directly addressing `ThreatModel.md` TM-016.
*Priority:* Critical. *Traceability:* ThreatModel.md TM-016; DeploymentArchitecture.md DA-017; AIRequirements.md AI-046.

**SEC-041** — AI capabilities shall treat all meeting content (audio, transcript text, imported recordings) as untrusted input, architecturally incapable of triggering a privileged action or bypassing the authorization checks defined in Section 4, directly addressing `ThreatModel.md` TM-019 (prompt injection) and TM-020 (malicious input).
*Priority:* Critical. *Traceability:* ThreatModel.md TM-019–TM-020; AIRequirements.md AI-047–AI-048.

**SEC-042** — AI-generated output integrity shall be preserved by the architectural tagging mechanism already defined in `SystemArchitecture.md` SA-032 (AI-generated/unreviewed status as a structural data property); this document adds no separate integrity mechanism, since SA-032 already prevents unreviewed output from being mistaken for verified content at the data-model level.
*Priority:* Critical. *Traceability:* SystemArchitecture.md SA-032; SecurityRequirements.md SR-038.

**SEC-043** — No autonomous learning path shall exist between the AI Processing Layer's runtime operation and its own configuration or model state; any behavior change reaches the AI Processing Layer only through the version-controlled Update Management component (`SystemArchitecture.md` SA-033), directly addressing `ThreatModel.md` TM-017.
*Priority:* Critical. *Traceability:* ThreatModel.md TM-017; SystemArchitecture.md SA-033; ProjectConstitution.md §5.4.

**SEC-044** — Where the networked AI processing opt-in is active, any shared infrastructure underlying that path shall maintain isolation between organizations consistent with `ThreatModel.md` TM-018; the specific technical isolation mechanism is not selected by this document and is deferred to `AIArchitecture.md`, consistent with the previously tracked **AR-073**.
*Priority:* Critical. *Traceability:* ThreatModel.md TM-018; AssumptionsRegister.md AR-073.

## 10. Security Operations

**SEC-045** — Monitoring shall detect the access-pattern anomalies already required by `SecurityRequirements.md` SR-045–SR-046 (repeated failed authentication, access patterns inconsistent with assigned role/scope) using the Audit Layer's captured events (Section 6) as its data source, rather than a separate monitoring data path.
*Priority:* High. *Traceability:* SecurityRequirements.md SR-045–SR-046; Section 6 (this document).

**SEC-046** — This document's security controls are the inputs that `06-Security/IncidentResponse.md` (pending) must assume are in place when defining detection and containment procedures; incident response process design itself remains out of scope for this document, consistent with `SecurityRequirements.md` SR-057's deferral.
*Priority:* N/A (scope clarification). *Traceability:* SecurityRequirements.md SR-057, SR-059.

**SEC-047** — Vulnerability management (per `SecurityRequirements.md` SR-054–SR-056) shall apply to every component defined in `SystemArchitecture.md` §4, including the AI Processing Layer's model artifacts and any incorporated components; specific tooling and process remain deferred, consistent with the previously tracked **AR-054/AR-057**.
*Priority:* High. *Traceability:* SecurityRequirements.md SR-054–SR-056; AssumptionsRegister.md AR-054, AR-057.

## 11. Deferred Decisions and Risks

### 11.1 Deferred Decisions

- **Specific authentication protocol/standard** implementing the federated model (SEC-005) — deferred to `05-Engineering/`.
- **Specific encryption algorithms** implementing the envelope key hierarchy (Section 5) — deferred to `05-Engineering/`, consistent with the constraint against selecting algorithms in this document.
- **Specific key escrow/recovery mechanism** (SEC-028) — deferred to `05-Engineering/`.
- **Specific session validity duration and re-authentication triggers** (SEC-012) — deferred, pending resolution of related `NonFunctionalRequirements.md` quantitative targets.
- **Specific cross-organization AI processing isolation mechanism** (SEC-044) — deferred to `AIArchitecture.md`, per **AR-073**.
- **Specific vulnerability management tooling** (SEC-047) — deferred, per **AR-054/AR-057**.

### 11.2 Architectural Risks

| Risk | Likelihood | Impact | Notes |
|---|---|---|---|
| Federated authentication (SEC-005) makes Project Echo's own authentication posture dependent on the adopting organization's identity system's security quality; a weak organizational identity system weakens Project Echo's authentication regardless of Project Echo's own design. | Medium | High | This is an accepted trade-off inherent to Enterprise First (avoiding a parallel, potentially weaker Project-Echo-specific credential store); should be documented as a shared-responsibility item in `08-Operations/AdministratorGuide.md`. |
| The offline-session caching mechanism (SEC-007) necessarily weakens the strength of "continuous" authentication compared to a fully connected system, since a cached session persists without re-verification for some period. | Medium | Medium | Necessary trade-off for genuine offline-first support; bounded by the not-yet-fixed validity duration (SEC-012), which should be set conservatively once resolved. |
| Device-scoped key loss before content reaches the Organization Shared Component (SEC-026) results in irrecoverable local-only content. | Low–Medium | Medium | Accepted trade-off, mitigated procedurally (prompt progression through the review workflow) rather than architecturally eliminated. |

### 11.3 Assumptions Register Updates

- **AR-051** (authentication mechanism) — **Resolved**: federated delegation to the organization's existing identity system (SEC-005–SEC-008).
- **AR-052** (encryption/key management approach) — **Resolved**: envelope key hierarchy with per-organization and per-device KEK scoping and organization-controlled escrow (SEC-020–SEC-028).
- **AR-010** (encryption-at-rest/key management strategy) — **Substantially advanced, not fully resolved**: the architectural strategy is now defined; specific algorithm selection remains deferred to `05-Engineering/`, consistent with the constraint against selecting algorithms in this document.
- **AR-048** (technical authorization mechanism) — **Substantially advanced, not fully resolved**: the architectural pattern (claims-based, scope-qualified evaluation) is now defined; specific token format/protocol selection remains deferred to `05-Engineering/`.

No new assumption is introduced by this document; every open question identified during authoring (specific protocols, algorithms, escrow mechanisms, session durations) was either already tracked or is explicitly and appropriately deferred per the constraints governing this document (no vendor/technology/algorithm selection).

## 12. Traceability Summary

Every requirement/decision in this document traces to at least one of: `00-Governance/ProjectConstitution.md`, ADR-004, `SecurityRequirements.md`, `PrivacyRequirements.md`, `ThreatModel.md`, `DeploymentArchitecture.md`, or `SystemArchitecture.md`, per the inline Traceability references above. This document selects no programming language, library, vendor, cloud provider, or specific encryption algorithm, and contains no implementation code, consistent with the constraints governing it.

## 13. Relationship to Other PEKB Documents

- This document derives its authority from `ThreatModel.md`, `SecurityRequirements.md`, `PrivacyRequirements.md`, ADR-004, and `SystemArchitecture.md` (specifically the Identity and Access Layer and Audit Layer components, SA-014–SA-015).
- `03-Architecture/DatabaseArchitecture.md` (pending) must design the Storage Layer's physical data model consistent with the envelope key hierarchy defined in Section 5.
- `03-Architecture/AIArchitecture.md` (pending) must resolve the cross-organization isolation mechanism deferred in SEC-044 (AR-073).
- `03-Architecture/DesktopArchitecture.md` (pending) must implement the endpoint security posture defined in Section 7, including reliance on platform-provided secure key storage (SEC-022).
- `05-Engineering/CodingStandards.md` and `SecurityControls.md` (pending) must select the specific protocols, algorithms, and tooling this document deliberately deferred.

---

*End of Document — PEKB-03-ARC-004 — Project Echo Security Architecture — PE-2026.001-ZM*
