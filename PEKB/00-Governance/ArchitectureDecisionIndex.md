# Project Echo — Architecture Decision Index

## Document Metadata

| Field | Value |
|---|---|
| Document ID | PEKB-00-GOV-014 |
| Document Title | Architecture Decision Index |
| PEKB Section | 00-Governance |
| Version | 0.1.0 |
| Status | Draft |
| Classification | Internal — Governance |
| Owner Role | Principal Software Architect |
| Approval Required From | Technical Documentation Lead |
| Related Documents | ADR-001–ADR-004 (00-Governance/Decisions); all 03-Architecture documents; PrivacyRequirements.md, FunctionalRequirements.md (02-Requirements); ArchitectureBaselineReview.md |
| Original Creator | Dr Ziyaad Moolla |
| Creator ID | ZM |
| Document Provenance | PE-2026.001-ZM |

---

## 1. Purpose of This Document and Structural Note

This document is a lightweight, at-a-glance index of Project Echo's significant architectural decisions and where each is authoritatively defined. It is not itself an authoritative source for any decision — it is a navigation aid so a contributor can quickly locate the governing document for a given decision without reading the full architecture set.

This document was not in the original PEKB structure and is added here on the Principal Software Architect's recommendation, following completion of the `03-Architecture/` phase. It is placed in `00-Governance/` (alongside `Glossary.md`, which it complements) rather than `03-Architecture/`, because it indexes decisions spanning governance, requirements, and architecture, not architecture alone. Per `00-Governance/DocumentStandards.md` §5 (Single Source of Truth), every entry below **links to**, and never restates in a conflicting way, its authoritative source — if this index and its source document ever disagree, the source document governs, and the discrepancy is a defect in this index to be corrected.

## 2. How to Use This Index

1. Find the decision area you need in the table (Section 3).
2. Follow the **Source** reference to the authoritative document and section.
3. If you need the *reasoning* behind a decision, the source document's own Rationale/Context sections are authoritative — this index states *what* was decided and *where*, not *why*, beyond a one-line summary.
4. If a decision is not yet made (still an open assumption), it will not appear here — check `00-Governance/AssumptionsRegister.md` instead.

## 3. Decision Index

