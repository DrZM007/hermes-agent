# Project Echo — Organization Knowledge Base Requirements

## Document Metadata

| Field | Value |
|---|---|
| Document ID | PEKB-02-REQ-012 |
| Document Title | Organization Knowledge Base Requirements |
| PEKB Section | 02-Requirements |
| Version | 0.1.0 |
| Status | Draft |
| Classification | Internal — Requirements |
| Owner Role | Product Manager |
| Approval Required From | Principal Software Architect, Security Architect, Privacy Officer, QA Lead |
| Related Documents | ProjectConstitution.md, EthicalAICharter.md (00-Governance); ADR-002-DeploymentModel.md, ADR-003-DataOwnershipGovernance.md, ADR-004-AccessControlRBACModel.md, ADR-006-DataClassificationTwoAxisModel.md, ADR-007-TranscriptRecordLifecycle.md (00-Governance/Decisions); Scope.md (01-Product); FunctionalRequirements.md, PrivacyRequirements.md, SecurityRequirements.md, AcceptanceCriteria.md (02-Requirements) |
| Original Creator | Dr Ziyaad Moolla |
| Creator ID | ZM |
| Document Provenance | PE-2026.001-ZM |

---

## 1. Purpose and Scope

This document defines the requirements for Project Echo's **Organization Knowledge Base** — the in-scope capability in `01-Product/Scope.md` §2.15 — which turns approved meeting outputs into a permission-scoped, searchable institutional memory. It exists so an organization can answer questions such as "show every approved decision relating to protocol X in 2025" or "list unresolved action items assigned to a department," while keeping all data within the organization's control.

The Knowledge Base is deliberately bounded (Scope §3.6 reconciliation note): it operates **only over approved meeting-derived outputs**, is **not** general-purpose document management, and is **not** a wiki. The Enterprise Knowledge Graph is a separate, deferred capability (Scope §4) and is out of scope here.

## 2. Requirement Identifiers

Requirements use the prefix **`KB-###`** (Knowledge Base), recorded in `Glossary.md` §3A.

## 3. Source Content — Approved Outputs Only

**KB-001** — The Knowledge Base shall be populated **only** from meeting outputs that have reached the Approved state (or later) in the transcript lifecycle (`FunctionalRequirements.md` §3.1); unreviewed AI output and in-progress transcripts shall never enter it.
*Priority:* Critical. *Traceability:* ADR-007; EthicalAICharter.md §3.2; Constitution Commitment 2.

**KB-002** — The Knowledge Base shall index structured approved outputs — decisions, action items, risks, approved summaries, and topics — and approved transcript content, but shall **not** ingest raw recordings or unapproved drafts.
*Priority:* High. *Traceability:* Scope.md §2.15; briefing V14 (structured objects).

**KB-003** — When an approved record is later re-opened, amended, superseded, or disposed (per ADR-007), its Knowledge Base representation shall be updated or removed to stay consistent with the current approved state; the Knowledge Base shall never present as current an output that has been superseded or disposed.
*Priority:* High. *Traceability:* ADR-007; DesignPrinciples.md §3.12.

## 4. Classification, Scope, and Isolation

**KB-004** — Every Knowledge Base entry shall inherit **both** classification axes (ADR-006) of its most-sensitive source, and shall never be assigned a lower value on either axis; no classification laundering shall occur when content is derived into the Knowledge Base.
*Priority:* Critical. *Traceability:* ADR-006 §4.5; PrivacyRequirements.md PR-036.

**KB-005** — All Knowledge Base search and retrieval shall be scoped to the requesting user's authorization (ADR-004); the Knowledge Base shall never surface an entry, or reveal the existence of an entry, that the user is not authorized to access, consistent with `AIRequirements.md` AI-018.
*Priority:* Critical. *Traceability:* ADR-004 §4.1; AIRequirements.md AI-018.

**KB-006** — The Knowledge Base shall exist entirely within the organization's isolated deployment (ADR-002); no Knowledge Base content shall cross the organizational boundary except through the governed Controlled Export / secure-sharing mechanisms.
*Priority:* Critical. *Traceability:* ADR-002; ADR-003; Scope.md §2.19.

