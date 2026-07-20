# Project Echo — Assumptions Register

## Document Metadata

| Field | Value |
|---|---|
| Document ID | PEKB-00-GOV-009 |
| Document Title | Assumptions Register |
| PEKB Section | 00-Governance |
| Version | 0.5.0 |
| Status | Draft |
| Classification | Internal — Governance |
| Owner Role | Principal Software Architect |
| Approval Required From | Product Manager, Security Architect, Privacy Officer |
| Related Documents | All PEKB documents; Project Echo Foundation Review v0.1 |
| Original Creator | Dr Ziyaad Moolla |
| Creator ID | ZM |
| Document Provenance | PE-2026.001-ZM |

---

## 1. Purpose of This Document

Per `EngineeringPrinciples.md` §4, assumptions made to allow interim progress must always be recorded, never silently embedded in design or documentation. This document is the single authoritative register of every such assumption made across the PEKB to date. It exists so that no assumption is lost, forgotten, or mistaken for an approved decision.

An entry remains in this register until it is formally resolved (converted into an approved requirement, decision, or document) and its Resolution Status is updated accordingly. Resolved entries are retained for historical traceability, not deleted.

## 2. Register Conventions

| Field | Meaning |
|---|---|
| ID | Unique register entry identifier: `AR-###` |
| Assumption | The specific assumption made |
| Source | The PEKB document or activity where the assumption originated |
| Impact | What is affected if the assumption is wrong or unresolved |
| Risk Level | High / Medium / Low, per Section 3 |
| Resolution Status | Open / In Progress / Resolved |
| Owner for Resolution | Role accountable for resolving the assumption |

### 3. Risk Level Definitions

| Level | Definition |
|---|---|
| High | Could invalidate architecture already proposed, create a security/privacy exposure, or block multiple downstream documents if resolved incorrectly. |
| Medium | Affects a specific document or capability but is contained and correctable without wide rework. |
| Low | Editorial, terminological, or low-consequence; correction is straightforward whenever addressed. |

---

## 4. Assumptions from Project Echo Foundation Review v0.1

