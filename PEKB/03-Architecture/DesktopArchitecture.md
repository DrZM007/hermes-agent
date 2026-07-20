# Project Echo — Desktop Architecture

## Document Metadata

| Field | Value |
|---|---|
| Document ID | PEKB-03-ARC-007 |
| Document Title | Desktop Architecture |
| PEKB Section | 03-Architecture |
| Version | 0.1.0 |
| Status | Draft |
| Classification | Internal — Architecture |
| Owner Role | Principal Software Architect |
| Approval Required From | Security Architect, AI/ML Architect, UX Lead, Accessibility Specialist, DevOps/Deployment Engineer |
| Related Documents | SystemArchitecture.md, DeploymentArchitecture.md, DatabaseArchitecture.md, SecurityArchitecture.md, AIArchitecture.md, ThreatModel.md (03-Architecture); FunctionalRequirements.md, NonFunctionalRequirements.md, UXRequirements.md (02-Requirements); AssumptionsRegister.md (00-Governance) |
| Original Creator | Dr Ziyaad Moolla |
| Creator ID | ZM |
| Document Provenance | PE-2026.001-ZM |

---

## 1. Purpose and Scope of This Document

This document defines the architecture of the Project Echo desktop application — the Desktop Client and Local Processing Layer of `SystemArchitecture.md` SA-009–SA-010 as they exist on a managed end-user device. It is the final `03-Architecture/` document. It selects no UI framework, desktop framework, programming language, operating system API, or installer technology — those belong to `05-Engineering/`, which this document constrains but does not replace.

This document uses the identifier format `DT-<###>`, following the established PEKB precedent.

## 2. Desktop Architecture Principles

**DT-001** — The desktop application shall be fully operable within a standard (non-administrator) user context on a managed Windows device: installation footprint, storage, processing, and updates all function without elevation, per `SecurityRequirements.md` SR-004 and `NonFunctionalRequirements.md` NFR-013.
*Priority:* Critical. *Traceability:* ProjectIntent.md (Target Environment Constraints); SecurityRequirements.md SR-004; NonFunctionalRequirements.md NFR-013.

**DT-002** — The desktop application shall be a full-capability node, not a thin client: capture, offline AI processing, review, and approval of content assigned to the local user function with no network dependency, per `DeploymentArchitecture.md` DA-011 and `SystemArchitecture.md` SA-025.
*Priority:* Critical. *Traceability:* ADR-001 §4.1; DeploymentArchitecture.md DA-011; SystemArchitecture.md SA-025.

**DT-003** — The desktop application shall present exactly the capabilities the authenticated user's role and scope permit (ADR-004), hiding rather than disabling unauthorized functionality per `UXRequirements.md` UX-013, while treating UI-level enforcement as defense-in-depth only — authoritative enforcement remains with the Identity and Access Layer (`SystemArchitecture.md` SA-014).
*Priority:* Critical. *Traceability:* ADR-004 §4.1; UXRequirements.md UX-013; SystemArchitecture.md SA-009, SA-014.

**DT-004** — Simplicity governs internal structure as well as UI: the desktop architecture prefers fewer, clearer internal components over speculative extensibility, per the Simplicity commitment and `EngineeringPrinciples.md` §6.
*Priority:* High. *Traceability:* ProjectConstitution.md §3.6.

## 3. Runtime Architecture

**DT-005** — The desktop application shall be structured as two cooperating runtime parts on the device:
1. an **interactive part** (the user-facing application: presentation, review interface, notifications), and
2. a **background part** (capture handling, AI processing coordination, synchronization, audit write-ahead),
such that long-running work in the background part never blocks the interactive part (`NonFunctionalRequirements.md` NFR-002) and background processing continues at background priority while the user does other work (NFR-014, `AIArchitecture.md` AI-ARCH-030).
*Priority:* Critical. *Rationale:* The separation is the architectural mechanism behind the already-required responsiveness guarantees; whether the two parts are processes, services, or threads is an implementation decision, not made here. *Traceability:* NonFunctionalRequirements.md NFR-002, NFR-014; AIArchitecture.md AI-ARCH-030.

