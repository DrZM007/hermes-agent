# ADR-007 — Transcript & Record Lifecycle Amendment

## Document Metadata

| Field | Value |
|---|---|
| Document ID | PEKB-00-GOV-020 |
| Decision ID | ADR-007 |
| Document Title | Transcript & Record Lifecycle Amendment |
| PEKB Section | 00-Governance/Decisions |
| Version | 0.1.0 |
| Status | Proposed |
| Classification | Internal — Governance |
| Owner Role | Principal Software Architect |
| Approval Required From | Product Manager, Security Architect, Privacy Officer, QA Lead |
| Related Documents | ProjectConstitution.md, AssumptionsRegister.md (00-Governance); ADR-003-DataOwnershipGovernance.md, ADR-004-AccessControlRBACModel.md, ADR-006-DataClassificationTwoAxisModel.md (00-Governance/Decisions); FunctionalRequirements.md, PrivacyRequirements.md, SecurityRequirements.md (02-Requirements); DatabaseArchitecture.md (03-Architecture); Scope.md (01-Product) |
| Original Creator | Dr Ziyaad Moolla |
| Creator ID | ZM |
| Document Provenance | PE-2026.001-ZM |

---

## 1. Context

`02-Requirements/FunctionalRequirements.md` §3.1 defines the ratified seven-state transcript lifecycle: **Recording Received → Processing → Draft Transcript → Review Required → Reviewed → Approved → Archived**, with two backward transitions (Reviewed → Review Required; Approved → Reviewed). This state machine is referenced throughout the requirements set (FR-023, FR-025, FR-029, FR-032, FR-040, FR-048, FR-050, FR-051, FR-054, FR-055) and by `DatabaseArchitecture.md`.

The product-owner briefing introduced three additions that must be reconciled with this ratified machine:

1. **Records-management retention lifecycle** (Versions 12, 14, 16): beyond Archived, a record proceeds through retention to eligibility for disposal and, ultimately, governed secure disposal with a disposal certificate.
2. **Two-stage / multi-stage approval** (Version 3): approval may require more than one approver (e.g., Reviewer → Department Manager → Final Approval), varying by department, meeting type, or classification.
3. **Collaborative editing** (Versions 3, 10): multiple reviewers working on a transcript, via check-out/check-in or (where infrastructure supports it) real-time collaboration.

Adding all three naively as new top-level states would inflate a clean seven-state machine into eleven-plus rigid states that every referencing document must adopt. This ADR reconciles them at the appropriate level instead.

## 2. Problem

Decide, for each of the three additions, whether it is a **new macro lifecycle state**, a **sub-process within an existing state/transition**, or an **overlay/mode** — and amend §3.1 accordingly without weakening any ratified invariant (append-only revisions, no auto-merge, mandatory Reviewer/Approver separation, immutable audit).

## 3. Options Considered

### Option A — Every addition becomes a new top-level state
Collaborative Editing, each approval stage, Retention, Eligible-for-Disposal, and Disposed all become distinct macro states.

- **Pros:** Literal to the briefing text; every concept is a first-class state.
- **Cons:** Produces an 11–13 state machine, much of whose complexity is configurable (approval stages vary per org) or is a working mode (collaborative editing) rather than a lifecycle position; forces every referencing document and the database to model configurable/parallel concerns as fixed states; brittle. Rejected.

### Option B — Reconcile at the appropriate level (chosen)
Add only the records-management states that are genuinely new *lifecycle positions* after Archived; model multi-stage approval as a configurable sub-process of the Reviewed → Approved transition; model collaborative editing as an editing *mode* within the review states.

- **Pros:** Keeps the macro state machine stable and comprehensible; puts configurable approval variation where configuration belongs (the policy engine); preserves the no-auto-merge and separation invariants; extends the lifecycle only where a real new position exists (the retention/disposal tail). 
- **Cons:** Requires a clear statement that "two-stage approval" is not a macro state, which is slightly less literal to the briefing wording. Accepted, and stated explicitly below.

## 4. Decision

**Project Echo adopts Option B.** The lifecycle in `FunctionalRequirements.md` §3.1 is amended as follows.

### 4.1 Records-management tail (new macro states, after Archived)

Three states are appended after **Archived**, forming the records-management tail:

