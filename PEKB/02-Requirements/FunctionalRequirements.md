# Project Echo — Functional Requirements

## Document Metadata

| Field | Value |
|---|---|
| Document ID | PEKB-02-REQ-003 |
| Document Title | Functional Requirements |
| PEKB Section | 02-Requirements |
| Version | 0.1.0 |
| Status | Draft |
| Classification | Internal — Requirements |
| Owner Role | Product Manager |
| Approval Required From | Principal Software Architect, Security Architect, Privacy Officer, UX Lead |
| Related Documents | Vision.md, Scope.md (01-Product); ADR-001–ADR-004 (00-Governance/Decisions); SecurityRequirements.md, PrivacyRequirements.md (02-Requirements); AssumptionsRegister.md (00-Governance) |
| Original Creator | Dr Ziyaad Moolla |
| Creator ID | ZM |
| Document Provenance | PE-2026.001-ZM |

---

## 1. Purpose and Scope of This Document

This document defines the functional capabilities Project Echo must provide to users and organizations: what users can do, what workflows exist, what information users interact with, and what outcomes the system must support. It does not define software architecture, programming languages, databases, infrastructure, vendor selection, or technical implementation — those belong to `03-Architecture/` and `05-Engineering/`.

This document uses the requirement identifier format `FR-<###>` (Functional Requirement), following the `SR-###`/`PR-###` precedent established in `SecurityRequirements.md` §2. Every requirement traces to `01-Product/Vision.md`, `01-Product/Scope.md`, ADR-001–ADR-004, `SecurityRequirements.md`, or `PrivacyRequirements.md`.

This document does not resolve open AI-capability questions (e.g., whether persistent speaker recognition ships, per AR-060) — these are referenced as open assumptions, not decided here.

## 2. Priority Definitions

Priority levels are as defined in `SecurityRequirements.md` §3 (Critical / High / Medium / Low), reused without redefinition per `00-Governance/DocumentStandards.md` §5.

## 3. Workflow States (Explicit Definition)

### 3.1 Transcript Lifecycle Workflow

The transcript lifecycle is defined as the following required state sequence:

```
Recording Received
       ↓
   Processing
       ↓
 Draft Transcript
       ↓
 Review Required
       ↓
   Reviewed
       ↓
   Approved
       ↓
   Archived
       ↓
 Eligible for Disposal
       ↓
   Disposed
```

> **Amended by ADR-007.** The records-management tail (Eligible for Disposal, Disposed) was appended by `00-Governance/Decisions/ADR-007-TranscriptRecordLifecycle.md`. That ADR also establishes that **multi-stage approval** is a configurable sub-process of the Reviewed → Approved transition (not new macro states — see note after the table), and that **collaborative editing** is an editing *mode* within Draft Transcript / Review Required (not a new state), bound by the no-auto-merge invariant `DatabaseArchitecture.md` DB-011. **Legal Hold** is an overlay that suspends the Archived → Eligible-for-Disposal transition and blocks Disposed.

| State | Meaning | Entry Condition | Status Visibility | Permitted Actions | Roles Permitted (per ADR-004) |
|---|---|---|---|---|---|
| **Recording Received** | A completed capture or imported recording has been accepted into the system. | Recorder ends capture, or an authorized user completes an import. | Visible to Meeting Owner and Recorder. | Confirm receipt; no editing possible yet. | Meeting Owner, Recorder |
| **Processing** | AI transcription (and, where applicable, speaker labeling) is underway. | Automatic, immediately following Recording Received. | Visible to Meeting Owner as a progress indicator. | View status only; no content exists yet to act on. | Meeting Owner (view only) |
| **Draft Transcript** | AI-generated transcript exists; no human review has occurred. | Automatic, upon successful processing completion. | Visible to Meeting Owner and assigned Reviewer(s). | Assign/confirm Reviewer; begin correction. | Meeting Owner (assign), Reviewer (edit) |
| **Review Required** | The Draft Transcript is queued/flagged for active Reviewer attention. | Automatic, immediately following Draft Transcript, or upon return from a later state (see backward transitions below). | Visible to assigned Reviewer(s) and Meeting Owner. | Edit transcript text, correct names/speakers, add comments, flag uncertainty. | Reviewer |
| **Reviewed** | A Reviewer has completed correction and submitted the transcript for approval. | Reviewer submits review (Section 7). | Visible to Meeting Owner and Approver. | Approve, or return with requested changes. | Approver |
| **Approved** | An Approver has confirmed the transcript as the organizational record. | Approver approves a Reviewed transcript. | Visible per organization's configured access (Knowledge Consumer visibility begins here or at Archived, per organization configuration). | Search, read, summarize, export (per governance); re-opening requires Approver action (`SecurityRequirements.md` SR-035). | Approver (re-open), Knowledge Consumer (read) |
| **Archived** | The approved record has entered active long-term retention. | Automatic or organization-configured transition, per `PrivacyRequirements.md` §15 (Retention Requirements). | Visible per organization's configured access. | Read, search; un-archive requires an explicit, audited action. | Knowledge Consumer (read), Organization Administrator (un-archive) |
| **Eligible for Disposal** | The configured retention period has elapsed; the record is eligible for governed disposal but not yet disposed. | Automatic when the retention period (per `PrivacyRequirements.md` §15 and the two-axis classification, ADR-006) elapses; **suspended while a Legal Hold is in effect** (ADR-007 §4.4). | Visible per organization's configured access, with a disposal-eligibility indicator. | Read, search; authorize disposal (subject to separation of duties); re-extend retention (returns to Archived). | Knowledge Consumer (read), Organization Administrator (retention), disposal authority per `SecurityRequirements.md` |
| **Disposed** | The record's C1–C3 content has been securely destroyed under a governed disposal action; a disposal certificate has been generated. | An authorized disposal action executed on an Eligible-for-Disposal record. Blocked while a Legal Hold is in effect. | The C4 audit record and disposal certificate remain visible; content no longer exists. | View disposal certificate / audit record only. | Auditor (view), Organization Administrator (view) |

