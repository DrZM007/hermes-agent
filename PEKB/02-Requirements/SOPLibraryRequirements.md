# Project Echo — SOP / Reference Document Library Requirements

## Document Metadata

| Field | Value |
|---|---|
| Document ID | PEKB-02-REQ-013 |
| Document Title | SOP / Reference Document Library Requirements |
| PEKB Section | 02-Requirements |
| Version | 0.1.0 |
| Status | Draft |
| Classification | Internal — Requirements |
| Owner Role | Product Manager |
| Approval Required From | Principal Software Architect, Security Architect, Privacy Officer |
| Related Documents | ProjectConstitution.md, DesignPrinciples.md (00-Governance); ADR-002-DeploymentModel.md, ADR-004-AccessControlRBACModel.md, ADR-006-DataClassificationTwoAxisModel.md (00-Governance/Decisions); Scope.md (01-Product); FunctionalRequirements.md, SecurityRequirements.md, GovernanceEngineRequirements.md, KnowledgeBaseRequirements.md (02-Requirements) |
| Original Creator | Dr Ziyaad Moolla |
| Creator ID | ZM |
| Document Provenance | PE-2026.001-ZM |

---

## 1. Purpose and Scope

This document defines the requirements for Project Echo's **SOP / Reference Document Library** — the in-scope capability in `01-Product/Scope.md` §2.16 — which lets reviewers open approved reference documents (standard operating procedures, review checklists, naming conventions, quality procedures, export templates) side-by-side with a transcript, reducing context-switching and helping maintain consistency.

The library is deliberately narrow (Scope §3.6 reconciliation): it holds **approved reference material that directly supports the review workflow**, not general file storage, and it is distinct from the Organization Knowledge Base (`KnowledgeBaseRequirements.md`), which holds *approved meeting-derived outputs*. The two do not overlap: one holds reference material used *during* review; the other holds knowledge produced *by* approved meetings.

## 2. Requirement Identifiers

Requirements use the prefix **`SL-###`** (SOP Library), recorded in `Glossary.md` §3A.

## 3. Content and Boundaries

**SL-001** — The library shall store reference documents that support the review workflow (e.g., review SOPs, meeting-minute standards, naming conventions, quality-assurance procedures, internal policies, export templates), each as an approved, versioned item.
*Priority:* Medium. *Traceability:* Scope.md §2.16; briefing V11 (SOP library).

**SL-002** — The library shall **not** provide general-purpose file storage, arbitrary document management, or a wiki; content unrelated to supporting the review workflow is out of scope (Scope §3.6). Any drift toward general document management is a scope violation.
*Priority:* High. *Traceability:* Scope.md §3.6.

**SL-003** — The library is distinct from the Organization Knowledge Base: reference documents live here; approved meeting-derived outputs live in the Knowledge Base (`KnowledgeBaseRequirements.md`). A document shall have exactly one authoritative home, per `DocumentStandards.md` §5.
*Priority:* Medium. *Traceability:* DocumentStandards.md §5; KnowledgeBaseRequirements.md.

## 4. Versioning and Approval

**SL-004** — Each reference document shall be version-controlled, carry an approval record, and retain superseded versions; a reference document shall never be silently replaced, so a reviewer always knows which version applied at a given time.
*Priority:* High. *Traceability:* RevisionPolicy.md; ProjectConstitution.md Commitment 10; briefing V5 (version-locked docs).

**SL-005** — The library shall indicate the current approved version of each document and allow authorized users to view its version history.
*Priority:* Medium. *Traceability:* SL-004.

## 5. Access, Classification, and Isolation

**SL-006** — Access to reference documents shall be governed by the ADR-004 authorization model; a reference document shall carry classification on both axes (ADR-006) and shall be visible only to users authorized for its classification and scope.
*Priority:* High. *Traceability:* ADR-004; ADR-006.

**SL-007** — Reference documents shall reside within the organization's isolated deployment (ADR-002) and shall not cross the organizational boundary except through the governed Controlled Export / secure-sharing mechanisms.
*Priority:* High. *Traceability:* ADR-002; ADR-003; Scope.md §2.19.

## 6. Use During Review

**SL-008** — An authorized reviewer shall be able to open a reference document side-by-side with a transcript during review, without leaving the review workspace, consistent with the split-screen capability in `01-Product/Scope.md` and the Review Intelligence Engine.
*Priority:* Medium. *Traceability:* briefing V11; ReviewIntelligenceEngineRequirements.md.

**SL-009** — Reference documents shall be searchable (where text extraction is enabled), scoped to the requesting user's authorization; search shall never reveal the existence of a document the user is not authorized to access.
*Priority:* Medium. *Traceability:* ADR-004; AIRequirements.md AI-018.

**SL-010** — Opening or viewing a reference document shall not alter transcript content or the review record; the library is a read reference during review, and any use of a reference document is a non-consequential action except where an organization's governance links a checklist/SOP to a required review step (via the Governance & Policy Engine).
*Priority:* Medium. *Traceability:* GovernanceEngineRequirements.md GE-011/GE-017; RI-001.

## 7. Open Items

1. Whether reference-document text extraction/indexing (SL-009) is enabled by default or per-policy is a Governance & Policy Engine configuration decision, not fixed here.
2. Supported reference-document formats and size limits are design/engineering concerns deferred to `04-Design/`/`05-Engineering/` within the ADR-005 constraints.
3. Retention of superseded reference-document versions is deferred to `07-Privacy-Compliance/RetentionPolicy.md`.

## 8. Challenge the Design

Before this document is approved:

1. Is the boundary between the SOP Library and both general document management (SL-002) and the Knowledge Base (SL-003) crisp enough to prevent overlap or scope creep?
2. Could reference-document search reveal the existence of documents outside a user's authorization (SL-009)?
3. Does linking a checklist/SOP to a required review step (SL-010) stay within the Governance Engine rather than duplicating enforcement logic here?
4. What is deferred (indexing default, formats, version retention) and is each flagged?

## 9. Revision History

| Version | Date | Summary | Author |
|---|---|---|---|
| 0.1.0 | 2026-07-20 | Initial SOP / Reference Document Library requirements (SL-001–SL-010): a narrow, versioned, approval-controlled store of reference documents that support the review workflow (SOPs, checklists, naming conventions, export templates), openable side-by-side with a transcript. Bounded away from general document management (Scope §3.6) and kept distinct from the Knowledge Base (reference material vs. approved meeting outputs). RBAC- and classification-governed, within the isolation boundary; existence-hiding search. Introduces SL-### prefix. Indexing default, formats, and version retention deferred. | Dr Ziyaad Moolla (ZM) |

---

*End of Document — PEKB-02-REQ-013 — Project Echo SOP / Reference Document Library Requirements — PE-2026.001-ZM*
