# Project Echo — Third-Party Component Register

## Document Metadata

| Field | Value |
|---|---|
| Document ID | PEKB-05-ENG-002 |
| Document Title | Third-Party Component Register |
| PEKB Section | 05-Engineering |
| Version | 0.1.0 |
| Status | Draft |
| Classification | Internal — Engineering |
| Owner Role | Security Architect |
| Approval Required From | Principal Software Architect, DevOps/Deployment Engineer |
| Related Documents | ProjectConstitution.md, DesignPrinciples.md, EngineeringPrinciples.md (00-Governance); ADR-005-EnterpriseCompatibilityZeroITFriction.md (00-Governance/Decisions); SecurityRequirements.md (02-Requirements) |
| Original Creator | Dr Ziyaad Moolla |
| Creator ID | ZM |
| Document Provenance | PE-2026.001-ZM |

---

## 1. Purpose

This document is the single authoritative inventory of every third-party component (library, framework, model, tool, or service) Project Echo depends on. It supports security review, license compliance, and update planning, per the product-owner briefing (Version 17) and `DesignPrinciples.md` §3.13 (Minimize Dependencies).

Every dependency is a deployment and security liability — especially in the constrained enterprise environment ADR-005 governs. This register makes each dependency a conscious, reviewed choice rather than an incidental import.

## 2. Dependency Admission Criteria

**TPC-P1** — Before a third-party component is added, it shall be evaluated against, and the answers recorded here: Do we genuinely need it? Is it actively maintained? Does it have an acceptable security record? Can it be replaced if it becomes unavailable or unmaintained? Can the software degrade gracefully if it fails?
*Traceability:* DesignPrinciples.md §3.13; briefing Version 17.

**TPC-P2** — A component that would violate ADR-005 (e.g., one that requires administrator rights, a container runtime, or a mandatory server process for local desktop operation) shall not be admitted.
*Traceability:* ADR-005 §4, §6.3.

**TPC-P3** — Each admitted component shall be recorded with the fields in Section 3 and reviewed on a defined cadence (at least at each release readiness review) for security advisories and maintenance status.
*Traceability:* EngineeringQualityGates.md; SecurityRequirements.md §19 (vulnerability management).

## 3. What Every Entry Records

| Field | Meaning |
|---|---|
| Name | The component. |
| Version | Pinned version in use. |
| License | License and any obligations it imposes. |
| Purpose | Why it is used / what requirement it serves. |
| Source | Where it is obtained (and how integrity is verified). |
| Security Status | Last known advisory status. |
| Last Reviewed | Date of most recent review. |

## 4. Register

No technology stack has been selected yet — the desktop stack, database engine, AI model tooling, and packaging technology are Engineering-phase decisions still open (`AssumptionsRegister.md` AR-003) and bounded by ADR-005. Accordingly there are no admitted components yet. This register is established now so that every dependency, once the stack is chosen, is admitted through the criteria in Section 2 rather than accreting silently.

| Name | Version | License | Purpose | Source | Security Status | Last Reviewed |
|---|---|---|---|---|---|---|
| — *(none yet)* | — | — | — | — | — | — |

## 5. Relationship to the Engineering-Phase Technology Decisions

When the desktop-stack, database-engine, and AI-tooling ADRs are made (Track B / Engineering phase), each selected component shall be entered here as part of that decision, with its admission criteria (Section 2) answered in the ADR and summarized in this register. A technology ADR that adds a dependency without a corresponding register entry is incomplete.

## 6. Challenge the Design

Before this document is approved:

1. Are the admission criteria (Section 2) strong enough to keep the dependency count minimal?
2. Does TPC-P2 correctly exclude anything that would breach ADR-005?
3. Is the review cadence (TPC-P3) sufficient to catch security advisories in time?

## 7. Revision History

| Version | Date | Summary | Author |
|---|---|---|---|
| 0.1.0 | 2026-07-20 | Initial Third-Party Component Register: purpose, dependency admission criteria (need/maintenance/security/replaceability/graceful-degradation, and ADR-005 conformance), entry structure, and an empty register (no stack chosen yet). Links dependency admission to the forthcoming technology ADRs. Derived from briefing Version 17. | Dr Ziyaad Moolla (ZM) |

---

*End of Document — PEKB-05-ENG-002 — Project Echo Third-Party Component Register — PE-2026.001-ZM*