**Backward transitions**: Reviewed → Review Required (Approver requests changes, Section 8) and Approved → Reviewed (re-opening an approved record, per `SecurityRequirements.md` SR-035) are permitted and must be logged as distinct auditable actions, consistent with Section 13. **Eligible for Disposal → Archived** is permitted when retention is re-extended or a Legal Hold is applied. There is **no** transition out of **Disposed** (content no longer exists). Secure destruction is governed best-effort per storage medium/OS with a disposal certificate and surviving C4 audit record — never claimed as a cryptographic erasure guarantee (ADR-007 §4.1).

**Multi-stage approval (per ADR-007 §4.2)**: the Reviewed → Approved transition may be configured, via the governance/policy engine (`Scope.md` §2.13), to require an ordered sequence of approval stages (e.g., Department Manager then Final Approver). Stages are **configuration, not new macro states** — the record reaches the single **Approved** state only when all configured stages complete. Mandatory Reviewer/Approver separation of duties (ADR-004) and conflict-of-interest rules hold across every stage; each stage completion or rejection is a distinct auditable action; a rejection at any stage returns the record to **Review Required**.

**Collaborative editing (per ADR-007 §4.3)**: within **Draft Transcript** and **Review Required**, the organization may enable a collaborative editing mode (check-out/check-in, or real-time where infrastructure supports it). This is a working **mode, not a lifecycle state**; every edit remains an append-only revision and conflicting concurrent edits are surfaced for human resolution, never auto-merged (`DatabaseArchitecture.md` DB-011).

### 3.2 Meeting Capture Lifecycle

| State | Meaning |
|---|---|
| **Scheduled/Pending** | A meeting has been designated for capture; recording has not started. |
| **Recording** | Active capture is underway. |
| **Captured** | Recording has ended; feeds into "Recording Received" (Section 3.1). |

## 4. User and Organization Management

**FR-001** — The system shall support unique, identifiable user accounts for every individual accessing Project Echo, with no shared or anonymous accounts.
*Priority:* Critical. *Rationale:* Human accountability is unachievable without unique identity. *Traceability:* SecurityRequirements.md SR-011; ADR-004 §4.4.

**FR-002** — The system shall associate every user account with exactly one organization's isolated deployment, consistent with the tenancy model in ADR-002.
*Priority:* Critical. *Traceability:* ADR-002 §4.

**FR-003** — An Organization Administrator shall be able to create, modify, deactivate, and reactivate user accounts within their organization.
*Priority:* Critical. *Traceability:* ADR-004 §4.2; ADR-003 §4.7 (delegated authority).

**FR-004** — An Organization Administrator shall be able to assign one or more of the eight baseline roles defined in ADR-004 §4.1 to a user, scoped either organization-wide or to specific meetings/transcripts.
*Priority:* Critical. *Traceability:* ADR-004 §4.1–§4.2.

**FR-005** — The system shall prevent a user from self-assigning or self-escalating a role; all role delegation shall originate from the Organization Administrator, consistent with ADR-003's organization-owns/delegated-authority model.
*Priority:* Critical. *Traceability:* ADR-003 §4.7; ADR-004 §4.2; SecurityRequirements.md SR-016.

