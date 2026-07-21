# Project Echo — Core Data Model

## Document Metadata

| Field | Value |
|---|---|
| Document ID | PEKB-04-DSN-003 |
| Document Title | Core Data Model |
| PEKB Section | 04-Design |
| Version | 0.1.0 |
| Status | Draft |
| Classification | Internal — Design |
| Owner Role | Database Architect |
| Approval Required From | Principal Software Architect, Security Architect, Privacy Officer, QA Lead |
| Related Documents | ADR-004, ADR-006, ADR-007, ADR-010, ADR-013 (00-Governance/Decisions); DatabaseArchitecture.md, ModuleArchitecture.md (03-Architecture); FunctionalRequirements.md, PrivacyRequirements.md, SecurityRequirements.md (02-Requirements) |
| Original Creator | Dr Ziyaad Moolla |
| Creator ID | ZM |
| Document Provenance | PE-2026.001-ZM |

---

## 1. Purpose and Scope

This document is the concrete **core data model** — the principal entities, their keys, relationships, classification, and lifecycle behavior — sufficient to build **Phase 1 (Foundation)** and the core review workflow. It realizes, at schema level, the lifecycle-state-driven storage model and seven data domains of `03-Architecture/DatabaseArchitecture.md`, bound to the ratified engines (`ADR-010`: SQLite local, PostgreSQL shared) and key management (`ADR-013`).

Scope is the **core**: meetings, recordings, transcripts and their append-only revisions, speakers, comments, derived knowledge objects, the approval/lifecycle records, identity/roles, classification, retention/disposal, audit, and backup metadata. **Extended module schemas** (full Governance/Policy Engine configuration tables, Knowledge Base indexes, SOP Library, Evidence packaging) are noted where they attach and are elaborated per module as each build phase reaches them.

This is design detail; it introduces no requirements. Every entity cites the requirement/ADR it serves. Physical column types are given generically (the two engines differ in exact types); the engineering phase binds them per engine.

## 2. Modeling Conventions

- **Identity:** every entity has a globally unique identifier (`*_id`, GUID), per briefing V14 ("every object has identity").
- **Classification:** every content-bearing entity carries **both** classification axes (ADR-006): `data_class` (C1–C4, Axis 1) and `sensitivity_label` (Public…Highly Restricted, Axis 2). Derived entities inherit the most-sensitive source value on each axis (no laundering, PR-036/KB-004).
- **Append-only:** content history is never updated in place; edits create new revision rows (ADR-007; DB-008–011).
- **Placement:** each entity notes local (SQLite), shared (PostgreSQL), or both (synced per ADR-012).
- **Encryption:** content-bearing fields are encrypted at rest under the ADR-013 key hierarchy; keys are never stored beside the data they protect (SR-025).
- **Audit:** consequential changes emit an `audit_event` (Section 9); audit is append-only and independent (ADR-004 §4.4).

## 3. Meeting and Recording

**Meeting** *(both placements; FR §3.1)*

| Column | Notes |
|---|---|
| meeting_id (PK) | GUID |
| title, description | encrypted; may contain personal info (≥ C2 if so) |
| department_id (FK), project/study, committee | organizational metadata |
| meeting_type_id (FK) | drives template/checklist/policy (RI-017, GE) |
| data_class, sensitivity_label | ADR-006 two-axis |
| lifecycle_state | enum, Section 7 |
| owner_user_id (FK), created_at, last_modified | Meeting Owner (ADR-004) |
| retention_policy_id (FK), legal_hold (bool) | ADR-007; EV-003 |

**Recording** *(both; FR-023; supports multiple recordings per meeting, briefing V14)*

| Column | Notes |
|---|---|
| recording_id (PK), meeting_id (FK) | one meeting → many recordings |
| source (live/import/room-mic…), checksum, duration | integrity (RC-016) |
| storage_location, encryption_ref | ADR-013 |
| data_class (≥ C2, PR-019), sensitivity_label | recording inherently personal |
| created_at, integrity_verified_at | RC-016 |

## 4. Transcript and Append-Only Revisions

**Transcript** *(both; FR §3.1)* — `transcript_id (PK)`, `meeting_id (FK)`, `current_revision_id (FK)`, `lifecycle_state`, `data_class`, `sensitivity_label`, `ai_engine_version`, `ai_model_ref` (AI-053 provenance).

**TranscriptRevision** *(append-only; DB-008–011; FR-038)*

| Column | Notes |
|---|---|
| revision_id (PK), transcript_id (FK), parent_revision_id (FK) | version tree (branching, briefing V14) |
| author_type (AI / human / reviewer-correction / approved) | four-state provenance (SA-032; V9) |
| author_user_id (FK, nullable for AI) | attribution |
| created_at | immutable |
| content_ref | structured content (Section 5), encrypted |
| is_verbatim (bool) | guardrail: AI text never flagged verbatim (AI-059) |

Revisions are **never updated or deleted**; a correction, an AI suggestion accepted by a human, or a redaction all create new revisions.

## 5. Structured Transcript Content

Transcript content is stored structurally, not as a blob (briefing V14), to enable precise playback, targeted correction, and auditing.

**Segment** — `segment_id (PK)`, `revision_id (FK)`, `sequence`, `start_ms`, `end_ms`, `speaker_id (FK)`, `text` (encrypted), `confidence_overall`, `confidence_by_category` (JSON: speech/speaker/terminology/names/numbers/dates), `uncertainty_flags` (typed: name/number/date/terminology/unclear-audio/multi-speaker — RI-006), `is_inaudible` (bool; AI-026/AI-061 — never fabricated).

## 6. Speakers, Comments, Derived Knowledge

