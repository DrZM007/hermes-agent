# Project Echo — Assumptions Register

## Document Metadata

| Field | Value |
|---|---|
| Document ID | PEKB-00-GOV-009 |
| Document Title | Assumptions Register |
| PEKB Section | 00-Governance |
| Version | 0.17.0 |
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
| AR-005 | No formal data classification scheme exists for product data (meeting audio, transcripts, comments, exports); assumed to require definition before retention/access-control requirements can be finalized. | Foundation Review v0.1, Recommendation #3 | Blocks `SecurityRequirements.md`, `PrivacyRequirements.md`, `RetentionPolicy.md`. | High | **Resolved — see PrivacyRequirements.md §6 (Data Classification Framework: C1-C4)** | Privacy Officer + Database Architect |
| AR-006 | No POPIA-specific consent or data-subject-rights mechanism (access/correction/deletion requests from meeting participants) has been defined; assumed to be required given POPIA-alignment goal. | Foundation Review v0.1, Required Decision #6 | Blocks `PrivacyRequirements.md`, `POPIAFramework.md`. | High | Open — `PrivacyRequirements.md` §16 defines the requirement (organization must be able to locate/act on subject data) and §10 defines consent-opt-in gating for C3 data; specific process/interface still deferred (see AR-058, AR-062) | Privacy Officer |
| AR-007 | No update/patch delivery mechanism has been defined for environments where users cannot install software themselves; assumed IT-managed distribution (e.g., enterprise software deployment tooling) is likely but unconfirmed. | Foundation Review v0.1, Required Decision #7 | Blocks `DeploymentArchitecture.md`, `DeploymentGuide.md`. | Medium | Open | DevOps/Deployment Engineer |
| AR-008 | No named approval authority has been defined for the AI Improvement Loop (who approves detected-correction-driven model/behavior updates); assumed to require a specific named role, not an ad hoc process. | Foundation Review v0.1, Required Decision #8 | Blocks `AIRequirements.md`, `AIArchitecture.md`. | Medium | In Progress — `AIArchitecture.md` §6 (AI-ARCH-018) recommends a joint AI/ML Architect + Product Manager release-approval authority, structurally separate from the change's producer; awaiting governance sign-off; see also AR-074 | Product Manager + AI/ML Architect |
| AR-009 | No threat model exists yet; all security controls proposed in future documents will be provisional until `ThreatModel.md` is authored. | Foundation Review v0.1, Security Risks | Blocks `SecurityArchitecture.md`, `SecurityControls.md`. | High | **Resolved — see 03-Architecture/ThreatModel.md** | Security Architect |
| AR-010 | No encryption-at-rest / key management strategy has been defined for recordings and transcripts on managed laptops, including lost/stolen-device handling. | Foundation Review v0.1, Security Risks | Blocks `SecurityArchitecture.md`, `SecurityRequirements.md`. | High | Open — substantially advanced by `SecurityArchitecture.md` §5 (envelope key hierarchy, per-org/per-device KEK scoping, organization-controlled escrow); specific algorithm selection remains deferred to `05-Engineering/` | Security Architect |
| AR-011 | No persona definitions exist; assumed a range of technical skill levels must be designed for per stated UX principles, without specific personas to design against yet. | Foundation Review v0.1, UX Risks | Blocks `Personas.md`, `UXRequirements.md`, `04-Design/` documents. | Medium | Open | Product Manager + UX Lead |
| AR-012 | Speaker identification is assumed to potentially involve persistent voice/biometric-adjacent data, which raises privacy sensitivity beyond ordinary transcript text; not yet addressed at requirements level. | Foundation Review v0.1, Privacy Risks | Blocks `AIRequirements.md`, `PrivacyRequirements.md`. | High | Open — see AR-026 note (`PrivacyRequirements.md` §12) | Privacy Officer + AI/ML Architect |

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
| AR-026 | Speaker Identification's biometric persistence undefined. | `Glossary.md` §8.6 | Overlaps AR-012. | High | Open — `PrivacyRequirements.md` §12 classifies persistent biometric speaker recognition as C3/opt-in-only; whether it is offered at all in initial release remains undecided (see AR-060) | Privacy Officer + AI/ML Architect |
| AR-027 | Access Control model (RBAC/ABAC/other) undefined. | `Glossary.md` §8.7 | Blocks `SecurityRequirements.md`. | Medium | **Resolved — see ADR-004** | Security Architect |
| AR-028 | Data Classification scheme for product data undefined. | `Glossary.md` §8.8 | Overlaps AR-005. | High | **Resolved — see PrivacyRequirements.md §6** | Privacy Officer + Database Architect |

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
| AR-036 | Whether Third Parties Referenced in Meeting Content require distinct product-level privacy protections beyond participant-focused mechanisms is unaddressed. | `Stakeholders.md` §7 | Affects `PrivacyRequirements.md` scope. | Medium | Open — `PrivacyRequirements.md` §11 (PR-028-PR-030) classifies third-party-referenced information at C2/C3 and requires it not be exempted from standard protections; the specific request-mechanism for non-user third parties remains deferred (see AR-063) | Privacy Officer |
| AR-037 | Whether "Organizational Leadership / Sponsor" needs distinct reporting/oversight features beyond existing audit/export capability is unconfirmed. | `Stakeholders.md` §7 | Low-impact scope question; may affect `FunctionalRequirements.md`. | Low | Open | Product Manager |
| AR-038 | Whether an external stakeholder category (regulators, external auditors) needs formal representation is unresolved. | `Stakeholders.md` §7 | Could affect audit/export/compliance requirements. | Low | Open | Privacy Officer |
| AR-039 | Personas (`Personas.md`) are illustrative constructs derived from stated principles, not from confirmed user research; all persona detail requires future validation. | `Personas.md` §1, §8 | Design decisions based on unvalidated personas carry a risk of misdirected UX investment. | Medium | Open | Product Manager + UX Lead |
| AR-040 | Whether Meeting Owner, Transcript Reviewer, and Approver are typically distinct individuals or the same person in multiple roles is unconfirmed. | `Personas.md` §8 | Affects UX flow design and RBAC model (overlaps AR-004, AR-023). | Medium | Open — partially informed by ADR-004 §4.3.2 (combination permitted only as a visible, audited exception); see also AR-047 | Product Manager + UX Lead |
| AR-041 | Whether IT Administrator, Security Function, and Privacy/Compliance Function require dedicated administrative-console personas is deferred pending future scoping of administrative functionality. | `Personas.md` §8 | Affects future `04-Design/` and `02-Requirements/` work for admin-facing capability. | Low | Open | Product Manager + UX Lead |

