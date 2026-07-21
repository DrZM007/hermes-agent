# ADR-013 — Key Management

## Document Metadata

| Field | Value |
|---|---|
| Document ID | PEKB-00-GOV-026 |
| Decision ID | ADR-013 |
| Document Title | Key Management |
| PEKB Section | 00-Governance/Decisions |
| Version | 0.1.0 |
| Status | Accepted |
| Classification | Internal — Governance |
| Owner Role | Security Architect |
| Approval Required From | Product Owner (Dr Ziyaad Moolla), Principal Software Architect, Privacy Officer, DevOps/Deployment Engineer |
| Related Documents | ProjectConstitution.md, AssumptionsRegister.md (00-Governance); ADR-002-DeploymentModel.md, ADR-005-EnterpriseCompatibilityZeroITFriction.md, ADR-007-TranscriptRecordLifecycle.md, ADR-009-DesktopApplicationStack.md, ADR-010-DatabaseEngineStrategy.md, ADR-012-SynchronizationApproach.md (00-Governance/Decisions); SecurityArchitecture.md (03-Architecture); SecurityRequirements.md, RecoverabilityRequirements.md, EvidenceComplianceRequirements.md, RedactionSecureSharingRequirements.md (02-Requirements) |
| Original Creator | Dr Ziyaad Moolla |
| Creator ID | ZM |
| Document Provenance | PE-2026.001-ZM |

---

## 1. Context

`03-Architecture/SecurityArchitecture.md` §5 established an **envelope encryption architecture** — per-asset data encryption keys (DEKs) wrapped by key-encryption keys (KEKs), scoped per-device (local) or per-organization (shared) — but explicitly did not choose *how keys are stored, custodied, recovered, or rotated*. That gap was tracked as **AR-052** and is depended on by encryption-at-rest (SR-023/SR-025), disposal (ADR-007/EV-002), secure sharing/signing (RS-006), sync transport security (ADR-012), and Recoverability/disaster recovery (RC-010). This ADR resolves AR-052. It was decided by the Product Owner on 2026-07-20 and is **Accepted**.

Constraints it must satisfy: the desktop runs under managed Windows with **no administrator rights** (ADR-005); each organization's deployment is **isolated** (ADR-002); core operation is **offline-first** (ADR-001); and almost nothing may be **permanently lost by accident** (Constitution Commitment 11).

## 2. Problem

Decide, within the ratified envelope architecture: (1) how the **local** desktop key is protected on a no-admin managed Windows device; (2) who holds the **organization-level KEK** for the shared component; (3) how keys are **recovered** so a lost device/credential does not mean permanent data loss; and (4) the rotation discipline.

## 3. Decision

### 3.1 Local key protection — OS-native DPAPI-NG
The desktop's local data-encryption material (the key protecting the encrypted SQLite store, ADR-010) is protected using the **Windows Data Protection API (DPAPI-NG)**, bound to the user's Windows logon. This requires no administrator rights and no separate application password, and is transparent to the user (ADR-005 fit). The local DEK(s) encrypting content are wrapped by a local KEK that DPAPI-NG protects.

### 3.2 Organization KEK custody — organization-controlled software key store
The **organization-level KEK** (which wraps DEKs in the Organization Shared Component) is held and managed within an **organization-controlled software key store inside the org's own isolated deployment** (ADR-002). It has **no dependency on an external KMS/HSM or cloud service** by default. Integration with an existing enterprise KMS/HSM or AD/Windows-Server-backed custody is a **supported optional configuration**, not the default, and if adopted must not weaken isolation or the escrow guarantee below.

