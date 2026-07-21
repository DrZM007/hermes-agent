# ADR-002 — Deployment Model

## Document Metadata

| Field | Value |
|---|---|
| Document ID | PEKB-00-GOV-011 |
| Decision ID | ADR-002 |
| Document Title | Deployment Model |
| PEKB Section | 00-Governance/Decisions |
| Version | 0.2.0 |
| Status | Accepted |
| Classification | Internal — Governance |
| Owner Role | Principal Software Architect |
| Approval Required From | Security Architect, Privacy Officer, DevOps/Deployment Engineer, Product Manager |
| Related Documents | ProjectConstitution.md, ProjectIntent.md, Scope.md (01-Product), Stakeholders.md (01-Product), AssumptionsRegister.md, ADR-001-AIProcessingModel.md |
| Original Creator | Dr Ziyaad Moolla |
| Creator ID | ZM |
| Document Provenance | PE-2026.001-ZM |

---

## 1. Context

`00-Governance/ProjectIntent.md` establishes Enterprise First as a Foundational Commitment, and describes a target environment of managed Windows laptops, restricted user permissions, possible inability to install developer tools, absence of Docker, absence of administrator rights, and IT departments that require predictable deployment. `01-Product/Stakeholders.md` §4 identifies IT Administrators, Security Functions, and Privacy/Compliance Functions as stakeholders whose interests depend directly on how Project Echo is deployed and isolated between organizations.

