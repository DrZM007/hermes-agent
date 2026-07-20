# ADR-008 — Constrained Custom Roles (extends ADR-004)

## Document Metadata

| Field | Value |
|---|---|
| Document ID | PEKB-00-GOV-021 |
| Decision ID | ADR-008 |
| Document Title | Constrained Custom Roles (extends ADR-004) |
| PEKB Section | 00-Governance/Decisions |
| Version | 0.1.0 |
| Status | Proposed |
| Classification | Internal — Governance |
| Owner Role | Security Architect |
| Approval Required From | Principal Software Architect, Privacy Officer, Product Manager |
| Related Documents | ProjectConstitution.md, AssumptionsRegister.md (00-Governance); ADR-002-DeploymentModel.md, ADR-003-DataOwnershipGovernance.md, ADR-004-AccessControlRBACModel.md, ADR-006-DataClassificationTwoAxisModel.md (00-Governance/Decisions); SecurityRequirements.md, FunctionalRequirements.md, UXRequirements.md (02-Requirements); Scope.md (01-Product) |
| Original Creator | Dr Ziyaad Moolla |
| Creator ID | ZM |
| Document Provenance | PE-2026.001-ZM |

---

## 1. Context

`ADR-004-AccessControlRBACModel.md` adopted **Option C** — a fixed baseline taxonomy of eight roles (System Administrator, Organization Administrator, Meeting Owner, Recorder, Reviewer, Approver, Knowledge Consumer, Auditor) with organization-scoped assignment and constrained delegation — and explicitly **rejected Option B** (fully organization-defined, unconstrained custom roles) because it provided no baseline guarantee of least privilege or separation of duties.

The product-owner briefing (Version 2) later described **expanded roles** and, in places, **"fully custom roles"** with an organization-defined permission matrix. Taken literally, "fully custom roles" is the very Option B that ADR-004 rejected for good reasons. However, the underlying need — that organizations can model their own internal structures (e.g., a department-manager approver, an executive read-only consumer, a trainee reviewer) — is legitimate and was partially anticipated by ADR-004 itself (Section 4.1 role combination, Section 7 "may not perfectly fit every organization's structure").

This ADR reconciles the briefing's custom-role desire with ADR-004's guarantees by defining a **constrained** custom-role capability, rather than either re-adopting unconstrained custom roles or refusing organizational flexibility.

## 2. Problem

Decide:

1. May organizations define custom roles at all, given ADR-004's rejection of unconstrained custom roles?
2. If so, under what constraints, so that no custom role can weaken the least-privilege and separation-of-duties guarantees ADR-004 makes structural?
3. How are the briefing's "expanded roles" realized — as new baseline roles, custom roles, scopes, or modes?

## 3. Options Considered

### Option A — Re-adopt unconstrained custom roles (briefing's literal "fully custom")
Let each organization define arbitrary roles and permissions with no product-imposed floor.

- **Pros:** Maximum flexibility; literal to the briefing wording.
- **Cons:** Exactly the Option B that ADR-004 rejected; a single misconfigured custom role could hold unchecked authority or defeat Reviewer/Approver separation or the System-Administrator/content-access separation; inconsistent with Constitution Commitments 3 (Security by Design) and the Section 2A precedence of Security before convenience. Rejected.

### Option B — No custom roles; assignment/scope flexibility only (status quo of ADR-004)
Organizations keep only the eight baseline roles, varying assignment and scope.

- **Pros:** Strongest guarantee; simplest.
- **Cons:** Does not meet the briefing's expressed need to name and model organization-specific roles; pushes organizations toward routine use of role *combination* exceptions, which ADR-004 §7 already flags as a risk. Insufficient.

### Option C — Constrained custom roles as bounded compositions of baseline permissions (chosen)
Organizations may define custom roles, but only by **composing and restricting** the permission boundaries the eight baseline roles already define, and never in a way that violates a mandatory separation of duties or exceeds the union of baseline permissions.

- **Pros:** Gives organizations real naming/modelling flexibility while keeping every ADR-004 structural guarantee intact by construction; a custom role can only ever be *equal to or more restrictive than* what baseline roles already permit; keeps cross-organization auditing tractable because every custom role decomposes into known baseline permissions.
- **Cons:** Requires a permission model expressive enough to compose baseline capabilities and a validator that rejects any custom role violating the constraints. Accepted as necessary.

## 4. Decision

**Project Echo adopts Option C: constrained custom roles.** ADR-004's baseline taxonomy and mandatory separations remain fully in force; this ADR adds a bounded custom-role capability on top of them.

1. **Baseline roles are unchanged and remain mandatory.** The eight roles of ADR-004 §4.1, their permission boundaries, and the mandatory separations of ADR-004 §4.3 are the fixed floor. This ADR does not add, remove, or redefine any baseline role.

2. **Custom roles are compositions of baseline permissions.** An organization may define a named custom role by selecting a subset of the permissions already granted to one or more baseline roles. A custom role's permission set must be a subset of the **union** of the baseline permissions it draws from — it may **never** grant a capability that no baseline role holds.

3. **Custom roles may only restrict, never weaken.** A custom role may be *more* restrictive than the baseline roles it composes (fewer permissions, narrower scope, tighter classification limits per ADR-006). It may **never**:
   - a. violate any mandatory separation of duties in ADR-004 §4.3 (e.g., no custom role may let one identity both review and give final approval of the same transcript, or grant an infrastructure/audit role content access);
   - b. grant content access to a role composed from infrastructure-only or audit-only baseline permissions (preserving ADR-004 §4.5 and the Auditor independence of §4.3.3);
   - c. exceed the classification handling permitted by the two-axis model (ADR-006) for the data in scope.

