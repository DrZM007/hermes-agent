# Project Echo — Release Strategy & Roadmap

## Document Metadata

| Field | Value |
|---|---|
| Document ID | PEKB-11-RDM-001 |
| Document Title | Release Strategy & Roadmap |
| PEKB Section | 11-Roadmap |
| Version | 0.1.0 |
| Status | Draft |
| Classification | Internal — Roadmap |
| Owner Role | Product Manager |
| Approval Required From | Principal Software Architect, DevOps/Deployment Engineer, QA Lead, Security Architect |
| Related Documents | ProjectConstitution.md (00-Governance); ADR-005, ADR-007, ADR-011 (00-Governance/Decisions); ProductCharter.md, Scope.md (01-Product); BranchingStrategy.md (05-Engineering); EngineeringQualityGates.md (00-Governance); TestStrategy.md (09-Testing); AssumptionsRegister.md (00-Governance) |
| Original Creator | Dr Ziyaad Moolla |
| Creator ID | ZM |
| Document Provenance | PE-2026.001-ZM |

---

## 1. Purpose and Scope

This document defines *how Project Echo is released and how it evolves*: the phased delivery sequence, release types and channels, the release-readiness gates, the long-term-support and deprecation discipline, and the roadmap of deferred capabilities. It realizes the release governance of the product-owner briefing (Versions 15, 18) and Foundational Commitments 9 (Longevity) and 23 (Adaptability).

It governs *sequencing and governance*, not calendar dates — assigning dates would be an invented commitment before resourcing is known, so scheduling is deliberately left to the organization executing the build.

## 2. Phased Delivery (authoritative sequence)

The build proceeds in the five gated phases of `ProductCharter.md` §9; each produces a working, testable system passing the `EngineeringQualityGates.md` gates before the next begins:

1. **Foundation** — architecture, security framework, authN/authZ, database (Core Data Model), configuration, installer, logging, backup/recovery.
2. **Core Functionality** — recording, import, AI transcription (behind the ADR-011 abstraction), Review Workspace, transcript editor, search.
3. **Enterprise Features** — Governance/Policy Engine, approvals & workflow, audit, reporting, templates, export, administration.
4. **Intelligence** — summaries, action/decision extraction, timeline, Knowledge Base, advanced search.
5. **Documentation & Validation** — walkthroughs, Learning Centre, manuals, automated tests, performance tuning (resolving AR-076), security validation, UAT.

**RDM-001** — No phase begins until the prior phase's Definition of Done and Red-Team review are satisfied; phases are not overlapped in a way that ships an ungated capability.
*Traceability:* EngineeringQualityGates.md; ProductCharter.md §9.

## 3. Release Types and Channels

**RDM-002** — Releases use semantic versioning and the defined types (per `BranchingStrategy.md` BR-004): **Security** (fixes only), **Maintenance** (bug/perf/docs), **Feature** (new functionality + migration), **Long-Term Support** (stability, security/bug only, predictable lifecycle).
*Traceability:* BranchingStrategy.md BR-004; briefing V18.

**RDM-003** — The channels are **Stable**, **LTS**, **Preview**, and **Experimental** (disabled by default). Meeting data is never used to evaluate Experimental/Preview features without explicit organizational approval (BR-008).
*Traceability:* BranchingStrategy.md BR-007/008; briefing V15/V18.

**RDM-004** — An LTS release shall receive security and bug fixes with no unexpected feature changes for a defined lifecycle, so organizations that cannot upgrade frequently (hospitals, research) have a predictable, stable base. The specific LTS duration is set per release, not fixed here.
*Traceability:* briefing V18; Constitution Commitment 9.

## 4. Release Readiness

**RDM-005** — Every production release shall pass the release-readiness gates before it is production-eligible: functional completeness, security review, performance validation, accessibility validation, documentation updates, upgrade testing, backup/restore testing, rollback verification, and the **Compatibility Certification** (ADR-005 §4.6 / `TestStrategy.md` TST-P7). "It works on my machine" is never sufficient.
*Traceability:* EngineeringQualityGates.md; TestStrategy.md; ADR-005.

**RDM-006** — Each release produces a formal package: release notes, known/resolved issues, upgrade and rollback instructions, compatibility statement, security summary, validation summary, documentation changes, and risk assessment.
*Traceability:* briefing V20 (release certification).

## 5. Deprecation and Compatibility

**RDM-007** — Features are retired only through the deprecation discipline (BR-009): mark deprecated, explain why, recommend the replacement, provide a migration path, warn administrators, remove only after an appropriate transition period. Existing data remains accessible across upgrades wherever reasonably possible (BR-010; Commitment 14).
*Traceability:* BranchingStrategy.md BR-009/010; briefing V18.

## 6. Roadmap of Deferred Capabilities

The following are **out of initial scope** (`Scope.md` §4) and require an explicit, governed scope decision (and, where noted, a dedicated ethics/privacy gate) before being promoted into `02-Requirements/`:

| Deferred capability | Tracking | Promotion condition |
|---|---|---|
| Mobile & web clients | AR-086 | Reopen the web/mobile topology decision; a new client is a new surface, not implied by "and web" phrasing |
| Enterprise Knowledge Graph | Scope §4 | Approved-content-only relationship modelling; post-core |
| On-premises LLM summarization | Scope §4 | Must stay within ADR-001 offline-default + AI-ARCH-011 isolation |
| Voice biometrics (persistent) | AR-060; Scope §4 | Dedicated POPIA/ethics gate; special-category processing |
| Default transcription engine | AR-076 | Selected by benchmarking (TST-P6), not by preference |

**RDM-008** — No deferred capability is implemented by drift; promotion is a documented scope change per `RevisionPolicy.md`.
*Traceability:* Scope.md §4; RevisionPolicy.md.

## 7. Open Items

1. Calendar scheduling, resourcing, and LTS-duration values are deliberately not set here; they are the executing organization's to fix.
2. The concrete feature roadmap beyond the five phases (a `FeatureRoadmap.md`) is pending.
3. AR-076 (default engine) and the AR-052 residual (crypto algorithm) resolve during Phases 2 and 1 respectively.

## 8. Challenge the Design

1. Does the phased sequence (Section 2) ever ship an ungated capability?
2. Are release types/channels and the no-experimental-on-meeting-data rule airtight?
3. Do the readiness gates (Section 4) include every validation a regulated deployment needs?
4. Is every deferred capability recorded with a promotion condition, with none promotable by drift?
5. What is deferred (dates, LTS duration, FeatureRoadmap) and is each flagged?

## 9. Revision History

| Version | Date | Summary | Author |
|---|---|---|---|
| 0.1.0 | 2026-07-20 | Initial Release Strategy & Roadmap: the authoritative five-phase gated delivery sequence; release types and channels with the no-experimental-on-meeting-data rule; release-readiness gates including ADR-005 compatibility certification and the formal release package; deprecation and data-compatibility discipline; and the roadmap of deferred capabilities (mobile/web AR-086, Knowledge Graph, on-prem LLM, voice biometrics, default engine AR-076) each with a promotion condition. Establishes 11-Roadmap. Calendar/LTS-duration deliberately not invented. | Dr Ziyaad Moolla (ZM) |

---

*End of Document — PEKB-11-RDM-001 — Project Echo Release Strategy & Roadmap — PE-2026.001-ZM*