| ID | Assumption | Source | Impact | Risk Level | Resolution Status | Owner for Resolution |
|---|---|---|---|---|---|---|
| AR-001 | "Core functionality" for the Offline First principle has not been scoped; it is assumed AI transcription itself may need to run offline in v1 unless a hybrid model is explicitly approved. | Foundation Review v0.1, Required Decision #1 | Determines AI/ML architecture, model size/footprint, network policy, and privacy posture. | High | **Resolved — see ADR-001** | AI/ML Architect + Privacy Officer |
| AR-002 | No deployment/tenancy model (on-prem per-org vs. hosted multi-tenant) has been confirmed; architecture work assumes this is still undecided. | Foundation Review v0.1, Required Decision #2 | Blocks `SystemArchitecture.md`, `DeploymentArchitecture.md`, `DatabaseArchitecture.md`. | High | **Resolved — see ADR-002** | Principal Software Architect + DevOps/Deployment Engineer |
| AR-003 | No desktop technology stack has been chosen; it is assumed any stack considered must operate without administrator rights and without Docker. | Foundation Review v0.1, Required Decision #3 | Blocks `DesktopArchitecture.md` and `ReleaseStrategy.md`; risk of costly rework if assumed incorrectly. | High | Open | Principal Software Architect + DevOps/Deployment Engineer |
| AR-004 | No RBAC/permission model exists for the Draft → Reviewed → Approved → Archived review workflow; it is assumed roles are configurable per organization rather than fixed, pending confirmation. | Foundation Review v0.1, Required Decision #4 | Affects `FunctionalRequirements.md` and `UXRequirements.md`. | Medium | **Resolved — see ADR-004** | Product Manager + Security Architect |
| AR-005 | No formal data classification scheme exists for product data (meeting audio, transcripts, comments, exports); assumed to require definition before retention/access-control requirements can be finalized. | Foundation Review v0.1, Recommendation #3 | Blocks `SecurityRequirements.md`, `PrivacyRequirements.md`, `RetentionPolicy.md`. | High | Open | Privacy Officer + Database Architect |
| AR-006 | No POPIA-specific consent or data-subject-rights mechanism (access/correction/deletion requests from meeting participants) has been defined; assumed to be required given POPIA-alignment goal. | Foundation Review v0.1, Required Decision #6 | Blocks `PrivacyRequirements.md`, `POPIAFramework.md`. | High | Open — partially informed by ADR-003 §4.10 (ownership/responsibility framing established; specific mechanism still undefined) | Privacy Officer |
| AR-007 | No update/patch delivery mechanism has been defined for environments where users cannot install software themselves; assumed IT-managed distribution (e.g., enterprise software deployment tooling) is likely but unconfirmed. | Foundation Review v0.1, Required Decision #7 | Blocks `DeploymentArchitecture.md`, `DeploymentGuide.md`. | Medium | Open | DevOps/Deployment Engineer |
| AR-008 | No named approval authority has been defined for the AI Improvement Loop (who approves detected-correction-driven model/behavior updates); assumed to require a specific named role, not an ad hoc process. | Foundation Review v0.1, Required Decision #8 | Blocks `AIRequirements.md`, `AIArchitecture.md`. | Medium | Open | Product Manager + AI/ML Architect |
| AR-009 | No threat model exists yet; all security controls proposed in future documents will be provisional until `ThreatModel.md` is authored. | Foundation Review v0.1, Security Risks | Blocks `SecurityArchitecture.md`, `SecurityControls.md`. | High | Open | Security Architect |
| AR-010 | No encryption-at-rest / key management strategy has been defined for recordings and transcripts on managed laptops, including lost/stolen-device handling. | Foundation Review v0.1, Security Risks | Blocks `SecurityArchitecture.md`, `SecurityRequirements.md`. | High | Open | Security Architect |
| AR-011 | No persona definitions exist; assumed a range of technical skill levels must be designed for per stated UX principles, without specific personas to design against yet. | Foundation Review v0.1, UX Risks | Blocks `Personas.md`, `UXRequirements.md`, `04-Design/` documents. | Medium | Open | Product Manager + UX Lead |
| AR-012 | Speaker identification is assumed to potentially involve persistent voice/biometric-adjacent data, which raises privacy sensitivity beyond ordinary transcript text; not yet addressed at requirements level. | Foundation Review v0.1, Privacy Risks | Blocks `AIRequirements.md`, `PrivacyRequirements.md`. | High | Open | Privacy Officer + AI/ML Architect |

## 5. Assumptions from Governance Document Authoring (Phase 0.1–0.2)

