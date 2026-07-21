# ADR-003 — Data Ownership Governance

## Document Metadata

| Field | Value |
|---|---|
| Document ID | PEKB-00-GOV-012 |
| Decision ID | ADR-003 |
| Document Title | Data Ownership Governance |
| PEKB Section | 00-Governance/Decisions |
| Version | 0.2.0 |
| Status | Accepted |
| Classification | Internal — Governance |
| Owner Role | Privacy Officer |
| Approval Required From | Principal Software Architect, Security Architect, Product Manager |
| Related Documents | ProjectConstitution.md, ProjectPhilosophy.md, Scope.md (01-Product), Stakeholders.md (01-Product), ADR-001-AIProcessingModel.md, ADR-002-DeploymentModel.md, AssumptionsRegister.md |
| Original Creator | Dr Ziyaad Moolla |
| Creator ID | ZM |
| Document Provenance | PE-2026.001-ZM |

---

## 1. Context

ADR-001 established that AI processing is offline-by-default with a governed opt-in for networked processing. ADR-002 established that each organization's deployment is isolated by default, with the isolation boundary defined as "the organization's controlled environment." Neither ADR defines *who owns* the data within that boundary, *who is responsible* for it at each stage of its lifecycle, or *who has authority* to delete or export it.

`01-Product/Scope.md` §2 lists retention management, access control, and controlled export as in-scope capabilities, and `01-Product/Stakeholders.md` identifies Meeting Participants (as data subjects), Meeting Owners, Approvers, IT Administrators, and Privacy/Compliance Functions as having distinct interests in this data — but no document yet states who is accountable for that data at each point in its life, nor how Project Echo's own responsibility (as the platform) differs from the adopting organization's responsibility (as data controller/operator) and the individual user's responsibility (as an actor within it).

This gap blocks `02-Requirements/PrivacyRequirements.md`, `02-Requirements/SecurityRequirements.md`, `07-Privacy-Compliance/DataGovernance.md`, and `07-Privacy-Compliance/RetentionPolicy.md`, all of which depend on knowing who owns and who may act on organizational data before their requirements can be written meaningfully.

## 2. Problem

Define, at a strategic governance level (not technical implementation):

