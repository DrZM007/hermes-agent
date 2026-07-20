# Project Echo — Database Architecture

## Document Metadata

| Field | Value |
|---|---|
| Document ID | PEKB-03-ARC-006 |
| Document Title | Database Architecture |
| PEKB Section | 03-Architecture |
| Version | 0.1.0 |
| Status | Draft |
| Classification | Internal — Architecture |
| Owner Role | Database Architect |
| Approval Required From | Principal Software Architect, Security Architect, Privacy Officer, AI/ML Architect |
| Related Documents | SystemArchitecture.md, SecurityArchitecture.md, AIArchitecture.md, DeploymentArchitecture.md, ThreatModel.md (03-Architecture); PrivacyRequirements.md, SecurityRequirements.md, FunctionalRequirements.md, NonFunctionalRequirements.md (02-Requirements); AssumptionsRegister.md (00-Governance) |
| Original Creator | Dr Ziyaad Moolla |
| Creator ID | ZM |
| Document Provenance | PE-2026.001-ZM |

---

## 1. Purpose and Scope of This Document

This document defines the logical persistence architecture for Project Echo's Storage Layer (`SystemArchitecture.md` SA-013): what is stored, how it is logically organized, how classification/encryption/retention/synchronization apply to it, and what structural guarantees storage must provide. It selects no SQL engine, NoSQL product, cloud database, vendor, or technology, and invents no storage limits or capacities — those belong to `05-Engineering/` and to the resolution of AR-081/AR-082.

This document uses the identifier format `DB-<###>`, following the established PEKB precedent.

## 2. Storage Architecture

**DB-001** — Persistence exists in exactly two placements, per `DeploymentArchitecture.md` §5: **local storage** on each end-user device (working data for capture, offline processing, and in-progress review) and **shared storage** on the Organization Shared Component (authoritative Approved/Archived records, organization-wide configuration, aggregated audit). Both placements are inside the organization's isolation boundary (DA-005).
*Priority:* Critical. *Traceability:* DeploymentArchitecture.md §5, DA-005; SystemArchitecture.md SA-013.

**DB-002** — The authoritative copy of a record is placement-dependent on lifecycle state: local storage is authoritative for content in Recording Received through Reviewed states still in progress on a device; shared storage becomes authoritative at the point a transcript requires cross-user visibility and permanently from Approved state onward (`SystemArchitecture.md` SA-017).
*Priority:* Critical. *Rationale:* A single always-authoritative location would either break offline-first (if shared) or break cross-user search/administration (if local); authority tied to lifecycle state follows the flow already defined in SA-017. *Traceability:* SystemArchitecture.md SA-017; FunctionalRequirements.md §3.1.

**DB-003** — All storage access passes through the Identity and Access Layer's authorization (`SystemArchitecture.md` SA-014); the persistence layer itself exposes no query or retrieval path that bypasses it, addressing `ThreatModel.md` TM-006 in combination with encryption at rest (Section 9).
*Priority:* Critical. *Traceability:* SystemArchitecture.md SA-014; ThreatModel.md TM-006.

## 3. Logical Data Domains

**DB-004** — Persistent data is organized into seven logical domains, each with distinct classification, retention, and synchronization behavior. Domains are logical boundaries, not physical products.

| Domain | Contents | Primary Placement |
|---|---|---|
| **Media** | Raw audio recordings (captured or imported) | Local during processing; shared/archival per retention configuration |
| **Transcript** | Transcript content, revision history, uncertainty flags, review-progress state | Local while in review; shared from Approved |
| **Annotation** | Comments, notes, section flags | Follows its parent transcript |
| **Derived Artifacts** | Summaries, key points, decisions, action items, and their confirmation status | Follows source transcript |
| **Identity & Policy** | User accounts, role/scope assignments, organization configuration (retention rules, opt-in states, consent records) | Shared (authoritative), cached read-only locally for offline authorization |
| **Audit** | Immutable event records (C4) | Local write-ahead, aggregated to shared (Section 6) |
| **AI Provenance** | Capability/model-version/processing-path/review-status metadata per artifact (AIArchitecture.md AI-ARCH-002) | Stored with the artifact it describes |