| ID | Assumption | Source | Impact | Risk Level | Resolution Status | Owner for Resolution |
|---|---|---|---|---|---|---|
| AR-013 | Document ID convention (`PEKB-<SectionNumber>-<SectionCode>-<SequenceNumber>`) was invented, as no convention existed previously. | `DocumentStandards.md` §3 | Affects ID stability of every PEKB document; a later change would require renumbering. | Medium | Open (pending confirmation) | Technical Documentation Lead + Principal Software Architect |
| AR-014 | Section codes for all 12 PEKB sections (GOV, PRD, REQ, ARC, DSN, ENG, SEC, PRIV, OPS, TST, DOC, RDM) were assigned by the Technical Documentation Lead role in `Glossary.md` §3, without independent confirmation from other sections' future owners. | `Glossary.md` §3 | Low risk of collision if changed early; higher cost if changed after multiple documents in a section are authored. | Medium | Open | Technical Documentation Lead |
| AR-015 | Document status lifecycle (Draft / In Review / Approved / Deprecated) and its transition rules were newly authored in `RevisionPolicy.md`, as no lifecycle previously existed. | `RevisionPolicy.md` §2 | Governs whether any PEKB document may be treated as authoritative; incorrect design could allow premature reliance on unapproved content. | Medium | Open | Principal Software Architect |
| AR-016 | Version numbering scheme (semantic-style MAJOR.MINOR.PATCH with defined increment triggers) was newly authored, not previously specified. | `RevisionPolicy.md` §3 | Affects how future changes are classified and reviewed. | Low | Open | Technical Documentation Lead |
| AR-017 | The mechanism linking a software release to the specific Approved PEKB document versions that governed it (e.g., a per-release manifest) is not yet defined; `RevisionPolicy.md` §6 flags this explicitly rather than inventing a mechanism. | `RevisionPolicy.md` §6 | Affects traceability between software releases and governing documentation — a core traceability requirement. | Medium | Open | Principal Software Architect + Technical Documentation Lead |
| AR-018 | Approval routing (which named role approves which document) in each document's metadata block was assigned by inferring the most relevant role, not confirmed against an actual organizational RACI. | All Phase 0.1–0.2 documents | If actual approvers differ, metadata blocks across multiple documents require correction. | Low | Open | Principal Software Architect |
| AR-019 | The specific technical mechanism for artifact-level provenance display (e.g., "About" panel vs. manifest file) was deliberately left undefined in `CreatorProvenanceFramework.md` §4.5 and deferred to future architecture documents, rather than assumed. | `CreatorProvenanceFramework.md` §4.5 | Low risk now; must be resolved before `DeploymentArchitecture.md` is finalized. | Low | Open | Principal Software Architect + DevOps/Deployment Engineer |
| AR-020 | It is assumed that no individual has yet been named to fill the 11 governance roles (Principal Architect, Product Manager, etc.) as real people — all approvals referenced in metadata are role-based placeholders. | All Phase 0.1–0.2 documents | Approval steps in `RevisionPolicy.md` cannot actually be executed until roles are staffed or explicitly assigned to available personnel. | Medium | Open | Product Manager (or organizational sponsor) |

## 6. Terminology Gaps Carried from Glossary.md

The following are formally tracked here as required by `Glossary.md` §8; see that document for full context. Each is registered as its own entry to ensure independent resolution tracking.

| ID | Assumption / Gap | Source | Impact | Risk Level | Resolution Status | Owner for Resolution |
|---|---|---|---|---|---|---|
| AR-021 | Requirement ID format is undefined. | `Glossary.md` §8.1 | Blocks consistent traceability referencing in `02-Requirements/`. | Medium | Open | Technical Documentation Lead |
| AR-022 | "Meeting" scope boundaries (duration limits, multi-session handling) undefined. | `Glossary.md` §8.2 | Blocks `FunctionalRequirements.md`. | Low | Open | Product Manager |
| AR-023 | "Meeting Owner" permissions and configurability undefined. | `Glossary.md` §8.3 | Overlaps AR-004. | Medium | **Resolved — see ADR-004** | Product Manager + Security Architect |
| AR-024 | Organization/tenancy isolation model undefined. | `Glossary.md` §8.4 | Overlaps AR-002. | High | **Resolved — see ADR-002** | Principal Software Architect |
| AR-025 | Hybrid Processing adoption and governance undefined. | `Glossary.md` §8.5 | Overlaps AR-001. | High | **Resolved — see ADR-001** | AI/ML Architect + Privacy Officer |
| AR-026 | Speaker Identification's biometric persistence undefined. | `Glossary.md` §8.6 | Overlaps AR-012. | High | Open | Privacy Officer + AI/ML Architect |
| AR-027 | Access Control model (RBAC/ABAC/other) undefined. | `Glossary.md` §8.7 | Blocks `SecurityRequirements.md`. | Medium | Open | Security Architect |
| AR-028 | Data Classification scheme for product data undefined. | `Glossary.md` §8.8 | Overlaps AR-005. | High | Open | Privacy Officer + Database Architect |

## 7. Assumptions from Product Definition Authoring (Phase 1)

