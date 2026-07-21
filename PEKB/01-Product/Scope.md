# Project Echo — Scope

## Document Metadata

| Field | Value |
|---|---|
| Document ID | PEKB-01-PRD-003 |
| Document Title | Scope |
| PEKB Section | 01-Product |
| Version | 0.3.0 |
| Status | Draft |
| Classification | Internal — Product |
| Owner Role | Product Manager |
| Approval Required From | Principal Software Architect, Security Architect, Privacy Officer |
| Related Documents | Vision.md, BusinessCase.md, ProjectIntent.md (00-Governance), FunctionalRequirements.md (02-Requirements, pending) |
| Original Creator | Dr Ziyaad Moolla |
| Creator ID | ZM |
| Document Provenance | PE-2026.001-ZM |

---

## 1. Purpose of This Document

This document defines the concrete boundaries of Project Echo's initial product scope: what is included, what is explicitly excluded, and what is deferred to future consideration. It exists to prevent scope drift, consistent with the Statement of Non-Intent in `00-Governance/ProjectIntent.md` §3, and to give `02-Requirements/` a bounded scope to derive testable requirements from.

This document defines *product* scope. It does not select technologies, define system architecture, or specify implementation approaches — those belong to `03-Architecture/` and are explicitly out of scope for this document.

## 2. In Scope (Initial Product Scope)

The following capability areas are in scope for Project Echo's defined product direction:

1. **Secure meeting capture** — the ability to record or ingest meeting audio/content within an organization's controlled environment.
2. **AI-assisted transcription** — conversion of captured meeting content into draft text transcripts.
3. **Speaker identification** — attribution of transcript segments to distinct speakers, subject to the privacy considerations tracked in `00-Governance/AssumptionsRegister.md` (AR-012, AR-026).
4. **Transcript review workflow** — the Draft → Reviewed → Approved → Archived lifecycle, including editing, correction, commenting, revision comparison, and change tracking.
5. **AI-assisted summarization** — generation of draft meeting summaries subject to human review.
6. **AI-assisted action item extraction** — generation of draft candidate action items subject to human review.
7. **Meeting insights and search assistance** — AI-assisted capabilities to help users find and understand previously captured meeting knowledge.
8. **Access control** — restricting who may view, edit, approve, export, or delete meeting content and derived artifacts.
9. **Auditability** — recording of consequential actions (approvals, exports, deletions, retention actions) attributable to a human actor.
10. **Retention management** — governed lifecycle management of meeting data and derived artifacts, including archival.
11. **Controlled export** — deliberate, auditable mechanisms for meeting data to leave Project Echo's managed environment, where explicitly configured and approved.
12. **User guidance and accessibility support** — tooltips, contextual hints, walkthroughs, user guides, and accessible design, per `00-Governance/ProjectConstitution.md` §3.7.

The following capability areas were added in v0.2.0, following the product-owner briefing, as part of Project Echo's committed identity as a Meeting Intelligence Platform and system of record (`Vision.md` §2). Each is named here as authoritative in-scope; its **detailed requirements are pending** authoring in `02-Requirements/` and each remains subordinate to `ProjectConstitution.md` and the ratified ADRs:

