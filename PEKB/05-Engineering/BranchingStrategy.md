# Project Echo — Branching & Versioning Strategy

## Document Metadata

| Field | Value |
|---|---|
| Document ID | PEKB-05-ENG-003 |
| Document Title | Branching & Versioning Strategy |
| PEKB Section | 05-Engineering |
| Version | 0.1.0 |
| Status | Draft |
| Classification | Internal — Engineering |
| Owner Role | DevOps/Deployment Engineer |
| Approval Required From | Principal Software Architect, QA Lead |
| Related Documents | ProjectConstitution.md, EngineeringPrinciples.md, RevisionPolicy.md, EngineeringQualityGates.md (00-Governance); ADR-005-EnterpriseCompatibilityZeroITFriction.md (00-Governance/Decisions) |
| Original Creator | Dr Ziyaad Moolla |
| Creator ID | ZM |
| Document Provenance | PE-2026.001-ZM |

---

## 1. Purpose

This document defines how Project Echo's source is branched, versioned, and released. It exists so that change is disciplined and traceable over the multi-year maintenance horizon required by `ProjectConstitution.md` Commitment 9 (Longevity), and so the release governance described in the product-owner briefing (Versions 15, 18, 20) has a concrete branching model.

This document governs *source-code* branching and *software* versioning. Versioning of the PEKB specification itself is governed separately by `00-Governance/RevisionPolicy.md`; the two are related (the software records which specification version it implements) but distinct.

## 2. Branching Model

**BR-001** — Development shall use a small, predictable branch topology: a protected mainline representing the current integrated state, short-lived feature/fix branches taken from and merged back to it via reviewed pull requests, and long-lived release branches for supported release lines (including Long-Term Support).
*Priority:* High. *Traceability:* EngineeringPrinciples.md §2; briefing V15/V18.

**BR-002** — No change shall reach the mainline except through a pull request that has passed the applicable quality gates (`EngineeringQualityGates.md`), including the required-role reviews for any change touching a Critical requirement.
*Priority:* Critical. *Traceability:* EngineeringQualityGates.md; SecurityRequirements.md SR-064.

**BR-003** — The mainline shall always be in a buildable, test-passing state; a change that would leave it otherwise is not admitted. Build reproducibility (same source + approved dependencies → consistent output) is a goal of the branching and build process.
*Priority:* High. *Traceability:* briefing V17 (build reproducibility); EngineeringQualityGates.md.

## 3. Software Versioning

**BR-004** — Released software shall use semantic versioning (`MAJOR.MINOR.PATCH`), with pre-release and Long-Term Support designations, and the meaning of each release type shall follow the release-governance model: security releases, maintenance releases, feature releases, and LTS releases.
*Priority:* High. *Traceability:* briefing V15/V18 (release governance); RevisionPolicy.md.

**BR-005** — Each released build shall record the PEKB specification version it implements and shall carry the Creator Provenance build identifier per `00-Governance/CreatorProvenanceFramework.md` (e.g., `PE-2026.001-ZM`). The model-identity string of any AI assisting development shall never appear in version identifiers, build metadata, commit messages, or released artifacts.
*Priority:* High. *Traceability:* ProjectConstitution.md §6; CreatorProvenanceFramework.md.

**BR-006** — Compatibility expectations shall be documented per release type: PATCH and MAINTENANCE releases preserve compatibility; MAJOR releases may break it only with explicit justification, migration guidance, and the deprecation discipline below.
*Priority:* High. *Traceability:* briefing V18 (backward compatibility, deprecation policy).

## 4. Release Channels

**BR-007** — The product shall support the release channels defined in the briefing: **Stable** (production-recommended), **Long-Term Support** (stability-prioritized, security/bug fixes only, predictable lifecycle), **Preview** (optional early access), and **Experimental** (disabled by default, test environments only).
*Priority:* Medium. *Traceability:* briefing V15/V18.

**BR-008** — Meeting data shall never be used to evaluate Experimental or Preview features without explicit organizational approval, consistent with ADR-003 and the privacy-first stance.
*Priority:* Critical. *Traceability:* ADR-003; briefing V15.

## 5. Deprecation and Compatibility

**BR-009** — A feature shall not be removed abruptly. Retirement follows the deprecation discipline: mark deprecated, explain why, recommend the replacement, provide a migration path, warn administrators, and remove only after an appropriate transition period.
*Priority:* High. *Traceability:* briefing V18 (deprecation policy).

**BR-010** — Existing data shall remain accessible across upgrades wherever reasonably possible (old transcripts readable, historical audit logs valid, prior exports understandable, templates migrated); breaking data compatibility requires exceptional, documented justification and a migration path.
*Priority:* Critical. *Traceability:* briefing V18 (backward compatibility); ProjectConstitution.md Commitment 14 (Data as a Long-Term Asset).

## 6. Commit and Review Discipline

**BR-011** — Commits shall be clear and descriptive; pull requests shall reference the requirement ID(s) they implement or the defect/debt item they address, so the traceability chain (Requirement → Implementation → Test → Release) is maintained.
*Priority:* Medium. *Traceability:* EngineeringPrinciples.md §3; AcceptanceCriteria.md AC-P5.

**BR-012** — Secrets shall never be committed to source control, configuration files without encryption, logs, or diagnostic bundles, consistent with the secure-development requirements.
*Priority:* Critical. *Traceability:* SecurityRequirements.md §22 (secure development); briefing V17 (secrets management); AssumptionsRegister.md AR-052 (key/secret storage, open).

## 7. Open Items

1. The specific hosting platform, CI system, and pull-request tooling are Engineering-phase choices bounded by ADR-005 and are not fixed here.
2. Exact LTS lifecycle duration and channel cadence are deferred to `11-Roadmap/ReleaseStrategy.md`.
3. Secret-storage mechanics underlying BR-012 depend on the still-open key-management assumption AR-052.

## 8. Challenge the Design

Before this document is approved:

1. Is the branch topology (BR-001) simple enough to be followed consistently, yet sufficient for LTS maintenance?
2. Does BR-002/BR-008 close every path by which an unreviewed change or unapproved experimental feature could reach production or touch meeting data?
3. Is the model-identity exclusion (BR-005) unambiguous?
4. Does the deprecation/compatibility discipline (BR-009/BR-010) adequately protect existing organizational data across upgrades?
5. What is deferred (CI tooling, LTS cadence, secret storage) and is each flagged?

## 9. Revision History

| Version | Date | Summary | Author |
|---|---|---|---|
| 0.1.0 | 2026-07-20 | Initial Branching & Versioning Strategy (BR-001–BR-012): protected-mainline branch topology with reviewed PRs and LTS release branches; gate-enforced merges; semantic versioning with release types and provenance build IDs (and model-identity exclusion); the four release channels with the no-meeting-data-for-experimental rule; deprecation and data-compatibility discipline; and commit/review/secrets discipline. Derived from briefing Versions 15/17/18/20. CI tooling, LTS cadence, and secret storage deferred. | Dr Ziyaad Moolla (ZM) |

---

*End of Document — PEKB-05-ENG-003 — Project Echo Branching & Versioning Strategy — PE-2026.001-ZM*
