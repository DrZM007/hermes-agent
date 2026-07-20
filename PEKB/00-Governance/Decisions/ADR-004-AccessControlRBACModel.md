# ADR-004 — Access Control (RBAC) Model

## Document Metadata

| Field | Value |
|---|---|
| Document ID | PEKB-00-GOV-013 |
| Decision ID | ADR-004 |
| Document Title | Access Control (RBAC) Model |
| PEKB Section | 00-Governance/Decisions |
| Version | 0.1.0 |
| Status | Proposed |
| Classification | Internal — Governance |
| Owner Role | Security Architect |
| Approval Required From | Principal Software Architect, Privacy Officer, Product Manager |
| Related Documents | ProjectConstitution.md, Stakeholders.md (01-Product), Personas.md (01-Product), ADR-001-AIProcessingModel.md, ADR-002-DeploymentModel.md, ADR-003-DataOwnershipGovernance.md, AssumptionsRegister.md |
| Original Creator | Dr Ziyaad Moolla |
| Creator ID | ZM |
| Document Provenance | PE-2026.001-ZM |

---

## 1. Context

ADR-003 established that the adopting organization owns its data and that individual users act under **delegated organizational authority**, not personal ownership, but explicitly left the specific role structure and default authority-holders undefined (AR-046). `01-Product/Stakeholders.md` and `Personas.md` describe Direct User roles (Meeting Owner, Transcript Reviewer, Approver, Knowledge Consumer) and Organizational Authorities (IT Administrator, Security Function, Privacy/Compliance Function) narratively, but no document has yet defined these as a formal, bounded authorization model.

This gap has been tracked since Foundation Review v0.1 as AR-004 and AR-023, and now also as AR-046, and directly blocks `02-Requirements/FunctionalRequirements.md`, `02-Requirements/SecurityRequirements.md`, and any future `04-Design/` work on the review workflow (Draft → Reviewed → Approved → Archived), since none of that work can specify who may do what without a defined role model.

## 2. Problem

Define, at a conceptual (not technical) level:

1. What roles exist within Project Echo's authorization model?
2. What is each role responsible for, and what are the boundaries of its permissions?
3. Which roles must be separated from one another to prevent a single actor from controlling an entire consequential action end-to-end (separation of duties)?
4. How is authority delegated — from the organization downward to individual role-holders — consistent with ADR-003's "organization owns, users act under delegated authority" model?
5. What must be audited, and at what level of granularity, to satisfy the Auditability commitment and support POPIA-aligned accountability?
6. How do technical/infrastructure administrators relate to actual data access — does administering the system imply the ability to read organizational data content?

This decision does not define database roles, permission-flag schemas, or specific access-control technology (RBAC engine, claims/tokens, etc.) — those are implementation decisions for `03-Architecture/SecurityArchitecture.md` and `05-Engineering/`, made only after this conceptual model is approved.

## 3. Options Considered

### Option A — Single Undifferentiated "Administrator" Role
One administrative role has full authority over all configuration, data access, deletion, export, and audit review, with all other users holding only basic read/edit permissions with no further distinction.

- **Pros:** Simplest possible model to implement.
- **Cons:** Directly violates least privilege and separation of duties; a single compromised or careless account would have unchecked authority over an entire organization's confidential meeting data; makes it impossible to distinguish "can administer the system" from "can read meeting content," which is a core concern raised in Section 2, Question 6; incompatible with the Security by Design and Auditability commitments. Rejected.

### Option B — Fully Organization-Defined, Unconstrained Custom Roles
Project Echo defines no fixed roles at all; each adopting organization is free to define an arbitrary set of custom roles and permissions with no baseline structure or constraints imposed by the product.

- **Pros:** Maximum flexibility per organization.
- **Cons:** Provides no baseline guarantee of least privilege or separation of duties — an organization could misconfigure a single role with unchecked authority, and Project Echo would have no structural basis to flag this as a risk; makes cross-organization support, documentation, and auditing inconsistent; undermines the Enterprise First goal of predictable, governable deployment, since IT/Security/Privacy functions (per `Stakeholders.md` §4) would face a different authorization model in every deployment. Rejected as insufficiently governed, though the underlying idea (organization-level configurability) is retained in modified form in Option C.