*Priority:* Critical. *Traceability:* SystemArchitecture.md §4; AIArchitecture.md AI-ARCH-002; FunctionalRequirements.md §5, §9, §12.

**DB-005** — Cross-domain references are one-directional from dependent to source (e.g., a Derived Artifact references its source Transcript revision; an Audit record references the object it describes) so that deleting content never leaves the Audit domain dangling and never requires cascading deletion into Audit (per `SecurityRequirements.md` SR-044).
*Priority:* Critical. *Traceability:* SecurityRequirements.md SR-044; PrivacyRequirements.md PR-044.

## 4. Classification Mapping

**DB-006** — Every stored object carries its classification level (C1–C4 per `PrivacyRequirements.md` §6.1) as an intrinsic, non-optional attribute set at creation, not inferred at read time.

| Domain | Default Classification |
|---|---|
| Media | C2 minimum (PR-019); C3 where sensitive content is identified |
| Transcript / Annotation / Derived Artifacts | Inherits source (PR-036); C2 minimum |
| Identity & Policy | C1 (configuration) / C2 (personal account data) |
| Audit | C4 |
| AI Provenance | C1 (metadata only; must never embed content excerpts that would raise its classification) |
| Voice profiles (only if speaker recognition is ever approved per AR-060) | C3, stored as a distinct separately-encrypted asset class (AIArchitecture.md AI-ARCH-021) |

*Priority:* Critical. *Traceability:* PrivacyRequirements.md §6.1, PR-019, PR-036; AIArchitecture.md AI-ARCH-021.

**DB-007** — Classification governs handling automatically: export gating (C3's additional approval per PR-048), retention rules (Section 10), and audit granularity (PR-052's classification-in-log-entry requirement) all key off the stored classification attribute rather than per-feature judgment.
*Priority:* Critical. *Traceability:* PrivacyRequirements.md PR-048, PR-052.

## 5. Transcript Revision Architecture

**DB-008** — Transcript storage is **append-only at the revision level**: every edit, correction, speaker-label change, or state transition creates a new immutable revision entry referencing its predecessor; no revision is ever updated in place or deleted by any role, including System Administrator and Organization Administrator (`SecurityRequirements.md` SR-043; `FunctionalRequirements.md` FR-041).
*Priority:* Critical. *Traceability:* SecurityRequirements.md SR-034, SR-043; FunctionalRequirements.md FR-038, FR-041.

**DB-009** — Each revision entry records: the content delta or full snapshot (mechanism deferred to implementation), the acting user identity and role at time of edit, a timestamp, the workflow state at which the edit occurred, and whether the changed content originated as AI-generated or human-entered — sufficient to reconstruct any prior revision and to render the AI/human/uncertain distinctions required by `UXRequirements.md` UX-028.
*Priority:* Critical. *Traceability:* SecurityRequirements.md SR-034; UXRequirements.md UX-028; FunctionalRequirements.md FR-039.

**DB-010** — The original AI-generated Draft Transcript is revision zero and is permanently retained within the revision chain for as long as the transcript exists, so comparison against the AI original (`FunctionalRequirements.md` FR-026/FR-039) is always possible.
*Priority:* High. *Traceability:* FunctionalRequirements.md FR-026, FR-038–FR-039.

**DB-011** — Approval creates a **lock marker** on the revision chain: post-approval revisions can only be appended following an audited re-opening event (`SecurityRequirements.md` SR-035), and the locked-at revision remains permanently identifiable as "the approved record as of approval."
*Priority:* Critical. *Traceability:* SecurityRequirements.md SR-035; FunctionalRequirements.md FR-053–FR-054; ADR-003 §4.2.

## 6. Audit Storage