1. Who owns recordings, transcripts, summaries, and AI-generated outputs produced within Project Echo?
2. What is the adopting organization's responsibility versus Project Echo's (the platform's) responsibility versus the individual user's responsibility?
3. Who holds authority to delete data, and who holds authority to export it?
4. How does this ownership/responsibility model relate to POPIA-aligned principles already committed to in governance?

This decision does not define technical access-control mechanisms, database schemas, or specific deletion/export tooling — those belong to `03-Architecture/` and `05-Engineering/`, informed by this decision.

## 3. Options Considered

### Option A — Project Echo (the Platform/Vendor) Owns All Processed Data
The platform itself is treated as retaining rights over recordings, transcripts, and derived outputs generated through its processing, analogous to a SaaS provider claiming rights over user-generated content.

- **Pros:** None identified that are consistent with the project's governing principles.
- **Cons:** Directly contradicts the Privacy First commitment and the product's core promise that "meeting data must not leave the organization's controlled environment unless explicitly configured and approved" (`00-Governance/ProjectIntent.md`); contradicts data ownership as a named privacy requirement in `00-Governance/ProjectConstitution.md`; incompatible with ADR-002's isolated-by-default deployment model, which presumes the organization — not the platform — controls its own boundary. Rejected outright.

### Option B — Individual User Owns Their Own Contributions
Each meeting participant or user individually owns the data they personally generated (their spoken contribution, their edits, their comments), with no organizational-level ownership layer.

- **Pros:** Emphasizes individual data-subject rights.
- **Cons:** Unworkable for a meeting record, which is inherently a multi-party artifact — no single participant can meaningfully "own" a transcript of a discussion involving several people; would fragment retention, deletion, and export authority to the point of making organizational record-keeping (the product's core purpose) impossible; does not reflect how meeting records function in a real organizational/employment context, where the organization is typically the record-keeper for business communications. Rejected as impractical and inconsistent with the product's purpose.

### Option C — Organization Owns the Data; Project Echo Is a Processor; Users Act Within Organizational Authority; Individual Data-Subject Rights Are Preserved
The adopting organization owns and is the controller of the meeting data processed through its deployment. Project Echo (the platform/software) acts strictly as a data processor/tool operating within that organization's isolated boundary (per ADR-002), with no independent ownership claim over the data. Individual users (Meeting Owners, Reviewers, Approvers) act with delegated authority granted by the organization, not personal ownership. Meeting participants, as data subjects, retain applicable individual rights (e.g., access, correction, and — where legally applicable — objection/deletion requests) that the organization must be able to honor, distinct from ownership itself.

- **Pros:** Consistent with ADR-002's isolated-deployment model (the organization owns what is inside its own boundary); consistent with the Privacy First and data-ownership commitments already established; reflects a workable, real-world organizational data-controller model; keeps meeting-record-keeping functional while still preserving individual data-subject rights as a distinct, non-ownership concept — directly supporting POPIA-aligned principles.
- **Cons:** Requires precise definition of what "delegated authority" means for each user role (Meeting Owner, Reviewer, Approver) — deferred to `02-Requirements/FunctionalRequirements.md` and the RBAC model still pending resolution (AR-004/AR-023); requires the distinction between "ownership" (organizational) and "data-subject rights" (individual, non-ownership) to be clearly and consistently communicated, or it risks confusing users about what rights they hold.

## 4. Decision

**Project Echo adopts Option C: Organization-Owned Data, Platform-as-Processor, Delegated User Authority, with Preserved Individual Data-Subject Rights.**

Specifically:

1. **Ownership of recordings**: The adopting organization owns all meeting recordings captured through its deployment.
2. **Ownership of transcripts**: The adopting organization owns all transcripts, at every review-workflow state (Draft, Reviewed, Approved, Archived).
3. **Ownership of summaries**: The adopting organization owns all AI-generated and human-approved summaries derived from its meetings.
4. **Ownership of AI-generated outputs**: The adopting organization owns all AI-generated outputs (transcripts, summaries, action items, insights) produced from its data. Project Echo (the platform) claims no ownership interest in any organizational data or in outputs derived from it, consistent with its role as processor, not controller.
5. **Organization responsibility**: The adopting organization is responsible for lawful basis for capture, participant notification/consent practices, configuring access control and retention settings, approving any boundary-crossing configuration (per ADR-001 and ADR-002), and responding to data-subject requests.
6. **Project Echo (platform) responsibility**: Project Echo is responsible for providing the technical means to fulfill the organization's obligations — secure processing, access control enforcement, audit logging, retention enforcement, and controlled export/deletion mechanisms — and for not processing organizational data beyond what the organization has configured and approved (per ADR-001 §4, ADR-002 §4).
7. **User responsibilities**: Individual users (Meeting Owners, Reviewers, Approvers, Knowledge Consumers) act with authority delegated by the organization through its access-control configuration. Users do not personally own the data they interact with; they are accountable for actions taken under their delegated authority (consistent with the Human Authority and Auditability commitments).
8. **Data deletion authority**: Deletion authority rests with the organization (typically exercised through designated administrative or compliance roles, to be specified in `FunctionalRequirements.md`). Individual users may request deletion (e.g., as a data subject), which the organization is responsible for evaluating and fulfilling; Project Echo must provide the technical capability to execute an approved deletion.
9. **Export authority**: Export authority rests with the organization and must follow the Controlled Export governance already established (`01-Product/Scope.md` §2.11), consistent with the boundary-crossing governance defined in ADR-001 and ADR-002. Individual users may only export data to the extent the organization's configuration delegates that authority to them.
10. **Relationship to POPIA**: This ownership model is designed to support POPIA-aligned operation by clearly separating the *organization's* role as the party responsible for lawful processing (analogous to a "responsible party" under POPIA) from *Project Echo's* role as the technical means of processing, while preserving meeting participants' standing to exercise data-subject rights regardless of the ownership structure. This ADR does not itself constitute a legal compliance determination; formal POPIA obligations are addressed in `07-Privacy-Compliance/POPIAFramework.md` (pending).

## 5. Rationale

This decision resolves the ownership gap by aligning it with the deployment isolation already decided in ADR-002 (the organization owns what is inside its own controlled boundary) and the processing governance already decided in ADR-001 (the platform processes data on the organization's behalf and under its configuration, not on its own authority). Treating the organization as owner and Project Echo as processor is the only option consistent with the explicit governance commitments already made — Privacy First, data ownership, and "must not leave the organization's controlled environment unless explicitly configured and approved" — and it preserves a workable path to POPIA alignment by keeping individual data-subject rights conceptually distinct from, and not dependent on, who "owns" the record.

## 6. Consequences

1. `02-Requirements/PrivacyRequirements.md` must specify the mechanisms by which the organization fulfills its responsibilities (Section 4.5) — e.g., consent/notification workflows, data-subject request handling — as product requirements, not merely organizational policy statements.
2. `02-Requirements/SecurityRequirements.md` must specify access-control delegation (Section 4.7) precisely enough to support the "delegated authority, not ownership" model for individual users.
3. `02-Requirements/FunctionalRequirements.md` must define who, organizationally, can exercise deletion and export authority (Section 4.8–4.9) — this is a direct input to the still-pending RBAC decision (AR-004/AR-023).
4. `07-Privacy-Compliance/DataGovernance.md` and `07-Privacy-Compliance/RetentionPolicy.md` must be authored consistent with organization-as-owner; retention and deletion rules are organizational configuration, not platform-wide defaults imposed on all organizations identically (beyond safe minimums, which remain to be defined).
5. `07-Privacy-Compliance/POPIAFramework.md` must build on Section 4.10 to define the formal responsible-party/operator-equivalent relationship in POPIA-specific terms.
6. This decision does not resolve who, specifically, within an organization holds deletion/export authority by default (e.g., IT Administrator vs. a named Data Owner role) — this remains open pending RBAC resolution.

## 7. Risks

| Risk | Likelihood | Impact | Notes |
|---|---|---|---|
| Without a resolved RBAC model (AR-004/AR-023), "delegated authority" remains abstract and could be implemented inconsistently across requirements and architecture work. | Medium | High | Must be resolved before `FunctionalRequirements.md` finalizes deletion/export authority requirements. |
| Users may misunderstand the distinction between "data-subject rights" (individual, preserved) and "ownership" (organizational, not individual), leading to support/trust issues if not clearly communicated in the product itself. | Medium | Medium | Must be addressed in `04-Design/UXPrinciples.md` and `10-Documentation/UserGuide.md` once authored — this is a transparency requirement, not just a legal one. |
| Treating Project Echo strictly as a processor with no data interest could be undermined if a future feature (e.g., cross-organization benchmarking, product analytics) is added without revisiting this ADR. | Low | High | Any such feature must trigger a formal amendment to this ADR before being added to scope, per `00-Governance/RevisionPolicy.md` §5. |

## 8. Related Requirements

This decision is a direct input to the following pending documents, which must not contradict it:

- `02-Requirements/PrivacyRequirements.md`
- `02-Requirements/SecurityRequirements.md`
- `02-Requirements/FunctionalRequirements.md`
- `07-Privacy-Compliance/DataGovernance.md`
- `07-Privacy-Compliance/RetentionPolicy.md`
- `07-Privacy-Compliance/POPIAFramework.md`

## 9. Assumptions Updated

The following entries in `00-Governance/AssumptionsRegister.md` are affected by this decision:

- **AR-006** (POPIA-specific consent/data-subject-rights mechanism) — partially informed by Section 4.10 of this ADR, but remains **Open**: this ADR establishes the ownership/responsibility framing POPIA requirements must build on, but does not itself define the specific consent/rights mechanism.
- **AR-036** (whether Third Parties Referenced in Meeting Content need distinct protections) — partially informed by the data-subject-rights preservation in Section 4.10, but remains **Open** pending `PrivacyRequirements.md`.

The following new open item is introduced by this decision and must be added to `AssumptionsRegister.md`:

- Who, specifically, within an adopting organization holds default deletion and export authority (e.g., IT Administrator, a named Data Owner role, or configurable per organization) is not yet defined; deferred to `FunctionalRequirements.md`, overlapping the still-open RBAC decision (AR-004/AR-023).

---

## Ratification

**Ratified by the Product Owner on 2026-07-20.** Status changed Proposed → Accepted (v0.2.0). This decision is authoritative for all downstream work; amendments follow `RevisionPolicy.md`.

---

*End of Document — PEKB-00-GOV-012 — ADR-003 — Data Ownership Governance — PE-2026.001-ZM*
