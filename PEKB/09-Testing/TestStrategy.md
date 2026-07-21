# Project Echo — Test Strategy

## Document Metadata

| Field | Value |
|---|---|
| Document ID | PEKB-09-TST-001 |
| Document Title | Test Strategy |
| PEKB Section | 09-Testing |
| Version | 0.1.0 |
| Status | Draft |
| Classification | Internal — Testing |
| Owner Role | QA Lead |
| Approval Required From | Principal Software Architect, Security Architect, Privacy Officer, Accessibility Specialist |
| Related Documents | EngineeringPrinciples.md, EngineeringQualityGates.md, EthicalAICharter.md (00-Governance); ADR-005 (00-Governance/Decisions); AcceptanceCriteria.md, SecurityRequirements.md, PrivacyRequirements.md, AIRequirements.md, NonFunctionalRequirements.md, UXRequirements.md (02-Requirements) |
| Original Creator | Dr Ziyaad Moolla |
| Creator ID | ZM |
| Document Provenance | PE-2026.001-ZM |

---

## 1. Purpose and Scope

This document defines *how Project Echo is verified*: the levels of testing, what each must cover, how tests map to the Quality Gates, and the special test assets (golden dataset, benchmark suite, compatibility certification) the product-owner briefing required. It is the strategy; concrete test cases live in `TestPlan.md` (pending) and reference `AcceptanceCriteria.md` by ID.

It realizes the test discipline of `EngineeringPrinciples.md` §2 and `EngineeringQualityGates.md`, and fills the gate-to-test mapping that `EngineeringQualityGates.md` §8 Open Item 1 deferred. It introduces no requirements — it defines verification of existing ones.

## 2. Testing Philosophy

**TST-P1 — Coverage is a tool, not the goal.** Rather than chase an arbitrary percentage, testing shall guarantee that **all critical business logic, all security-sensitive code, all workflow transitions, all permission enforcement, all data migration, and every safety-critical control are tested**. A high coverage number over untested critical paths is a failure, not a pass.
*Traceability:* briefing V17; EngineeringQualityGates.md §2.

**TST-P2 — Every test traces to a requirement/AC.** Each test case references the `AC-###` (and through it the requirement) it verifies, per `AcceptanceCriteria.md` AC-P6; tests never restate scenarios in divergent terms.
*Traceability:* AcceptanceCriteria.md AC-P6; DocumentStandards.md §5.

**TST-P3 — Safety-critical controls are non-waivable in test.** The AI content-integrity guardrails (`AIRequirements.md` §6A / AC-042–047), separation of duties (SR-019), audit immutability (AC-007), encryption at rest (AC-005), and the human-approval gate must each have a test whose failure blocks release; none may be skipped for schedule.
*Traceability:* EthicalAICharter.md §6.2; EngineeringQualityGates.md.

## 3. Test Levels

| Level | Verifies | Notes |
|---|---|---|
| **Unit** | Individual functions/classes; business rules, validators (e.g., custom-role validator SR-071). | Fast, isolated. |
| **Integration** | Interactions across components (Desktop ↔ shared, module ↔ Identity/Access ↔ Audit). | Includes the no-parallel-authorization rule (MA-001). |
| **System / end-to-end** | Full workflows (capture → transcribe → review → approve → archive → dispose). | Uses the golden dataset (Section 5). |
| **Security** | AuthN/authZ, encryption at rest, audit immutability, boundary/isolation, secrets handling, prompt-injection resistance (AC-028). | Plus dependency/vulnerability review (SR §19); pen-testing where appropriate. |
| **Privacy** | Classification handling (both axes), retention/disposal, DSR support, redaction, logging exclusions. | POPIA-aligned; see `07-Privacy-Compliance/`. |
| **AI behaviour** | The six hard prohibitions (AC-042–047), confidence marking, no-auto-apply, controlled-learning gate (AC-027). | Safety-critical; non-waivable. |
| **Performance** | Responsiveness under load, offline throughput, large-recording handling, memory stability. | Budgets empirical — see Section 6 / AR-076. |
| **Accessibility** | Keyboard-only operation, screen-reader compatibility, contrast, color-independent indicators, text scaling (AC-035). | Continuous, not a final pass. |
| **Usability** | Task completion by representative non-technical users without training (AC-036). | Session-based. |
| **Regression** | Prior behavior preserved across changes. | Automated where feasible. |
| **Recovery / DR** | Crash recovery, workspace restore, backup/restore validation, disaster recovery onto new hardware (RC). | Includes key-escrow recovery (ADR-013). |
| **Upgrade** | Upgrade without data loss; config/schema migration with rollback. | Compatibility certification (Section 7). |
| **Sync** | Offline-first, no-auto-merge conflict surfacing (DB-011), in-org-only, audited. | Per ADR-012 once protocol exists. |

