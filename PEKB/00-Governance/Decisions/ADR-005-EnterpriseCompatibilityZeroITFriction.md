# ADR-005 — Enterprise Compatibility & Zero-IT-Friction

## Document Metadata

| Field | Value |
|---|---|
| Document ID | PEKB-00-GOV-018 |
| Decision ID | ADR-005 |
| Document Title | Enterprise Compatibility & Zero-IT-Friction |
| PEKB Section | 00-Governance/Decisions |
| Version | 0.1.0 |
| Status | Proposed |
| Classification | Internal — Governance |
| Owner Role | DevOps/Deployment Engineer |
| Approval Required From | Principal Software Architect, Security Architect, Product Manager |
| Related Documents | ProjectConstitution.md, ProjectIntent.md, EngineeringQualityGates.md, AssumptionsRegister.md (00-Governance); ADR-001-AIProcessingModel.md, ADR-002-DeploymentModel.md (00-Governance/Decisions); Scope.md, ProductCharter.md (01-Product); NonFunctionalRequirements.md (02-Requirements); DeploymentArchitecture.md, DesktopArchitecture.md (03-Architecture) |
| Original Creator | Dr Ziyaad Moolla |
| Creator ID | ZM |
| Document Provenance | PE-2026.001-ZM |

---

## 1. Context

`00-Governance/ProjectIntent.md` establishes **Enterprise First** as a Foundational Commitment and describes a target environment of managed Windows laptops, restricted user permissions, no administrator rights, no Docker/containers, and IT functions that require predictable, policy-driven deployment. These constraints are stated in governance and are assumed throughout (notably `AssumptionsRegister.md` **AR-003**), and the product-owner briefing devoted extensive material ("Enterprise Compatibility / Zero-IT-Friction," and the deployment/operations chapters) to them.

However, these constraints are currently **distributed** across governance prose and assumptions rather than ratified as a single binding decision with a defined verification gate. Without that, they risk being treated as aspirational guidance that a technology or packaging choice could quietly erode — for example, a stack that depends on a container runtime, or a database engine that requires a server process the user cannot install. This ADR consolidates them into one authoritative, testable compatibility constraint.

This ADR decides the **compatibility constraint and its enforcement**, not the technology that satisfies it. The desktop stack, database engine, and packaging technology remain open (AR-003) and are Engineering-phase decisions constrained by, but not made in, this ADR.

## 2. Problem

Define, at a strategic level:

1. Are the Zero-IT-Friction constraints (no admin rights, no container/Docker/WSL dependency, offline-capable, deployable by standard enterprise tooling) **binding requirements** or best-effort guidance?
2. How is compatibility **verified** before a release, so that a violation is caught rather than discovered in the field?
3. How does this constraint bound downstream technology, packaging, and database-engine decisions without pre-making them?

## 3. Options Considered

### Option A — Treat enterprise constraints as best-effort guidance
The constraints remain governance prose; teams "aim for" them but no gate enforces them.

- **Pros:** Maximum implementation freedom; simplest to state.
- **Cons:** A single convenient dependency (container runtime, admin-only installer, server-only database) can silently defeat Enterprise First; the failure surfaces at customer deployment, the most expensive place to discover it; inconsistent with `ProjectConstitution.md` Commitment 12 (Quality Before Features) and Commitment 15 (Reliability & Supportability). Rejected.

### Option B — Binding Zero-IT-Friction constraints with a Compatibility Certification release gate
The constraints become mandatory, testable requirements; every release must pass a defined Compatibility Certification checklist before it is production-eligible.

- **Pros:** Makes Enterprise First an enforced architectural property rather than a hope; catches violations at the release gate, not in the field; gives downstream technology decisions a clear, bounded target; directly realizes Constitution Commitments 5, 12, 15. 
- **Cons:** Constrains the technology solution space (rules out container-dependent and admin-only approaches) and adds a mandatory release gate. Both are accepted as deliberate trade-offs.