## 7a. Assumptions Introduced by Architecture Decision Records (ADR-001, ADR-002)

| ID | Assumption | Source | Impact | Risk Level | Resolution Status | Owner for Resolution |
|---|---|---|---|---|---|---|
| AR-042 | Specific on-device resource/performance thresholds for the offline AI processing path are not yet defined. | ADR-001 §9 | Blocks `NonFunctionalRequirements.md`. | Medium | Open — `NonFunctionalRequirements.md` §4 (NFR-012) restates this as a qualitative requirement without inventing the threshold; see also AR-075/AR-076 | AI/ML Architect |
| AR-043 | The specific approval/audit mechanism for enabling the optional networked AI processing path is not yet defined. | ADR-001 §9 | Blocks `PrivacyRequirements.md`, `SecurityRequirements.md`. | Medium | Open | Privacy Officer + Security Architect |
| AR-044 | Specific deployment topology (on-premises single-server vs. dedicated cloud instance per organization vs. other) is not yet defined. | ADR-002 §9 | Blocks `03-Architecture/DeploymentArchitecture.md`. | Medium | **Resolved — see DeploymentArchitecture.md §4.4 (DA-009): hybrid local-first desktop client + organization-controlled shared component** | Principal Software Architect + DevOps/Deployment Engineer |
| AR-045 | The precise technical definition of the per-organization "isolation boundary" (what constitutes a violation, how it is enforced/tested) is not yet defined. | ADR-002 §9 | Blocks `SecurityRequirements.md` and `DeploymentArchitecture.md`. | High | **Resolved — see DeploymentArchitecture.md §3.1 (DA-005)** | Security Architect |
| AR-046 | Who, specifically, within an adopting organization holds default deletion and export authority (e.g., IT Administrator, a named Data Owner role, or configurable per organization) is not yet defined. | ADR-003 §9 | Blocks `FunctionalRequirements.md`; overlaps AR-004/AR-023 (RBAC model). | Medium | **Resolved — see ADR-004** | Product Manager + Security Architect |
| AR-047 | Whether Meeting Owner, Reviewer, and Approver are typically the same or distinct individuals in real-world usage remains an organizational choice under the ADR-004 role model; not resolved at the level of expected usage patterns. | ADR-004 §9 (partially informs AR-040) | Affects UX flow design assumptions and how prominently the Reviewer/Approver combination exception (ADR-004 §4.3.2) should be surfaced. | Low | Open | Product Manager + UX Lead |
| AR-048 | The specific technical authorization mechanism capable of expressing scoped, per-meeting role assignment is not yet defined. | ADR-004 §9 | Blocks `03-Architecture/SecurityArchitecture.md`. | Medium | Open — substantially advanced by `SecurityArchitecture.md` §4 (claims-based, scope-qualified access evaluation pattern defined); specific token format/protocol selection remains deferred to `05-Engineering/` | Security Architect |
| AR-049 | The "expedited but audited" support-access workflow allowing a System Administrator occasional, logged content access is not yet defined. | ADR-004 §9 | Blocks `FunctionalRequirements.md`. | Medium | Open | Security Architect + Product Manager |
| AR-050 | How very small organizations satisfy Auditor independence (a distinct individual who is not also an administrator) is not yet defined. | ADR-004 §9 | Blocks `08-Operations/AdministratorGuide.md`. | Low | Open | Product Manager |