**FR-006** — The system shall enforce the mandatory separation-of-duties rules defined in ADR-004 §4.3 (e.g., System Administrator has no implicit content access; Reviewer ≠ Approver by default; Auditor independence) as non-bypassable defaults.
*Priority:* Critical. *Traceability:* ADR-004 §4.3; SecurityRequirements.md SR-018–SR-021.

**FR-007** — Any organization-configured exception to a mandatory separation of duties (e.g., combining Reviewer and Approver for a specific transcript) shall be visibly flagged wherever that content is displayed, and logged per Section 13.
*Priority:* Critical. *Traceability:* ADR-004 §4.3.2; SecurityRequirements.md SR-019.

**FR-008** — Deactivating a user account shall not delete that user's historical actions from the audit trail.
*Priority:* High. *Traceability:* SecurityRequirements.md SR-044.

**FR-009** — A user shall be able to view their own currently assigned role(s), scope, and the actions those roles permit, in plain, non-technical language.
*Priority:* High. *Rationale:* Supports novice users understanding their own authority without needing to understand the underlying RBAC model. *Traceability:* ProjectConstitution.md (User Experience Principles); Personas.md.

**FR-010** — An Organization Administrator shall be able to view a summary of all current role assignments within their organization, to support administrative oversight.
*Priority:* Medium. *Traceability:* ADR-004 §4.1 (Organization Administrator row).

## 5. Meeting Management

**FR-011** — An authorized user (Meeting Owner) shall be able to create a meeting record, becoming its accountable owner per ADR-003 §4.1–§4.2.
*Priority:* Critical. *Traceability:* ADR-003 §4.1–§4.2; ADR-004 §4.1 (Meeting Owner row).

**FR-012** — A meeting record shall capture, at minimum: date/time, Meeting Owner identity, designated Recorder(s), and a title or description.
*Priority:* High. *Traceability:* SecurityRequirements.md SR-031 (recording provenance).

**FR-013** — A meeting record shall support an associated list of participants, for the purpose of notification (Section 12) and, where applicable, per-participant consent tracking (`PrivacyRequirements.md` §10).
*Priority:* High. *Traceability:* PrivacyRequirements.md PR-025, PR-022.

**FR-014** — A meeting record and its derived artifacts (recording, transcript, summary) shall be assigned a classification level per the framework in `PrivacyRequirements.md` §6, no lower than C2 by default.
*Priority:* Critical. *Traceability:* PrivacyRequirements.md §6, PR-019.

**FR-015** — A Meeting Owner shall be able to configure privacy-relevant settings for their meeting to the extent delegated by the Organization Administrator (e.g., participant notification content, consent basis reference), consistent with ADR-003's delegated-authority model.
*Priority:* High. *Traceability:* ADR-003 §4.7; PrivacyRequirements.md §9–§10.

**FR-016** — Ownership of a meeting record shall remain with the organization (per ADR-003 §4.1), and reassignment of the Meeting Owner individual shall require Organization Administrator action, not be transferable by the current Meeting Owner unilaterally.
*Priority:* Medium. *Traceability:* ADR-003 §4.1, §4.7.

## 6. Recording Capture

**FR-017** — The system shall support live capture of a meeting by a designated Recorder, per ADR-004 §4.1 (Recorder row).
*Priority:* Critical. *Traceability:* Scope.md §2.1; ADR-004 §4.1.

**FR-018** — The system shall support import of a previously created recording as an alternative to live capture, subject to the same notification (Section 12), classification (Section 5, FR-014), and ownership (Section 5, FR-011) requirements as live-captured recordings.
*Priority:* High. *Traceability:* Scope.md §2.1; PrivacyRequirements.md PR-019.

**FR-019** — The system shall support recordings originating from external sources (e.g., a recording produced outside Project Echo and subsequently imported), provided the import path in FR-018 is satisfied.
*Priority:* Medium. *Traceability:* Scope.md §2.1.

**FR-020** — Where meeting-room hardware (e.g., dedicated conferencing microphones/cameras) is used to produce a capture, the system shall treat the resulting recording identically to any other captured recording for purposes of ownership, classification, and workflow — no hardware-specific behavior shall bypass Sections 3–5 of this document.
*Priority:* Medium. *Rationale:* Ensures consistent governance regardless of capture source, without prescribing hardware. *Traceability:* ADR-003 §4.1; PrivacyRequirements.md §6.

**FR-021** — Specific meeting-room hardware compatibility, drivers, or integration protocols are not yet defined and are deferred to `03-Architecture/DesktopArchitecture.md`; this document defines required behavior only, not hardware selection.
*Priority:* N/A (deferral notice).

**FR-022** — The participant notification required by `PrivacyRequirements.md` PR-022 shall be presented before or at the start of capture, regardless of capture source (live, import, or hardware-originated).
*Priority:* Critical. *Traceability:* PrivacyRequirements.md PR-022–PR-023.