### Option C — Binding for the desktop client only; relaxed for the shared server component
Apply Zero-IT-Friction strictly to the desktop client, but allow the organization-controlled shared component (ADR-002) to assume ordinary server administration (installed by IT with admin rights on a managed server).

- **Pros:** Recognizes that a server component is installed by IT under change control, where admin rights are normal, whereas the desktop client runs in a locked-down standard-user session.
- **Cons:** Not actually in conflict with Option B — it is a *scoping clarification* of it, not an alternative. Adopted as a clarification within the decision (see Section 4.5), not as a competing option.

## 4. Decision

**Project Echo adopts Option B, with the Option C scoping clarification: binding Zero-IT-Friction constraints for the desktop client, enforced by a Compatibility Certification release gate.**

1. **No administrator rights after installation.** The desktop client installs and runs entirely within a standard-user session; no in-scope capability may require elevation to function. (Consistent with `DesktopArchitecture.md` DT-005–DT-007.)
2. **No mandatory container/Docker/WSL/Linux dependency.** No in-scope capability may depend on a container runtime, WSL, or a Linux subsystem being present on an end-user managed Windows device.
3. **Offline-capable by default.** Consistent with ADR-001, no core capture/review/approval capability may require external connectivity; connectivity to the organization-controlled shared component (ADR-002) may be assumed only for capabilities explicitly designated as shared-component features, and the desktop client must degrade gracefully when that component is unavailable.
4. **Deployable by standard enterprise tooling.** The desktop client must be deployable via managed Windows mechanisms — MSI and/or portable package, silent/unattended install, configuration-file-driven install, Group Policy, Microsoft Intune, and Microsoft Endpoint Configuration Manager (SCCM) — without bespoke per-site engineering.
5. **Scope of the constraint (Option C clarification).** Constraints 1–2 apply to the **desktop client** running in an end-user managed session. The **organization-controlled shared component** (ADR-002) may assume ordinary IT-administered server installation (where administrator rights and change-controlled server management are normal), but must not require container/Kubernetes/Linux expertise as a precondition, consistent with the briefing's "no Docker, no Kubernetes, no Linux knowledge required" position.
6. **Compatibility Certification gate.** No release is production-eligible until it passes a Compatibility Certification checklist covering at least: standard Windows 10/11 enterprise environments; operation without administrator privileges; CPU-only systems (no dedicated GPU); restricted network environments; large recordings; low-disk-space conditions; recovery after unexpected shutdown; accessibility scenarios (keyboard-only, larger fonts, screen readers where applicable); upgrade from a previous version without data loss; and backup/restore validation. This gate is added to `EngineeringQualityGates.md` (Compliance/Release gate).

This ADR does **not** select the desktop technology stack, database engine, or packaging tool. It defines the box those choices must fit inside.

## 5. Rationale

Enterprise First is only real if it is enforced where technology decisions are made and where releases ship. Making the constraints binding and adding a certification gate converts a governance aspiration into an architectural property that a stack or packaging choice cannot silently erode, catching the failure at the cheapest point (the gate) rather than the most expensive (customer deployment). The Option C scoping keeps the constraint honest: it does not pretend a server component installed by IT is subject to the same standard-user limits as the desktop client, while still forbidding the container/Linux-expertise dependencies the briefing explicitly ruled out.

## 6. Consequences

1. `02-Requirements/NonFunctionalRequirements.md` must express constraints 1–4 and the Compatibility Certification checklist as numbered, testable requirements.
2. `03-Architecture/DesktopArchitecture.md` and `03-Architecture/DeploymentArchitecture.md` must design within these constraints as binding, and must reflect the desktop-vs-shared-component scoping in Section 4.5.
3. **Engineering-phase technology ADRs are bounded by this decision.** The desktop-stack decision (AR-003), the database-engine decision, and the packaging decision must each demonstrate conformance to Section 4; any candidate that requires admin rights, a container runtime, or a mandatory server process for local operation is non-conformant.
4. `EngineeringQualityGates.md` gains the Compatibility Certification checklist as a mandatory release gate; a release that has not passed it is not production-eligible regardless of functional completeness.
5. Any future desire to relax a Section 4 constraint (e.g., to adopt a technology that needs a container runtime) requires a formal amendment to this ADR, not an incidental engineering choice.