## 7b. Assumptions from Security Requirements Authoring (Phase 2.1)

| ID | Assumption | Source | Impact | Risk Level | Resolution Status | Owner for Resolution |
|---|---|---|---|---|---|---|
| AR-051 | Specific authentication mechanism/protocol is undefined. | `SecurityRequirements.md` §24.1 (SR-012, SR-013) | Blocks `03-Architecture/SecurityArchitecture.md`. | Medium | **Resolved — see SecurityArchitecture.md §3 (SEC-005-SEC-008): federated delegation to the organization's existing enterprise identity system, with bounded-validity offline-cached sessions** | Security Architect |
| AR-052 | Specific encryption algorithms, key management architecture, and lost-device key recovery procedure are undefined; SR-023–SR-025 scope the requirement without resolving it. | `SecurityRequirements.md` §24.2 | Overlaps AR-010; blocks `SecurityArchitecture.md`. | High | **Resolved — see SecurityArchitecture.md §5 (SEC-020-SEC-028): envelope key hierarchy (DEK/KEK), per-organization and per-device KEK scoping, organization-controlled escrow; specific algorithm selection remains deferred to 05-Engineering/ per this document's own scope constraint** | Security Architect |
| AR-053 | Specific access-monitoring mechanism and alert thresholds are undefined. | `SecurityRequirements.md` §24.3 (SR-047) | Blocks `SecurityArchitecture.md`, `06-Security/SecurityControls.md`. | Medium | Open | Security Architect |
| AR-054 | Specific vulnerability management process and tooling are undefined. | `SecurityRequirements.md` §24.4 (SR-056) | Blocks `05-Engineering/Operations.md`, `SecurityControls.md`. | Medium | Open | Security Architect + DevOps/Deployment Engineer |
| AR-055 | Specific incident response procedure and escalation paths are undefined. | `SecurityRequirements.md` §24.5 (SR-059) | Blocks `06-Security/IncidentResponse.md`. | High | Open | Security Architect |
| AR-056 | Specific backup/disaster-recovery procedures are undefined. | `SecurityRequirements.md` §24.6 (SR-062) | Blocks `08-Operations/DisasterRecovery.md`. | Medium | Open | DevOps/Deployment Engineer |
| AR-057 | Specific secure development tooling and code-review gating mechanics are undefined. | `SecurityRequirements.md` §24.7 (SR-065) | Blocks `05-Engineering/CodingStandards.md`, `TestingStrategy.md`. | Medium | Open | Security Architect + QA Lead |

