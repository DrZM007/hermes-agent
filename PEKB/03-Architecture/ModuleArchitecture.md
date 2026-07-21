# Project Echo — Module Architecture

## Document Metadata

| Field | Value |
|---|---|
| Document ID | PEKB-03-ARC-009 |
| Document Title | Module Architecture |
| PEKB Section | 03-Architecture |
| Version | 0.1.0 |
| Status | Draft |
| Classification | Internal — Architecture |
| Owner Role | Principal Software Architect |
| Approval Required From | Security Architect, AI/ML Architect, Database Architect, Privacy Officer, QA Lead |
| Related Documents | SystemArchitecture.md, DeploymentArchitecture.md, SecurityArchitecture.md, AIArchitecture.md, DatabaseArchitecture.md, DesktopArchitecture.md (03-Architecture); DesignPrinciples.md, ArchitectureDecisionIndex.md (00-Governance); ADR-002/005/006/007/008/009/010/011/012 (00-Governance/Decisions); GovernanceEngineRequirements.md, ReviewIntelligenceEngineRequirements.md, RecoverabilityRequirements.md, KnowledgeBaseRequirements.md, SOPLibraryRequirements.md, EvidenceComplianceRequirements.md, RedactionSecureSharingRequirements.md (02-Requirements) |
| Original Creator | Dr Ziyaad Moolla |
| Creator ID | ZM |
| Document Provenance | PE-2026.001-ZM |

---

## 1. Purpose and Scope

This document shows how the seven new-module capability areas (`01-Product/Scope.md` §2.13–2.19, specified in their respective `02-Requirements/` documents) integrate into Project Echo's **ratified architecture** — the eight logical components of `SystemArchitecture.md` §4, the layered model introduced in the product-owner briefing (Version 7), and the technology stack ratified in ADR-009–ADR-012.

Its altitude is *integration*: where each module lives, which components and layer it belongs to, its placement (local device vs. organization shared component), and which ratified services it must defer to. It does **not** specify per-screen, per-table, or per-endpoint detail — that is `04-Design/` work, which this document sets up. It introduces no new capability and no new authoritative source; every module's obligations remain defined in its requirements document.

## 2. Reference Structures

Two ratified structures describe the same system from different angles; the modules map onto both.

**Eight logical components** (`SystemArchitecture.md` §4): Desktop Client, Local Processing Layer, AI Processing Layer, Organization Shared Component, Storage Layer, Identity and Access Layer, Audit Layer, Update Management.

**Five layers** (briefing Version 7): Presentation, Application, AI, Security, Storage. These are a lens over the eight components, not a competing structure (per the ADR-006-adjacent reconciliation recorded in the briefing notes): e.g., the Identity and Access Layer and Audit Layer realize the Security layer; the Desktop Client hosts the Presentation layer.

## 3. Cross-Cutting Architectural Rules (apply to all seven modules)

**MA-001** — Every module defers to the **Identity and Access Layer** as the sole authorization point (`SystemArchitecture.md` SA-014, SA-030); no module implements parallel access logic. A module surfaces or acts on content only within the requesting user's authorization scope (ADR-004; ADR-008 for custom roles).
*Traceability:* SA-014/SA-030; ADR-004; ADR-008.

**MA-002** — Every consequential action a module performs is recorded in the independent, append-only **Audit Layer** (`SystemArchitecture.md` SA-015, SA-030); no module can modify or delete a prior audit entry.
*Traceability:* SA-015/SA-030; SecurityRequirements.md SR-041–SR-043.

**MA-003** — Organizational variation in module behavior is expressed as configuration evaluated by the **Governance & Policy Engine**, never as per-organization code (`GovernanceEngineRequirements.md` GE-001; DesignPrinciples.md §3.10).
*Traceability:* GE-001; DesignPrinciples.md §3.10.

**MA-004** — Every module honors the two-axis classification (ADR-006) and the isolation boundary (ADR-002): no module moves content across the organizational boundary except through the governed export path (Redaction & Secure Sharing module), and none relaxes a classification-driven control (more-restrictive-governs, SR-068).
*Traceability:* ADR-002; ADR-006; SR-066–SR-069.

**MA-005** — No module may weaken a safety-critical control (encryption, audit immutability, separation of duties, AI content-integrity guardrails, human-approval gate); such controls are not feature-flag-disableable (`GovernanceEngineRequirements.md` GE-020; EthicalAICharter.md §6.2).
*Traceability:* GE-020; EthicalAICharter.md §6.2.

## 4. Module-to-Architecture Mapping