## 5. Search and Query

**KB-007** — Authorized users shall be able to search the Knowledge Base across approved decisions, action items, risks, summaries, topics, and approved transcript text, with results scoped per KB-005.
*Priority:* High. *Traceability:* Scope.md §2.15; briefing V10/V12.

**KB-008** — Search results shall be explainable: for each result the system shall indicate why it matched (e.g., transcript text, metadata, dictionary term, comment), consistent with the Transparency commitment.
*Priority:* Medium. *Traceability:* briefing V11 (explainable search); Constitution Commitment 8.

**KB-009** — The system shall support structured queries over approved outputs (e.g., "approved decisions relating to topic X in a date range," "unresolved action items for department Y"), returning only entries within the user's authorization scope.
*Priority:* Medium. *Traceability:* Scope.md §2.15; briefing V10.

## 6. Structured Knowledge Objects

**KB-010** — Approved action items shall be represented as structured objects (assignee, due date, priority, status, source meeting and transcript location, completion state, history), enabling organizations to track them beyond a single meeting.
*Priority:* Medium. *Traceability:* briefing V14 (action item objects); FunctionalRequirements.md.

**KB-011** — Approved decisions shall be represented as structured objects (owner, source meeting, date, rationale where captured, related items, status), forming a decision register queryable per KB-009.
*Priority:* Medium. *Traceability:* briefing V14 (decision register).

**KB-012** — The system may support comparison across recurring meetings (e.g., completed vs. outstanding action items, recurring topics) over approved content only, within the organization's environment and the user's authorization scope.
*Priority:* Low. *Traceability:* briefing V10 (meeting comparison); KB-005/KB-006.

## 7. Boundaries

**KB-013** — The Knowledge Base shall not provide general-purpose file storage, arbitrary document management, or wiki functionality unrelated to meetings; content unrelated to approved meeting outputs is out of scope (Scope §3.6). Any drift toward general document management is a scope violation.
*Priority:* High. *Traceability:* Scope.md §3.6.

**KB-014** — Relationship-graph capabilities across projects/documents/policies (the Enterprise Knowledge Graph) are out of scope for the Knowledge Base and deferred per `Scope.md` §4; the Knowledge Base shall not be extended toward them without a scope amendment.
*Priority:* Medium. *Traceability:* Scope.md §4.

## 8. Open Items

1. The search-index architecture (rebuildable without affecting source data, per briefing V14) is a `03-Architecture/` concern and is not fixed here.
2. The exact structured-object schemas (KB-010/KB-011) are design-level and deferred to `04-Design/` and `03-Architecture/DatabaseArchitecture.md`.
3. Retention of Knowledge Base entries relative to their source records (whether a KB entry persists after its source is disposed) is deferred to `07-Privacy-Compliance/RetentionPolicy.md`, consistent with KB-003.

## 9. Challenge the Design

Before this document is approved:

1. Is there any path by which unapproved or superseded content could enter or persist in the Knowledge Base (KB-001/KB-003)?
2. Could search ever reveal the existence of content outside a user's authorization (KB-005)?
3. Does classification inheritance (KB-004) fully prevent laundering across both axes?
4. Is the boundary with general document management (KB-013) crisp enough to prevent scope creep?
5. What is deferred (index architecture, object schemas, KB-entry retention) and is each flagged?

## 10. Revision History

| Version | Date | Summary | Author |
|---|---|---|---|
| 0.1.0 | 2026-07-20 | Initial Organization Knowledge Base requirements (KB-001–KB-014): a permission-scoped, in-organization institutional-memory store over approved meeting outputs only. Source restricted to Approved-or-later outputs (no raw recordings, no unapproved drafts), kept consistent with lifecycle changes; both-axes classification inheritance with no laundering; RBAC-scoped and existence-hiding search; structured action-item/decision objects; bounded away from general document management and the deferred Knowledge Graph. Introduces KB-### prefix. Index architecture and object schemas deferred to 03/04; KB-entry retention deferred to 07. | Dr Ziyaad Moolla (ZM) |

---

*End of Document — PEKB-02-REQ-012 — Project Echo Organization Knowledge Base Requirements — PE-2026.001-ZM*