**DT-006** — The background part shall run only within the user's own session context (no system-level service requiring elevation), consistent with DT-001; work that requires the application to be running (e.g., completing processing) resumes on next launch rather than depending on an always-on privileged service.
*Priority:* Critical. *Traceability:* SecurityRequirements.md SR-004; NonFunctionalRequirements.md NFR-013.

**DT-007** — All communication between the interactive and background parts occurs through a defined internal interface carrying the same authorization context as the acting user; the background part performs no action lacking an attributable initiating user or system-defined trigger, preserving auditability (`SecurityRequirements.md` SR-002).
*Priority:* Critical. *Traceability:* SecurityRequirements.md SR-002, SR-041.

## 4. Desktop Components

**DT-008** — The desktop application comprises six logical components, mapping onto the system-level components already defined:

| Desktop Component | Responsibility | System-Level Mapping |
|---|---|---|
| **Presentation Shell** | Role-scoped UI, walkthroughs/tooltips/help (`UXRequirements.md` §6–§7), accessibility surface (Section 12) | Desktop Client (SA-009) |
| **Capture Manager** | Audio capture start/stop, capture-state machine (`FunctionalRequirements.md` §3.2), participant-notification gating (FR-010/FR-022), import intake (FR-018) | Local Processing Layer (SA-010) |
| **Processing Coordinator** | Validation (FR-024), invocation of local AI capability modules, progress/status reporting (FR-025), failure handling (FR-026–FR-028) | Local Processing Layer (SA-010) → AI Processing Layer (SA-011) |
| **Local Store** | Encrypted local persistence: working transcripts, revision chain, offline queue, audit write-ahead, read-only policy cache | Storage Layer local placement (DB-001, DB-031) |
| **Sync Agent** | State-driven synchronization with the Organization Shared Component (DB-031–DB-034), reconciliation surfacing conflicts for human resolution | Storage Layer / Organization Shared Component interface |
| **Update Agent** | Receipt, verification, staged application, and rollback of updates (Section 10) | Update Management (SA-016) |

*Priority:* Critical. *Traceability:* SystemArchitecture.md §4; DatabaseArchitecture.md §12; FunctionalRequirements.md §3, §6–§7.

**DT-009** — The AI capability modules (`AIArchitecture.md` AI-ARCH-005) execute on-device under the Processing Coordinator but remain architecturally distinct from it: the Coordinator orchestrates and enforces the module contract (classified input in, draft-tagged output out, no side channels per AI-ARCH-006); it never merges module logic into its own.
*Priority:* Critical. *Traceability:* AIArchitecture.md AI-ARCH-005–AI-ARCH-006.

## 5. Startup Lifecycle

**DT-010** — Startup proceeds: integrity check of application and model artifacts (per `SecurityArchitecture.md`'s verification chain and `AIArchitecture.md` AI-ARCH-022) → user authentication (per `SecurityArchitecture.md`'s identity architecture) → load of the local policy cache with staleness evaluation (DB-034) → presentation of the role-scoped interface (DT-003) → resumption of any interrupted background work (queued processing, pending synchronization, incomplete captures per `NonFunctionalRequirements.md` NFR-026).
*Priority:* Critical. *Traceability:* SecurityArchitecture.md (identity, integrity); AIArchitecture.md AI-ARCH-022; DatabaseArchitecture.md DB-034; NonFunctionalRequirements.md NFR-025–NFR-026.

**DT-011** — Startup shall complete to a usable interface without waiting for network reachability or full synchronization; connectivity-dependent functions surface progressively as they become available, consistent with offline-first (DT-002).
*Priority:* High. *Traceability:* NonFunctionalRequirements.md NFR-001, NFR-030; DeploymentArchitecture.md DA-011.

**DT-012** — A failed startup integrity check shall prevent normal operation and present a clear, non-technical explanation with an escalation path, rather than continuing with potentially compromised components; recorded to the audit write-ahead.
*Priority:* Critical. *Traceability:* ThreatModel.md TM-010, TM-016; FunctionalRequirements.md FR-093.

## 6. Meeting Lifecycle