4. **A validator enforces the constraints.** The system must reject, at definition time, any custom role that would violate Section 4.3, with a plain-language explanation of which constraint failed. A custom role that cannot be validated is not created (fail-restrictively, `DesignPrinciples.md` §3.9).

5. **Custom roles are organization-scoped and audited.** Custom-role definition is an Organization Administrator authority (ADR-004 §4.2), isolated per deployment (ADR-002); every definition, modification, assignment, and deletion is a logged, attributable action (ADR-004 §4.4).

6. **The briefing's "expanded roles" are realized within this model, not as new baseline roles.** Roles such as *Executive* (read-only dashboards), *Department Manager* (an approval-stage authority per ADR-007 §4.2), or *Trainee Reviewer* (a Reviewer restricted to the training-review mode) are expressed as **constrained custom roles, scopes, or modes** over the baseline taxonomy. No new mandatory baseline role is introduced by this ADR; if a genuine capability is ever found that no baseline role can compose, that is a gap to be resolved by amending ADR-004, not by an unconstrained custom role.

## 5. Rationale

This preserves everything ADR-004 protected while granting the flexibility the briefing asked for, by making custom roles *strictly bounded compositions* of already-guaranteed-safe baseline permissions. Because a custom role can only ever be as permissive as, or more restrictive than, the baseline roles it draws from, no custom role can defeat least privilege or separation of duties — the guarantees hold *by construction*, not by administrator discipline. This directly answers the briefing's "custom roles" need without re-opening the Option B risks, consistent with Constitution Commitment 3 and the Section 2A precedence ordering.

## 6. Consequences

1. `SecurityRequirements.md` must define the custom-role permission model, the composition/subset rule, and the definition-time validator (Section 4.4) as testable requirements, including the mandatory-separation checks.
2. `FunctionalRequirements.md` must express that custom-role definition is an Organization Administrator authority and that assignment of a custom role follows the same scoping/audit rules as baseline roles.
3. `UXRequirements.md` must ensure custom-role definition surfaces, in plain language, what baseline permissions a custom role draws from and why a rejected definition failed validation (Transparency; Constitution Commitment 8).
4. The governance/policy engine (`Scope.md` §2.13) is the natural home for custom-role definitions and their validation.
5. Any future need for a capability outside the baseline union requires an ADR-004 amendment, not a custom role — this boundary is itself a guarantee.
6. `ArchitectureDecisionIndex.md` decision #4 is annotated to note the constrained-custom-role extension.

## 7. Risks

| Risk | Likelihood | Impact | Notes |
|---|---|---|---|
| Organizations expect truly arbitrary custom roles (per the briefing's "fully custom" wording) and find the constraints limiting. | Medium | Low | The constraint is the safeguard; documentation must explain that custom roles compose baseline permissions and cannot exceed them, and why. |
| The validator has a gap that lets a custom role violate a separation of duties. | Low | High | The mandatory-separation checks (Section 4.3) must be explicit, tested acceptance criteria in `SecurityRequirements.md`; this is safety-critical and not feature-flag-disableable. |
| "Expanded roles" get implemented as new baseline roles by mistake, fragmenting the taxonomy. | Low | Medium | Section 4.6 is explicit: expanded roles are custom roles/scopes/modes unless an ADR-004 amendment says otherwise. |

## 8. Related Requirements

- `02-Requirements/SecurityRequirements.md` (custom-role model + validator + separation checks)
- `02-Requirements/FunctionalRequirements.md` (definition/assignment authority)
- `02-Requirements/UXRequirements.md` (transparent definition and rejection messaging)
- `00-Governance/Decisions/ADR-004-AccessControlRBACModel.md` (baseline taxonomy this extends)
- `01-Product/Scope.md` §2.13 (policy engine as home)

## 9. Assumptions Updated

- **AR-040** (`Personas.md`) — the constrained-custom-role capability gives organizations a governed way to model their real-world role structures without the routine Reviewer/Approver combination exception ADR-004 discouraged; AR-040 remains Open at the level of expected usage patterns but is now better served.
- New open item: the concrete permission-composition model (how baseline permissions decompose into selectable units) is pending in `SecurityRequirements.md`.
- No numeric or performance assumptions are affected; AR-076/AR-052 untouched.

## 10. Challenge the Design

Before this ADR is approved:

1. Is there any capability the briefing's "expanded roles" need that genuinely cannot be composed from baseline permissions (which would require an ADR-004 amendment instead)?
2. Can the composition/subset rule (4.2) be stated precisely enough to validate mechanically?
3. Is there any way a *composition* of individually-safe permissions could violate a separation of duties that per-permission checks would miss?
4. Does the validator's fail-restrictive behavior (4.4) risk blocking legitimate roles, and is the rejection messaging clear enough?
5. What have we deferred (the permission-composition model) and is it flagged rather than assumed?

## 11. Revision History

| Version | Date | Summary | Author |
|---|---|---|---|
| 0.1.0 | 2026-07-20 | Initial ADR-008: extend ADR-004 with a constrained custom-role capability. Organizations may define named custom roles, but only as bounded compositions/restrictions of baseline permissions, validated at definition time, never violating a mandatory separation of duties or exceeding the baseline permission union or the ADR-006 classification limits. The briefing's "expanded roles" (Executive, Department Manager, Trainee Reviewer, etc.) are realized as constrained custom roles/scopes/modes, not new baseline roles. Reconciles the briefing's custom-role desire with ADR-004's guarantees without re-opening the rejected unconstrained form. | Dr Ziyaad Moolla (ZM) |

---

*End of Document — PEKB-00-GOV-021 — ADR-008 — Constrained Custom Roles (extends ADR-004) — PE-2026.001-ZM*