## 7. Audio/Media Processing Workflow

**FR-023** — The system shall accept a completed recording (live-captured or imported) and transition it to the Recording Received state (Section 3.1).
*Priority:* Critical. *Traceability:* Section 3.1 (this document).

**FR-024** — Upon receipt, the system shall validate that the recording is usable for processing (e.g., contains audio content) before beginning transcription, and shall not silently proceed with an unusable input.
*Priority:* High. *Rationale:* Prevents wasted processing and unclear failure states downstream. *Traceability:* Section 3.1 (this document).

**FR-025** — The system shall present processing status (Recording Received, Processing, Draft Transcript) to the Meeting Owner, consistent with Section 3.1's status visibility column.
*Priority:* High. *Traceability:* Section 3.1 (this document).

**FR-026** — Where processing fails (e.g., validation failure, transcription error), the system shall notify the Meeting Owner with a clear, non-technical explanation and, where possible, a corrective action (e.g., "re-upload the recording").
*Priority:* High. *Rationale:* Supports novice users encountering failures without needing technical support for routine issues. *Traceability:* ProjectConstitution.md (User Experience Principles — clear error messages).

**FR-027** — A failed processing attempt shall not silently delete the underlying recording; the Meeting Owner shall be able to retry processing or escalate for support.
*Priority:* High. *Traceability:* ADR-003 §4.1 (organization owns the recording regardless of processing outcome).

**FR-028** — Recovery from a failed or interrupted processing attempt shall not require re-capturing the meeting, provided the original recording remains intact.
*Priority:* Medium. *Traceability:* FR-027 (this document).

## 8. Transcription Workflow

**FR-029** — The system shall enforce the transcript lifecycle states and transitions defined in Section 3.1 exactly, including the backward transitions (Reviewed → Review Required, Approved → Reviewed).
*Priority:* Critical. *Traceability:* Section 3.1 (this document).

**FR-030** — The system shall produce the Draft Transcript using the default offline AI processing path defined in ADR-001 §4.1, unless the organization has enabled the governed networked opt-in per ADR-001 §4.2.
*Priority:* Critical. *Traceability:* ADR-001 §4.1–§4.2; SecurityRequirements.md SR-036.

**FR-031** — The system shall visually distinguish AI-generated transcript content from human-confirmed content until a Reviewer has acted on it, consistent with `SecurityRequirements.md` SR-038.
*Priority:* Critical. *Traceability:* SecurityRequirements.md SR-038; ADR-003 §4.3–§4.4.

**FR-032** — At each state defined in Section 3.1, the system shall restrict available user actions to those listed in that state's "Permitted Actions" column, enforced according to the "Roles Permitted" column.
*Priority:* Critical. *Traceability:* Section 3.1 (this document); ADR-004 §4.1.

**FR-033** — Whether transcription occurs near-real-time during the meeting ("live") versus only after capture completes is not decided as a product requirement and is deferred — see Section 20 (new assumption).
*Priority:* N/A (deferral notice).

## 9. Transcript Editing and Correction

**FR-034** — A Reviewer shall be able to edit transcript text to correct errors, with each edit attributed to the editing user and timestamped, consistent with `SecurityRequirements.md` SR-034.
*Priority:* Critical. *Traceability:* SecurityRequirements.md SR-034.

**FR-035** — A Reviewer shall be able to correct misattributed or mislabeled speaker names/identifiers within a transcript.
*Priority:* Critical. *Rationale:* Speaker mislabeling is an explicitly anticipated correction category given AI-generated speaker labeling (Section 9 of `PrivacyRequirements.md`). *Traceability:* PrivacyRequirements.md PR-031.

**FR-036** — A Reviewer shall be able to add notes to a transcript that are distinct from both the transcript text and formal comments (Section 12 of this document defines comments separately where applicable); the system shall not require a Reviewer to understand this distinction technically — a single, simple annotation mechanism is acceptable provided it satisfies FR-037–FR-039.
*Priority:* Medium. *Traceability:* ProjectConstitution.md (Review Workflow Requirements — "Add comments").

**FR-037** — A Reviewer shall be able to flag a specific transcript segment as uncertain or requiring further attention (e.g., unclear audio, ambiguous speaker), distinct from a confirmed correction.
*Priority:* High. *Rationale:* Directly supports the Transcript Reviewer persona's need to distinguish confirmed corrections from open concerns. *Traceability:* Personas.md §4.

**FR-038** — The system shall retain a complete revision history for every transcript, including the original AI-generated version and every subsequent human edit.
*Priority:* Critical. *Traceability:* SecurityRequirements.md SR-034.