## 7c. Assumptions from Privacy Requirements Authoring (Phase 2.2)

| ID | Assumption | Source | Impact | Risk Level | Resolution Status | Owner for Resolution |
|---|---|---|---|---|---|---|
| AR-058 | Specific participant-notification delivery/confirmation mechanism is undefined. | `PrivacyRequirements.md` §22.1 (PR-024) | Blocks `UXRequirements.md`, future `04-Design/` work. | Medium | Open | Product Manager + UX Lead |
| AR-059 | Specific consent-capture mechanism, granularity (per-meeting/per-participant/org-wide), and withdrawal handling are undefined. | `PrivacyRequirements.md` §22.2 (PR-027) | Overlaps AR-006; blocks `FunctionalRequirements.md`. | High | Open | Privacy Officer + Product Manager |
| AR-060 | Whether persistent cross-meeting speaker recognition is offered at all in the initial release remains undecided. | `PrivacyRequirements.md` §22.3 (PR-033) | Overlaps AR-012, AR-026, AR-035; blocks `AIRequirements.md`. | Medium | In Progress — `AIArchitecture.md` §7 (AI-ARCH-020) formally recommends excluding persistent speaker recognition from the initial release (speaker separation/diarization only, module slot reserved); awaiting Product Manager + Privacy Officer sign-off | Product Manager + AI/ML Architect |
| AR-061 | Specific de-identification/aggregation methods are undefined. | `PrivacyRequirements.md` §22.4 (PR-039) | Blocks `AIArchitecture.md`, `DatabaseArchitecture.md`. | Low | Open | AI/ML Architect + Database Architect |
| AR-062 | Specific retention period values (minimums, maximums, defaults) per classification level are undefined. | `PrivacyRequirements.md` §22.5 (PR-042) | Blocks `07-Privacy-Compliance/RetentionPolicy.md`. | High | Open | Privacy Officer |
| AR-063 | Specific technical deletion propagation mechanism (primary storage and backups) is undefined. | `PrivacyRequirements.md` §22.6 (PR-046) | Overlaps AR-056; blocks `DatabaseArchitecture.md`, `DisasterRecovery.md`. | Medium | Open | Database Architect + DevOps/Deployment Engineer |
| AR-064 | Specific data-subject-request process, timeline, and interface (including for third parties per AR-036) are undefined. | `PrivacyRequirements.md` §22.7 (PR-051) | Overlaps AR-006, AR-036; blocks `DataGovernance.md`. | High | Open | Privacy Officer |
| AR-065 | Specific configuration-review cadence/process for retention/consent/classification settings is undefined. | `PrivacyRequirements.md` §22.8 (PR-054) | Blocks `08-Operations/AdministratorGuide.md`. | Low | Open | Privacy Officer + Product Manager |

## 7d. Assumptions from Functional Requirements Authoring (Phase 2.3)