### Option C — Fixed Baseline Role Taxonomy with Organization-Scoped Assignment and Constrained Delegation
Project Echo defines a fixed, product-level set of baseline roles with clear responsibilities, permission boundaries, and mandatory separation-of-duties constraints between specific role pairs. Each adopting organization assigns individuals (or groups) to these roles within its own isolated deployment (per ADR-002), and may combine or restrict role assignments per individual, but may not weaken the mandatory separations defined by the product, nor grant a role permissions outside its defined boundary without a documented, approved exception.

- **Pros:** Preserves least privilege and separation of duties as guaranteed product properties, not organization-dependent choices; gives organizations real assignment flexibility (who holds which role) without giving them the ability to erode the structural safeguards; gives IT/Security/Privacy stakeholders a consistent, learnable, auditable model across deployments; directly supports ADR-003's "organization owns, users act under delegated authority" by making delegation an explicit, bounded, assignable mechanism rather than an abstract idea.
- **Cons:** Requires the baseline role set to be well-designed up front, since it is a product-level constraint, not something each organization can freely redesign; requires clear documentation so organizations understand what each role can and cannot do before assigning it.

## 4. Decision

**Project Echo adopts Option C: a Fixed Baseline Role Taxonomy with Organization-Scoped Assignment and Constrained Delegation.**

### 4.1 Baseline Roles

The proposed role set is evaluated below. All eight proposed roles are retained, with responsibilities and boundaries clarified; **System Administrator** and **Recorder** required the most clarification and are addressed explicitly.