**FR-039** — A user with read access to a transcript shall be able to compare any two revisions to see what changed between them.
*Priority:* High. *Traceability:* ProjectConstitution.md (Review Workflow Requirements — "Compare revisions").

**FR-040** — Editing shall be available while a transcript is in Draft Transcript or Review Required state; editing an Approved transcript shall require the re-opening mechanism (`SecurityRequirements.md` SR-035), not an in-place edit.
*Priority:* Critical. *Traceability:* SecurityRequirements.md SR-035; Section 3.1 (this document).

**FR-041** — Version history shall not be editable or deletable by any role, including System Administrator and Organization Administrator.
*Priority:* Critical. *Traceability:* SecurityRequirements.md SR-043.

**FR-042** — The correction interface shall be usable by a non-technical Reviewer without requiring an understanding of the underlying AI transcription process, consistent with the governing UX principle that users may not have advanced computer knowledge.
*Priority:* Critical. *Rationale:* This is explicitly called out as a critical section by the requesting stakeholder; simplicity of the reviewer experience is treated as a first-class requirement, not an incidental UX nicety. *Traceability:* ProjectConstitution.md (User Experience Principles); Personas.md §4.

## 10. Reviewer Workflow

**FR-043** — A Reviewer shall be able to listen to the source audio associated with a transcript while reviewing its text, to verify accuracy against the original recording.
*Priority:* Critical. *Traceability:* ADR-004 §4.1 (Reviewer row — content access scoped to assigned transcripts).

**FR-044** — The system shall allow a Reviewer to follow along with the transcript text synchronized to the audio playback position, to the extent feasible (the specific synchronization mechanism is deferred to `03-Architecture/`).
*Priority:* High. *Traceability:* Personas.md §4 (Reviewer efficiency needs).

**FR-045** — A Reviewer shall be able to make text corrections as defined in Section 9 while reviewing audio, without needing to leave the review interface.
*Priority:* High. *Traceability:* Section 9 (this document).

**FR-046** — A Reviewer shall be able to add comments to specific locations within a transcript (Section 12).
*Priority:* High. *Traceability:* Section 12 (this document).

**FR-047** — A Reviewer shall be able to mark specific transcript sections for further attention (per FR-037), visible to subsequent reviewers or the Approver.
*Priority:* High. *Traceability:* FR-037 (this document); Personas.md §4.

**FR-048** — A Reviewer shall be able to submit their review, transitioning the transcript from Review Required to Reviewed (Section 3.1).
*Priority:* Critical. *Traceability:* Section 3.1 (this document).

**FR-049** — The completeness criteria required before a Reviewer may submit a review (e.g., whether every segment must be explicitly acknowledged) are not yet defined and are deferred — see Section 20 (new assumption).
*Priority:* N/A (deferral notice).

## 11. Approval Workflow

**FR-050** — An Approver shall be able to move a Reviewed transcript to Approved state, finalizing it as the organizational record per ADR-003 §4.2.
*Priority:* Critical. *Traceability:* ADR-003 §4.2; Section 3.1 (this document).

**FR-051** — An Approver shall be able to reject a Reviewed transcript or request changes, returning it to Review Required state with comments explaining what is required.
*Priority:* Critical. *Traceability:* Section 3.1 (this document); Personas.md §5.

**FR-052** — The system shall present an Approver with a summary of review completeness and change history before allowing approval, consistent with the Approver persona's stated need in `01-Product/Personas.md` §5.
*Priority:* High. *Traceability:* Personas.md §5.

**FR-053** — Upon approval, the transcript and its associated outputs (summary, action items, per Section 15) shall be locked against in-place editing; any subsequent correction requires the re-opening mechanism (FR-040, `SecurityRequirements.md` SR-035).
*Priority:* Critical. *Rationale:* Preserves the integrity of the finalized organizational record. *Traceability:* SecurityRequirements.md SR-035; ADR-003 §4.2–§4.3.

**FR-054** — Re-opening an Approved transcript for correction shall require Approver-level authority and shall be logged as a distinct, auditable action, per Section 13.
*Priority:* Critical. *Traceability:* SecurityRequirements.md SR-035; ADR-004 §4.4.

**FR-055** — Transition from Approved to Archived shall occur per the organization's configured retention rules (`PrivacyRequirements.md` §15), and an Organization Administrator shall be able to view and adjust this configuration within product-defined bounds.
*Priority:* High. *Traceability:* PrivacyRequirements.md PR-041.

## 12. Comments, Annotations, and Summaries/Meeting Outputs

