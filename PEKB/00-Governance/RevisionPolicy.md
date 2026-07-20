# Project Echo — Revision Policy

## Document Metadata

| Field | Value |
|---|---|
| Document ID | PEKB-00-GOV-006 |
| Document Title | Revision Policy |
| PEKB Section | 00-Governance |
| Version | 0.1.0 |
| Status | Draft |
| Classification | Internal — Governance |
| Owner Role | Technical Documentation Lead |
| Approval Required From | Principal Software Architect |
| Related Documents | DocumentStandards.md, ProjectConstitution.md, ReleaseStrategy.md (05-Engineering) |
| Original Creator | Dr Ziyaad Moolla |
| Creator ID | ZM |
| Document Provenance | PE-2026.001-ZM |

---

## 1. Purpose of This Document

`DocumentStandards.md` requires that every PEKB document declare a Version and a Status, and states that the mechanics of both are governed here. This document defines those mechanics: how PEKB documents move through their lifecycle, how they are versioned, how changes are controlled and approved, and how PEKB versioning relates to software release versioning.

## 2. Document Lifecycle States

Every PEKB document exists in exactly one of the following states at any time, as introduced in `DocumentStandards.md` §6:

| State | Meaning | May Be Cited As Authoritative? |
|---|---|---|
| Draft | Actively authored or revised; not yet reviewed | No |
| In Review | Complete draft submitted to required approvers | No |
| Approved | Signed off by all required approvers | Yes |
| Deprecated | Superseded or no longer applicable | No (historical/audit reference only) |

### 2.1 State Transition Rules

1. **Draft → In Review**: The document owner (per its `Owner Role` metadata) declares the draft complete and submits it to every role listed in `Approval Required From`.
2. **In Review → Approved**: All listed approvers must record explicit approval. A single outstanding approver keeps the document In Review.
3. **In Review → Draft**: Any approver may return a document to Draft with documented reasons; this is not a rejection of the whole effort, but a request for revision.
4. **Approved → Draft**: A previously Approved document may re-enter Draft only via a formal change request (Section 5). Approved status is not edited silently.
5. **Any State → Deprecated**: A document is marked Deprecated when superseded by a newer document or when its subject matter is no longer applicable. Deprecated documents are retained in the PEKB, not deleted, per the Longevity commitment in `ProjectConstitution.md`.

### 2.2 Interim Use of Draft Documents

Per `EngineeringPrinciples.md` §2, implementation work requires sufficiently unambiguous requirements. A Draft document may inform preliminary design discussion, but **may not be treated as an approved basis for implementation** until it reaches Approved status, unless an explicit, time-bounded exception is recorded in `AssumptionsRegister.md` with a named accountable owner.

## 3. Version Numbering

PEKB documents use three-part semantic-style version numbers: `MAJOR.MINOR.PATCH`.

| Component | Incremented When |
|---|---|
| MAJOR | A change alters the document's meaning, scope, or obligations in a way that could invalidate decisions made under the prior version (e.g., a reversed principle, a removed requirement). |
| MINOR | A substantive addition that does not invalidate prior decisions (e.g., a new section, a clarified but not contradicted rule). |
| PATCH | A non-substantive correction (e.g., typo, formatting, broken cross-reference fix) that does not change meaning. |

Rules:

1. All new PEKB documents begin at `0.1.0` (Draft).
2. A document's first transition to Approved sets its version to `1.0.0`, regardless of how many `0.x.x` drafts preceded it.
3. Version numbers are never reused or decremented.
4. A Deprecated document retains the version number it held at deprecation; it is not incremented further.

## 4. Revision History Requirements

Every PEKB document must maintain a Revision History as its final section, immediately before the closing provenance line, once it has undergone at least one revision after initial authoring. The table format is:

| Version | Date | Status | Summary of Change | Approved By |
|---|---|---|---|---|

Requirements:

1. Every version increment produces exactly one row.
2. "Summary of Change" must describe *what changed and why*, not merely restate the new version number.
3. "Approved By" is left blank for Draft/In Review entries and completed only upon reaching Approved.
4. Documents in this initial authoring pass (v0.1.0, no prior revision) are not required to retroactively add this section, but must add it starting from their first revision.

## 5. Change Control Process

1. **Propose** — Any contributor may propose a change to a PEKB document, describing the change and rationale.
2. **Classify** — The document owner classifies the proposed change as MAJOR, MINOR, or PATCH per Section 3.
3. **Review** — For MAJOR and MINOR changes, the roles listed in the document's `Approval Required From` field review the change. PATCH changes may be approved solely by the document owner but must still be logged in Revision History.
4. **Approve** — Approval is recorded in Revision History (Section 4).
5. **Publish** — The version number and Status are updated in the document's metadata block to match the approved change.

Significant changes — particularly to `ProjectConstitution.md` or any document in `02-Requirements/` or `03-Architecture/` — should be accompanied by an Architecture Decision Record (ADR) capturing context, problem, options considered, recommendation, trade-offs, risks, and consequences, per `EngineeringPrinciples.md` §8.

## 6. Relationship Between PEKB Versions and Software Releases

The PEKB and the Project Echo software product are versioned independently, but related:

1. **PEKB documents version themselves** per Section 3 of this document, tracking the evolution of governance, requirements, and architecture knowledge.
2. **Software releases** are versioned and identified per `05-Engineering/ReleaseStrategy.md` (content pending) and carry provenance identifiers per `CreatorProvenanceFramework.md` (e.g., `Project Echo v1.2.0-ZM`, build `PE-2026.001-ZM`).
3. A software release must be traceable to the specific Approved versions of the PEKB documents that governed it (per the traceability chain in `EngineeringPrinciples.md` §3). This traceability record's exact mechanism (e.g., a per-release manifest listing PEKB document versions) is **not yet defined** and is flagged as an open item in `AssumptionsRegister.md`.
4. A software release must never be based on a PEKB requirement or architecture document that is not in Approved status, except under an explicitly recorded and risk-accepted exception.

## 7. Relationship to Other PEKB Documents

- `DocumentStandards.md` defines the metadata fields (including Version and Status) that this policy governs the mechanics of.
- `CreatorProvenanceFramework.md` defines build/release identifiers referenced in Section 6.
- `05-Engineering/ReleaseStrategy.md` (pending) will define the software release process this document's Section 6 defers to.

---

*End of Document — PEKB-00-GOV-006 — Project Echo Revision Policy — PE-2026.001-ZM*