| Role | Responsibility | Permission Boundary | Data Content Access? |
|---|---|---|---|
| **System Administrator** | Installs, configures, maintains, and operates the Project Echo deployment itself (infrastructure-level: updates, connectivity settings, backup/restore operations, enabling/disabling the ADR-001 networked-processing opt-in at a technical level). | May configure the platform's technical operation. May **not**, by virtue of this role alone, read meeting recordings, transcripts, summaries, or comments. | **No**, by default. System Administrator is an infrastructure role, not a data-access role, per Section 2 Question 6. Any content access would require a separate, explicitly granted role. |
| **Organization Administrator** | Governs the organization's use of Project Echo: assigns users to roles, configures retention and access-control policy within organization-owned settings, approves boundary-crossing configuration (ADR-001 networked opt-in, ADR-002 boundary exceptions, Controlled Export policy). | May configure organizational policy and role assignments. May **not** unilaterally read all meeting content by default — content access still follows the Meeting Owner/Reviewer/Approver/Knowledge Consumer assignment below, unless the organization explicitly also assigns one of those roles to the same individual. | **Not by default** — see previous column. Combining this role with a content-access role is an organizational choice, not a product default, and should be visible in audit records when it occurs. |
| **Meeting Owner** | Accountable for a specific meeting's record; initiates or authorizes capture, assigns Reviewers/Approvers for that meeting, monitors workflow progress. | Full read/edit access scoped to meetings they own. Cannot alter organization-wide policy (that is Organization Administrator's boundary). | Yes, scoped to meetings they own. |
| **Recorder** | Performs the technical act of starting/stopping capture for a specific meeting (may be the same individual as Meeting Owner, or a distinct participant/assistant delegated to do so). | May initiate/stop capture for a meeting they are authorized to record. Does not, by virtue of this role alone, gain review, approval, deletion, or export authority over the resulting record. | Limited — access to the raw capture only to the extent needed to confirm capture succeeded; not automatically granted full transcript/review access. |
| **Reviewer** | Performs detailed transcript correction, comments, revision comparison, and change tracking, per the Review Workflow. | Full read/edit access to transcripts assigned to them for review. Cannot move a transcript to Approved (that is the Approver's boundary) and cannot alter retention/export policy. | Yes, scoped to meetings assigned to them for review. |
| **Approver** | Holds authority to move a transcript from Reviewed to Approved, finalizing it as an organizational record. | May approve or return a transcript for further review. Should not also be the sole Reviewer of the same transcript by default, per separation of duties (Section 4.3) — an organization may combine these roles only as an explicit, documented exception. | Yes, scoped to transcripts submitted for their approval. |
| **Knowledge Consumer** | Searches, reads, and makes use of Approved/Archived meeting records they did not create or review. | Read-only access to records the organization's access-control configuration makes visible to them. No edit, approval, deletion, or export authority by default. | Yes, but read-only and scoped to Approved/Archived records made visible to them. |
| **Auditor** | Reviews audit logs, access records, and consequential actions (approvals, exports, deletions, role/policy changes) for compliance and oversight purposes. | Read-only access to audit trails and metadata about actions taken. Does **not** by default gain read access to meeting content itself (recordings, transcript text, summaries) — auditing *who did what* does not require reading *what was discussed*, unless explicitly and separately granted. | **No, by default** — access is to audit metadata, not meeting content, unless explicitly and separately granted (e.g., for a specific investigation, itself an auditable action). |

### 4.2 Delegation Principles

1. All role assignment authority originates from the **Organization Administrator**, consistent with ADR-003's "organization owns, users act under delegated authority" model. No role is self-assignable by a user.
2. **System Administrator** authority is delegated by the organization (or, in an on-premises deployment, is a function of the organization's own IT governance) but is structurally separate from Organization Administrator authority — the two may be held by different individuals, and best practice (to be reflected in `SecurityRequirements.md`) is that they are.
3. Role assignments are scoped — a user may hold a role (e.g., Reviewer) for specific meetings/transcripts without holding it organization-wide, except where the organization explicitly grants a broader scope.
4. Delegation is always visible and auditable: every role assignment, grant, or revocation is itself a logged, attributable action (see Section 4.4).

### 4.3 Separation of Duties (Mandatory)

The following separations are **structural product guarantees**, not organization-configurable defaults, consistent with the least-privilege and separation-of-duties principles:

1. **System Administrator ≠ implicit content access.** Infrastructure administration must never, by itself, grant meeting content read access.
2. **Reviewer and Approver should not be the same individual for the same transcript by default.** An organization may configure an explicit exception (e.g., for very small teams), but this exception must be a deliberate, documented configuration, not the default behavior, and should be flagged as elevated risk wherever it is enabled.
3. **Auditor must not also hold System Administrator, Organization Administrator, Meeting Owner, Reviewer, or Approver authority over the same scope they audit**, to preserve independence of audit review. An Auditor auditing an organization's own administrators must not be one of those administrators.
4. **Organization Administrator's policy-configuration authority is separate from Meeting Owner/Reviewer/Approver's content authority by default**, per the table in Section 4.1 — combining them is possible but must be an explicit, visible exception, not an implicit consequence of holding the Organization Administrator role.

### 4.4 Audit Expectations

1. Every role assignment, grant, revocation, and exception (e.g., a Reviewer/Approver combination per Section 4.3.2) must be logged with the acting Organization Administrator's identity, the affected user, the role, the scope, and a timestamp.
2. Every consequential content action (approval, deletion, export, boundary-crossing configuration change per ADR-001/ADR-002) must be logged with the acting user's identity, role at time of action, and scope.
3. Auditors must be able to review these logs without needing, and without automatically gaining, read access to the underlying meeting content itself (Section 4.1, Auditor row).
4. Audit logs themselves must be protected against modification or deletion by the roles they record — including System Administrators and Organization Administrators — consistent with least privilege; the specific technical mechanism for this is deferred to `03-Architecture/SecurityArchitecture.md`.

### 4.5 Relationship Between Technical Administrators and Data Access

Per Section 4.1 and Section 4.3.1: **System Administrator status does not imply data content access.** This directly answers Section 2's Question 6. Administering the platform (updates, connectivity, backup/restore, technical enablement of ADR-001's networked-processing opt-in) is treated as operationally necessary but conceptually distinct from reading organizational meeting content. Where a System Administrator also needs content access (e.g., for a specific support or investigation task), this must be an explicit, separately granted, and audited role assignment — never an inherent property of the System Administrator role.

## 5. Rationale

This decision resolves AR-004, AR-023, and AR-046 by converting the narratively described Direct User and Organizational Authority stakeholders (`Stakeholders.md`) into a bounded, structurally-safe authorization model consistent with the principles explicitly required by this task: least privilege (each role's permissions are scoped to what it needs), separation of duties (Section 4.3's mandatory separations), human accountability (every role's actions are attributable and auditable, consistent with the Human Authority commitment), POPIA alignment (auditability and bounded access support demonstrable accountability for personal information handling), and organization-controlled authority (all delegation originates from the Organization Administrator, consistent with ADR-003).

Retaining a fixed baseline role taxonomy (Option C) rather than either extreme (Option A's single role or Option B's fully custom roles) ensures Project Echo itself guarantees a governable minimum, while still letting each organization decide who fills each role and at what scope — matching the isolated, organization-controlled deployment model already established in ADR-002.

## 6. Consequences

1. `02-Requirements/FunctionalRequirements.md` must define the review workflow's state transitions (Draft → Reviewed → Approved → Archived) in terms of these roles — e.g., only a Reviewer may move Draft → Reviewed, only an Approver may move Reviewed → Approved.
2. `02-Requirements/SecurityRequirements.md` must specify the enforcement and audit-log requirements implied by Sections 4.3 and 4.4 as testable requirements.
3. `02-Requirements/PrivacyRequirements.md` must reference this role model when defining who may fulfill data-subject requests (building on ADR-003 §4.10).
4. Future `03-Architecture/SecurityArchitecture.md` must design a technical authorization mechanism capable of expressing scoped role assignments (per-meeting/per-transcript, not only organization-wide) and the mandatory separations in Section 4.3 — this ADR does not select that mechanism.
5. `04-Design/` work on the review workflow UI must make role, scope, and any active separation-of-duties exception clearly visible to users, consistent with the Transparency commitment.
6. Combining roles (e.g., Reviewer+Approver) is now explicitly possible but must always be a visible, audited exception — this must be reflected in both requirements and UX design, not treated as an edge case to handle later.

## 7. Risks

| Risk | Likelihood | Impact | Notes |
|---|---|---|---|
| Small organizations/teams may find the mandatory Reviewer/Approver separation (Section 4.3.2) impractical for very small meetings and lean on the "explicit exception" path routinely, eroding its intended rarity. | Medium | Medium | `FunctionalRequirements.md` and UX design should make the exception state visibly distinct (e.g., a persistent indicator), not a one-time silent toggle, to preserve its intended weight. |
| System Administrator/content-access separation (Section 4.5) may create friction for legitimate support scenarios (e.g., diagnosing a corrupted transcript) if the separately-granted-access path is too slow or cumbersome. | Medium | Medium | Must be addressed as a specific, expedited-but-still-audited workflow in `FunctionalRequirements.md`, not left unspecified. |
| The baseline role taxonomy, being fixed at product level, may not perfectly fit every adopting organization's internal structure. | Medium | Low | Organizations retain flexibility in *assignment* and *scope*, which should absorb most structural variation; a future ADR amendment remains available if a genuine gap is found. |
| Auditor independence (Section 4.3.3) may be difficult for very small organizations to staff (i.e., finding a distinct individual who is not also an administrator). | Low | Medium | To be addressed as an organizational deployment consideration in `08-Operations/AdministratorGuide.md` (pending), not a reason to weaken the separation itself. |

## 8. Related Requirements

This decision is a direct input to the following pending documents, which must not contradict it:

- `02-Requirements/FunctionalRequirements.md`
- `02-Requirements/SecurityRequirements.md`
- `02-Requirements/PrivacyRequirements.md`
- `02-Requirements/UXRequirements.md`
- (Future) `03-Architecture/SecurityArchitecture.md`
- (Future) `04-Design/UXPrinciples.md`
- (Future) `08-Operations/AdministratorGuide.md`

## 9. Assumptions Updated

The following entries in `00-Governance/AssumptionsRegister.md` are resolved by this decision and must be updated to Resolution Status **Resolved**, with a cross-reference to `ADR-004`:

- **AR-004** — RBAC/permission model for the review workflow is now defined per Section 4.1 and 4.3.
- **AR-023** — Meeting Owner permissions and configurability are now defined per Section 4.1.
- **AR-046** — Default deletion/export authority is now attributable to Organization Administrator (policy/assignment authority) in coordination with Meeting Owner/Approver (content-level authority), per Section 4.1; organizations configure the specific default within this structure.

The following entries are **partially informed** but remain Open:

- **AR-040** (`Personas.md`) — whether Meeting Owner/Reviewer/Approver are typically the same or distinct individuals remains an organizational choice under this model (Section 4.3.2 allows but discourages combination); still open at the level of expected real-world usage patterns.

The following new open items are introduced by this decision and must be added to `AssumptionsRegister.md`:

- The specific technical authorization mechanism capable of expressing scoped, per-meeting role assignment is not yet defined (deferred to `SecurityArchitecture.md`).
- The "expedited but audited" support-access workflow for System Administrators needing occasional content access is not yet defined (deferred to `FunctionalRequirements.md`).
- Whether/how very small organizations satisfy Auditor independence (Section 4.3.3) is not yet defined (deferred to `AdministratorGuide.md`).

---

*End of Document — PEKB-00-GOV-013 — ADR-004 — Access Control (RBAC) Model — PE-2026.001-ZM*