**DB-012** — Audit storage is **append-only and structurally isolated** from all other domains: no shared write path, no shared deletion mechanism, and no role — including the most privileged — holds modify/delete capability over written entries, per `SecurityRequirements.md` SR-043 and `SystemArchitecture.md` SA-030's architectural independence of the Audit Layer.
*Priority:* Critical. *Traceability:* SecurityRequirements.md SR-043; SystemArchitecture.md SA-015, SA-030; ThreatModel.md TM-011.

**DB-013** — Audit entries are written locally first (write-ahead, so offline actions are captured) and aggregated to shared audit storage upon connectivity; an action shall not complete if its audit entry cannot be durably written at least locally (`NonFunctionalRequirements.md` NFR-035).
*Priority:* Critical. *Traceability:* NonFunctionalRequirements.md NFR-035; DeploymentArchitecture.md §5.

**DB-014** — Audit retention is independent of content retention: deleting content (Media/Transcript/Derived) never deletes the audit entries describing it, and audit entries follow their own retention schedule per `07-Privacy-Compliance/RetentionPolicy.md` (pending, AR-062).
*Priority:* Critical. *Traceability:* SecurityRequirements.md SR-044; PrivacyRequirements.md PR-040, PR-044.

**DB-015** — Audit entries store references and metadata about affected objects, never content excerpts, so Auditor-role access to audit storage does not constitute content access (`SecurityRequirements.md` SR-020; ADR-004 §4.1).
*Priority:* Critical. *Traceability:* SecurityRequirements.md SR-020; ADR-004 §4.1 (Auditor row).

## 7. AI Metadata Storage

**DB-016** — AI provenance metadata (capability, model version, processing path, review status per `AIArchitecture.md` AI-ARCH-002) is stored inseparably with the artifact it describes: an artifact cannot be read without its provenance being available, and provenance cannot be altered independently of an audited revision event.
*Priority:* Critical. *Traceability:* AIArchitecture.md AI-ARCH-002, AI-ARCH-016; AIRequirements.md AI-051–AI-053.

**DB-017** — Per-segment confidence metadata produced by transcription (`AIArchitecture.md` AI-ARCH-007) is stored alongside the revision it applies to, at whatever granularity AR-072's resolution defines; the storage design accommodates segment-level metadata without prescribing the granularity now.
*Priority:* High. *Traceability:* AIRequirements.md AI-024; AssumptionsRegister.md AR-072.

**DB-018** — The correction-pattern data used by the AI Improvement Loop's detection stage (`AIArchitecture.md` AI-ARCH-027) is a derived, minimized dataset (error categories, not content), stored in the AI Provenance domain, reviewable by the organization, and excluded from any automatic outbound flow.
*Priority:* High. *Traceability:* AIArchitecture.md AI-ARCH-027; PrivacyRequirements.md PR-037–PR-038.

## 8. Search Index Architecture

**DB-019** — The search index over Approved/Archived content (`FunctionalRequirements.md` §13) resides on the Organization Shared Component and is a **derived structure**: it can always be rebuilt from the authoritative domains and is never itself an authoritative record.
*Priority:* High. *Traceability:* FunctionalRequirements.md §13; SystemArchitecture.md SA-012.

**DB-020** — Index entries carry the classification and authorization scope of their source objects, and queries are evaluated against the querying user's role/scope **before** index consultation, consistent with `AIArchitecture.md` AI-ARCH-007's corpus-level (not post-filter) authorization model — an unauthorized user's query never touches index entries outside their scope.
*Priority:* Critical. *Traceability:* AIArchitecture.md AI-ARCH-007; FunctionalRequirements.md FR-068; SecurityRequirements.md SR-014.

**DB-021** — Deletion or retention-driven removal of source content propagates to the index within the same reclamation cycle (Section 10), so deleted content is not discoverable through stale index entries.
*Priority:* Critical. *Traceability:* PrivacyRequirements.md §16; NonFunctionalRequirements.md NFR-045.

## 9. Encryption Boundaries

**DB-022** — All C2/C3/C4 data is encrypted at rest in both placements (local and shared), per `SecurityRequirements.md` SR-023, using the key hierarchy defined in `SecurityArchitecture.md` (which resolved AR-052); this document adds no new cryptographic decisions and names no algorithms.
*Priority:* Critical. *Traceability:* SecurityRequirements.md SR-023; SecurityArchitecture.md §4 (Encryption Architecture).