| New State | Definition | Entry Trigger | Notes |
|---|---|---|---|
| **Eligible for Disposal** | The record's configured retention period has elapsed and it is eligible for governed disposal, but has not yet been disposed. | Automatic, when the retention period configured per `PrivacyRequirements.md` §15 and per the two-axis classification (ADR-006) elapses. | Entry is **suspended while a Legal Hold is in effect** (Section 4.4). No data is destroyed on entry; this state flags eligibility and awaits an authorized disposal action. |
| **Disposed** | The record's content (Axis-1 C1–C3 data) has been securely destroyed under a governed disposal action; a disposal certificate has been generated. | An authorized disposal action (per `SecurityRequirements.md`, subject to separation of duties) executed on an Eligible-for-Disposal record. | Terminal for content. The **C4 audit record and disposal certificate survive** per PR-044/PR-208-equivalent (audit outlives content). Secure destruction is best-effort per medium/OS (see `Scope.md` reconciliation and briefing V14), never claimed as a cryptographic guarantee. |

"Archived" continues to mean "in active long-term retention"; the briefing's notion of a distinct "Retention" state is subsumed by Archived (the dwell period), not modeled as a separate state, to avoid redundancy. The forward chain becomes:

```
Recording Received → Processing → Draft Transcript → Review Required
→ Reviewed → Approved → Archived → Eligible for Disposal → Disposed
```

Backward transitions from the ratified machine are unchanged. There is **no** backward transition out of Disposed (content no longer exists). Eligible for Disposal → Archived is permitted if retention is re-extended or a Legal Hold is applied.

### 4.2 Multi-stage approval (configurable sub-process, not new macro states)

The single **Reviewed → Approved** transition may be configured, via the enterprise governance/policy engine (`Scope.md` §2.13), to require an ordered sequence of approval stages (e.g., Department Manager then Final Approver). While stages are outstanding the record remains conceptually in the approval sub-process; it reaches the **Approved** macro state only when **all** configured stages are complete. Constraints:

1. Approval stages are **configuration**, not new macro lifecycle states; documents referencing §3.1 continue to see a single Approved state.
2. The mandatory **Reviewer/Approver separation of duties (ADR-004)** holds across every stage; no single identity may satisfy a stage it is prohibited from, and conflict-of-interest rules (briefing V16) apply per stage.
3. Every stage completion and rejection is a distinct auditable action (Constitution Commitment; §3.1 backward-transition logging discipline).
4. A rejection at any stage returns the record to **Review Required** (as the existing Reviewed → Review Required backward transition already provides), with the stage recorded.

### 4.3 Collaborative editing (editing mode within the review states, not a new macro state)

Collaborative editing is an **editing mode** available within the **Draft Transcript** and **Review Required** states, not a distinct lifecycle state. The organization selects the collaboration model (check-out/check-in, or real-time where infrastructure supports it) by policy. Invariants:

1. **No automatic merge.** Concurrent edits that conflict are surfaced for human resolution, never auto-merged — preserving `DatabaseArchitecture.md` DB-011 exactly.
2. Every edit remains an append-only revision (DB-008–DB-011); collaboration changes *who* may edit concurrently and *how* conflicts surface, never the append-only guarantee.
3. Collaborative editing does not alter the state-machine position; a transcript being collaboratively edited is still in Draft Transcript or Review Required.

### 4.4 Legal Hold (overlay, not a state)

Legal Hold is an **overlay flag** applicable to a record in any state, not a lifecycle state. While a Legal Hold is in effect: transition into **Eligible for Disposal** is suspended, the **Disposed** action is blocked, and a visible banner indicates the hold. When the hold is removed, normal retention/disposal eligibility resumes. (Briefing V16.)

## 5. Rationale

Modeling each addition at its natural level keeps the authoritative state machine small and stable — which matters precisely because so many documents reference it — while still capturing every capability the briefing described. Multi-stage approval is inherently *configurable per organization*, so it belongs in the policy engine, not as fixed states; collaborative editing is a *working mode* governed by the already-ratified no-auto-merge invariant; only the retention/disposal tail is a genuine new sequence of lifecycle positions. This choice also keeps the separation-of-duties and append-only invariants literally unchanged, satisfying Constitution Commitments 2 (Human Authority) and 14 (Data as a Long-Term Asset) and the Section 2A precedence of correctness and security.

