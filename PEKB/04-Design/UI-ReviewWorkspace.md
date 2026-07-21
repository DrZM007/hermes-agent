# Project Echo — Screen Design: Review Workspace

## Document Metadata

| Field | Value |
|---|---|
| Document ID | PEKB-04-DSN-002 |
| Document Title | Screen Design — Review Workspace |
| PEKB Section | 04-Design |
| Version | 0.1.0 |
| Status | Draft |
| Classification | Internal — Design |
| Owner Role | UX Lead |
| Approval Required From | Principal Software Architect, AI/ML Architect, Accessibility Specialist, Security Architect, QA Lead |
| Related Documents | DesignPrinciples.md, EthicalAICharter.md (00-Governance); ADR-004, ADR-007, ADR-009 (00-Governance/Decisions); FunctionalRequirements.md, UXRequirements.md, AIRequirements.md, ReviewIntelligenceEngineRequirements.md, AcceptanceCriteria.md (02-Requirements); ModuleArchitecture.md, DesktopArchitecture.md (03-Architecture) |
| Original Creator | Dr Ziyaad Moolla |
| Creator ID | ZM |
| Document Provenance | PE-2026.001-ZM |

---

## 1. Purpose and Scope

This document is the detailed design of the **Review Workspace** — the screen where a human works through a transcript during the review stage. It is the product's core surface: the place "AI Assists, Humans Decide" (`EthicalAICharter.md` §3.2) is made concrete. It realizes the Review Intelligence Engine (`ReviewIntelligenceEngineRequirements.md`) and the review portion of the transcript lifecycle (`FunctionalRequirements.md` §3.1).

This document is the **exemplar** for the `04-Design/` per-screen pattern (per the product-owner briefing Version 21): every region, control, state, dialog, and error is specified. Other screens follow this structure. It adds no requirements — it designs the realization of existing ones, citing the requirement each element satisfies and the design principle it honors.

## 2. Screen Identity

- **Primary role:** Reviewer (edit/correct/comment/submit). **Secondary role:** Approver, when viewing a transcript in the Reviewed state (approve/return) — role-adaptive per `ADR-004`; a user who is only the Reviewer of a transcript never sees Approve for that transcript (separation of duties, ADR-004 §4.3.2, SR-019).
- **Lifecycle states served:** Draft Transcript and Review Required (edit mode); Reviewed (Approver view, read + approve/return). Not editable in Approved+ states (FR-040; re-open required).
- **Entry points:** the Reviewer's dashboard queue, a notification, Universal Search, or a direct link within the user's authorization scope.
- **Screen questions it must answer at a glance** (UX Rule, briefing V11): Where am I? What can I do here? What's next? Where is help?

## 3. Layout

Described wireframe (native .NET / WinUI, ADR-009; dockable per briefing V10):

```
┌───────────────────────────────────────────────────────────────────────┐
│ Ribbon: [Play][Pause][◀5s][5s▶] | [Accept][Reject][Add Note] |          │
│         [◀ Flag][Flag ▶] | [Focus Mode] | [Submit for Approval]         │
├───────────────┬───────────────────────────────────────┬───────────────┤
│ Heat Map      │  Transcript (primary)                  │ Evidence Panel│
│ (uncertainty  │  - AI-generated text marked            │ - audio clip  │
│  rail, click  │  - uncertainty underlines (typed)      │ - waveform    │
│  to jump)     │  - speaker labels                      │ - confidence  │
│               │  - revision/edit indicators            │   by category │
│               │                                        │ - alternatives│
│               │                                        │ - dict / prior│
├───────────────┴───────────────────────────────────────┴───────────────┤
│ Status bar: user • state • autosave • AI status • 🟢 Secure Offline •   │
│             background jobs • Help                                       │
└───────────────────────────────────────────────────────────────────────┘
```

Panels are dockable/resizable/collapsible and the layout is savable (briefing V10; UXRequirements). The transcript region is primary and never subordinated (per-screen identity, briefing V11: "Review — transcript first").

## 4. Regions

| Region | Purpose | Requirement |
|---|---|---|
| Ribbon | Grouped primary actions (playback, review actions, navigation, submit). | UXRequirements (ribbon, V11) |
| Transcript (primary) | The editable transcript with AI-generated marking, typed uncertainty indicators, speaker labels, and revision indicators. | FR-034/FR-038; AI-051/SA-032; RI-006 |
| Evidence Panel | On selecting a flagged item: audio clip, waveform, per-category confidence, alternative candidates, dictionary entries, similar approved corrections. | RI-007 |
| Heat Map rail | Uncertainty overview; click to jump. | RI-014 |
| Status bar | Live context incl. offline/secure indicator and autosave. | briefing V11; RC-012 (autosave) |

## 5. Controls (fully specified)

Each control is specified with the per-button fields from briefing Version 21. Representative critical controls are specified in full; remaining ribbon controls follow the same template.

