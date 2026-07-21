# Project Echo — Redaction & Secure Sharing Requirements

## Document Metadata

| Field | Value |
|---|---|
| Document ID | PEKB-02-REQ-015 |
| Document Title | Redaction & Secure Sharing Requirements |
| PEKB Section | 02-Requirements |
| Version | 0.1.0 |
| Status | Draft |
| Classification | Internal — Requirements |
| Owner Role | Security Architect |
| Approval Required From | Principal Software Architect, Privacy Officer, Product Manager, QA Lead |
| Related Documents | ProjectConstitution.md (00-Governance); ADR-002-DeploymentModel.md, ADR-003-DataOwnershipGovernance.md, ADR-004-AccessControlRBACModel.md, ADR-006-DataClassificationTwoAxisModel.md, ADR-007-TranscriptRecordLifecycle.md (00-Governance/Decisions); Scope.md (01-Product); SecurityRequirements.md, PrivacyRequirements.md, FunctionalRequirements.md, EvidenceComplianceRequirements.md, AcceptanceCriteria.md (02-Requirements) |
| Original Creator | Dr Ziyaad Moolla |
| Creator ID | ZM |
| Document Provenance | PE-2026.001-ZM |

---

## 1. Purpose and Scope

This document defines the requirements for Project Echo's **Redaction & Secure Sharing** capabilities — the in-scope area in `01-Product/Scope.md` §2.19 — which govern how content is prepared for, and released beyond, its normal audience: sensitive-information detection, redacted copies, encrypted sharing packages, controlled export, and secure viewing. These are the mechanisms by which content may cross the organizational isolation boundary (ADR-002), and are therefore held to the governed-exception discipline that boundary requires.

These capabilities extend the Controlled Export governance already established (`Scope.md` §2.11, `PrivacyRequirements.md` §17, `SecurityRequirements.md` export controls); they do not replace it. Where an export crosses the isolation boundary, the ADR-002 boundary-crossing rules and the ADR-006 classification handling both apply.

## 2. Requirement Identifiers

Requirements use the prefix **`RS-###`** (Redaction & Sharing), recorded in `Glossary.md` §3A.

## 3. Sensitive-Information Detection

**RS-001** — The system may optionally detect patterns that commonly indicate sensitive information (e.g., identity numbers, passport numbers, phone numbers, email addresses, bank-account numbers, configured study-participant identifiers, and organization-defined patterns) within a transcript.
*Priority:* Medium. *Traceability:* Scope.md §2.19; briefing V10 (sensitive-information detection).

**RS-002** — On detecting such a pattern, the system shall **flag it for the reviewer to decide**, and shall not automatically remove, alter, or redact the content, because context determines whether action is needed. This preserves Human Authority and the AI content-integrity guardrails (no silent alteration).
*Priority:* Critical. *Traceability:* ProjectConstitution.md Commitment 2; EthicalAICharter.md §4.1/§4.6; AIRequirements.md AI-020.

## 4. Redaction

**RS-003** — An authorized reviewer shall be able to create a **redacted copy** of a transcript (e.g., replacing a participant identifier with a redaction marker) for controlled sharing.
*Priority:* Medium. *Traceability:* Scope.md §2.19; briefing V10.

**RS-004** — Creating a redacted copy shall leave the **original record unchanged and immutable**; the redacted version shall be its own versioned artifact with its own audit history, consistent with the append-only revision model.
*Priority:* Critical. *Traceability:* DatabaseArchitecture.md (append-only, DB-008–DB-011); briefing V10; FunctionalRequirements.md.

**RS-005** — A redacted copy shall inherit classification on both axes (ADR-006) from its source and shall not be assigned a lower classification merely because content was redacted; redaction reduces exposure of specific values, it does not reclassify the record downward by default.
*Priority:* High. *Traceability:* ADR-006 §4.5; PrivacyRequirements.md PR-036.

## 5. Secure Sharing Packages

**RS-006** — The system shall be able to generate an **encrypted sharing package** for release outside the organization, containing the transcript (or redacted copy), optional attachments, optional metadata, a digital signature, a checksum, and optionally an expiry and password, together with an audit record of its creation.
*Priority:* Medium. *Traceability:* Scope.md §2.19; briefing V10/V16.