**DB-023** — Encryption boundaries align with logical domains: each domain's data is encrypted under domain-appropriate keys within `SecurityArchitecture.md`'s hierarchy, such that (a) compromise of one device's local keys does not expose shared storage or other devices (`SecurityRequirements.md` SR-025), and (b) the C3 voice-profile asset class (if ever created) is independently encrypted and independently destroyable (`AIArchitecture.md` AI-ARCH-021).
*Priority:* Critical. *Traceability:* SecurityRequirements.md SR-025; AIArchitecture.md AI-ARCH-021; ThreatModel.md TM-001.

**DB-024** — Key destruction is an architecturally supported deletion mechanism: where physical erasure of storage cannot be guaranteed (e.g., backups), rendering data unreadable by destroying its keys is an acceptable deletion pathway, subject to `SecurityArchitecture.md`'s key lifecycle rules.
*Priority:* High. *Traceability:* PrivacyRequirements.md §16; SecurityArchitecture.md §4.

## 10. Retention Architecture

**DB-025** — Retention is enforced at the domain level using each object's classification and lifecycle state: retention rules (organization-configured within product bounds, per `PrivacyRequirements.md` PR-041) are evaluated by a retention process on the Organization Shared Component, which drives Approved → Archived transitions (`FunctionalRequirements.md` FR-055) and eventual disposal.
*Priority:* Critical. *Traceability:* PrivacyRequirements.md PR-040–PR-041; FunctionalRequirements.md FR-055.

**DB-026** — Disposal is complete across placements: retention-driven or request-driven deletion removes the object from shared storage, propagates removal instructions to local caches/copies on next synchronization, removes derived index entries (DB-021), and where a backup copy cannot be individually erased, applies key destruction (DB-024). The audit record of the disposal persists (DB-014).
*Priority:* Critical. *Traceability:* PrivacyRequirements.md PR-045–PR-046; SecurityRequirements.md SR-044.

**DB-027** — Specific retention period values, storage growth expectations, and reclamation timeframes are not defined here; they remain governed by open items AR-062 and AR-082 and by `07-Privacy-Compliance/RetentionPolicy.md` (pending).
*Priority:* N/A (deferral notice). *Traceability:* AssumptionsRegister.md AR-062, AR-082.

## 11. Backup / Recovery Architecture

**DB-028** — Backups cover shared storage (authoritative Approved/Archived content, Identity & Policy, aggregated Audit) and are encrypted, access-controlled, and organization-isolated identically to primary data (`SecurityRequirements.md` SR-060); local device storage is treated as reconstructible working state, not a backup target, once content has synchronized to shared storage.
*Priority:* Critical. *Traceability:* SecurityRequirements.md SR-060; ThreatModel.md TM-013.

**DB-029** — Recovery restores data through the same authorization and encryption model as normal operation — no recovery mode grants unscoped access (`SecurityRequirements.md` SR-061) — and restores the audit domain alongside content domains so that recovery cannot be used to shed audit history.
*Priority:* Critical. *Traceability:* SecurityRequirements.md SR-061; AcceptanceCriteria.md AC-041.

**DB-030** — Backup frequency, retention of backup generations, and disaster-recovery procedures are not defined here; they remain deferred to `08-Operations/DisasterRecovery.md` per AR-056.
*Priority:* N/A (deferral notice). *Traceability:* AssumptionsRegister.md AR-056.

## 12. Synchronization Architecture

**DB-031** — Synchronization between local and shared storage is **state-driven, not continuous mirroring**: content synchronizes to shared storage when its lifecycle state requires cross-user visibility (per DB-002), and policy/identity data synchronizes down to devices as read-only caches for offline authorization. Full-content replication of all organizational data to every device is architecturally prohibited (it would multiply the TM-001 device-loss exposure).
*Priority:* Critical. *Traceability:* SystemArchitecture.md SA-017, SA-025; ThreatModel.md TM-001; DeploymentArchitecture.md DA-011.