### 5.1 "Submit for Approval"
- **Purpose:** Transition the transcript from Review Required to Reviewed, handing it to the Approver.
- **Tooltip:** "Submit this transcript for approval."
- **Keyboard shortcut:** `Ctrl+Shift+S` (customizable, RI-012).
- **Permission required:** Reviewer assigned to this transcript (ADR-004).
- **Confirmation required:** Yes — confirmation dialog (§7.1), because it is a consequential state transition (Mistake Prevention, Constitution Commitment 13).
- **Audit event:** `REVIEW_SUBMITTED` with user, transcript, timestamp (MA-002; SR-041).
- **Undo behavior:** Not a client-side undo; reversal is the Approver returning it (backward transition FR-051). The design must not present it as casually undoable.
- **Disabled conditions:** transcript not in Review Required; unresolved mandatory checklist items where policy requires them (RI-017 / GE via policy); no edit access.
- **Accessibility name / screen-reader text:** "Submit for approval, button. Submits the transcript to the approver."
- **Icon:** upward tray. **Localization:** label and tooltip localized. **Analytics event:** in-org only, non-identifying (RI-022 workload metric).
- **Traceability:** FR-048; ADR-007 §3.1; AC-019.

### 5.2 "Accept" (accept an AI suggestion)
- **Purpose:** Apply a specific AI suggestion (e.g., a candidate correction) to the transcript **as a human action**.
- **Tooltip:** "Apply this suggestion."
- **Keyboard shortcut:** `Enter` when a suggestion is focused (RI-012).
- **Permission required:** Reviewer with edit access.
- **Confirmation required:** No (low-friction), but the action is attributable and reversible.
- **Audit / record effect:** creates an **append-only revision** attributed to the Reviewer (DB-008–011; FR-038); the AI suggestion never auto-applies (RI-001/RI-002; AI-020).
- **Undo behavior:** standard editor undo/redo within the session; the prior revision remains in history regardless.
- **Disabled conditions:** no suggestion focused; transcript not editable.
- **Accessibility / screen-reader text:** "Accept suggestion, button. Applies the highlighted suggestion as your edit."
- **Traceability:** RI-001; AI-020; AC-042; DesignPrinciple §3.8 (Human Authority).

### 5.3 "Play / Pause"
- **Purpose:** Play or pause source audio, with contextual lead-in/out on segment selection (RI-008).
- **Tooltip:** "Play / pause audio (Space)." **Shortcut:** `Space`.
- **Permission:** view access to the recording. **Confirmation:** none. **Audit:** none (non-consequential playback; but clip *export* is audited — see RS).
- **Disabled conditions:** no audio available for the segment.
- **Accessibility:** operable by keyboard; state announced ("Playing" / "Paused").
- **Traceability:** RI-008; UXRequirements (keyboard operability).

### 5.4 "Approve" / "Return for changes" (Approver view only)
- **Visibility:** shown **only** when the current user is the Approver and the transcript is in Reviewed state; **never** shown to a user who is only the Reviewer of this transcript (SR-019; ADR-004 §4.3.2). If multi-stage approval is configured (ADR-007 §4.2), "Approve" completes the current stage.
- **Confirmation required:** Yes (§7.2).
- **Audit event:** `APPROVAL_GRANTED` / `APPROVAL_RETURNED` with stage, user, timestamp.
- **Undo behavior:** none casual; a granted approval is reversed only via the audited re-open mechanism (SR-035; FR-054).
- **Traceability:** FR-050/FR-051; ADR-007 §4.2; AC-020/AC-022.

### 5.5 "Add Note" · "Next/Prev Flag" · "Focus Mode"
Follow the same template: Add Note (`Alt+N`, typed notes RI-016, no record mutation); Next/Prev Flag (`F3`/`F4`, RI-010 navigation); Focus Mode (RI-011, hides non-essential chrome; toggle, no data effect).

## 6. Keyboard Shortcuts (default; customizable per RI-012)

| Action | Key |
|---|---|
| Play/Pause | `Space` |
| Jump ±5s | `←` / `→` |
| Prev/Next flagged item | `Ctrl+←` / `Ctrl+→` (or `F4`/`F3`) |
| Accept focused suggestion | `Enter` |
| Add note | `Alt+N` |
| Rename speaker | `F2` |
| Search transcript | `Ctrl+F` |
| Submit for approval | `Ctrl+Shift+S` |

*Traceability:* RI-012; UXRequirements (keyboard operability); AC-035.

## 7. Dialogs

### 7.1 Submit-for-Approval confirmation
- **Why shown:** consequential state transition (Mistake Prevention).
- **Title:** "Submit for approval?"
- **Body:** "This transcript will move to the Approver. You can still make changes only if the Approver returns it to you." (explains consequence — UX Rule 4, briefing V11)
- **Buttons:** [Submit] (default) · [Cancel] (Escape).
- **Accessibility / screen-reader:** dialog role, focus on body, buttons labeled.
- **Audit:** the resulting submit is audited per §5.1.

### 7.2 Approval confirmation (Approver)
- **Title:** "Approve this transcript as the official record?"
- **Body:** states that approval finalizes the record (and, if a stage, which stage) and that further change requires a re-open. 
- **Buttons:** [Approve] (default) · [Cancel].
- **Traceability:** FR-050; ADR-007 §4.2.