**DT-013** — The desktop application implements the capture lifecycle (`FunctionalRequirements.md` §3.2) and the device-resident portion of the transcript lifecycle (§3.1) exactly as defined there, with the Capture Manager owning Scheduled/Pending → Recording → Captured, and the Processing Coordinator owning Recording Received → Processing → Draft Transcript.
*Priority:* Critical. *Traceability:* FunctionalRequirements.md §3.1–§3.2; SystemArchitecture.md SA-017.

**DT-014** — The participant-notification requirement (PR-022, FR-010) is enforced by the Capture Manager as a gating precondition: the recording state cannot be entered until the notification step is satisfied, structurally rather than procedurally, addressing `ThreatModel.md` TM-021.
*Priority:* Critical. *Traceability:* PrivacyRequirements.md PR-020, PR-022; FunctionalRequirements.md FR-010, FR-022; ThreatModel.md TM-021.

**DT-015** — Capture interruption (crash, power loss) preserves the partial recording per `NonFunctionalRequirements.md` NFR-026, with the Capture Manager writing capture data durably and incrementally rather than buffering the full session in volatile memory.
*Priority:* High. *Traceability:* NonFunctionalRequirements.md NFR-026; AcceptanceCriteria.md AC-039.

**DT-016** — Review and approval interactions (editing, comments, flags, state transitions per `FunctionalRequirements.md` §9–§11) operate against the Local Store's revision chain (DB-008–DB-011), with synchronized audio-text review per `UXRequirements.md` UX-025 provided by the Presentation Shell.
*Priority:* Critical. *Traceability:* FunctionalRequirements.md §9–§11; DatabaseArchitecture.md DB-008–DB-011; UXRequirements.md §8–§9.

## 7. Offline Operation

**DT-017** — Every core action assigned to the local user (capture, processing, review, approval of assigned content, viewing owned/assigned records) functions with zero network reachability, per DT-002; the application shall clearly distinguish, in the interface, functions that are inherently cross-user (search over org-wide archives, assignment to other users) and therefore queue or defer while offline.
*Priority:* Critical. *Traceability:* ADR-001 §4.1; SystemArchitecture.md SA-025; NonFunctionalRequirements.md NFR-030.

**DT-018** — Offline actions accumulate in the durable offline queue with their audit write-ahead entries (DB-013, DB-032); no offline action is lost by application restart, and no action completes without at least a locally durable audit record (`NonFunctionalRequirements.md` NFR-035).
*Priority:* Critical. *Traceability:* DatabaseArchitecture.md DB-013, DB-032; NonFunctionalRequirements.md NFR-035.

**DT-019** — Consequential actions requiring current authorization confirmation (approval, export) follow the fail-restrictive staleness rule of DB-034: if the policy cache exceeds its staleness window offline, these actions defer until reconnection with a clear explanation to the user, rather than executing on stale authority.
*Priority:* Critical. *Traceability:* DatabaseArchitecture.md DB-034; SecurityRequirements.md SR-017.

## 8. Synchronization Behaviour

**DT-020** — The Sync Agent implements the state-driven synchronization model of DB-031–DB-033: content moves to the Organization Shared Component when its lifecycle state requires cross-user visibility; policy/identity data flows down as a read-only cache; full-content mirroring of organizational data to the device is prohibited.
*Priority:* Critical. *Traceability:* DatabaseArchitecture.md DB-031, DB-033; ThreatModel.md TM-001.

**DT-021** — Reconciliation conflicts are surfaced to the affected Reviewer/Approver through the Presentation Shell for human resolution per DB-032; the Sync Agent never auto-merges or discards a human's revision.
*Priority:* Critical. *Traceability:* DatabaseArchitecture.md DB-032; ProjectConstitution.md §3.2.

**DT-022** — Synchronization is resumable and incremental: an interrupted sync session resumes without data loss or duplication, and sync activity runs at background priority without degrading interactive use (NFR-002, NFR-014).
*Priority:* High. *Traceability:* NonFunctionalRequirements.md NFR-002, NFR-014, NFR-028.

## 9. AI Integration