| # | Decision | One-Line Summary | Authoritative Source |
|---|---|---|---|
| 1 | Offline-First Hybrid AI Processing | Every AI capability has a default offline path; networked processing is an explicit, organization-level, audited opt-in only. | ADR-001-AIProcessingModel.md |
| 2 | Per-Organization Isolated Deployment | Each organization's deployment is isolated by default; any boundary crossing requires the same governed-exception discipline. | ADR-002-DeploymentModel.md |
| 3 | Organization Owns Data | The adopting organization owns all recordings/transcripts/outputs; Project Echo is a processor only; users act under delegated authority. | ADR-003-DataOwnershipGovernance.md |
| 4 | Access Control / RBAC Model | Eight baseline roles with mandatory separations of duties (System Administrator excluded from content access, Reviewer/Approver separated by default, Auditor independent). Extended by constrained custom roles (see 4b). | ADR-004-AccessControlRBACModel.md |
| 4a | Enterprise Compatibility / Zero-IT-Friction | Binding constraints for the desktop client (no admin rights, no container/Docker/WSL dependency, offline-capable, deployable by MSI/silent/GPO/Intune/SCCM), scoped away from the IT-administered shared component, enforced by a Compatibility Certification release gate. | ADR-005-EnterpriseCompatibilityZeroITFriction.md |
| 4b | Constrained Custom Roles | Organizations may define custom roles only as bounded compositions/restrictions of baseline permissions, validated at definition time; never violating a mandatory separation of duties or exceeding the baseline permission union. "Expanded roles" are custom roles/scopes/modes, not new baseline roles. | ADR-008-ConstrainedCustomRoles.md |
| 5 | Data Classification — Two-Axis Model | Axis 1: four data-classification levels C1–C4 (Organizational Confidential, Personal Information, Sensitive Personal Information, Audit/Governance Metadata) — privacy/data-type. Axis 2: five sensitivity labels (Public→Highly Restricted) — business handling sensitivity. Orthogonal; more-restrictive-of-the-two governs. | PrivacyRequirements.md §6 (Axis 1); ADR-006-DataClassificationTwoAxisModel.md (model + Axis 2) |
| 6 | Transcript & Record Lifecycle | Recording Received → Processing → Draft Transcript → Review Required → Reviewed → Approved → Archived → Eligible for Disposal → Disposed, with defined backward transitions. Multi-stage approval = configurable sub-process (not new states); collaborative editing = mode within review states; Legal Hold = overlay suspending disposal. | FunctionalRequirements.md §3.1; ADR-007-TranscriptRecordLifecycle.md |
| 7 | Deployment Topology | Hybrid: local-first desktop client + organization-controlled shared component (not vendor-hosted, not thin-client-only). | DeploymentArchitecture.md §4.4 (DA-009) |
| 8 | Isolation Boundary (Technical Definition) | The boundary is all infrastructure exclusively controlled by one organization plus its network perimeter; a violation is any classified-data flow crossing it outside the governed exceptions. | DeploymentArchitecture.md §3.1 (DA-005) |
| 9 | Logical Component Architecture | Eight components: Desktop Client, Local Processing Layer, AI Processing Layer, Organization Shared Component, Storage Layer, Identity and Access Layer, Audit Layer, Update Management. | SystemArchitecture.md §4 |
| 10 | Identity and Access Layer as Sole Authorization Point | Every component defers to one architecturally independent layer for authorization; no component implements parallel access logic. | SystemArchitecture.md SA-014, SA-030 |
| 11 | Identity Delegation | Authentication is federated to the organization's existing enterprise identity system rather than a Project-Echo-issued credential store. | SecurityArchitecture.md §3 (SEC-005) |
| 12 | Envelope Encryption Architecture | Per-asset data encryption keys (DEKs) wrapped by key-encryption keys (KEKs) scoped per-device (local) or per-organization (shared); no algorithm selected at this stage. | SecurityArchitecture.md §5 |
| 13 | Independent, Tamper-Resistant Audit Layer | The Audit Layer is architecturally separate from every role it records; no privileged role can modify or delete an audit entry through any code path. | SecurityArchitecture.md SEC-029; SystemArchitecture.md SA-030 |
| 14 | AI Capability Modularity | AI capabilities are discrete, independently versioned modules with a uniform draft-in/draft-out contract and no side channels to storage, config, or workflow state. | AIArchitecture.md §3 (AI-ARCH-005–006) |
| 15 | AI Processing Pipeline (No Bypass) | Input → Processing → Output → Human Review → Approved Usage, with no structural path skipping human review. | AIArchitecture.md §5 (AI-ARCH-014) |
| 16 | Cross-Organization AI Isolation | Per-organization processing sessions with no cross-session data-bearing state; shared model weights permitted only because training restrictions keep organizational data out of them. | AIArchitecture.md §4.2 (AI-ARCH-011) |
| 17 | Speaker Separation vs. Speaker Recognition | Per-meeting diarization (C2, default-on) is architecturally distinct from persistent cross-meeting recognition (C3, opt-in only, recommended excluded from initial release). | AIArchitecture.md §7 (AI-ARCH-019–020) |
| 18 | Database Authority Model | Storage authority is lifecycle-state-driven across two placements (local device, organization shared component); seven logical data domains each with distinct classification/retention/sync behavior. | DatabaseArchitecture.md §2–3 |
| 19 | Append-Only Revision Architecture | Every transcript edit creates an immutable revision; approval creates a lock marker; conflicts are surfaced for human resolution, never auto-merged. | DatabaseArchitecture.md §5 (DB-008–DB-011), §12 (DB-032) |
| 20 | Desktop Runtime Model | Two-part runtime (interactive + background), entirely within the standard-user session, no administrator elevation ever required. | DesktopArchitecture.md §3 (DT-005–DT-007) |
| 21 | Threat Model Placement | The Threat Model is hosted in `03-Architecture/` (not the originally-planned `06-Security/`) since it functions as an architecture input document. | ThreatModel.md §0; see AR-085 |
| 22 | Desktop Application Stack | Native .NET (C#) with WinUI 3 / WPF fallback for the Windows desktop client — lightest fit for the ADR-005 managed, CPU-only, no-admin environment; Windows-only under AR-086. | ADR-009-DesktopApplicationStack.md |
| 23 | Database Engine Strategy | Encrypted embedded SQLite (local, server-less) + PostgreSQL default for the organization shared component, SQL Server supported. | ADR-010-DatabaseEngineStrategy.md |
| 24 | Offline Transcription Engine Strategy | Transcription abstraction layer committed (vendor-independence); the concrete default engine is deferred until benchmarked on CPU-only hardware (AR-076). whisper.cpp-family / faster-whisper are candidates. | ADR-011-OfflineTranscriptionEngineStrategy.md |
| 25 | Synchronization Approach | Sync invariants ratified (offline-first, in-organization only, no auto-merge, authenticated, audited); the concrete protocol is deferred to 03-Architecture. | ADR-012-SynchronizationApproach.md |

## 4. Relationship to Other PEKB Documents

- This index is derived entirely from the documents in Column 4 (Section 3); it has no independent authority and must be corrected, not argued with, if it ever diverges from its source.
- `00-Governance/Glossary.md` indexes *terminology*; this document indexes *decisions*. The two are complementary and should both be consulted by a new contributor.
- `00-Governance/AssumptionsRegister.md` indexes *unresolved* questions; this document indexes *resolved* ones. A decision should move from the Register to this Index only once formally resolved (see `RevisionPolicy.md` §2 for what "resolved" requires).
- `03-Architecture/ArchitectureBaselineReview.md` is the review that prompted this index's creation; future architecture reviews should confirm this index remains accurate as new decisions are made.
- This index should be updated whenever a new significant decision is ratified (a new ADR, a major architecture document, or a Design/Engineering decision judged significant enough to warrant inclusion) — it is a living reference, not a one-time snapshot.

---

*End of Document — PEKB-00-GOV-014 — Project Echo Architecture Decision Index — PE-2026.001-ZM*