| ID | Assumption | Source | Impact | Risk Level | Resolution Status | Owner for Resolution |
|---|---|---|---|---|---|---|
| AR-029 | Vision-level success metrics are stated only directionally (e.g., "reduced knowledge loss"); no quantitative targets exist yet. | `Vision.md` §8 | Blocks measurable acceptance criteria in `02-Requirements/AcceptanceCriteria.md`. | Medium | Open | Product Manager |
| AR-030 | Relative priority between the "trust" attributes (predictability, restraint, accountability) if they conflict during a design trade-off is undefined. | `Vision.md` §8 | Could affect architecture/UX trade-off decisions where these attributes compete. | Low | Open | Principal Software Architect + Product Manager |
| AR-031 | No market sizing, competitive analysis, or financial projections exist; `BusinessCase.md` is qualitative only. | `BusinessCase.md` §8 | Limits ability to justify investment quantitatively; may be required before funding/resourcing decisions. | Low | Open | Product Manager |
| AR-032 | Whether a dedicated financial/investment planning artifact is needed beyond the current PEKB structure is unresolved; none has been added. | `BusinessCase.md` §8 | Would require a structural PEKB proposal per governance rules if needed. | Low | Open | Product Manager + Principal Software Architect |
| AR-033 | Whether third-party meeting-platform ingestion will ever be added to scope, and under what governance conditions, is unresolved. | `Scope.md` §4, §7 | Affects future scope decisions and integration architecture. | Low | Open | Product Manager |
| AR-034 | Capability-level boundaries within "meeting insights and search assistance" are named at scope level only, not yet specified. | `Scope.md` §7 | Blocks precise requirements definition for this capability area. | Medium | Open | Product Manager + AI/ML Architect |
| AR-035 | Whether speaker identification must be configurable/optional per organization, pending AR-012/AR-026 resolution, is unconfirmed. | `Scope.md` §7 | Affects `FunctionalRequirements.md` and `AIRequirements.md`. | Medium | Open | Privacy Officer + Product Manager |
| AR-036 | Whether Third Parties Referenced in Meeting Content require distinct product-level privacy protections beyond participant-focused mechanisms is unaddressed. | `Stakeholders.md` §7 | Affects `PrivacyRequirements.md` scope. | Medium | Open — partially informed by ADR-003 §4.10 (data-subject rights preserved independent of ownership); specific protections still undefined | Privacy Officer |
| AR-037 | Whether "Organizational Leadership / Sponsor" needs distinct reporting/oversight features beyond existing audit/export capability is unconfirmed. | `Stakeholders.md` §7 | Low-impact scope question; may affect `FunctionalRequirements.md`. | Low | Open | Product Manager |
| AR-038 | Whether an external stakeholder category (regulators, external auditors) needs formal representation is unresolved. | `Stakeholders.md` §7 | Could affect audit/export/compliance requirements. | Low | Open | Privacy Officer |
| AR-039 | Personas (`Personas.md`) are illustrative constructs derived from stated principles, not from confirmed user research; all persona detail requires future validation. | `Personas.md` §1, §8 | Design decisions based on unvalidated personas carry a risk of misdirected UX investment. | Medium | Open | Product Manager + UX Lead |
| AR-040 | Whether Meeting Owner, Transcript Reviewer, and Approver are typically distinct individuals or the same person in multiple roles is unconfirmed. | `Personas.md` §8 | Affects UX flow design and RBAC model (overlaps AR-004, AR-023). | Medium | Open — partially informed by ADR-004 §4.3.2 (combination permitted only as a visible, audited exception); see also AR-047 | Product Manager + UX Lead |
| AR-041 | Whether IT Administrator, Security Function, and Privacy/Compliance Function require dedicated administrative-console personas is deferred pending future scoping of administrative functionality. | `Personas.md` §8 | Affects future `04-Design/` and `02-Requirements/` work for admin-facing capability. | Low | Open | Product Manager + UX Lead |

## 7a. Assumptions Introduced by Architecture Decision Records (ADR-001, ADR-002)

