# Project Echo — Glossary

## Document Metadata

| Field | Value |
|---|---|
| Document ID | PEKB-00-GOV-007 |
| Document Title | Glossary |
| PEKB Section | 00-Governance |
| Version | 0.2.0 |
| Status | Draft |
| Classification | Internal — Governance |
| Owner Role | Technical Documentation Lead |
| Approval Required From | Principal Software Architect, Privacy Officer, Security Architect |
| Related Documents | DocumentStandards.md, ProjectConstitution.md |
| Original Creator | Dr Ziyaad Moolla |
| Creator ID | ZM |
| Document Provenance | PE-2026.001-ZM |

---

## 1. Purpose of This Document

This document is the single authoritative source for all defined terms used across the PEKB, per the Single Source of Truth rule in `DocumentStandards.md` §5. No other PEKB document may define or redefine a term listed here; other documents must use these terms consistently and may link to this Glossary for definitions.

Where a term is used in this PEKB but not yet defined here, that is a documentation gap and must be added, not assumed.

## 2. PEKB Structural Terminology

| Term | Definition |
|---|---|
| PEKB | Project Echo Knowledge Base — the complete authoritative documentation set for Project Echo, organized into the numbered sections defined in the PEKB structure. |
| PEKB Section | One of the twelve numbered top-level folders in the PEKB (e.g., `00-Governance`, `02-Requirements`). |
| Document ID | The unique identifier assigned to a PEKB document per the convention `PEKB-<SectionNumber>-<SectionCode>-<SequenceNumber>`, defined in `DocumentStandards.md` §3. |
| Section Code | The short uppercase code identifying a PEKB section within a Document ID (see Section 3 of this Glossary for the authoritative list). |
| Status (Document) | The lifecycle state of a PEKB document: Draft, In Review, Approved, or Deprecated, as defined in `RevisionPolicy.md` §2. |
| Approved (Document) | A document status indicating all required approvers have signed off; only Approved documents may be cited as a basis for implementation, per `RevisionPolicy.md` §2.1. |
| ADR (Architecture Decision Record) | A structured record of a significant decision, capturing context, problem, options considered, recommendation, trade-offs, risks, and consequences, per `EngineeringPrinciples.md` §8. |
| Requirement ID | A unique identifier assigned to an individual requirement within `02-Requirements/`, used for traceability per `EngineeringPrinciples.md` §3. The format is `<PREFIX>-<###>`; authoritative prefixes are listed in Section 3A. |
| Traceability Chain | The mandatory linkage: Business Goal → Requirement → Architecture → Implementation → Test → Documentation → Release, defined in `EngineeringPrinciples.md` §3. |

## 3. Authoritative Section Code Table

Per `DocumentStandards.md` §3, this table is the single authoritative source for PEKB section codes used in Document IDs.

| Section Number | Folder Name | Section Code |
|---|---|---|
| 00 | Governance | GOV |
| 01 | Product | PRD |
| 02 | Requirements | REQ |
| 03 | Architecture | ARC |
| 04 | Design | DSN |
| 05 | Engineering | ENG |
| 06 | Security | SEC |
| 07 | Privacy-Compliance | PRIV |
| 08 | Operations | OPS |
| 09 | Testing | TST |
| 10 | Documentation | DOC |
| 11 | Roadmap | RDM |

## 3A. Authoritative Requirement ID Prefix Table

This table is the single authoritative source for requirement-ID prefixes used within `02-Requirements/`. A new prefix is introduced only with a new requirements document and recorded here.

| Prefix | Domain / Document | Introduced In |
|---|---|---|
| SR | Security Requirements | SecurityRequirements.md |
| PR | Privacy Requirements | PrivacyRequirements.md |
| FR | Functional Requirements | FunctionalRequirements.md |
| AI | AI Requirements | AIRequirements.md |
| NFR | Non-Functional Requirements | NonFunctionalRequirements.md |
| UX | UX Requirements | UXRequirements.md |
| AC | Acceptance Criteria | AcceptanceCriteria.md |
| GE | Governance & Policy Engine Requirements | GovernanceEngineRequirements.md |