**DT-023** — On-device AI processing follows the tiered-footprint model of `AIArchitecture.md` AI-ARCH-029: the desktop architecture supports multiple model footprints per capability, with per-device selection based on available resources, so heterogeneous fleets degrade in speed/accuracy rather than losing capability; the selection mechanism's thresholds await AR-076 resolution.
*Priority:* Critical. *Traceability:* AIArchitecture.md AI-ARCH-029, AI-ARCH-031; NonFunctionalRequirements.md NFR-011.

**DT-024** — Model artifacts reside in the Local Store's integrity-protected area, are loaded only after verification (AI-ARCH-022, DT-010), and are updated exclusively through the Update Agent (AI-ARCH-009) — never fetched ad hoc at runtime.
*Priority:* Critical. *Traceability:* AIArchitecture.md AI-ARCH-009, AI-ARCH-022; ThreatModel.md TM-016.

**DT-025** — Where the organization has enabled networked AI processing (ADR-001 §4.2), the Processing Coordinator routes eligible work through the boundary-crossing path per `AIArchitecture.md` §4.2, with the active path indicated in the interface (`UXRequirements.md` UX-051) and graceful fallback to the offline path on unreachability (AI-ARCH-013).
*Priority:* Critical. *Traceability:* AIArchitecture.md AI-ARCH-010–AI-ARCH-013; UXRequirements.md UX-051.

**DT-026** — AI outputs surface in the Presentation Shell with the mandatory distinctions intact: AI-generated vs. human-confirmed content (UX-028, SR-038), uncertainty flags (FR-037), and provenance metadata discoverable per `AIRequirements.md` AI-052; the desktop rendering never collapses these distinctions for visual simplicity.
*Priority:* Critical. *Traceability:* UXRequirements.md UX-028, UX-049–UX-052; SecurityRequirements.md SR-038.

## 10. Update Architecture

**DT-027** — The Update Agent applies updates entirely within the standard-user context (DT-001): receipt from the organization-approved channel (`DeploymentArchitecture.md` DA-013c), verification before application (DA-017), staged application such that an interrupted update leaves the prior version bootable, and rollback capability (DA-018).
*Priority:* Critical. *Traceability:* DeploymentArchitecture.md DA-016–DA-019; NonFunctionalRequirements.md NFR-051–NFR-054.

**DT-028** — Updates preserve local data compatibility: the Local Store's content (revision chains, offline queue, audit write-ahead) survives updates intact per `NonFunctionalRequirements.md` NFR-052, and an update never discards a queued offline action.
*Priority:* Critical. *Traceability:* NonFunctionalRequirements.md NFR-052; DatabaseArchitecture.md DB-032.

**DT-029** — Model artifact updates travel through the same verified pipeline as application updates (AI-ARCH-009), versioned independently per capability module so a single capability can be updated or rolled back without touching others.
*Priority:* High. *Traceability:* AIArchitecture.md AI-ARCH-005, AI-ARCH-009, AI-ARCH-016–AI-ARCH-017.

## 11. Desktop Security

**DT-030** — All locally persisted C2/C3/C4 data is encrypted at rest under `SecurityArchitecture.md`'s key hierarchy, such that device loss/theft (`ThreatModel.md` TM-001) or direct file inspection (TM-006) yields no readable content; local keys are protected per that architecture's endpoint key-protection design.
*Priority:* Critical. *Traceability:* SecurityRequirements.md SR-023, SR-025; SecurityArchitecture.md §4; ThreatModel.md TM-001, TM-006; DatabaseArchitecture.md DB-022–DB-023.

**DT-031** — The desktop application enforces session security per `SecurityArchitecture.md`'s session principles (authentication on startup per DT-010, session invalidation, re-authentication rules), and no session artifact bypasses the role/scope model (SR-013).
*Priority:* Critical. *Traceability:* SecurityRequirements.md SR-011, SR-013; SecurityArchitecture.md §2.

**DT-032** — The desktop application writes every locally originated auditable event (per SR-041) to the audit write-ahead before the action completes (DB-013), including offline actions, integrity-check failures (DT-012), and sync reconciliations.
*Priority:* Critical. *Traceability:* SecurityRequirements.md SR-041; DatabaseArchitecture.md DB-013.