### 7.3 Discard-unsaved-changes
- Shown on navigating away with unsaved edits; offers [Keep editing] / [Discard]; discard does not delete revision history. Autosave (RC-012) minimizes exposure.

## 8. Error Messages

Each error follows the per-error template (briefing V21): plain language, suggested actions, severity, recoverability, audit.

### ERR-RW-01 — Recording unavailable
- **Title:** "The audio for this transcript could not be opened."
- **Body:** "The recording appears to be unavailable or still processing. You can review the text now and add audio checks later."
- **Suggested actions:** Retry · Review text only · Contact administrator.
- **Severity:** Warning. **Recoverability:** recoverable; the transcript remains fully editable. **Audit:** `MEDIA_OPEN_FAILED` (non-content). **Traceability:** FR-026; DesignPrinciple §3.6.

### ERR-RW-02 — Shared component offline (submit attempted)
- **Title:** "You're working offline."
- **Body:** "Your changes are saved locally. Submitting for approval will complete automatically when the connection to your organization's server returns." (offline-first honesty, ADR-005 §4.3; RC-017)
- **Severity:** Info. **Recoverability:** automatic on reconnect (ADR-012 sync). **Audit:** queued action logged on completion.

### ERR-RW-03 — Not authorized
- **Title:** "You don't have access to this transcript."
- **Body:** plain explanation; no content or existence of content is revealed beyond scope (MA-001; AI-018).
- **Severity:** Error. **Recoverability:** request access via administrator. **Audit:** `ACCESS_DENIED`.

## 9. Accessibility

- Full keyboard operability of every action (§6); logical focus order; visible focus. *(UXRequirements §11; AC-035.)*
- Uncertainty and AI-generated status conveyed by **text/icon, never color alone** (RI-006; DesignPrinciple §3.5).
- Screen-reader names/roles on all controls and the transcript region; live-region announcements for playback and autosave state.
- Adjustable text size, spacing, reading mode, reduced-motion, high-contrast theme (briefing V11/V19).

## 10. Permissions and Role Adaptation

- Controls render per the user's role/scope resolved by the Identity & Access layer (MA-001); the screen never shows an action the user cannot perform.
- Reviewer: edit/suggest/note/submit. Approver (Reviewed state): read + approve/return; edit disabled. Knowledge Consumer: no access to non-approved states (AC-002).
- Separation of duties enforced server-side, not only by hiding controls (SR-019).

## 11. Audit Events (summary)

`REVIEW_SUBMITTED`, `APPROVAL_GRANTED`, `APPROVAL_RETURNED`, `SPEAKER_RENAMED`, `NOTE_ADDED`, `ACCESS_DENIED`, `MEDIA_OPEN_FAILED`, plus each accepted edit as an append-only revision. All immutable (MA-002; SR-043).

## 12. Performance

- The interface remains responsive during background processing (AC-029; NFR-002). Specific latency/throughput budgets for transcript loading and playback sync remain empirical under **AR-076** and are not fixed here.

## 13. Help, Walkthrough, Developer Notes, Future Expansion

- **Help/Walkthrough:** contextual help link in the status bar; a dismissible walkthrough that never re-appears once dismissed (AC-033).
- **Developer notes:** native .NET/WinUI (ADR-009); reads/writes the local encrypted SQLite store (ADR-010); AI analysis via the transcription/AI abstraction (ADR-011); works fully offline (ADR-001/005); syncs per ADR-012 (no auto-merge — concurrent edits surface conflicts, DB-011).
- **Future expansion:** real-time collaborative editing mode (ADR-007 §4.3), multi-monitor detach, additional review modes (RI-013) — all additive, none altering the guarantees above.

## 14. Challenge the Design

1. Can any control on this screen apply an AI suggestion to the record without an explicit human action? (It must not — RI-001.)
2. Is "Approve" provably unreachable for a user who is only the Reviewer of this transcript (not just hidden, but denied server-side)?
3. Does every consequential control produce an immutable audit entry?
4. Is every uncertainty/AI signal conveyed without relying on color?
5. Does the offline behavior (ERR-RW-02) honestly represent queued-and-will-sync rather than implying immediate completion?
6. What is deferred (latency budgets AR-076, collaborative editing detail) and is each flagged?

## 15. Revision History

| Version | Date | Summary | Author |
|---|---|---|---|
| 0.1.0 | 2026-07-20 | Initial Review Workspace screen design and the exemplar for the 04-Design per-screen pattern (briefing V21): layout, regions, fully-specified critical controls (Submit for Approval, Accept suggestion, Play/Pause, Approve/Return with role-adaptive visibility and server-side separation of duties), keyboard map, dialogs, plain-language errors with audit/recoverability, accessibility, permissions, audit events, and technology binding to the ratified stack. Embeds the AI guardrails (suggestions never auto-apply; append-only edits; AI-generated marking) and offline-first honesty. Latency budgets deferred to AR-076. | Dr Ziyaad Moolla (ZM) |

---

*End of Document — PEKB-04-DSN-002 — Project Echo Screen Design: Review Workspace — PE-2026.001-ZM*
