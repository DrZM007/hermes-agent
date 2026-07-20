# Project Echo — Stakeholders

## Document Metadata

| Field | Value |
|---|---|
| Document ID | PEKB-01-PRD-004 |
| Document Title | Stakeholders |
| PEKB Section | 01-Product |
| Version | 0.1.0 |
| Status | Draft |
| Classification | Internal — Product |
| Owner Role | Product Manager |
| Approval Required From | Principal Software Architect, Security Architect, Privacy Officer |
| Related Documents | Vision.md, BusinessCase.md, Scope.md, Personas.md |
| Original Creator | Dr Ziyaad Moolla |
| Creator ID | ZM |
| Document Provenance | PE-2026.001-ZM |

---

## 1. Purpose of This Document

This document identifies the stakeholder groups affected by, or with authority over, Project Echo — distinct from `Personas.md`, which describes individual end-user archetypes in behavioral detail. Stakeholders here include groups who may never directly use the product interface (e.g., data subjects, compliance functions, IT departments) but whose interests must be accounted for in product and governance decisions.

## 2. Stakeholder Categories

Stakeholders are grouped into four categories: Direct Users, Organizational Authorities, Data Subjects, and Governance/Engineering Roles. The latter category is already defined in `00-Governance/ProjectConstitution.md` §4 and is referenced, not redefined, here.

## 3. Direct Users

| Stakeholder | Description | Primary Interest |
|---|---|---|
| Meeting Participant (as user) | An individual who attends and/or is recorded in a meeting captured by Project Echo, when also using the platform to view or interact with its output. | Accurate representation of their contribution; confidence that content is handled appropriately. |
| Meeting Owner | The individual accountable for a given meeting's record within Project Echo (per `00-Governance/Glossary.md` §4). Precise permissions are an open item (AR-004, AR-023). | Efficient, trustworthy conversion of a meeting into an approved organizational record. |
| Transcript Reviewer | A user (which may or may not be the Meeting Owner) responsible for correcting, commenting on, and progressing a transcript through the review workflow. | Fast, low-friction correction and review tooling; confidence that edits are tracked and reversible. |
| Approver | A user with authority to move a transcript to Approved status. May be the same individual as Meeting Owner or Transcript Reviewer, or a distinct role — not yet finalized (AR-004). | Confidence that the record is accurate and organizationally final before approving. |
| Knowledge Consumer | A user who later searches, reads, or otherwise makes use of previously approved and archived meeting records, without having attended the original meeting. | Ability to find and trust historical organizational knowledge. |

## 4. Organizational Authorities

| Stakeholder | Description | Primary Interest |
|---|---|---|
| IT Administrator | Responsible for deploying, configuring, and maintaining Project Echo within an adopting organization's managed environment. | Predictable, low-friction deployment consistent with existing IT policy (per `00-Governance/ProjectIntent.md` "Target Environment Constraints"). |
| Security Function | Responsible for assessing and approving Project Echo's security posture within the adopting organization. | Verifiable adherence to the Security by Design commitment; a defined threat model and control set. |
| Privacy/Compliance Function | Responsible for ensuring the adopting organization's use of Project Echo aligns with applicable privacy obligations (e.g., POPIA-aligned principles). | Data minimization, lawful handling, auditability, and defined retention. |
| Organizational Leadership / Sponsor | Accountable for the decision to adopt and continue investing in Project Echo within the organization. | Demonstrable value per `BusinessCase.md`, and confidence that adoption does not create organizational risk. |

## 5. Data Subjects

| Stakeholder | Description | Primary Interest |
|---|---|---|
| Meeting Participant (as data subject) | Any individual whose voice, speech content, or identity is captured within a meeting, regardless of whether they separately use Project Echo as a Direct User. | Their personal information is handled per applicable privacy principles, with appropriate rights of access, correction, and — where applicable — deletion. |
| Third Party Referenced in Meeting Content | An individual discussed within a meeting's content but not present as a participant (e.g., a client, candidate, or colleague mentioned by name). | Not yet addressed at requirements level whether/how their interests are protected — see Section 7 (Open Items). |

Data subject rights mechanisms are not yet defined in requirements and are tracked in `00-Governance/AssumptionsRegister.md` (AR-006).

## 6. Governance and Engineering Roles

The eleven governance/engineering roles that must consider every significant Project Echo decision are defined authoritatively in `00-Governance/ProjectConstitution.md` §4 (Principal Software Architect, Product Manager, Security Architect, Privacy Officer, AI/ML Architect, UX Lead, Accessibility Specialist, Database Architect, QA Lead, DevOps/Deployment Engineer, Technical Documentation Lead). They are stakeholders in the sense of holding decision-making and review authority over the product, and are not redefined here to avoid duplication per `00-Governance/DocumentStandards.md` §5.

## 7. Open Items

1. Whether Third Parties Referenced in Meeting Content (Section 5) require distinct product-level protections beyond the participant-focused privacy mechanisms already anticipated — not yet addressed in requirements.
2. Whether "Organizational Leadership / Sponsor" requires distinct reporting/oversight features, or is served entirely by existing audit and export capabilities.
3. Whether an external stakeholder category (e.g., regulators, external auditors) needs formal representation, given the compliance orientation of the product.

These are tracked in `00-Governance/AssumptionsRegister.md`.

## 8. Relationship to Other PEKB Documents

- `00-Governance/ProjectConstitution.md` §4 is the authoritative source for governance/engineering roles referenced in Section 6.
- `Personas.md` elaborates the Direct Users category (Section 3) into detailed behavioral archetypes.
- `Scope.md` and `Vision.md` inform which stakeholder interests are addressed by current product scope versus deferred.

---

*End of Document — PEKB-01-PRD-004 — Project Echo Stakeholders — PE-2026.001-ZM*