No decision yet exists on the fundamental tenancy/deployment model: whether each adopting organization runs its own isolated instance, whether multiple organizations could ever share hosted infrastructure, and where the boundary of "the organization's controlled environment" (referenced throughout governance and product documents as the place data must not leave without approval) actually sits. This was identified as a high-risk open item in `00-Governance/AssumptionsRegister.md` (AR-002, AR-024) and Foundation Review v0.1 (Required Decision #2), blocking `03-Architecture/SystemArchitecture.md`, `03-Architecture/DeploymentArchitecture.md`, and `03-Architecture/DatabaseArchitecture.md`.

This decision addresses the deployment/tenancy model at a strategic level only. It does not select hosting technology, infrastructure providers, or specific installer mechanisms — those are implementation decisions for `03-Architecture/DeploymentArchitecture.md`, made only after this decision is ratified.

## 2. Problem

Define, at a strategic level:

1. Is each adopting organization's data isolated in a dedicated deployment, or could Project Echo ever operate as shared, multi-tenant hosted infrastructure across organizations?
2. Where does "the organization's controlled environment" (referenced in privacy/security governance) begin and end?
3. How does the chosen model interact with the Enterprise First constraints (no admin rights, no Docker, restricted external services) and the Offline-First Hybrid AI Processing Model decided in ADR-001?

## 3. Options Considered

### Option A — Multi-Tenant Hosted SaaS
A single, centrally hosted Project Echo service handles multiple organizations' data within shared infrastructure, logically separated by tenant.

- **Pros:** Simplifies centralized updates and operations; a common commercial model for enterprise software.
- **Cons:** Directly conflicts with the stated requirement that meeting data must not leave the organization's controlled environment unless explicitly configured and approved — under this model, leaving the organization's environment would be the default, not an exception; conflicts with Offline First, since a hosted-only model has no meaningful offline default; increases blast radius of any single security incident across multiple organizations; rejected as inconsistent with governance.

### Option B — Strict On-Premises Only, No Exceptions
Every adopting organization deploys Project Echo entirely within its own infrastructure, with no option for any hosted or cross-organization component, ever.

- **Pros:** Simplest, strongest interpretation of "organization's controlled environment"; minimizes shared-infrastructure risk entirely.
- **Cons:** May be needlessly rigid for organizations that would willingly and knowingly approve specific hosted components (e.g., a future optional networked AI processing path under ADR-001's governed opt-in) — this option would effectively contradict ADR-001's Option C by disallowing the very opt-in path ADR-001 defined as permissible.

### Option C — Per-Organization Isolated Deployment, with Governed Optional External Components
Each adopting organization's deployment is isolated by default — a dedicated deployment per organization, with no default sharing of infrastructure, data, or processing across organizations. Any component that would involve data leaving that organization's isolated boundary (including the optional networked AI processing path from ADR-001) requires the same explicit, organization-level, approved, and audited configuration already established for Controlled Export and for ADR-001's hybrid processing opt-in.

- **Pros:** Directly consistent with the "must not leave the organization's controlled environment unless explicitly configured and approved" requirement; consistent with ADR-001 (the isolated-by-default boundary is exactly where the offline AI path operates, and any opt-in networked processing is treated as a deliberate, governed exception to that boundary, not a routine cross-tenant service); consistent with Enterprise First, since it does not presuppose organizations must trust a shared hosted environment; preserves organizational data ownership as a default architectural property rather than a policy promise layered on top of shared infrastructure.
- **Cons:** Rules out a shared multi-tenant hosting model as a default commercial/operational simplification; requires "isolated deployment" to be defined precisely enough for `03-Architecture/DeploymentArchitecture.md` to design against (e.g., dedicated instance per organization vs. dedicated logical/data boundary — a question left to architecture, not resolved here).

## 4. Decision

**Project Echo adopts Option C: Per-Organization Isolated Deployment, with Governed Optional External Components.**

1. Each adopting organization's Project Echo deployment is isolated by default: no organization's meeting data, transcripts, or derived artifacts are shared, pooled, or co-mingled with another organization's data as a default behavior.
2. "The organization's controlled environment," as referenced throughout `00-Governance/` and `01-Product/`, is defined as this isolated deployment boundary.
3. Any capability that would involve data crossing that boundary — including but not limited to the optional networked AI processing path defined in ADR-001, and any Controlled Export — is permitted only under the same governance discipline: explicit organization-level configuration, approval, transparency to the organization, and audit logging.
4. This decision does not mandate a specific hosting topology (e.g., single-organization on-premises server vs. dedicated cloud-hosted instance per organization) — it mandates isolation and controlled-boundary behavior as the requirement, leaving specific topology to `03-Architecture/DeploymentArchitecture.md`.

## 5. Rationale

This decision resolves the tension identified in Section 1 by making organizational data isolation the default architectural property rather than a policy assurance layered on top of shared infrastructure — directly satisfying the Privacy First and data-ownership expectations already established in governance and product documents. It is deliberately compatible with ADR-001: both decisions share the same governance pattern (isolated/offline by default; any crossing of the organizational boundary is an explicit, approved, audited exception), which keeps the two decisions internally consistent rather than introducing two different exception-handling models for AI processing versus deployment.

## 6. Consequences

1. `03-Architecture/SystemArchitecture.md`, `03-Architecture/DeploymentArchitecture.md`, and `03-Architecture/DatabaseArchitecture.md` must design around per-organization isolation as a binding constraint, not an optional feature.
2. `02-Requirements/SecurityRequirements.md` and `02-Requirements/PrivacyRequirements.md` must define the isolation boundary precisely enough to be tested (e.g., what constitutes a boundary violation) once architecture work begins.
3. Any future consideration of shared/multi-tenant hosted infrastructure as a convenience would require a formal amendment to this ADR, not an incidental architecture decision.
4. This decision, combined with ADR-001, establishes a consistent "isolated and offline by default; explicit governed exception for anything crossing the boundary" pattern that should be reused, not reinvented, for future boundary-crossing capabilities (e.g., future integrations).
5. Specific deployment topology (single-server on-prem vs. one dedicated instance per organization in a controlled cloud environment) remains an open architecture question, not resolved by this ADR.

## 7. Risks

| Risk | Likelihood | Impact | Notes |
|---|---|---|---|
| "Isolated deployment" could be interpreted inconsistently by future architecture work without a precise technical definition of the boundary. | Medium | High | Must be resolved explicitly and early in `03-Architecture/DeploymentArchitecture.md`, referencing this ADR. |
| Ruling out multi-tenant hosted infrastructure as a default may increase per-organization deployment/operational overhead compared to a shared-hosting commercial model. | Medium | Medium | Accepted as a deliberate trade-off in favor of the Privacy First and data-ownership commitments; must be reflected in realistic operational planning. |
| Without a defined deployment topology yet, `DeploymentArchitecture.md` authors may be tempted to assume a topology prematurely to make progress. | Medium | Medium | This ADR intentionally leaves topology open; `DeploymentArchitecture.md` must treat topology as its own decision, informed by but not implied by this ADR. |

## 8. Related Requirements

This decision is a direct input to the following pending documents, which must not contradict it:

- `02-Requirements/SecurityRequirements.md`
- `02-Requirements/PrivacyRequirements.md`
- `02-Requirements/NonFunctionalRequirements.md`
- (Future) `03-Architecture/SystemArchitecture.md`
- (Future) `03-Architecture/DeploymentArchitecture.md`
- (Future) `03-Architecture/DatabaseArchitecture.md`

## 9. Assumptions Updated

The following entries in `00-Governance/AssumptionsRegister.md` are resolved by this decision and must be updated to Resolution Status **Resolved**, with a cross-reference to `ADR-002`:

- **AR-002** — The deployment/tenancy model is now defined as per-organization isolated deployment, with governed optional external components; specific hosting topology remains a separate, still-open architecture question (see below).
- **AR-024** — Organization/tenancy isolation model is now defined per Section 4 of this ADR.

The following new open items are introduced by this decision and must be added to `AssumptionsRegister.md`:

- Specific deployment topology (on-premises single-server vs. dedicated cloud instance per organization vs. other) is not yet defined; deferred to `03-Architecture/DeploymentArchitecture.md`.
- The precise technical definition of the "isolation boundary" (what constitutes a boundary violation, how it is enforced and tested) is not yet defined; deferred to `SecurityRequirements.md` and `DeploymentArchitecture.md`.

---

## Ratification

**Ratified by the Product Owner on 2026-07-20.** Status changed Proposed → Accepted (v0.2.0). This decision is authoritative for all downstream work; amendments follow `RevisionPolicy.md`.

---

*End of Document — PEKB-00-GOV-011 — ADR-002 — Deployment Model — PE-2026.001-ZM*