| ID | Assumption | Source | Impact | Risk Level | Resolution Status | Owner for Resolution |
|---|---|---|---|---|---|---|
| AR-066 | Whether transcription occurs near-real-time during the meeting ("live") or only after capture completes is undecided. | `FunctionalRequirements.md` §20.1 (FR-033) | Blocks `03-Architecture/AIArchitecture.md` sizing/latency requirements. | Medium | Open | AI/ML Architect + Product Manager |
| AR-067 | The completeness criteria required before a Reviewer may submit a review (full read-through vs. spot-check) are undefined. | `FunctionalRequirements.md` §20.2 (FR-049) | Affects `UXRequirements.md` and review-workflow UI design. | Medium | Open | Product Manager + UX Lead |
| AR-068 | The specific notification delivery channel (in-app, email, or other) is undefined. | `FunctionalRequirements.md` §20.3 (FR-082) | Overlaps AR-058; blocks `UXRequirements.md`, `03-Architecture/`. | Medium | Open | Product Manager + UX Lead |
| AR-069 | The specific form of "beginner mode" / simplified guidance (literal mode toggle vs. progressive disclosure) is undecided. | `FunctionalRequirements.md` §20.4 (FR-091) | Blocks `04-Design/UXPrinciples.md`, `HelpSystem.md`. | Low | Open | UX Lead |
| AR-070 | Specific accessibility conformance target (e.g., a named standard/level such as WCAG) is undefined. | `FunctionalRequirements.md` §20.5 (FR-100) | Blocks `04-Design/Accessibility.md`. | Medium | Open | Accessibility Specialist + UX Lead |
| AR-071 | Whether search access to C2/C3-classified content is logged for every search attempt or only for returned/opened results is unconfirmed. | `FunctionalRequirements.md` §20.6 (FR-069) | Affects `SecurityRequirements.md`/`PrivacyRequirements.md` audit-scope interpretation. | Low | Open | Security Architect + Privacy Officer |

## 7e. Assumptions from AI Requirements Authoring (Phase 2.4)

| ID | Assumption | Source | Impact | Risk Level | Resolution Status | Owner for Resolution |
|---|---|---|---|---|---|---|
| AR-072 | The specific mechanism and granularity for representing AI confidence (per-word, per-segment, or a general quality indicator) is undefined. | `AIRequirements.md` §14.1 (AI-025) | Blocks `03-Architecture/AIArchitecture.md` and reviewer UX design. | Medium | Open | AI/ML Architect + UX Lead |
| AR-073 | The specific technical mechanism for AI processing data isolation between organizations under the networked opt-in (if shared infrastructure is ever used) is undefined. | `AIRequirements.md` §14.2 (AI-050) | Overlaps AR-045 (now resolved); blocks `AIArchitecture.md`. | High | **Resolved — see AIArchitecture.md §4.2 (AI-ARCH-011): per-organization processing sessions with no cross-session data-bearing state; shared read-only model weights permitted because training restrictions keep organizational data out of them** | Security Architect + AI/ML Architect |
| AR-074 | The specific testing criteria and rollback mechanism for AI Improvement Loop changes are undefined beyond the governance shape (detect → propose → approve → version-control → test → rollback). | `AIRequirements.md` §14.3 (AI-057-AI-058) | Overlaps AR-008; blocks `05-Engineering/TestingStrategy.md`, `ReleaseStrategy.md`. | Medium | Open | AI/ML Architect + QA Lead |

## 7f. Assumptions from Non-Functional Requirements Authoring (Phase 2.5)