**DB-032** — Offline actions (edits, comments, state transitions performed without connectivity) queue durably on the device with their audit entries (DB-013) and reconcile on reconnection. Because scoped role assignment (ADR-004 §4.2.3) makes concurrent editing of the same transcript by the same role uncommon, conflicts are handled by revision-chain append: concurrent revisions are both preserved append-only (DB-008) and surfaced to the Reviewer for human resolution — never silently auto-merged.
*Priority:* Critical. *Rationale:* Append-only revisions make "conflict" a presentation problem for a human to resolve rather than a data-loss risk, consistent with Human Authority — the system never decides which human's edit wins. *Traceability:* SecurityRequirements.md SR-034; ProjectConstitution.md §3.2; FunctionalRequirements.md §3.1.

**DB-033** — Synchronization transport occurs entirely within the isolation boundary (Desktop Client ↔ Organization Shared Component, per `DeploymentArchitecture.md` DA-013a) and carries classification metadata with every object so the receiving placement applies correct handling immediately.
*Priority:* Critical. *Traceability:* DeploymentArchitecture.md DA-013; SystemArchitecture.md SA-026.

**DB-034** — A stale offline authorization cache (DB-031) shall fail toward restriction: where a device cannot confirm current role assignments within a bounded staleness window, consequential actions (approval, export) are deferred until reconnection rather than performed on stale authority. The specific staleness window is an implementation decision, not defined here.
*Priority:* High. *Traceability:* SecurityRequirements.md SR-017 (default-deny); ADR-004 §4.2.

## 13. Deferred Decisions

- **Storage technology selection** (engines, products, formats) — deferred to `05-Engineering/`, per this document's scope constraints.
- **Delta-vs-snapshot revision encoding** (DB-009) — implementation decision.
- **Confidence metadata granularity** (DB-017) — pending AR-072.
- **Retention values and reclamation timeframes** (DB-027) — pending AR-062/AR-082 and `RetentionPolicy.md`.
- **Backup/DR procedures** (DB-030) — pending AR-056 and `08-Operations/DisasterRecovery.md`.
- **Scalability sizing** for shared storage and the search index — pending AR-081; no capacities invented here.
- **Offline authorization staleness window** (DB-034) — implementation decision, to be set alongside `SecurityArchitecture.md` session rules.

No new assumptions are introduced by this document; every deferred item above was already tracked (AR-056, AR-062, AR-072, AR-081, AR-082) or is a scoped implementation detail rather than a genuine new uncertainty.

## 14. Traceability Summary

Every requirement/decision traces to `SystemArchitecture.md`, `SecurityArchitecture.md`, `AIArchitecture.md`, `DeploymentArchitecture.md`, `ThreatModel.md`, or the `02-Requirements/` documents, per inline references. The nine mandated support properties are each architecturally located: immutable audit (DB-012–DB-015), complete revision history (DB-008–DB-011), offline-first synchronization (DB-031–DB-034), organization isolation (DB-001, DB-028, DB-033), AI provenance (DB-016–DB-018), transcript lifecycle (DB-002, DB-011, DB-025), RBAC (DB-003, DB-020, DB-034), encryption hierarchy (DB-022–DB-024), and C1–C4 classification (DB-006–DB-007). No database product, storage limit, or capacity is named.

## 15. Relationship to Other PEKB Documents

- `03-Architecture/DesktopArchitecture.md` (pending) must implement local storage, the offline queue, and the read-only policy cache (DB-031–DB-034) within endpoint constraints.
- `05-Engineering/` documents must select the concrete storage technologies satisfying this architecture.
- `07-Privacy-Compliance/RetentionPolicy.md` (pending) must supply the retention values DB-025–DB-027 enforce.
- `08-Operations/DisasterRecovery.md` (pending) must define the procedures DB-028–DB-030 constrain.

---

*End of Document — PEKB-03-ARC-006 — Project Echo Database Architecture — PE-2026.001-ZM*