**FR-056** — A Reviewer or Approver shall be able to add comments to specific locations within a transcript, distinct from the transcript text itself and attributed/timestamped per `SecurityRequirements.md` SR-034.
*Priority:* High. *Traceability:* SecurityRequirements.md SR-034; ProjectConstitution.md (Review Workflow Requirements).

**FR-057** — Comments containing personal information shall be classified consistent with the classification of the transcript content they annotate, per `PrivacyRequirements.md` §6.
*Priority:* Medium. *Traceability:* PrivacyRequirements.md §6.

**FR-058** — The system shall be able to generate a draft AI summary of a transcript at Reviewed or Approved state, consistent with the in-scope Summarization capability in `01-Product/Scope.md` §2.5.
*Priority:* High. *Traceability:* Scope.md §2.5; ADR-001 §4.1.

**FR-059** — A generated summary shall identify, at minimum: key discussion points and decisions made, distinct from unconfirmed AI inference, consistent with Human Authority.
*Priority:* High. *Traceability:* Scope.md §2.5; SecurityRequirements.md SR-038.

**FR-060** — The system shall be able to generate draft candidate action items from a transcript at Reviewed or Approved state, each including, where extractable, a responsible person and a deadline.
*Priority:* High. *Traceability:* Scope.md §2.6; ADR-001 §4.1.

**FR-061** — A generated summary or action item shall be treated as a draft artifact requiring human confirmation before being relied upon as an organizational commitment, consistent with `SecurityRequirements.md` SR-038.
*Priority:* Critical. *Traceability:* SecurityRequirements.md SR-038; ProjectConstitution.md §3.2.

**FR-062** — A summary or action item derived from personal information shall inherit the classification of its source content, consistent with `PrivacyRequirements.md` PR-036.
*Priority:* High. *Traceability:* PrivacyRequirements.md PR-036.

**FR-063** — A confirmed action item shall be attributable to the confirming user and timestamped, consistent with `SecurityRequirements.md` SR-002.
*Priority:* High. *Traceability:* SecurityRequirements.md SR-002.

**FR-064** — This document does not define the AI mechanism (model, technique) used to generate summaries or action items; that is deferred to `03-Architecture/AIArchitecture.md` and `02-Requirements/AIRequirements.md`.
*Priority:* N/A (deferral notice).

## 13. Search and Retrieval

**FR-065** — A user with appropriate access shall be able to search across Approved and Archived transcripts, summaries, and action items visible to them, per their assigned scope (ADR-004 §4.1).
*Priority:* High. *Traceability:* Scope.md §2.7; ADR-004 §4.1 (Knowledge Consumer row).

**FR-066** — Search shall also cover meeting metadata (title, date, Meeting Owner) to the extent the searching user is authorized to view it.
*Priority:* Medium. *Traceability:* Section 5 (this document, FR-012).

**FR-067** — Search results shall clearly indicate the workflow state (Section 3.1) of each result, so a user can distinguish an Approved/Archived record from content still in review.
*Priority:* High. *Traceability:* Personas.md §6.

**FR-068** — Search shall not return results the searching user is not authorized to access, per `SecurityRequirements.md` SR-014, and shall respect the classification level of each result per `PrivacyRequirements.md` §6.
*Priority:* Critical. *Traceability:* SecurityRequirements.md SR-014; PrivacyRequirements.md §6.

**FR-069** — Every search access resulting in a returned result shall be capable of being reflected in the audit trail (Section 13/16) consistent with `PrivacyRequirements.md` PR-052, at least for results containing C2/C3 classified content.
*Priority:* Medium. *Traceability:* PrivacyRequirements.md PR-052.

**FR-070** — The specific search mechanism (keyword, semantic, or other) and its underlying technology are not yet defined and are deferred to `03-Architecture/AIArchitecture.md`.
*Priority:* N/A (deferral notice).

## 14. Export and Sharing

**FR-071** — The system shall support exporting a transcript, summary, or action item list across the organization's isolation boundary only under the Controlled Export governance defined in `SecurityRequirements.md` SR-048–SR-050 and `PrivacyRequirements.md` PR-047–PR-048.
*Priority:* Critical. *Traceability:* SecurityRequirements.md SR-048–SR-050; PrivacyRequirements.md PR-047–PR-048.

**FR-072** — Export authority shall be governed by ADR-003 §4.9 and ADR-004's role model: a user may export only to the extent the organization's configuration delegates that authority to them.
*Priority:* Critical. *Traceability:* ADR-003 §4.9; ADR-004 §4.2.

**FR-073** — Export of content classified C3 (Sensitive Personal Information) shall require the additional explicit approval step defined in `PrivacyRequirements.md` PR-048, beyond the baseline export approval.
*Priority:* High. *Traceability:* PrivacyRequirements.md PR-048.