### 3.3 Key recovery — mandatory organization-controlled escrow
Every organization deployment shall maintain an **encrypted, organization-controlled key escrow** so that a lost device, reimaged laptop, or forgotten credential does not render the organization's own data permanently unrecoverable (supporting RC-010 disaster recovery and Constitution Commitment 11). Escrow:
1. is held under organization control within the isolated deployment (never vendor-held, per ADR-003);
2. protects escrowed key material under its own encryption;
3. is access-gated by **separation of duties** (recovering a key from escrow is an authorized, multi-party-or-approved action, not a single administrator's unilateral power) and is **fully audited** (SR-041–SR-043);
4. never bypasses the ADR-004 authorization model to grant content access — escrow restores *keys* for continuity, it does not grant *reading rights*.

### 3.4 Rotation
KEKs and long-lived keys are **rotatable on an administrator-configured policy** without re-encrypting all content wholesale (envelope architecture: re-wrap DEKs, not re-encrypt assets), and rotation is an audited operation. The operational runbook for rotation lives in `08-Operations/` (pending).

## 4. Rationale

Each choice is the lowest-regret fit for the ratified constraints. DPAPI-NG is the standard no-admin Windows mechanism, so local encryption "just works" in the locked-down estate without a password to lose. An organization-controlled software key store keeps custody inside the isolation boundary with no external dependency (ADR-002/ADR-005), while still allowing organizations with a KMS/HSM to plug it in. Mandatory escrow is the deciding safeguard for Commitment 11: without it, a lost key silently violates the Recoverability promise; with separation-of-duties and audit, escrow provides recoverability *without* becoming a backdoor to content. Together these keep the strongest commitments — privacy, security, and recoverability — simultaneously satisfied, consistent with the Section 2A precedence ordering.

## 5. Consequences

1. `03-Architecture/SecurityArchitecture.md` §5 is elaborated with the concrete key hierarchy: DPAPI-NG-protected local KEK; organization-controlled KEK for the shared component; per-asset DEKs; escrow of KEK material.
2. `SecurityRequirements.md` must add testable requirements for DPAPI-NG local protection, organization KEK custody, escrow (with separation of duties and audit), and rotation.
3. `RecoverabilityRequirements.md` RC-004/RC-010 are satisfied by the escrow guarantee; disaster recovery onto new hardware uses escrowed keys.
4. `EvidenceComplianceRequirements.md` EV-002/EV-006 (disposal certificate, signing) and `RedactionSecureSharingRequirements.md` RS-006 (package signing/encryption) now have a key source; their "pending on AR-052" notes are resolved by this ADR.
5. `ADR-012` sync transport authentication draws its key material from this hierarchy.
6. Optional enterprise-KMS/HSM/AD-backed custody is a supported configuration to be specified in `03-Architecture/SecurityArchitecture.md` and `08-Operations/`.
7. The key-rotation and escrow-recovery **operational runbooks** are `08-Operations/` deliverables (pending), unblocked by this decision.

## 6. Risks

| Risk | Likelihood | Impact | Notes |
|---|---|---|---|
| DPAPI-NG ties local data to the Windows profile; profile loss without escrow could strand local data. | Medium | Medium | Mitigated by mandatory escrow (3.3) and by sync of approved records to the shared component. |
| Escrow becomes a backdoor if separation of duties is weak. | Low | High | Escrow recovery is authorized, multi-party/approved, and audited (3.3.3); it restores keys, never grants content-reading rights outside ADR-004. |
| Organization-controlled software key store is weaker than an HSM for very high-assurance orgs. | Medium | Medium | Optional KMS/HSM integration (3.2) is available for such organizations. |
| Rotation implemented as full re-encryption would be costly. | Low | Medium | Envelope design re-wraps DEKs rather than re-encrypting assets (3.4). |

## 7. Related Requirements

- `03-Architecture/SecurityArchitecture.md` §5 (envelope architecture, now concretized)
- `02-Requirements/SecurityRequirements.md` (SR-023/SR-025 encryption; new key-management requirements)
- `02-Requirements/RecoverabilityRequirements.md` (RC-004/RC-010)
- `02-Requirements/EvidenceComplianceRequirements.md` (EV-002/EV-006), `RedactionSecureSharingRequirements.md` (RS-006)
- ADR-002, ADR-005, ADR-010, ADR-012

## 8. Assumptions Updated

- **AR-052** (`AssumptionsRegister.md`) — **Resolved** by this ADR: DPAPI-NG local protection; organization-controlled software key store for the KEK (KMS/HSM/AD optional); mandatory organization-controlled, separation-of-duties-gated, audited escrow; policy-based envelope rotation.
- New open item: the concrete key-hierarchy detail and the escrow-recovery/rotation runbooks are elaborated in `03-Architecture/SecurityArchitecture.md` and `08-Operations/` (pending).

## 9. Challenge the Design

1. Does escrow (3.3) create any path to content access that bypasses ADR-004? (It must not — it restores keys, not reading rights.)
2. Is DPAPI-NG genuinely sufficient on all target managed-Windows configurations, or are there estates where it is disabled by policy?
3. Does the organization-controlled key store stay entirely within the isolation boundary (ADR-002) in every configuration, including optional KMS integration?
4. Is separation of duties on escrow recovery strong enough to prevent a single administrator from unilaterally recovering keys?
5. What is deferred (concrete hierarchy, runbooks) and is each flagged?

## 10. Revision History

| Version | Date | Summary | Author |
|---|---|---|---|
| 0.1.0 | 2026-07-20 | Initial ADR-013, Accepted on decision: resolve AR-052. Local desktop keys protected by OS-native DPAPI-NG (no admin, no extra password); organization-level KEK held in an organization-controlled software key store within the isolated deployment (enterprise KMS/HSM/AD optional); mandatory organization-controlled, separation-of-duties-gated, audited key escrow supporting disaster recovery (Commitment 11) without becoming a content backdoor; policy-based envelope-rotation (re-wrap DEKs, not re-encrypt assets). Resolves the AR-052 dependencies across encryption, disposal, signing, sync, and recoverability. | Dr Ziyaad Moolla (ZM) |

---

*End of Document — PEKB-00-GOV-026 — ADR-013 — Key Management — PE-2026.001-ZM*