13. **Enterprise governance engine** — an organization-configurable policy library, policy-enforcement engine, and workflow/rule engine governing approvals, conditions, escalations, retention triggers, and mandatory review/checklist requirements. Configuration-driven, never per-organization custom code (`DesignPrinciples.md` §3.10). *Requirements: `02-Requirements/GovernanceEngineRequirements.md` (GE-###).*
14. **Review intelligence engine** — reviewer-assist tooling (per-category confidence, evidence panel, intelligent highlighting, review queue, heat map, difference viewer) that **suggests and surfaces, but never changes**, the official record, per the Ethical AI Charter. *Requirements: `02-Requirements/ReviewIntelligenceEngineRequirements.md` (RI-###).*
15. **Organization knowledge base** — a permission-scoped, in-organization searchable repository built **only from approved meeting-derived outputs** (decisions, action items, risks, approved summaries, topics) — not raw transcripts. Distinct from the general-purpose knowledge management excluded in Section 3.6 (see reconciliation note there). *Requirements: `02-Requirements/KnowledgeBaseRequirements.md` (KB-###).*
16. **SOP / reference document library** — storage and side-by-side access to **approved reference documents that directly support the review workflow** (SOPs, checklists, naming conventions, export templates). Scoped to review-supporting reference material, **not** general file storage or a wiki (see Section 3.6). *Requirements: `02-Requirements/SOPLibraryRequirements.md` (SL-###).*
17. **Recoverability subsystem** — versioned backups, guided restore, workspace recovery after interruption, and disaster recovery, per `ProjectConstitution.md` Commitment 11. *Requirements: `02-Requirements/RecoverabilityRequirements.md` (RC-###).*
18. **Governance, evidence & compliance capabilities** — records-management lifecycle (including retention states through governed secure disposal), digital evidence packages, chain of custody, compliance mapping, legal hold, and evidence/compliance reporting. *Requirements: `02-Requirements/EvidenceComplianceRequirements.md` (EV-###).*
19. **Redaction and secure external sharing** — governed creation of redacted copies (leaving the original immutable) and encrypted, audited sharing packages, as controlled-export mechanisms extending Section 2.11 and bound by the isolation-boundary discipline of ADR-002. *Requirements: `02-Requirements/RedactionSecureSharingRequirements.md` (RS-###).*

## 3. Explicitly Out of Scope (Initial Product Scope)

Consistent with `00-Governance/ProjectIntent.md` §3, the following are explicitly excluded from Project Echo's current defined scope:

1. **Video-conferencing or meeting-hosting functionality.** Project Echo processes meetings; it does not host or conduct them.
2. **Meeting scheduling or calendar management.** Not a calendaring product.
3. **Autonomous AI action-taking.** Project Echo does not send communications, make commitments, or alter organizational records on its own authority; all AI output requires human review per the Human Authority commitment.
4. **Continuous unsupervised AI learning from organizational data.** Any AI improvement follows the governed AI Improvement Loop (`00-Governance/ProjectConstitution.md` §5.4); Project Echo does not learn from meeting content without human-approved, version-controlled updates.
5. **Public or consumer-facing deployment.** Project Echo's initial scope targets organizational/enterprise deployment only.
6. **General-purpose document management or knowledge base functionality unrelated to meetings.** Project Echo preserves meeting-derived knowledge; it is not a general file-storage or wiki platform. *Reconciliation note (v0.2.0):* the in-scope Organization Knowledge Base (Section 2.15) and SOP/reference library (Section 2.16) do **not** breach this exclusion — the former operates only over *approved meeting-derived outputs*, and the latter is scoped to *approved reference documents that support the review workflow*. Neither provides general-purpose file storage, arbitrary document management, or wiki functionality unrelated to meetings; any drift toward that is a scope violation.
7. **Mandatory dependency on unrestricted infrastructure.** Project Echo's in-scope capabilities must not require administrator rights, mandatory container runtimes, or mandatory constant internet connectivity as a precondition, per `00-Governance/ProjectIntent.md` §3.5.

## 4. Deferred / Future Consideration

The following are acknowledged as directionally relevant to the long-term vision (`Vision.md` §7) but are **not** part of current product scope, and require an explicit future scope decision (with governance review) before being added:

1. **Mobile and web clients.** The adopted topology is local-first desktop + organization-controlled shared component (ADR-002 / DA-009). A web or mobile client is deferred and tracked as `00-Governance/AssumptionsRegister.md` **AR-086**; recurring "and web" framing across the briefing does not, by itself, commit a web client.
2. **Enterprise Knowledge Graph.** Relationship modelling across projects/meetings/decisions/documents, over approved content only — a long-term vision capability, not initial scope.
3. **On-premises large-language-model summarization.** Any on-prem LLM capability must remain within ADR-001's offline-default and AI-ARCH-011 isolation; deferred pending a dedicated decision.
4. **Voice biometrics.** Persistent voice-based speaker recognition — POPIA special-category processing; deferred and gated behind a dedicated governance/ethics review if ever pursued (distinct from the in-scope per-meeting speaker identification in Section 2.3).
5. Broader "organizational knowledge platform" capabilities beyond meetings (e.g., non-meeting document knowledge capture).
6. Any expansion beyond the exclusions in Section 3.
7. Integration with third-party video-conferencing or calendar platforms (ingestion of externally-hosted meetings), as distinct from Project Echo hosting meetings itself (which remains excluded per Section 3.1).

Movement of any item from Deferred to In Scope requires a documented scope change per the change control process in `00-Governance/RevisionPolicy.md` §5, not an implicit inclusion during requirements or architecture work.

## 5. Scope Boundary Rationale

Scope decisions in Sections 2–4 are derived directly from:

1. The Statement of Intent and Statement of Non-Intent in `00-Governance/ProjectIntent.md`.
2. The Foundational Commitments in `00-Governance/ProjectConstitution.md` (particularly Human Authority, AI governance, and Enterprise First).
3. The Mission statement in `Vision.md` §3.

No scope boundary in this document has been introduced without a corresponding governance basis; where a plausible capability could not be clearly justified against these sources, it has been placed in Section 4 (Deferred) rather than Section 2 (In Scope).

## 6. How Scope Relates to Success Measurement

Scope boundaries in this document exist to keep the success indicators in `Vision.md` §6 achievable and evaluable. A capability being added to scope without corresponding requirements, architecture, and acceptance criteria would undermine the traceability chain required by `00-Governance/EngineeringPrinciples.md` §3, and is therefore treated as a scope violation, not a minor addition.

## 7. Open Items

1. Whether third-party meeting-platform ingestion (Section 4.3) will ever be added, and if so, under what governance conditions.
2. Precise capability-level boundaries within "meeting insights and search assistance" (Section 2.7) — this is named as a capability area but not yet specified at requirements level.
3. Whether any Section 2 capability (e.g., speaker identification) may need to be made optional/configurable per organization pending resolution of AR-012/AR-026.

These are tracked in `00-Governance/AssumptionsRegister.md`.

## 8. Relationship to Other PEKB Documents

- `Vision.md` and `BusinessCase.md` provide the justification this Scope document bounds.
- `00-Governance/ProjectIntent.md` is the governance authority this Scope elaborates; any conflict is resolved in favor of `ProjectIntent.md`.
- `02-Requirements/FunctionalRequirements.md` must derive its requirements from the In Scope list (Section 2) only; requirements referencing Section 3 (Out of Scope) items should be rejected or escalated as a scope question. Capability areas 13–19 are in scope but their requirements are pending; requirements work for them is authorized, requirements work for Section 3/4 items is not.

## 9. Challenge the Design

Before this document is approved:

1. Does any newly-added capability (Sections 2.13–2.19) actually appear in the product-owner briefing, or has any been inferred/invented?
2. Do the Knowledge Base (2.15) and SOP library (2.16) stay clearly on the meeting/approved-content side of the Section 3.6 exclusion, or is the boundary still blurry?
3. Does any in-scope addition weaken an out-of-scope exclusion (e.g., autonomous action, general document management, meeting hosting)?
4. Is every deferred capability (Section 4) recorded with a tracking reference, and none accidentally promoted?
5. What have we added to scope that we cannot yet write acceptance criteria for, and is that flagged as "requirements pending" rather than presented as complete?

## 10. Revision History

| Version | Date | Summary | Author |
|---|---|---|---|
| 0.1.0 | 2026 (initial) | Initial Scope: 12 in-scope capability areas, 7 out-of-scope exclusions, deferred items, boundary rationale. | Dr Ziyaad Moolla (ZM) |
| 0.2.0 | 2026-07-20 | Added in-scope capability areas 13–19 (enterprise governance engine, review intelligence engine, organization knowledge base, SOP/reference library, recoverability subsystem, governance/evidence/compliance, redaction & secure sharing), each marked "detailed requirements pending"; added a reconciliation note to §3.6 distinguishing the Knowledge Base/SOP library from excluded general-purpose document management; expanded §4 deferred items with explicit tracking (mobile/web AR-086, Enterprise Knowledge Graph, on-prem LLM summarization, voice biometrics). Added Challenge-the-Design and Revision History. No out-of-scope exclusion weakened. | Dr Ziyaad Moolla (ZM) |
| 0.3.0 | 2026-07-20 | Replaced the "detailed requirements pending" markers on capability areas 13–19 with references to their now-authored requirement documents (GovernanceEngineRequirements GE-###, ReviewIntelligenceEngineRequirements RI-###, KnowledgeBaseRequirements KB-###, SOPLibraryRequirements SL-###, RecoverabilityRequirements RC-###, EvidenceComplianceRequirements EV-###, RedactionSecureSharingRequirements RS-###). | Dr Ziyaad Moolla (ZM) |

---

*End of Document — PEKB-01-PRD-003 — Project Echo Scope — PE-2026.001-ZM*