**RS-007** — Generating a sharing package that crosses the organizational isolation boundary shall be a governed export: it requires the applicable Controlled Export approval, and for C3 (Axis-1) or Restricted/Highly-Restricted (Axis-2) content the additional heightened approval required by `PrivacyRequirements.md` PR-048 and ADR-006's "more restrictive governs" rule.
*Priority:* Critical. *Traceability:* ADR-002; ADR-006 §4.4; PrivacyRequirements.md PR-047/PR-048.

**RS-008** — Every creation, approval, and release of a sharing package shall be recorded in the immutable audit layer with the acting identity, role/scope, classification of the content, and timestamp; a boundary crossing shall never be unaudited.
*Priority:* Critical. *Traceability:* SecurityRequirements.md SR-041–SR-044; ADR-002.

## 6. Secure Viewing

**RS-009** — The system shall support a **secure viewing mode** for highly sensitive records that disables in-application copy, paste, print, and export, and logs viewing access.
*Priority:* Medium. *Traceability:* Scope.md §2.19; briefing V12.

**RS-010** — Screenshot prevention, where offered, shall be documented and treated as a **best-effort deterrent plus audit control, not a guarantee**, since the operating system cannot guarantee blocking all capture methods; the system shall never claim it prevents all capture.
*Priority:* High. *Rationale:* Over-claiming a security guarantee would itself be a trust failure. *Traceability:* ProjectConstitution.md Commitment 8; briefing V12 (secure viewing caveat).

## 7. Constraints

**RS-011** — No redaction, sharing, export, or secure-viewing capability shall weaken a safety-critical control or the ADR-004 authorization model, and none shall provide a path for content to leave the isolation boundary except through the governed, audited export defined here.
*Priority:* Critical. *Traceability:* GovernanceEngineRequirements.md GE-020; ADR-002; ADR-004.

**RS-012** — Licensing state, feature flags, or configuration shall never gate an organization's access to its **own** records or its ability to export them within its authorization — consistent with ADR-003 (the organization owns its data); export controls govern *how* release is done, never *whether* an organization can reach its own data.
*Priority:* High. *Traceability:* ADR-003; briefing V12 (licensing must never disable access to own data).

## 8. Open Items

1. Encryption, digital-signature, checksum, and password mechanisms underlying RS-006 depend on the key-management approach still open as `AssumptionsRegister.md` AR-052.
2. The sensitive-information pattern set and detection mechanism (RS-001) are design-level; organization-defined patterns are configured via the Governance & Policy Engine.
3. The specific export formats and package structure are deferred to `04-Design/`/`05-Engineering/`.

## 9. Challenge the Design

Before this document is approved:

1. Is there any redaction/sharing/export/viewing path (RS-003–RS-009) that could let content leave the isolation boundary un-audited or without the required approval?
2. Does redaction ever alter the original record (RS-004)? (It must not.)
3. Does any secure-viewing claim (RS-010) over-promise capture prevention?
4. Could redaction be used to reclassify a record downward inappropriately (RS-005)?
5. Is the "own data is always reachable" guarantee (RS-012) airtight against licensing/flag gating?
6. What is deferred (crypto/AR-052, pattern set, formats) and is each flagged?

## 10. Revision History

| Version | Date | Summary | Author |
|---|---|---|---|
| 0.1.0 | 2026-07-20 | Initial Redaction & Secure Sharing requirements (RS-001–RS-012): sensitive-information detection that flags for the reviewer and never auto-removes; redacted copies that leave the original immutable and form their own audited version without downward reclassification; encrypted, signed, audited sharing packages released only through governed export with heightened approval for C3/Restricted content; secure viewing mode with honest best-effort screenshot caveat; and the guarantee that licensing/flags can never gate an organization's access to its own data. All boundary crossings audited and bound to RBAC/isolation/safety-critical controls. Introduces RS-### prefix. Crypto depends on AR-052; pattern set and formats deferred. | Dr Ziyaad Moolla (ZM) |

---

*End of Document — PEKB-02-REQ-015 — Project Echo Redaction & Secure Sharing Requirements — PE-2026.001-ZM*