*Note:* Architecture documents use their own decision/element identifiers (e.g., SA, DA, SEC, AI-ARCH, DB, DT, TM) defined within `03-Architecture/`; those are element IDs, not requirement IDs, and are outside this table's scope.

## 4. Product and Domain Terminology

| Term | Definition |
|---|---|
| Project Echo | The enterprise meeting intelligence platform described in `ProjectIntent.md`, whose first capability is secure meeting transcription. |
| Meeting | A recorded organizational discussion that is the subject of capture, transcription, and review within Project Echo. Precise scope (e.g., minimum/maximum duration, single vs. multi-session) is not yet defined — see Open Items. |
| Transcript | The textual representation of a meeting's spoken content, produced initially by AI transcription and subject to human review under the Review Workflow. |
| Review Workflow | The mandatory lifecycle a transcript passes through: Draft → Reviewed → Approved → Archived, as introduced in the governing product context and to be formally specified in `02-Requirements/FunctionalRequirements.md`. |
| Draft (Transcript State) | The initial state of a transcript immediately after AI generation, before any human review has occurred. Not to be confused with Draft as a *document* status (Section 2). |
| Reviewed (Transcript State) | A transcript state indicating a human has examined and corrected the transcript, but it is not yet organizationally final. |
| Approved (Transcript State) | A transcript state indicating a designated human authority has confirmed the transcript as the organizational record. Not to be confused with Approved as a *document* status (Section 2). |
| Archived (Transcript State) | A transcript state indicating the approved record has entered long-term retention per `RetentionPolicy.md` (pending). |
| Meeting Owner | The individual accountable for a given meeting's record within Project Echo. Exact permissions and whether this is a fixed role or configurable are not yet defined — see Open Items. |
| Organization (Org) | A single deploying enterprise entity using an isolated instance or isolated data boundary of Project Echo. Exact isolation model (per-org install vs. multi-tenant) is undefined — see Open Items and Foundation Review v0.1. |

## 5. Architecture Terminology