| Module (Req doc) | Primary layer(s) | Component(s) | Placement | Key architectural notes |
|---|---|---|---|---|
| **Governance & Policy Engine** (GE) | Application / Security | Organization Shared Component; Identity & Access; Audit | Shared component (authoritative policy store); policy set cached to Desktop Client for **offline local enforcement** | Enforcement point for ADR-006 (Axis-2), ADR-007 §4.2 (approval stages), ADR-008 (custom-role validation). Config is explicit state (SA-032-style), versioned. |
| **Review Intelligence Engine** (RI) | Presentation / Application / AI | Desktop Client; Local Processing Layer; AI Processing Layer | **Local, offline-capable** (review happens on the desktop) | Read-only over transcripts; never writes the record (RI-001). Uses transcription/analysis behind the ADR-011 abstraction. All outputs marked AI-generated (SA-032) until human-confirmed. |
| **Recoverability** (RC) | Storage / Security | Storage Layer; Update Management; Desktop Client; Organization Shared Component | **Spans both** (local SQLite + shared PostgreSQL) | Backups/restore governed identically to primary data (no unscoped recovery mode, MA-001). Pre-update/pre-restore backups (Update Management). Graceful degradation (RC-017). |
| **Organization Knowledge Base** (KB) | Application / Storage | Organization Shared Component; Storage Layer; Identity & Access | Shared component (org-wide derived store); offline degrades to read of cached/local subset | Indexes **approved outputs only** (KB-001); search scoped and existence-hiding (MA-001). In-org only (MA-004). |
| **SOP / Reference Library** (SL) | Application / Storage | Organization Shared Component; Storage Layer; Identity & Access | Shared component; reference docs cached for side-by-side offline review | Distinct store from KB (reference vs. derived outputs). Access via Identity & Access; classification per ADR-006. |
| **Governance, Evidence & Compliance** (EV) | Application / Security | Audit Layer; Organization Shared Component; Storage Layer | Shared component; reads Audit Layer | Point-in-time **projections** over immutable audit + append-only revisions (EV-007); no new source of record. Auditor independence (ADR-004 §4.3.3). Export via RS. |
| **Redaction & Secure Sharing** (RS) | Application / Security | Desktop Client; Organization Shared Component; Security services | Spans both; the **only** path content crosses the isolation boundary | Redaction is append-only (original immutable, RS-004). Packages encrypted/signed (gated on AR-052). Every boundary crossing audited (MA-002, MA-004). |

## 5. Placement and Offline Behavior

**MA-006** — Modules whose authoritative data is org-wide (GE, KB, SL, EV) are hosted in the **Organization Shared Component**, but the desktop client must degrade gracefully when the shared component is unavailable (RC-017): policy enforcement continues from the cached policy set (GE), review continues locally (RI), and shared-component search (KB/SL) is unavailable-but-non-blocking rather than fatal.
*Traceability:* ADR-002 (DA-009 topology); ADR-005 §4.3; RecoverabilityRequirements.md RC-017; ADR-012 (sync).

**MA-007** — Review Intelligence (RI) is fully local and offline-capable, because core review/approval must function offline (ADR-001, ADR-005). Its AI analysis runs on the Local/AI Processing Layer behind the transcription abstraction (ADR-011), on the local encrypted SQLite store (ADR-010).
*Traceability:* ADR-001; ADR-005; ADR-010; ADR-011.

## 6. Technology Binding (per ratified ADRs)

- **Desktop shell / UI** for all module client surfaces: native .NET (WinUI 3 / WPF), standard-user session (ADR-009, DesktopArchitecture DT-005–007).
- **Local storage** for module data on the device: encrypted embedded SQLite (ADR-010).
- **Shared-component storage** for GE/KB/SL/EV authoritative data: PostgreSQL (SQL Server supported) (ADR-010).
- **AI analysis** for RI and derived-output generation: behind the transcription/AI abstraction layer (ADR-011); default engine pending AR-076.
- **Desktop↔shared synchronization** for module data: offline-first, in-org, no-auto-merge, authenticated, audited (ADR-012); concrete protocol designed in `SystemArchitecture.md`/`DatabaseArchitecture.md`.

## 7. Open Items

1. Per-module design detail (screens, data schemas, module interfaces/APIs) is `04-Design/` work this document sets up; it is not specified here.
2. Encryption/signing for RS packages and RC backups depend on the open key-management assumption **AR-052**.
3. The concrete sync protocol reconciling SQLite (local) and PostgreSQL (shared) module data is designed in `SystemArchitecture.md`/`DatabaseArchitecture.md` per ADR-012.
4. The transcription/AI default engine behind RI's analysis is pending **AR-076**.

## 8. Challenge the Design

Before this document is approved:

1. Does any module's placement (Section 4) require it to work offline where it is hosted only in the shared component? (MA-006 must cover it.)
2. Does any module bypass the Identity/Access or Audit layers (MA-001/MA-002)? (None may.)
3. Is the Redaction & Secure Sharing module genuinely the *only* boundary-crossing path (MA-004), or does another module leak across it?
4. Does mapping modules onto both the 8-component and 5-layer views create any inconsistency, or do they remain one system seen two ways?
5. What is deferred to 04-Design, and is each item flagged rather than silently assumed?

## 9. Revision History

| Version | Date | Summary | Author |
|---|---|---|---|
| 0.1.0 | 2026-07-20 | Initial Module Architecture: integrates the seven new modules (GE/RI/RC/KB/SL/EV/RS) into the ratified 8-component and 5-layer architecture and the ratified stack (ADR-009–012). Establishes cross-cutting rules (MA-001–MA-005: sole authorization point, append-only audit, config-not-code, classification/isolation, safety-critical protection), a module-to-architecture mapping table with placement and offline behavior (MA-006/MA-007), and the technology binding. Sets up 04-Design for per-module detail. AR-052 and AR-076 remain the open gates. | Dr Ziyaad Moolla (ZM) |

---

*End of Document — PEKB-03-ARC-009 — Project Echo Module Architecture — PE-2026.001-ZM*