## 6. Consequences

1. `FunctionalRequirements.md` §3.1 is amended to append the two records-management states (Eligible for Disposal, Disposed), to note multi-stage approval as a configurable sub-process of Reviewed → Approved, and to note collaborative editing as a mode within Draft/Review Required. FR-029 (enforce states exactly) now includes the new tail states.
2. `PrivacyRequirements.md` §15 (retention) and the ADR-006 Axis-2 handling matrix must define what drives the Archived → Eligible-for-Disposal timing and the disposal approval/authority.
3. `SecurityRequirements.md` must define the disposal action's authority and separation of duties, the disposal certificate, and the Legal Hold overlay controls.
4. `DatabaseArchitecture.md` must represent the new tail states and confirm the Disposed state destroys C1–C3 content while retaining C4 audit + certificate; collaborative editing must be shown to preserve DB-011.
5. The policy/workflow engine (`Scope.md` §2.13) is the home for approval-stage configuration.
6. `ArchitectureDecisionIndex.md` decision #6 is updated to reference this amendment.
7. Any future desire to make multi-stage approval or collaborative editing into true macro states would require amending this ADR.

## 7. Risks

| Risk | Likelihood | Impact | Notes |
|---|---|---|---|
| Implementers model approval stages as fixed states, contradicting this ADR. | Medium | Medium | §3.1 and this ADR state explicitly that stages are configuration; the policy engine is the single home. |
| "Disposed" is over-claimed as guaranteed erasure. | Medium | High | Must be documented as governed best-effort per medium/OS + certificate + audit, never a cryptographic guarantee (consistent with the Scope secure-disposal note). |
| Collaborative editing implementation introduces an auto-merge path. | Low | High | DB-011 is invariant; the no-auto-merge behavior must be a tested acceptance criterion. |
| Legal Hold not honored at the disposal boundary. | Low | High | Suspension of Eligible-for-Disposal entry and blocking of Disposed under hold must both be tested. |

## 8. Related Requirements

- `02-Requirements/FunctionalRequirements.md` §3.1, FR-029, FR-050, FR-055
- `02-Requirements/PrivacyRequirements.md` §15 (retention → disposal timing)
- `02-Requirements/SecurityRequirements.md` (disposal authority/certificate, Legal Hold)
- `03-Architecture/DatabaseArchitecture.md` (state representation; DB-011 preservation)
- `01-Product/Scope.md` §2.13 (approval-stage configuration), §2.18 (records management)

## 9. Assumptions Updated

- No numeric retention values are set here; specific retention periods remain deferred to `PrivacyRequirements.md` PR-042 / `07-Privacy-Compliance/RetentionPolicy.md`.
- New open item: the disposal-authority model (who may authorize disposal, and the separation of duties around it) is pending in `SecurityRequirements.md`.
- This ADR does not touch AR-076 or AR-052.

## 10. Challenge the Design

Before this ADR is approved:

1. Is any of the three additions actually a genuine macro state that this ADR has wrongly demoted to sub-process/mode?
2. Does subsuming "Retention" into "Archived" lose any needed distinction (e.g., a record that is retained but not yet archived)?
3. Does the multi-stage approval sub-process leave any path that violates Reviewer/Approver separation?
4. Is there any way the Disposed transition could run while a Legal Hold is in effect?
5. What have we deferred (retention values, disposal authority) and is each flagged rather than assumed?

## 11. Revision History

| Version | Date | Summary | Author |
|---|---|---|---|
| 0.1.0 | 2026-07-20 | Initial ADR-007: amend the seven-state transcript lifecycle. Append two records-management macro states after Archived (Eligible for Disposal, Disposed) with governed best-effort disposal + surviving audit/certificate; model multi-stage approval as a configurable sub-process of Reviewed → Approved (not new states, separation of duties preserved); model collaborative editing as an editing mode within Draft/Review Required (DB-011 no-auto-merge preserved); model Legal Hold as an overlay suspending disposal. Keeps the macro state machine stable while capturing all three briefing additions. | Dr Ziyaad Moolla (ZM) |

---

*End of Document — PEKB-00-GOV-020 — ADR-007 — Transcript & Record Lifecycle Amendment — PE-2026.001-ZM*