**Speaker** *(briefing V14 speaker object)* — `speaker_id (PK)`, `meeting_id (FK)` (per-meeting label, C2, AI-040a) or `voice_profile_id` (persistent, C3, opt-in only — AI-041/PR-032), `display_name`, `role`, `department`, `aliases`, `confidence`, `is_uncertain` (bool; AI-060).

**Comment** *(structured; RI-016)* — `comment_id (PK)`, `transcript_id`/`segment_id (FK)`, `author_user_id`, `type` (general/question/correction/policy/quality/privacy/technical), `status` (open/resolved), `parent_comment_id` (threads), `created_at`, permissions scope.

**ActionItem** / **Decision** *(Knowledge Base source objects; KB-010/KB-011)* — structured objects (assignee, due, priority, status / owner, rationale, related, status), each linked to source `meeting_id` + `segment_id`, entering the Knowledge Base **only when the source transcript is Approved+** (KB-001). Extended KB indexes attach here (Phase 4).

## 7. Lifecycle, Approval, Retention, Disposal

**Lifecycle state** (on Meeting/Transcript) enum, per ADR-007:
`Recording Received → Processing → Draft Transcript → Review Required → Reviewed → Approved → Archived → Eligible for Disposal → Disposed`.

**ApprovalRecord** *(ADR-007 §4.2 multi-stage)* — `approval_id (PK)`, `transcript_id (FK)`, `stage_index`, `stage_name`, `approver_user_id`, `action` (granted/returned), `comments`, `created_at`. Separation of duties enforced (SR-019): reviewer of a transcript cannot fill an approval stage they are barred from.

**RetentionState / Disposal** — `retention_policy_id`, `retention_starts_at`, `eligible_for_disposal_at` (suspended while `legal_hold`), `disposed_at`, `disposal_certificate_ref`. On Disposed: C1–C3 content destroyed; the **C4 audit row and disposal certificate persist** (ADR-007 §4.1; PR-044; SR-076/077).

## 8. Identity, Roles, Classification, Policy (attach points)

**User** — `user_id (PK)`, federated identity ref (SEC-005; no local password store), status. **RoleAssignment** — `assignment_id`, `user_id`, `role` (8 baseline, ADR-004) or `custom_role_id` (ADR-008), `scope` (meeting/department/org), `granted_by`, `expires_at` (for delegation/exceptions, SR-074/075), audited. **CustomRole** — validated composition (ADR-008/SR-070–072). **Policy / Rule / Workflow** *(Governance Engine; GE-###)* — configuration tables; full schema elaborated in Phase 3. **ClassificationLabel** — reference tables for both axes (ADR-006).

## 9. Audit and Backup

**AuditEvent** *(independent, append-only; ADR-004 §4.4; SR-041–043; MA-002)* — `event_id (PK)`, `event_type`, `actor_user_id`, `actor_role`, `scope`, `target_ref`, `data_class`, `timestamp`, `detail` (no meeting content unless explicitly authorized). No code path updates or deletes an audit row (SR-043; AC-007). Retained independently of, and potentially longer than, the content it describes (C4; PR-044).

**Backup** *(RC-003)* — `backup_id (PK)`, `created_at`, `scope`, `contents_summary`, `encryption_ref` (ADR-013), `checksum`, `verification_status`, `last_restore_validation_at` (RC-009). Backups inherit classification/isolation of their source (RC-004).

## 10. Placement & Sync Summary

- **Local (SQLite, encrypted via ADR-013/DPAPI-NG):** in-progress capture, working transcript/revisions, the reviewer's local workspace, offline queue.
- **Shared (PostgreSQL; SQL Server supported):** authoritative approved records, org-wide Knowledge Base/SOP/Policy/Audit, cross-user data.
- **Synced (ADR-012):** offline-first, in-org, **no auto-merge** — conflicting concurrent revisions are surfaced for human resolution (DB-011), never merged.

## 11. Open Items

1. Extended module schemas (full Governance/Policy configuration, Knowledge Base search indexes, SOP Library, Evidence packaging, Recovery Centre) are elaborated per module as each build phase reaches them; this document covers the core needed for Phase 1 + core review.
2. Physical column types, indexes, and migrations per engine are `05-Engineering/` deliverables bound to ADR-010.
3. Specific cryptographic algorithms remain deferred to `05-Engineering/` (AR-052 residual).

## 12. Challenge the Design

1. Does every content-bearing entity carry both classification axes, and does inheritance prevent laundering?
2. Is the append-only guarantee expressible with no update/delete path on revision and audit tables?
3. Can a Disposed record's structure retain the certificate + C4 audit while destroying C1–C3 content?
4. Does the model let "Approve" and the multi-stage approval enforce separation of duties at the data layer, not just the UI?
5. What is deferred (module schemas, engine types, algorithms) and is each flagged?

## 13. Revision History

| Version | Date | Summary | Author |
|---|---|---|---|
| 0.1.0 | 2026-07-20 | Initial Core Data Model: principal entities (Meeting, Recording, Transcript, append-only TranscriptRevision with four-state provenance, structured Segment with per-category confidence and typed uncertainty, Speaker, Comment, ActionItem/Decision, ApprovalRecord, Retention/Disposal, User/RoleAssignment/CustomRole, ClassificationLabel, AuditEvent, Backup) with keys, relationships, two-axis classification, lifecycle, placement, and sync behavior. Bound to ADR-010 engines and ADR-013 key management. Sufficient for Phase 1 Foundation + core review; extended module schemas and per-engine physical types deferred. | Dr Ziyaad Moolla (ZM) |

---

*End of Document — PEKB-04-DSN-003 — Project Echo Core Data Model — PE-2026.001-ZM*