| ID | Assumption | Source | Impact | Risk Level | Resolution Status | Owner for Resolution |
|---|---|---|---|---|---|---|
| AR-042 | Specific on-device resource/performance thresholds for the offline AI processing path are not yet defined. | ADR-001 §9 | Blocks `NonFunctionalRequirements.md`. | Medium | Open | AI/ML Architect |
| AR-043 | The specific approval/audit mechanism for enabling the optional networked AI processing path is not yet defined. | ADR-001 §9 | Blocks `PrivacyRequirements.md`, `SecurityRequirements.md`. | Medium | Open | Privacy Officer + Security Architect |
| AR-044 | Specific deployment topology (on-premises single-server vs. dedicated cloud instance per organization vs. other) is not yet defined. | ADR-002 §9 | Blocks `03-Architecture/DeploymentArchitecture.md`. | Medium | Open | Principal Software Architect + DevOps/Deployment Engineer |
| AR-045 | The precise technical definition of the per-organization "isolation boundary" (what constitutes a violation, how it is enforced/tested) is not yet defined. | ADR-002 §9 | Blocks `SecurityRequirements.md` and `DeploymentArchitecture.md`. | High | Open | Security Architect |
| AR-046 | Who, specifically, within an adopting organization holds default deletion and export authority (e.g., IT Administrator, a named Data Owner role, or configurable per organization) is not yet defined. | ADR-003 §9 | Blocks `FunctionalRequirements.md`; overlaps AR-004/AR-023 (RBAC model). | Medium | **Resolved — see ADR-004** | Product Manager + Security Architect |
| AR-047 | Whether Meeting Owner, Reviewer, and Approver are typically the same or distinct individuals in real-world usage remains an organizational choice under the ADR-004 role model; not resolved at the level of expected usage patterns. | ADR-004 §9 (partially informs AR-040) | Affects UX flow design assumptions and how prominently the Reviewer/Approver combination exception (ADR-004 §4.3.2) should be surfaced. | Low | Open | Product Manager + UX Lead |
| AR-048 | The specific technical authorization mechanism capable of expressing scoped, per-meeting role assignment is not yet defined. | ADR-004 §9 | Blocks `03-Architecture/SecurityArchitecture.md`. | Medium | Open | Security Architect |
| AR-049 | The "expedited but audited" support-access workflow allowing a System Administrator occasional, logged content access is not yet defined. | ADR-004 §9 | Blocks `FunctionalRequirements.md`. | Medium | Open | Security Architect + Product Manager |
| AR-050 | How very small organizations satisfy Auditor independence (a distinct individual who is not also an administrator) is not yet defined. | ADR-004 §9 | Blocks `08-Operations/AdministratorGuide.md`. | Low | Open | Product Manager |

## 8. Register Maintenance

1. Every new PEKB document authored must be checked for assumptions before being finalized; any found must be added here immediately, not deferred.
2. An entry's Resolution Status moves to **In Progress** once work has begun on the specific document/decision that resolves it, and to **Resolved** only once that document reaches Approved status per `RevisionPolicy.md`.
3. Duplicate assumptions surfaced from different sources (e.g., AR-001 and AR-025) are cross-referenced rather than merged, so each source document's origin is preserved.
4. This register does not itself carry decision-making authority — it tracks open questions and routes them to the correct owner; the owner's resolving document is the authoritative source once approved.

## 9. Relationship to Other PEKB Documents

- `EngineeringPrinciples.md` §4 mandates this register's existence and use.
- `Glossary.md` §8 seeds the terminology-specific entries in Section 6 of this register.
- Project Echo Foundation Review v0.1 seeds the risk-derived entries in Section 4.
- `01-Product/` documents (Vision, BusinessCase, Scope, Stakeholders, Personas) seed the entries in Section 7.
- `Decisions/ADR-001-AIProcessingModel.md` and `Decisions/ADR-002-DeploymentModel.md` resolve AR-001, AR-002, AR-024, AR-025 and seed the new entries in Section 7a.
- `Decisions/ADR-003-DataOwnershipGovernance.md` partially informs AR-006 and AR-036 and seeds AR-046 in Section 7a.
- `Decisions/ADR-004-AccessControlRBACModel.md` resolves AR-004, AR-023, and AR-046, partially informs AR-040, and seeds AR-047–AR-050 in Section 7a.
- Resolution of any entry here should result in an update to the relevant PEKB document and a status change in this register — never a resolution recorded only in this register without a corresponding document update.

---

*End of Document — PEKB-00-GOV-009 — Project Echo Assumptions Register — PE-2026.001-ZM*