**FR-074** — Every export action shall be logged, including what was exported, by whom, under what authority, and (in general terms) to where, per `SecurityRequirements.md` SR-050.
*Priority:* Critical. *Traceability:* SecurityRequirements.md SR-050.

**FR-075** — Export shall not be available for a transcript that has not yet reached Approved state, unless an organization explicitly configures an exception with corresponding audit visibility.
*Priority:* High. *Rationale:* Prevents unreviewed AI-generated draft content from being exported and mistaken for a finalized record. *Traceability:* ADR-003 §4.3–§4.4; SecurityRequirements.md SR-038.

**FR-076** — The specific export file formats and destination mechanisms are not yet defined and are deferred to `03-Architecture/` and `05-Engineering/`.
*Priority:* N/A (deferral notice).

## 15. Notifications

**FR-077** — The system shall notify the Meeting Owner when processing completes and a Draft Transcript is available.
*Priority:* High. *Traceability:* Section 3.1 (this document); Personas.md §3.

**FR-078** — The system shall notify an assigned Reviewer when a transcript enters Review Required state.
*Priority:* High. *Traceability:* Section 3.1 (this document); Personas.md §4.

**FR-079** — The system shall notify an Approver when a transcript enters Reviewed state, ready for their approval.
*Priority:* High. *Traceability:* Section 3.1 (this document); Personas.md §5.

**FR-080** — The system shall notify a Reviewer when an Approver requests changes (Reviewed → Review Required), including the Approver's comments.
*Priority:* High. *Traceability:* Section 11 (this document, FR-051).

**FR-081** — The system shall notify relevant users of significant system events affecting their content (e.g., processing failure per Section 7, FR-026).
*Priority:* Medium. *Traceability:* Section 7 (this document).

**FR-082** — The specific notification delivery channel (in-app, email, or other) is not yet defined and is deferred — see Section 20 (new assumption).
*Priority:* N/A (deferral notice).

## 16. Audit Visibility

**FR-083** — A user holding the Auditor role shall be able to view audit records (who accessed, edited, approved, or exported content, and export history) as required by `SecurityRequirements.md` SR-041–SR-042, without gaining access to the underlying meeting content, per SR-020.
*Priority:* Critical. *Traceability:* SecurityRequirements.md SR-020, SR-041–SR-042.

**FR-084** — A Meeting Owner shall be able to view the audit history specific to meetings they own (who reviewed, who approved, when, export history), without necessarily holding the full Auditor role.
*Priority:* Medium. *Traceability:* ADR-004 §4.1 (Meeting Owner row); Personas.md §3.

**FR-085** — Audit records shall be presented in a form usable by an Auditor without requiring technical expertise to interpret, consistent with the Accessibility and User Experience principles.
*Priority:* Medium. *Traceability:* ProjectConstitution.md (User Experience Principles, Accessibility).

**FR-086** — Audit visibility shall include, at minimum: content access events, edits, approvals, and export history, consistent with `SecurityRequirements.md` SR-041.
*Priority:* Critical. *Traceability:* SecurityRequirements.md SR-041.

## 17. Help and User Guidance System

**FR-087** — The system shall provide contextual tooltips and hints appropriate to a user's current task and role, consistent with the governing UX principle that users may not have advanced computer knowledge.
*Priority:* High. *Traceability:* ProjectConstitution.md (User Experience Principles).

**FR-088** — The system shall provide interactive walkthroughs for first-time users of each major role (Meeting Owner, Reviewer, Approver, Knowledge Consumer).
*Priority:* High. *Traceability:* ProjectConstitution.md (User Experience Principles).

**FR-089** — A user shall be able to dismiss or skip a walkthrough or tutorial easily at any point, without being blocked from using the underlying feature.
*Priority:* High. *Traceability:* ProjectConstitution.md (User Experience Principles — "Ability to close walkthroughs easily").

**FR-090** — A user shall be able to voluntarily re-open a previously dismissed walkthrough (e.g., from a help menu).
*Priority:* Medium. *Traceability:* ProjectConstitution.md (User Experience Principles).

**FR-091** — The system shall provide a "beginner mode" or equivalent simplified guidance state for first-time or infrequent users, consistent with the stated need to support novice users across all personas.
*Priority:* Medium. *Rationale:* Directly addresses the explicit instruction that the system must support novice users; the specific form this takes (a literal mode toggle vs. progressive disclosure) is not prescribed here. *Traceability:* ProjectConstitution.md (User Experience Principles); Personas.md §7.

**FR-092** — The system shall provide feature explanations accessible in context, not only in a separate reference manual, so a user encountering an unfamiliar feature can understand it without leaving their task.
*Priority:* Medium. *Traceability:* ProjectConstitution.md (User Experience Principles).