| Term | Definition |
|---|---|
| Desktop Architecture | The architecture governing Project Echo's client application running on end-user managed devices, defined in `DesktopArchitecture.md` (pending). |
| Web Architecture | The architecture governing any browser-based or server-hosted component of Project Echo, defined in `WebArchitecture.md` (pending). |
| Offline First | The Foundational Commitment (see `ProjectConstitution.md` §3.4) that core functionality must operate without dependency on external connectivity wherever technically feasible. |
| Hybrid Processing | A processing model in which some functionality may optionally use networked/cloud resources under explicit configuration and approval, contrasted with fully offline processing. Whether and how Project Echo adopts this model is an open architectural decision (see Foundation Review v0.1, Required Decision #1). |

## 6. AI Terminology

| Term | Definition |
|---|---|
| AI-Assisted | Describes any capability where an AI/ML component produces an output (e.g., a transcript, summary, or suggestion) that requires human review before being treated as authoritative, per the Human Authority commitment. |
| Speaker Identification | An AI capability that attributes spoken segments of a meeting to distinct speakers. Whether this includes persistent biometric-style speaker recognition across meetings is undefined — see Open Items and Foundation Review v0.1 (Privacy Risks). |
| Summarization | An AI capability that produces a condensed representation of meeting content, always treated as a draft subject to human review. |
| Action Item Extraction | An AI capability that identifies candidate follow-up tasks from meeting content, always subject to human review before being treated as an organizational commitment. |
| AI Improvement Loop | The governed process by which AI behavior may evolve: (1) detecting recurring corrections, (2) suggesting improvements, (3) human approval, (4) version-controlled update. AI must never bypass this loop, per `ProjectConstitution.md` §5.4. |
| Autonomous Decision (Prohibited) | Any action taken by an AI component that is not first reviewed and approved by a human, which Project Echo's AI components must never perform, per the Human Authority commitment. |

## 7. Security and Privacy Terminology

| Term | Definition |
|---|---|
| Data Minimization | The privacy principle that only data necessary for a stated purpose is collected, processed, or retained. |
| Access Control | Mechanisms restricting which users/roles may view, edit, export, or delete specific data within Project Echo. Specific model (RBAC, ABAC, etc.) is not yet defined — see Open Items. |
| Auditability | The property that consequential actions (approvals, exports, deletions, retention changes) are recorded and attributable to a human actor. |
| Retention Policy | The rules governing how long meeting data, transcripts, and derived artifacts are kept before deletion or archival, to be defined in `RetentionPolicy.md` (pending). |
| Controlled Export | Any mechanism by which meeting data leaves Project Echo's managed environment, which must be deliberate, visible, and — per product context — potentially subject to approval and audit logging. |
| POPIA | Protection of Personal Information Act — the South African data protection legislation with which Project Echo's design must align, per `PrivacyRequirements.md` (pending) and `POPIAFramework.md` (pending). |
| POPIA-Aligned | Describes a design or control that follows POPIA's principles even where full formal legal compliance determination is outside PEKB scope; does not itself constitute a legal compliance certification. |
| Threat Model | The structured analysis of actors, attack surfaces, and risks that informs `SecurityArchitecture.md` and `SecurityControls.md`, to be defined in `ThreatModel.md` (pending). |
| Classification (Data) | A designation of a document or dataset's sensitivity level governing its handling (e.g., "Internal — Governance" as used in PEKB document metadata). A full data classification scheme for product data (as distinct from PEKB documents) is not yet defined — see Open Items and Foundation Review v0.1. |

## 8. Open Items — Terms Requiring Future Definition

The following terms are referenced across the PEKB. Items marked **RESOLVED** now have an approved definition via a ratified decision; remaining items are still to be formalized rather than assumed:

1. ~~Requirement ID format.~~ **RESOLVED** — defined in Section 3A (`<PREFIX>-<###>`, authoritative prefix table).
2. Meeting (precise scope boundaries). *(Still open.)*
3. ~~Meeting Owner (permissions, whether fixed or configurable role).~~ **RESOLVED** — defined by ADR-004 §4.1 (baseline role) and extended by ADR-008 (constrained custom roles).
4. ~~Organization/tenancy isolation model.~~ **RESOLVED** — defined by ADR-002 (per-organization isolated deployment).
5. ~~Hybrid Processing (whether adopted, and under what governance).~~ **RESOLVED** — defined by ADR-001 (offline-first hybrid AI; networked path is a governed opt-in).
6. ~~Speaker Identification (persistent biometric recognition vs. per-meeting-only labeling).~~ **RESOLVED** — distinguished by AI-040 / PR-031 / PR-032 (per-meeting labeling default C2; persistent recognition optional C3); whether persistent recognition ships initially remains AR-060.
7. ~~Access Control model (RBAC vs. ABAC vs. other).~~ **RESOLVED** — RBAC with fixed baseline roles + constrained custom roles, per ADR-004 and ADR-008.
8. ~~Data Classification scheme for product data.~~ **RESOLVED** — two-axis model per ADR-006 (Axis 1 C1–C4 in PrivacyRequirements §6; Axis 2 sensitivity labels).

These correspond to Required Decisions identified in Project Echo Foundation Review v0.1 and are tracked formally in `AssumptionsRegister.md`.

## 9. Relationship to Other PEKB Documents

- `DocumentStandards.md` requires consistent terminology usage and defers definitions to this document.
- All PEKB documents referencing a term defined here should do so consistently; discovery of inconsistent usage elsewhere is a defect to be corrected in the other document, not in this Glossary.
- `AssumptionsRegister.md` tracks resolution of the Open Items listed in Section 8.

## 9. Revision History

| Version | Date | Summary | Author |
|---|---|---|---|
| 0.1.0 | 2026 (initial) | Initial Glossary: PEKB terminology, authoritative section-code table, product/domain terms, open items. | Dr Ziyaad Moolla (ZM) |
| 0.2.0 | 2026-07-20 | Added Section 3A (authoritative requirement-ID prefix table, including the new GE prefix); defined the Requirement ID format; marked Section 8 open items 1, 3, 4, 5, 6, 7, 8 RESOLVED with references to the ratified decisions that closed them (ADR-001/002/004/006/008, AI-040, PR-031/032). Added Revision History. | Dr Ziyaad Moolla (ZM) |

---

*End of Document — PEKB-00-GOV-007 — Project Echo Glossary — PE-2026.001-ZM*