## 4. Gate-to-Test Mapping

Each Quality Gate in `EngineeringQualityGates.md` §5 is satisfied by specific levels above:

| Quality Gate | Satisfied by |
|---|---|
| Unit tests | Unit |
| Integration tests | Integration |
| Security tests | Security + AI behaviour (safety-critical subset) |
| Privacy review | Privacy |
| Accessibility review | Accessibility |
| Performance review | Performance |
| Compliance review | Privacy + Security + audit-completeness + POPIA mapping |
| Final review | Regression + system E2E + Red-Team confirmation |

A gate is not passed until its mapped tests pass for the change under review.

## 5. Golden Test Dataset

**TST-P4** — A permanent, version-controlled **golden dataset** of representative recordings shall exist (quiet/noisy meetings, domain terminology, accents, fast/overlapping speakers, poor microphones, room systems, long/short recordings), or organizations may supply their own approved test sets. Every AI or transcription change is tested against the **same** dataset so results are comparable over time.
*Traceability:* briefing V20 (golden dataset); AIRequirements.md.

**TST-P5** — Only approved, non-confidential test data shall be used; no production meeting content is used for testing without explicit organizational approval (consistent with ADR-003 and the experimental-features rule BR-008).
*Traceability:* ADR-003; BranchingStrategy.md BR-008.

## 6. Benchmark Suite and AR-076

**TST-P6** — A benchmark suite shall measure accuracy (incl. domain terminology), speed, speaker-labeling quality, CPU/RAM usage, and regression against the current engine, on representative CPU-only managed-laptop hardware. This suite is the **instrument that resolves AR-076** and selects the default transcription engine (ADR-011); performance budgets are set from measured results, never invented.
*Traceability:* ADR-011; AssumptionsRegister.md AR-076; NonFunctionalRequirements.md.

## 7. Compatibility Certification (release gate, per ADR-005)

**TST-P7** — Before any release, the Compatibility Certification checklist (ADR-005 §4.6) shall pass: Windows 10/11 enterprise, no-admin operation, CPU-only systems, restricted networks, large recordings, low-disk conditions, crash recovery, accessibility scenarios, upgrade-without-data-loss, and backup/restore validation. Silent/GPO/Intune/SCCM install paths are tested explicitly, not just interactive install.
*Traceability:* ADR-005 §4.6.

## 8. User Acceptance Testing

**TST-P8** — Real-world scenario UAT (e.g., research protocol review, ethics committee, HR meeting, executive board, clinical case discussion, QA review) shall be defined with expected outcomes and acceptance criteria, run before a production release, and involve representative users.
*Traceability:* briefing V20; AcceptanceCriteria.md.

## 9. Open Items

1. Concrete test cases (`TestPlan.md`) referencing each `AC-###`, and full AC coverage for the seven modules' safety-critical requirements (AR-084), are pending.
2. The performance budgets validated by the benchmark suite remain empirical (AR-076).
3. Specific test tooling, automation framework, and CI integration are `05-Engineering/` decisions bounded by ADR-005.

## 10. Challenge the Design

1. Does every safety-critical control (TST-P3) have a named, non-waivable test?
2. Is the gate-to-test mapping (Section 4) complete — is any gate left without a test level?
3. Does the golden dataset cover the domain (clinical/research/accents) adequately?
4. Are performance budgets kept measured-not-invented (TST-P6)?
5. What is deferred (TestPlan, AR-084 coverage, tooling) and is each flagged?

## 11. Revision History

| Version | Date | Summary | Author |
|---|---|---|---|
| 0.1.0 | 2026-07-20 | Initial Test Strategy: testing philosophy (coverage-as-tool, every-test-traces, safety-critical-non-waivable), thirteen test levels, the gate-to-test mapping filling EngineeringQualityGates §8, the golden dataset and benchmark suite (the instrument that resolves AR-076), the ADR-005 compatibility certification release gate, and UAT. Introduces TST- identifiers. Concrete TestPlan, full AR-084 coverage, and tooling deferred. | Dr Ziyaad Moolla (ZM) |

---

*End of Document — PEKB-09-TST-001 — Project Echo Test Strategy — PE-2026.001-ZM*
