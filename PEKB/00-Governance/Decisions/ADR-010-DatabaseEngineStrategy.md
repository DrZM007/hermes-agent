# ADR-010 — Database Engine Strategy

## Document Metadata

| Field | Value |
|---|---|
| Document ID | PEKB-00-GOV-023 |
| Decision ID | ADR-010 |
| Document Title | Database Engine Strategy |
| PEKB Section | 00-Governance/Decisions |
| Version | 0.2.0 |
| Status | Accepted |
| Classification | Internal — Governance |
| Owner Role | Database Architect |
| Approval Required From | Product Owner (Dr Ziyaad Moolla), Principal Software Architect, Security Architect, DevOps/Deployment Engineer |
| Related Documents | ProjectConstitution.md, AssumptionsRegister.md (00-Governance); ADR-002-DeploymentModel.md, ADR-005-EnterpriseCompatibilityZeroITFriction.md, ADR-006-DataClassificationTwoAxisModel.md, ADR-007-TranscriptRecordLifecycle.md (00-Governance/Decisions); DatabaseArchitecture.md (03-Architecture); SecurityRequirements.md, ThirdPartyComponentRegister.md (02/05) |
| Original Creator | Dr Ziyaad Moolla |
| Creator ID | ZM |
| Document Provenance | PE-2026.001-ZM |

---

## 1. Context

`03-Architecture/DatabaseArchitecture.md` defines a lifecycle-state-driven storage model across two placements — the local device and the organization-controlled shared component — but deliberately did not select a database engine. **ADR-005** requires that the desktop client operate with no server process and no administrator rights, while **ADR-002** permits the organization shared component to be IT-administered. This ADR selects the engine(s) for each placement. **Ratified by the Product Owner on 2026-07-20.**

## 2. Problem

Select database engine(s) that (a) let the desktop store operate embedded, encrypted, and server-less under ADR-005; (b) give the organization shared component a robust multi-user engine under ADR-002; and (c) support the append-only revision model, two-axis classification, and records lifecycle already ratified.

## 3. Options Considered

### Option A — SQLite (local, encrypted) + PostgreSQL (shared), SQL Server supported
- **Pros:** SQLite is embedded, file-based, server-less, and runs with no admin rights — an exact fit for the desktop under ADR-005; encryptable at rest (e.g., SQLCipher-style). PostgreSQL is a strong, widely-supported, license-friendly engine for the shared component. Matches the hybrid topology (DA-009) and the briefing's tiering. Two engines, but each is the right tool for its placement.
- **Cons:** Two engines to support; schema/migration discipline must keep them aligned.

### Option B — SQLite (local) + SQL Server (shared)
- **Pros:** Same server-less local story; best where target organizations already standardize on SQL Server estates and IT prefers it.
- **Cons:** SQL Server licensing/operational assumptions per organization; less license-flexible as a default than PostgreSQL.

### Option C — PostgreSQL everywhere
- **Pros:** One engine end-to-end; simplest mental model.
- **Cons:** A local PostgreSQL requires a running server process and service management — in direct tension with the desktop Zero-IT-Friction constraint (ADR-005 §4). Rejected as the local engine for that reason.

## 4. Decision

**Option A.**

1. **Local desktop placement:** an embedded, server-less, encrypted-at-rest SQLite database, running in the standard-user session with no admin rights (ADR-005).
2. **Organization shared component placement:** PostgreSQL as the default engine, with **SQL Server supported as a first-class alternative** for organizations that standardize on it (Option B becomes a supported configuration, not a separate decision).
3. Both placements implement the ratified data model: append-only revisions (DB-008–DB-011), two-axis classification (ADR-006), and the records lifecycle including disposal (ADR-007).
4. Engine-specific encryption/key handling remains subject to the open key-management assumption **AR-052**; this ADR selects engines, not the key-management mechanism.

## 5. Rationale

The two placements have genuinely different constraints, so the right answer is two engines matched to them: SQLite because it is the only option that satisfies the desktop's server-less/no-admin requirement cleanly, and PostgreSQL because it is a robust, license-friendly default for the shared component while leaving SQL Server available where an organization prefers it. Option C's single-engine simplicity is outweighed by its violation of the desktop constraint. This keeps the strongest ratified constraint (ADR-005) satisfied without compromising the shared component's robustness.

## 6. Consequences

1. `03-Architecture/DatabaseArchitecture.md` binds each placement to its engine and defines the migration discipline that keeps the two schemas aligned.
2. Selected engine libraries and encryption components are admitted via `05-Engineering/ThirdPartyComponentRegister.md`.
3. `SecurityRequirements.md` encryption requirements (SR-023/SR-025) apply to both engines; the local SQLite store must be encrypted at rest.
4. The sync approach (ADR-012) must reconcile the two engines' representations without auto-merging conflicts (DB-011).
5. Key management for encryption remains **AR-052** and is not resolved here.

## 7. Risks

| Risk | Likelihood | Impact | Notes |
|---|---|---|---|
| Two-engine support increases schema/migration maintenance. | Medium | Medium | Data access through a repository layer (per engineering standards) isolates engine differences; a shared migration discipline is required. |
| SQLite limits at very large local data volumes. | Low | Medium | Local store is per-device and lifecycle-bounded; the shared component holds the organizational corpus. |
| Encryption-at-rest depends on unresolved key management (AR-052). | Medium | High | Engine choice does not resolve AR-052; encryption design must follow once AR-052 is decided. |

## 8. Related Requirements

- `03-Architecture/DatabaseArchitecture.md`
- `02-Requirements/SecurityRequirements.md` (SR-023/SR-025 encryption; SR-076–077 disposal)
- ADR-002, ADR-005, ADR-006, ADR-007
- `05-Engineering/ThirdPartyComponentRegister.md`

## 9. Assumptions Updated

- Partially informs **AR-003** (technology stack) for the database dimension, pending ratification.
- **AR-052** (key management) remains Open; this ADR explicitly does not resolve it.

## 10. Challenge the Design

1. Is two engines genuinely justified, or could one engine (with an embedded mode) serve both placements without breaching ADR-005?
2. Should PostgreSQL or SQL Server be the default for the shared component, given the likely target organizations?
3. Does the append-only + disposal model impose any engine-specific constraint that changes the ranking?
4. Is the AR-052 dependency correctly isolated from this engine choice?

## 11. Revision History

| Version | Date | Summary | Author |
|---|---|---|---|
| 0.1.0 | 2026-07-20 | Initial ADR-010 (Proposed): recommend encrypted embedded SQLite for the server-less/no-admin desktop placement and PostgreSQL (default) with SQL Server supported for the organization shared component. Rejects single-engine PostgreSQL-everywhere because a local server process breaches ADR-005. Engine choice only; key management remains AR-052. | Dr Ziyaad Moolla (ZM) |
| 0.2.0 | 2026-07-20 | Ratified by the Product Owner. Status Proposed → Accepted; database dimension of AR-003 resolved (SQLite local + PostgreSQL shared, SQL Server supported). Key management remains AR-052. | Dr Ziyaad Moolla (ZM) |

---

*End of Document — PEKB-00-GOV-023 — ADR-010 — Database Engine Strategy — PE-2026.001-ZM*