## 7. Risks

| Risk | Likelihood | Impact | Notes |
|---|---|---|---|
| The constraint space is narrow enough that some otherwise-attractive technology stacks are excluded. | Medium | Medium | Accepted as a deliberate Enterprise-First trade-off; the constraint is the requirement, not the stack. |
| "Deployable by standard enterprise tooling" is interpreted loosely and a release ships that technically installs but needs per-site scripting. | Medium | High | The Compatibility Certification gate (Section 4.6) must test silent/GPO/Intune/SCCM paths explicitly, not just interactive install. |
| The desktop-vs-shared-component scoping (4.5) is misread as permitting an admin-only desktop client. | Low | High | Section 4.1–4.2 are unambiguous for the desktop client; the shared-component relaxation applies only to the server component. |
| Performance-related certification items (CPU-only, large recordings, low disk) depend on thresholds that are not yet known. | High | Medium | These items are pass/fail on *behavior* (works / degrades gracefully), not on numeric targets; numeric performance budgets remain under AR-076 and are deliberately not fixed here. |

## 8. Related Requirements

This decision is a direct input to, and must not be contradicted by:

- `02-Requirements/NonFunctionalRequirements.md`
- `03-Architecture/DesktopArchitecture.md`
- `03-Architecture/DeploymentArchitecture.md`
- `00-Governance/EngineeringQualityGates.md` (Compatibility Certification gate)
- (Engineering-phase) the desktop-stack, database-engine, and packaging ADRs

## 9. Assumptions Updated

- **AR-003** (`AssumptionsRegister.md`) — *not resolved* by this ADR, but its **premise is now ratified**: the constraint that any desktop stack must operate without administrator rights and without Docker is now binding (Section 4.1–4.2), not merely assumed. The stack *choice* itself remains Open under AR-003 and is an Engineering-phase decision, now explicitly bounded by this ADR. The AR-003 entry should be annotated to reference ADR-005 as the source of its binding constraint.

New open items introduced by this decision:

- The Compatibility Certification checklist (Section 4.6) states *what* must be certified; the specific test procedures that satisfy each item are deferred to `09-Testing/` and referenced by `EngineeringQualityGates.md`.
- Numeric performance budgets underlying the CPU-only/large-recording/low-disk certification items remain unresolved under **AR-076** and are deliberately not fixed here.

## 10. Challenge the Design

Before this ADR is approved:

1. Is any Section 4 constraint stated as binding but not actually testable at the certification gate?
2. Does the desktop-vs-shared-component scoping (4.5) leave any loophole by which the desktop client could require elevation or a container runtime?
3. Does this ADR accidentally make a technology choice (stack, engine, packaging) that should remain open under AR-003?
4. Is the certification checklist sufficient for a regulated healthcare/research deployment, or is an item missing?
5. What have we deliberately left to the Engineering phase, and is each such item recorded as bounded-but-open?

## 11. Revision History

| Version | Date | Summary | Author |
|---|---|---|---|
| 0.1.0 | 2026-07-20 | Initial ADR-005: ratify binding Zero-IT-Friction constraints (no admin rights, no container/Docker/WSL dependency, offline-capable, deployable by standard enterprise tooling) for the desktop client, with an Option C scoping clarification for the organization-controlled shared component, and a mandatory Compatibility Certification release gate. Consolidates constraints previously distributed across ProjectIntent and the briefing; ratifies the premise of AR-003 without resolving the stack choice; leaves numeric budgets under AR-076. | Dr Ziyaad Moolla (ZM) |

---

*End of Document — PEKB-00-GOV-018 — ADR-005 — Enterprise Compatibility & Zero-IT-Friction — PE-2026.001-ZM*