| ID | Assumption | Source | Impact | Risk Level | Resolution Status | Owner for Resolution |
|---|---|---|---|---|---|---|
| AR-075 | Specific quantitative performance targets (startup time, processing-time ratio, search response time, edit latency, export time) are undefined. | `NonFunctionalRequirements.md` §17.1 (NFR-007) | Blocks `03-Architecture/` design and `09-Testing/TestPlan.md` verification. | Medium | Open | Principal Software Architect + QA Lead |
| AR-076 | Specific offline AI processing time targets and resource-usage ceilings (CPU/memory/storage) are undefined. | `NonFunctionalRequirements.md` §17.2 (NFR-012) | Overlaps AR-042; blocks `AIArchitecture.md`. | High | Open — `AIArchitecture.md` §10 (AI-ARCH-029/031) defines the architectural mechanism (tiered capability footprints per device) without inventing the numeric thresholds, which remain to be set empirically and gate `AIArchitecture.md`/`DesktopArchitecture.md` leaving Draft status | AI/ML Architect |
| AR-077 | Specific endpoint CPU/memory/storage/battery-impact numeric thresholds are undefined. | `NonFunctionalRequirements.md` §17.3 (NFR-019) | Blocks `DesktopArchitecture.md`. | Medium | Open | Principal Software Architect + DevOps/Deployment Engineer |
| AR-078 | Specific maximum recording duration, participant count, file size, and simultaneous processing capacity are undefined. | `NonFunctionalRequirements.md` §17.4 (NFR-024) | Overlaps AR-022; blocks `FunctionalRequirements.md` scale assumptions and `DatabaseArchitecture.md`. | Medium | Open | Product Manager + Database Architect |
| AR-079 | Specific uptime/availability targets for any centrally-operated component are undefined. | `NonFunctionalRequirements.md` §17.5 (NFR-032) | Blocks `DeploymentArchitecture.md`. | Low | Open | DevOps/Deployment Engineer |
| AR-080 | Specific security-quality quantitative targets (e.g., audit-log write latency) are undefined. | `NonFunctionalRequirements.md` §17.6 (NFR-037) | Blocks `SecurityArchitecture.md`. | Low | Open | Security Architect |
| AR-081 | Specific scalability targets (max users per organization, max transcript volume, max archive size before degradation) are undefined. | `NonFunctionalRequirements.md` §17.7 (NFR-042) | Blocks `DatabaseArchitecture.md`, `SystemArchitecture.md`. | Medium | Open | Principal Software Architect + Database Architect |
| AR-082 | Specific storage growth-rate expectations and deletion-to-reclamation timeframes are undefined. | `NonFunctionalRequirements.md` §17.8 (NFR-046) | Overlaps AR-062, AR-063; blocks `RetentionPolicy.md`, `DatabaseArchitecture.md`. | Medium | Open | Database Architect + Privacy Officer |

## 7g. Assumptions from UX Requirements Authoring (Phase 2.6)

| ID | Assumption | Source | Impact | Risk Level | Resolution Status | Owner for Resolution |
|---|---|---|---|---|---|---|
| AR-083 | Whether a "materially new capability" triggering a re-shown walkthrough is determined automatically by the system or requires organizational configuration is undefined. | `UXRequirements.md` §15 (UX-019) | Blocks `04-Design/Walkthroughs.md`. | Low | Open | UX Lead + Product Manager |

## 7h. Assumptions from Acceptance Criteria Authoring (Phase 2.7)

| ID | Assumption | Source | Impact | Risk Level | Resolution Status | Owner for Resolution |
|---|---|---|---|---|---|---|
| AR-084 | Full one-to-one acceptance-criteria coverage for every Critical/High requirement across SecurityRequirements.md through UXRequirements.md has not yet been completed; `AcceptanceCriteria.md` provides representative coverage only. | `AcceptanceCriteria.md` §12-§13 | Blocks full traceability closure per AC-P5; must be completed during `03-Architecture/` and `09-Testing/TestPlan.md` authoring. | Medium | Open | QA Lead + Principal Software Architect |

## 7i. Assumptions from Threat Model Authoring (Phase 3.1)

