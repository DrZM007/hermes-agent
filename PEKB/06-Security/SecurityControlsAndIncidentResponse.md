# Project Echo — Security Controls Catalog & Incident Response

## Document Metadata

| Field | Value |
|---|---|
| Document ID | PEKB-06-SEC-001 |
| Document Title | Security Controls Catalog & Incident Response |
| PEKB Section | 06-Security |
| Version | 0.1.0 |
| Status | Draft |
| Classification | Internal — Security |
| Owner Role | Security Architect |
| Approval Required From | Principal Software Architect, Privacy Officer, DevOps/Deployment Engineer |
| Related Documents | ADR-002, ADR-004, ADR-006, ADR-007, ADR-013 (00-Governance/Decisions); SecurityRequirements.md, PrivacyRequirements.md, EvidenceComplianceRequirements.md (02-Requirements); SecurityArchitecture.md, ThreatModel.md (03-Architecture); OperationsGuide.md (08-Operations) |
| Original Creator | Dr Ziyaad Moolla |
| Creator ID | ZM |
| Document Provenance | PE-2026.001-ZM |

---

## 1. Purpose and Scope

This document gives a security reviewer a **single navigable catalog** of Project Echo's security controls and defines the **incident-response process** that `SecurityRequirements.md` §20 flagged as pending. Per `DocumentStandards.md` §5, the control *definitions* remain in their authoritative homes (`SecurityRequirements.md` SR-###, `SecurityArchitecture.md` SEC-###); this catalog **indexes and does not restate** them, so if it ever diverges, the source governs and this index is the defect.

## 2. Control Catalog (by reference)

| Control domain | Authoritative home | Key IDs |
|---|---|---|
| Authentication (federated identity) | SecurityRequirements §7; SecurityArchitecture §3 | SR-011…, SEC-005 |
| Authorization / RBAC + custom roles | SecurityRequirements §8–9, §22B; ADR-004/008 | SR-014–019, SR-070–072 |
| Separation of duties (mandatory) | ADR-004 §4.3; SecurityRequirements | SR-019; AC-004 |
| Encryption at rest | SecurityRequirements §10; ADR-013 | SR-023–025; AC-005 |
| Key management (DPAPI-NG, org key store, escrow, rotation) | ADR-013; SecurityArchitecture §5 | SEC-020–028 |
| Per-organization isolation | ADR-002; SecurityArchitecture | DA-005; SR (boundary) |
| Sensitivity-label handling (Axis 2) | SecurityRequirements §22A; ADR-006 | SR-066–069 |
| Immutable audit | SecurityRequirements §15; ADR-004 §4.4 | SR-041–043; AC-006/007 |
| Elevated/emergency access (break-glass, delegation, exceptions) | SecurityRequirements §22C | SR-073–075 |
| Records disposal authority | SecurityRequirements §22D; ADR-007 | SR-076–077 |
| AI processing security + content-integrity guardrails | SecurityRequirements §14; AIRequirements §6A | AI-047–048, AI-059–063; AC-042–047 |
| Export / redaction / secure sharing controls | SecurityRequirements §17; RedactionSecureSharing | RS-006–012; PR-047/048 |
| Secrets management | SecurityRequirements §22; BranchingStrategy | SR (secrets); BR-012 |
| Update security (signature verification) | SecurityRequirements §18; Update Management | SR (update) |
| Vulnerability management | SecurityRequirements §19 | SR §19 |
| Threat model | ThreatModel.md (03-Architecture) | 24 threats |

A control not appearing here that exists in a source document is a gap in *this* catalog, to be corrected here.

## 3. Incident Response Process

Elaborating `SecurityRequirements.md` §20 (SR-057–SR-059) and `PrivacyRequirements.md` PR-055/056:

**SEC-IR-1 — Detection & triage.** Security-relevant events (unauthorized access attempts, configuration drift alerts per OPS-004, integrity failures) are surfaced to designated administrators; severity is assessed.
*Traceability:* SecurityRequirements §20; OperationsGuide OPS-004.

**SEC-IR-2 — Containment.** Contain using existing controls — revoke/scope access (ADR-004), apply Legal Hold if records are implicated (EV-003), and, where investigation requires elevated access, use audited break-glass (SR-073), never an unaudited backdoor.
*Traceability:* SR-073; EV-003.

**SEC-IR-3 — Investigation.** Use the Discovery/Audit capabilities (EvidenceCompliance EV-009) over immutable audit; content access for the investigation is a separate, explicit, audited grant (EV-010), preserving Auditor independence.
*Traceability:* EV-009/010; ADR-004 §4.3.3.

**SEC-IR-4 — Notification support.** For a privacy incident potentially triggering a POPIA notification obligation, provide the organization sufficient detail (what data, what classification, how many data subjects potentially affected) to make its own determination; Project Echo does not make the legal notification decision.
*Traceability:* PR-056; POPIAComplianceMapping §4.

**SEC-IR-5 — Recovery & lessons.** Recover via the Recoverability subsystem/runbooks (RC; OperationsGuide §6) without weakening controls; record residual risk and feed improvements back through the governed process (Red-Team/Technical Debt Register).
*Traceability:* RecoverabilityRequirements; EngineeringQualityGates (Red-Team).

## 4. Open Items

1. Specific detection tooling and severity thresholds are Engineering/Operations decisions (in-org telemetry only, no external egress).
2. Step-level incident runbook detail is completed with the build (`08-Operations/`).
3. A full control-to-threat coverage matrix (each ThreatModel threat → mitigating controls) is pending.

## 5. Challenge the Design

1. Does the catalog omit any control that exists in a source document?
2. Does the incident process ever permit unaudited content access or a backdoor? (It must not — SEC-IR-2/3.)
3. Is Auditor independence preserved during investigation?
4. Does notification support stop short of making the legal determination (correctly the organization's)?
5. What is deferred (tooling, runbook steps, threat-coverage matrix) and is each flagged?

## 6. Revision History

| Version | Date | Summary | Author |
|---|---|---|---|
| 0.1.0 | 2026-07-20 | Initial Security Controls Catalog & Incident Response: a single by-reference catalog indexing every security control to its authoritative SR/SEC/ADR home (no duplication), and the five-step incident-response process (detection/triage, containment via audited break-glass + Legal Hold, investigation preserving Auditor independence, POPIA notification support, recovery & lessons) elaborating SecurityRequirements §20. Establishes 06-Security. Tooling, runbook steps, and a control-to-threat matrix deferred. | Dr Ziyaad Moolla (ZM) |

---

*End of Document — PEKB-06-SEC-001 — Project Echo Security Controls Catalog & Incident Response — PE-2026.001-ZM*
