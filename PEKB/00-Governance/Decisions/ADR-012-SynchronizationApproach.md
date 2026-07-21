# ADR-012 — Synchronization Approach

## Document Metadata

| Field | Value |
|---|---|
| Document ID | PEKB-00-GOV-025 |
| Decision ID | ADR-012 |
| Document Title | Synchronization Approach |
| PEKB Section | 00-Governance/Decisions |
| Version | 0.2.0 |
| Status | Accepted |
| Classification | Internal — Governance |
| Owner Role | Principal Software Architect |
| Approval Required From | Product Owner (Dr Ziyaad Moolla), Security Architect, Database Architect, DevOps/Deployment Engineer |
| Related Documents | ProjectConstitution.md, AssumptionsRegister.md (00-Governance); ADR-002-DeploymentModel.md, ADR-005-EnterpriseCompatibilityZeroITFriction.md, ADR-007-TranscriptRecordLifecycle.md, ADR-010-DatabaseEngineStrategy.md (00-Governance/Decisions); SystemArchitecture.md, DatabaseArchitecture.md, DeploymentArchitecture.md (03-Architecture); SecurityRequirements.md, RecoverabilityRequirements.md (02-Requirements) |
| Original Creator | Dr Ziyaad Moolla |
| Creator ID | ZM |
| Document Provenance | PE-2026.001-ZM |

---

## 1. Context

The adopted topology (**DA-009**) is local-first desktop + organization-controlled shared component, and the briefing (Versions 14, 15) requires offline-first operation with synchronization to the internal server when connectivity returns, and clear visibility into what changed. The ratified data model requires that conflicts are **surfaced for human resolution, never auto-merged** (`DatabaseArchitecture.md` **DB-011**). This ADR decides the synchronization *approach*. **Ratified by the Product Owner on 2026-07-20** (the synchronization invariants are ratified; the concrete protocol is designed in `03-Architecture/` within them).

## 2. Problem

Decide how the desktop client and the organization shared component synchronize, such that offline-first operation, per-organization isolation, the no-auto-merge invariant, and full auditability are guaranteed — without prematurely over-specifying a wire protocol before architecture work.

## 3. Options Considered

### Option A — Ratify the binding invariants now; design the concrete protocol in architecture
Fix the non-negotiable rules (offline-first, in-organization only, no auto-merge, fully audited, authenticated transport) as the decision, and defer the concrete change-log/conflict-detection/resumability protocol to `03-Architecture/`.

- **Pros:** Locks every invariant that matters for correctness, privacy, and trust, while leaving wire-level details to be designed with full architectural context; consistent with how other ADRs fix constraints without pre-selecting mechanisms.
- **Cons:** The concrete protocol is not yet specified (but is unblocked, since its constraints are fixed).

### Option B — Fully specify a custom HTTPS sync protocol now
- **Pros:** Maximum upfront detail (change-log format, conflict detection, resumable transfers) in one place.
- **Cons:** Commits wire-level design before architecture and data-engine detail (ADR-010) are worked through; higher risk of premature, hard-to-change decisions.

### Option C — Adopt a third-party sync framework/service
- **Pros:** Less bespoke code.
- **Cons:** Most such frameworks assume cloud/multi-tenant models or auto-merge semantics that conflict with ADR-002 isolation and DB-011; introduces an external dependency contrary to ADR-005/DesignPrinciples §3.13. Rejected.

## 4. Decision

**Option A.** The following synchronization invariants are ratified now; the concrete protocol is designed in `03-Architecture/`.

1. **Offline-first.** The desktop client remains fully usable for core capture/review/approval while disconnected; synchronization occurs when connectivity to the organization shared component returns (ADR-005 §4.3, RecoverabilityRequirements RC-017).
2. **In-organization only.** Synchronization occurs solely between a desktop client and its own organization's shared component, never across the isolation boundary (ADR-002); no third-party or cross-organization sync service is used.
3. **No auto-merge.** Conflicting concurrent changes are surfaced for human resolution and never automatically merged, preserving `DatabaseArchitecture.md` DB-011 and the append-only revision model.
4. **Authenticated and encrypted transport.** Synchronization uses authenticated, encrypted transport, with the client and shared component mutually verified; key/credential handling remains subject to **AR-052**.
5. **Fully audited and transparent.** Every synchronization event and every conflict resolution is recorded in the immutable audit layer, and the user is given clear visibility into what changed (briefing V14).
6. **Concrete protocol deferred.** The change-log representation, conflict-detection algorithm, resumability, and reconciliation between the SQLite and shared-component schemas (ADR-010) are designed in `03-Architecture/`, honoring invariants 1–5.