**DT-033** — The desktop application does not require, request, or depend on elevation at any point in normal operation, and does not weaken managed-device security controls (it coexists with, rather than requiring exceptions to, standard enterprise endpoint policy).
*Priority:* Critical. *Traceability:* ProjectIntent.md (Target Environment Constraints); SecurityRequirements.md SR-004.

## 12. Accessibility

**DT-034** — The Presentation Shell exposes all core workflows (capture, review, approval, search) to full keyboard-only operation (`FunctionalRequirements.md` FR-097, `UXRequirements.md` UX-040) and to assistive technologies (FR-098, UX-041) as an architectural property of the shell's design, not a per-screen retrofit.
*Priority:* Critical. *Traceability:* FunctionalRequirements.md FR-097–FR-098; UXRequirements.md §11.

**DT-035** — Accessibility is structured for verifiability: the shell's interaction layer is designed so accessibility conformance (target pending AR-070) can be tested per `NonFunctionalRequirements.md` NFR-055, with the synchronized audio-text review experience (UX-025) specifically designed to remain operable through keyboard and assistive technology.
*Priority:* Critical. *Traceability:* NonFunctionalRequirements.md NFR-055; UXRequirements.md UX-025, UX-043; AssumptionsRegister.md AR-070.

**DT-036** — Guidance systems (walkthroughs, tooltips, beginner support per `UXRequirements.md` §6–§7, §12) are part of the Presentation Shell's architecture — dismissible, restartable, never blocking (UX-015–UX-017) — not an overlay added after the core UI.
*Priority:* High. *Traceability:* UXRequirements.md UX-014–UX-019, UX-045–UX-048.

## 13. Deferred Decisions

- **UI framework, desktop framework, language, OS API usage, installer technology** — deferred to `05-Engineering/`, per this document's scope constraints.
- **Interactive/background part boundary mechanism** (process/service/thread split, DT-005) — implementation decision within DT-006's no-elevation constraint.
- **AR-076 numeric thresholds** for tiered footprint selection (DT-023) — still gating this document and `AIArchitecture.md` leaving Draft status.
- **AR-070 accessibility conformance target** (DT-035) — pending; blocks `04-Design/Accessibility.md`.
- **AR-072 confidence-display granularity** (DT-026) — pending.
- **Offline policy-cache staleness window** (DT-019) — implementation decision alongside `SecurityArchitecture.md` session rules, per DB-034.
- **AR-007 update delivery mechanism** (DT-027) — the Update Agent's channel-side counterpart remains deferred per `DeploymentArchitecture.md` DA-020.

No new assumptions are introduced by this document; all deferred items above were already tracked (AR-007, AR-070, AR-072, AR-076) or are scoped implementation details rather than genuine new uncertainty.

## 14. Traceability Summary

Every requirement/decision traces to the six upstream architecture documents or the `02-Requirements/` set, per inline references. The ten mandated support properties are each architecturally located: managed Windows devices and no administrator privileges (DT-001, DT-006, DT-033), offline-first (DT-002, DT-017–DT-019), secure local storage (DT-030), AI processing (DT-023–DT-026), synchronization (DT-020–DT-022), audit (DT-032), update verification (DT-027–DT-029), accessibility (DT-034–DT-036), enterprise deployment (DT-001, DT-027). No technology, framework, or product is named.

## 15. Relationship to Other PEKB Documents

- This document completes the `03-Architecture/` phase (seven documents: ThreatModel, DeploymentArchitecture, SystemArchitecture, SecurityArchitecture, AIArchitecture, DatabaseArchitecture, DesktopArchitecture). Note: the original PEKB tree also lists `WebArchitecture.md`; under the adopted topology (`DeploymentArchitecture.md` DA-009) no browser-delivered client exists in current scope, so that document is not required unless scope changes — flagged for confirmation in the Architecture Baseline Review rather than silently dropped.
- `04-Design/` documents (pending) design the Presentation Shell's UX to the requirements this architecture hosts.
- `05-Engineering/` documents select the concrete technologies this document defers.
- The Architecture Baseline Review should verify cross-document consistency before `04-Design/`/`05-Engineering/` begin.

---

*End of Document — PEKB-03-ARC-007 — Project Echo Desktop Architecture — PE-2026.001-ZM*