**FR-093** — Error messages presented to users shall be clear, actionable, and avoid technical jargon, consistent with FR-026 (processing failure guidance) generalized to all error conditions.
*Priority:* High. *Traceability:* ProjectConstitution.md (User Experience Principles — clear error messages).

**FR-094** — The system shall provide a detailed user guide accessible from within the application (elaborated in `10-Documentation/UserGuide.md`, pending), covering at minimum the transcript lifecycle, role permissions, and export/notification behavior.
*Priority:* Medium. *Traceability:* ProjectConstitution.md (User Experience Principles).

## 18. Accessibility

**FR-095** — The system's interface shall support users with different technical abilities and needs, consistent with the Accessibility commitment in `00-Governance/ProjectConstitution.md` §3.7.
*Priority:* Critical. *Traceability:* ProjectConstitution.md §3.7.

**FR-096** — The system shall provide a clear, readable interface, avoiding unnecessary visual or interaction complexity, consistent with the Simplicity commitment.
*Priority:* Critical. *Traceability:* ProjectConstitution.md §3.6–§3.7.

**FR-097** — The system shall support keyboard-only navigation for all core workflows (capture initiation, review, approval, search), without requiring pointer-device input.
*Priority:* High. *Traceability:* ProjectConstitution.md §3.7.

**FR-098** — The system shall be compatible with commonly used assistive technologies (e.g., screen readers), to the extent technically feasible for each capability.
*Priority:* High. *Traceability:* ProjectConstitution.md §3.7.

**FR-099** — Every persona described in `01-Product/Personas.md` shall be treated as potentially requiring accessibility accommodation, per `Personas.md` §7 — no user-facing workflow (capture, review, approval, search) shall assume a technically expert user by default.
*Priority:* Critical. *Traceability:* Personas.md §7.

**FR-100** — Specific accessibility standards (e.g., a named conformance level) to be targeted are not yet defined and are deferred to `04-Design/Accessibility.md`.
*Priority:* N/A (deferral notice).

## 19. Cross-Cutting Confidentiality Requirement

**FR-101** — Every functional capability defined in this document shall operate within the confidentiality, access-control, and audit constraints defined in `SecurityRequirements.md` and `PrivacyRequirements.md`; no functional requirement in this document may be implemented in a way that weakens those constraints.
*Priority:* Critical. *Traceability:* SecurityRequirements.md (entire document); PrivacyRequirements.md (entire document).

## 20. Open Items and New Assumptions

The following new items are introduced by this document and must be added to `00-Governance/AssumptionsRegister.md`:

1. Whether transcription occurs near-real-time during the meeting ("live") or only after capture completes is undecided (FR-033).
2. The completeness criteria required before a Reviewer may submit a review (e.g., full read-through vs. spot-check) are undefined (FR-049).
3. The specific notification delivery channel (in-app, email, or other) is undefined (FR-082).
4. The specific form of "beginner mode" / simplified guidance (a literal mode vs. progressive disclosure) is undecided (FR-091).
5. Specific accessibility conformance target (e.g., a named standard/level) is undefined (FR-100).
6. Whether search access to C2/C3-classified content is logged for every search or only for returned/opened results is unconfirmed (FR-069).

These are consolidated into `AssumptionsRegister.md` as AR-066–AR-071 (see completion summary).

## 21. Traceability Summary

Every requirement in this document traces to at least one of: `01-Product/Vision.md`, `01-Product/Scope.md`, ADR-001–ADR-004, `SecurityRequirements.md`, or `PrivacyRequirements.md`, per the inline Traceability references above. Where a plausible functional detail had no basis in those sources, it is recorded as a deferral notice and new assumption in Section 20 rather than invented.

## 22. Relationship to Other PEKB Documents

- This document derives its authority from `01-Product/Vision.md`, `01-Product/Scope.md`, ADR-001–ADR-004, `SecurityRequirements.md`, and `PrivacyRequirements.md`; it does not introduce new governance principles.
- Section 3 (Workflow States) is now the authoritative source for the transcript lifecycle and meeting capture lifecycle state definitions; other documents must reference, not redefine, these states, per `00-Governance/DocumentStandards.md` §5.
- `02-Requirements/UXRequirements.md` and `AIRequirements.md` (pending) must build on this document without contradicting its role, workflow, or confidentiality constraints (FR-101).
- `04-Design/` documents (pending) must design the Help System, Walkthroughs, and Accessibility capabilities (Sections 17–18) to the requirements level defined here.

---

*End of Document — PEKB-02-REQ-003 — Project Echo Functional Requirements — PE-2026.001-ZM*