| ID | Assumption | Source | Impact | Risk Level | Resolution Status | Owner for Resolution |
|---|---|---|---|---|---|---|
| AR-085 | `ThreatModel.md` was placed at `03-Architecture/ThreatModel.md` per explicit instruction, deviating from the original PEKB tree's `06-Security/ThreatModel.md` location; whether a separate `06-Security/ThreatModel.md` is still expected (and should reference this one) or the original tree entry should be considered superseded is unconfirmed. | `03-Architecture/ThreatModel.md` §0 | Affects PEKB structural consistency; low functional impact. | Low | Open | Principal Software Architect + Technical Documentation Lead |

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
- `02-Requirements/SecurityRequirements.md` resolves AR-027, partially informs AR-005/AR-028 (mandates the classification scheme without defining it), and seeds AR-051–AR-057 in Section 7b.
- `02-Requirements/PrivacyRequirements.md` resolves AR-005 and AR-028 (Data Classification Framework, §6), further informs AR-006, AR-012, AR-026, and AR-036, and seeds AR-058–AR-065 in Section 7c.
- `02-Requirements/FunctionalRequirements.md` defines the authoritative transcript lifecycle and meeting capture lifecycle state machines (§3), and seeds AR-066–AR-071 in Section 7d.
- `02-Requirements/AIRequirements.md` further informs AR-008 and AR-060 (defines governance shape without deciding the open question), and seeds AR-072–AR-074 in Section 7e.
- `02-Requirements/NonFunctionalRequirements.md` further informs AR-042, restates quality attributes qualitatively without inventing numeric targets, and seeds AR-075–AR-082 in Section 7f.
- `02-Requirements/UXRequirements.md` further references AR-039, AR-069, and AR-070 without resolving them, and seeds AR-083 in Section 7g.
- `02-Requirements/AcceptanceCriteria.md` closes the 02-Requirements phase, references AR-064/AR-076/AR-070/AR-067 without resolving them, and seeds AR-084 in Section 7h.
- `03-Architecture/ThreatModel.md` resolves AR-009, references AR-010/AR-045/AR-051/AR-052/AR-060/AR-062/AR-063/AR-073/AR-076 without resolving them, and seeds AR-085 in Section 7i.
- `03-Architecture/DeploymentArchitecture.md` resolves AR-044 and AR-045 (deployment topology and isolation boundary definition), further annotates AR-073, and introduces no new assumptions.
- `03-Architecture/SystemArchitecture.md` adopts the AR-044/AR-045 resolutions from `DeploymentArchitecture.md`, references AR-010/AR-051/AR-052/AR-073/AR-081 without resolving them, and introduces no new assumptions.
- `03-Architecture/SecurityArchitecture.md` resolves AR-051 and AR-052, substantially advances (without fully resolving) AR-010 and AR-048, references AR-054/AR-057/AR-073 without resolving them, and introduces no new assumptions.
- `03-Architecture/AIArchitecture.md` resolves AR-073 (session-isolation model), advances AR-060 and AR-008 to formal recommendations awaiting sign-off, defines the architectural mechanism for AR-076 without setting its numbers, and introduces no new assumptions.
- `03-Architecture/DatabaseArchitecture.md` references AR-056/AR-062/AR-072/AR-081/AR-082 without resolving them, and introduces no new assumptions.
- `03-Architecture/DesktopArchitecture.md` completes the architecture phase, references AR-007/AR-070/AR-072/AR-076 without resolving them, flags the `WebArchitecture.md` scope question for the Architecture Baseline Review, and introduces no new assumptions.
- `03-Architecture/ArchitectureBaselineReview.md` classifies AR-076 as the sole hard architecture-blocking assumption, confirms AR-051/AR-052 as architecturally resolved with narrow remaining specifics, and seeds AR-086 (WebArchitecture.md disposition) in Section 7j.
- `00-Governance/ArchitectureDecisionIndex.md` is a new, non-authoritative navigation index of resolved decisions (complementing Glossary.md's terminology index and this Register's open-question index); it introduces no new assumptions.

## 7j. Assumptions from Architecture Baseline Review

| ID | Assumption | Source | Impact | Risk Level | Resolution Status | Owner for Resolution |
|---|---|---|---|---|---|---|
| AR-086 | Whether `WebArchitecture.md` is required at all under the adopted hybrid topology, or should be formally marked not-required-for-current-scope pending a future roadmap decision, is unratified. | `ArchitectureBaselineReview.md` §12, §19 | Affects PEKB structural completeness for `03-Architecture/`; low functional impact since DesktopArchitecture.md already covers the only client in current scope. | Low | Open | Principal Software Architect + Product Manager |
- Resolution of any entry here should result in an update to the relevant PEKB document and a status change in this register — never a resolution recorded only in this register without a corresponding document update.

---

*End of Document — PEKB-00-GOV-009 — Project Echo Assumptions Register — PE-2026.001-ZM*