## 5. Rationale

Everything that matters for correctness, privacy, and trust in synchronization is an *invariant*, and those can be fixed now with certainty: offline-first, in-organization, no-auto-merge, authenticated, audited. The *mechanism* to realize them benefits from being designed alongside the data-engine and system-architecture detail rather than guessed here. Option C is rejected outright because typical sync frameworks assume exactly the cloud/auto-merge semantics our ratified decisions forbid. This mirrors the project's consistent pattern: fix the constraint, design the mechanism with full context.

## 6. Consequences

1. `03-Architecture/SystemArchitecture.md` and `DatabaseArchitecture.md` design the concrete sync protocol against invariants 1–5, including how it reconciles the two database engines (ADR-010) without auto-merging.
2. `SecurityRequirements.md` must express the authenticated-transport and audit requirements for sync as testable requirements; credential/key handling depends on **AR-052**.
3. `RecoverabilityRequirements.md` RC-017 (work locally, sync on return) is realized by this approach.
4. No third-party sync dependency is admitted; any library used for transport is admitted via the ThirdPartyComponentRegister and must satisfy ADR-005.
5. A follow-up architecture document records the concrete protocol; this ADR governs its constraints.

## 7. Risks

| Risk | Likelihood | Impact | Notes |
|---|---|---|---|
| Deferring the protocol slows a concrete multi-device demo. | Medium | Low | Invariants are enough to prototype a simple sync; the full protocol follows in architecture. |
| No-auto-merge creates friction for heavy concurrent editing. | Medium | Medium | Accepted deliberately (DB-011); the collaborative-editing mode (ADR-007 §4.3) surfaces conflicts rather than merging. |
| Authenticated transport depends on unresolved key management (AR-052). | Medium | High | Transport security design follows AR-052 resolution; the invariant is fixed regardless. |

## 8. Related Requirements

- `03-Architecture/SystemArchitecture.md`, `DatabaseArchitecture.md`, `DeploymentArchitecture.md`
- `02-Requirements/SecurityRequirements.md` (transport auth, audit)
- `02-Requirements/RecoverabilityRequirements.md` RC-017
- ADR-002, ADR-005, ADR-007 (§4.3 collaborative editing), ADR-010

## 9. Assumptions Updated

- **AR-052** (key/credential management) remains Open and gates the concrete transport-security design, not the invariants here.
- No numeric sync-timing target is set; any such target remains under AR-076.
- New open item: the concrete synchronization protocol (change-log, conflict detection, resumability) is to be designed in `03-Architecture/`, tracked as a new assumption on ratification.

## 10. Challenge the Design

1. Are the five invariants sufficient to fully constrain a safe sync design, or is one missing (e.g., ordering guarantees, idempotency)?
2. Does deferring the protocol risk any invariant being weakened during architecture work? (Invariants are ratified precisely to prevent that.)
3. Is there any legitimate sync scenario that would require crossing the isolation boundary? (There must not be, per ADR-002.)
4. Does the no-auto-merge rule interact cleanly with the collaborative-editing mode (ADR-007 §4.3)?

## 11. Revision History

| Version | Date | Summary | Author |
|---|---|---|---|
| 0.1.0 | 2026-07-20 | Initial ADR-012 (Proposed): ratify the synchronization invariants — offline-first, in-organization only (ADR-002), no auto-merge (DB-011), authenticated/encrypted transport, fully audited and transparent — and defer the concrete change-log/conflict-detection/resumability protocol to 03-Architecture. Rejects third-party sync frameworks as incompatible with the isolation and no-auto-merge invariants. Transport security gated on AR-052. | Dr Ziyaad Moolla (ZM) |
| 0.2.0 | 2026-07-20 | Ratified by the Product Owner. Status Proposed → Accepted: the synchronization invariants are ratified; the concrete protocol is designed in 03-Architecture within them. Transport security remains gated on AR-052. | Dr Ziyaad Moolla (ZM) |

---

*End of Document — PEKB-00-GOV-025 — ADR-012 — Synchronization Approach — PE-2026.001-ZM*
