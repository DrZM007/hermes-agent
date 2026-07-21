# Project Echo — POPIA Compliance Mapping

## Document Metadata

| Field | Value |
|---|---|
| Document ID | PEKB-07-PRIV-001 |
| Document Title | POPIA Compliance Mapping |
| PEKB Section | 07-Privacy-Compliance |
| Version | 0.1.0 |
| Status | Draft |
| Classification | Internal — Privacy/Compliance |
| Owner Role | Privacy Officer |
| Approval Required From | Principal Software Architect, Security Architect, Product Manager |
| Related Documents | ProjectConstitution.md (00-Governance); ADR-003-DataOwnershipGovernance.md, ADR-006-DataClassificationTwoAxisModel.md, ADR-007-TranscriptRecordLifecycle.md, ADR-013-KeyManagement.md (00-Governance/Decisions); PrivacyRequirements.md, SecurityRequirements.md, AIRequirements.md, EvidenceComplianceRequirements.md, AcceptanceCriteria.md (02-Requirements) |
| Original Creator | Dr Ziyaad Moolla |
| Creator ID | ZM |
| Document Provenance | PE-2026.001-ZM |

---

## 1. Purpose and Scope

This document maps the eight conditions for lawful processing under South Africa's **Protection of Personal Information Act (POPIA)** to the Project Echo requirements and controls that support them. Its purpose is to make the platform's privacy posture *demonstrable* (Constitution Commitment 16, Measurable Trust) and to give an adopting organization a clear starting point for its own compliance work.

**Framing (per ADR-003):** the adopting organization is the **Responsible Party** — it determines the purpose and lawful basis of processing and owns the data. **Project Echo is an Operator (processor)** — it provides technical means and processes on the organization's instructions. This mapping therefore distinguishes, for each condition, what Project Echo provides technically from what remains the organization's obligation.

**This document is a compliance *alignment* aid, not a legal compliance certification** (per the "POPIA-Aligned" definition in `Glossary.md`). Legal determination is the organization's responsibility, ideally with its own legal/Information Officer review.

## 2. The Eight Conditions

### 2.1 Condition 1 — Accountability
- **Project Echo provides:** immutable audit of consequential actions (SR-041–043; AC-006/007), classification of all data (ADR-006), and evidence/compliance reporting (EvidenceCompliance EV-011/012) so the organization can demonstrate accountability.
- **Organization retains:** appointing an Information Officer, defining lawful basis, and overall accountability for processing.

### 2.2 Condition 2 — Processing Limitation (lawfulness, minimality, consent/justification)
- **Project Echo provides:** data minimization by design (PR-016), C3 (sensitive) processing off by default and opt-in only (PR-025/026; AC-010), and recording classified ≥ C2 by default (PR-019).
- **Organization retains:** establishing the lawful basis/consent for recording meetings and for any C3 capability it enables.

### 2.3 Condition 3 — Purpose Specification
- **Project Echo provides:** retention tied to purpose and lifecycle state (PR-040; ADR-007), and configurable retention policies (Governance Engine).
- **Organization retains:** specifying the purpose for which meetings are recorded and retained.

### 2.4 Condition 4 — Further Processing Limitation
- **Project Echo provides:** AI outputs inherit source classification (no laundering, PR-036; AC-024); the Knowledge Base is built only from **approved** outputs and stays in-org (KB-001/006); no automatic training on organizational data (AI-030/031; AC-027).
- **Organization retains:** ensuring secondary uses remain compatible with the original purpose.

### 2.5 Condition 5 — Information Quality
- **Project Echo provides:** human review and correction workflow before a record is authoritative (FR §3.1; RI engine); AI never fabricates or guesses (AI-059–062; AC-042–047); uncertainty surfaced not hidden (AI-026/060).
- **Organization retains:** ensuring reviewers correct records diligently.

### 2.6 Condition 6 — Openness
- **Project Echo provides:** a clear description of what personal-information categories are processed and how (PR-009; the C1–C4 framework); provenance of AI-generated content (AI-051/053).
- **Organization retains:** notifying data subjects as required.

### 2.7 Condition 7 — Security Safeguards
- **Project Echo provides:** encryption at rest (SR-023/025; AC-005) under the ADR-013 key hierarchy; per-organization isolation (ADR-002); RBAC with separation of duties (ADR-004/008); immutable audit (SR-043); secure development (SR §22); incident response support (SR §20). This is the most directly technical condition and is extensively covered.
- **Organization retains:** operational security of its own environment and personnel.

### 2.8 Condition 8 — Data Subject Participation
- **Project Echo provides:** the technical means to locate all C1–C3 data about an identifiable individual within the isolated deployment (PR-049; AC-014), and to execute approved corrections/deletions across classification levels (PR-045), with disposal leaving a surviving audit record (PR-044; ADR-007).
- **Organization retains:** receiving, validating, and responding to data-subject requests.

## 3. Special Personal Information

Sensitive categories (health, biometric) map to **C3** (ADR-006 Axis 1), are processed only under explicit organization-level opt-in (PR-026), require heightened export approval (PR-048; AC-013), and — for persistent biometric-style speaker recognition — are disabled by default and gated (AI-041; whether offered at all is AR-060). Voice biometrics beyond per-meeting labeling are a deferred capability requiring a dedicated governance/ethics gate (Scope §4).

## 4. Breach Notification Support

Project Echo's incident-response support provides sufficient detail (what data, what classification, how many data subjects potentially affected) for the organization to make its own POPIA notification determination (PR-056; SR §20); Project Echo does not make the legal notification determination itself.

## 5. Open Items

1. A control-by-control POPIA **traceability matrix** (each POPIA sub-requirement → specific PR/SR/AC IDs) is pending; this document maps at the condition level.
2. The organization-facing **Information Officer guidance** (how to operate Echo compliantly) is an `08-Operations/AdministratorGuide.md` deliverable (pending).
3. Legal review by a qualified party is the organization's responsibility and is outside PEKB scope.

## 6. Challenge the Design

1. Does any condition rely on a control that does not actually exist in the requirements? (Each mapping cites a real requirement ID.)
2. Is the Operator/Responsible-Party split (Section 1) applied consistently, without Project Echo over-claiming obligations that are the organization's?
3. Does anything here read as a legal compliance *certification* rather than alignment? (It must not.)
4. Are special-category and biometric provisions (Section 3) correctly gated?
5. What is deferred (control-level matrix, IO guidance, legal review) and is each flagged?

## 7. Revision History

| Version | Date | Summary | Author |
|---|---|---|---|
| 0.1.0 | 2026-07-20 | Initial POPIA Compliance Mapping: the eight conditions for lawful processing each mapped to Project Echo requirements/controls, with the Operator (Echo) vs. Responsible Party (organization) split per ADR-003; special personal information, and breach-notification support. Framed explicitly as alignment, not legal certification. Control-level matrix and Information Officer guidance deferred. | Dr Ziyaad Moolla (ZM) |

---

*End of Document — PEKB-07-PRIV-001 — Project Echo POPIA Compliance Mapping — PE-2026.001-ZM*
