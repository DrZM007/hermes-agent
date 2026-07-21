# Project Echo — Review Intelligence Engine Requirements

## Document Metadata

| Field | Value |
|---|---|
| Document ID | PEKB-02-REQ-010 |
| Document Title | Review Intelligence Engine Requirements |
| PEKB Section | 02-Requirements |
| Version | 0.1.0 |
| Status | Draft |
| Classification | Internal — Requirements |
| Owner Role | Product Manager |
| Approval Required From | Principal Software Architect, AI/ML Architect, Privacy Officer, UX Lead, QA Lead |
| Related Documents | ProjectConstitution.md, EthicalAICharter.md, DesignPrinciples.md (00-Governance); ADR-004-AccessControlRBACModel.md, ADR-006-DataClassificationTwoAxisModel.md, ADR-007-TranscriptRecordLifecycle.md (00-Governance/Decisions); Scope.md (01-Product); FunctionalRequirements.md, AIRequirements.md, UXRequirements.md, PrivacyRequirements.md, GovernanceEngineRequirements.md, AcceptanceCriteria.md (02-Requirements) |
| Original Creator | Dr Ziyaad Moolla |
| Creator ID | ZM |
| Document Provenance | PE-2026.001-ZM |

---

## 1. Purpose and Scope

This document defines the requirements for Project Echo's **Review Intelligence Engine** — the in-scope capability in `01-Product/Scope.md` §2.14. The engine is the reviewer-assistance layer that helps a human Reviewer work efficiently and accurately over the ratified review workflow (`FunctionalRequirements.md` §3.1), by prioritizing likely errors, explaining why segments are flagged, and presenting evidence — **without ever altering the official record itself**.

The engine sits *on top of* the review workflow and the AI capabilities already specified; it adds assistance, not authority. It does not change the transcript lifecycle, the role model, or the AI content-integrity guarantees — it surfaces information so a human decides faster and better. Requirements here reference those documents rather than restating them.

## 2. Requirement Identifiers

Requirements use the prefix **`RI-###`** (Review Intelligence), recorded in `Glossary.md` §3A.

## 3. Foundational Constraint — Assist, Never Decide

**RI-001** — Every output of the Review Intelligence Engine (highlight, suggestion, recommendation, confidence indicator, extracted candidate) shall be a **non-binding aid**. It shall never modify transcript content, change a lifecycle state, record an approval, or take any consequential action; only an explicit human action through the review/approval workflow may do so.
*Priority:* Critical. *Traceability:* ProjectConstitution.md Commitment 2; EthicalAICharter.md §3.2, §4; AIRequirements.md AI-020; ADR-007.

**RI-002** — No engine feature shall be capable of being configured to auto-apply its suggestions to the record; the human-in-the-loop step is not optional and is not feature-flag-disableable.
*Priority:* Critical. *Traceability:* GovernanceEngineRequirements.md GE-020; EthicalAICharter.md §6.2.

**RI-003** — Content the engine derived from AI output shall remain marked as AI-generated (per `AIRequirements.md` AI-051 / SA-032) until a human confirms it; the engine shall never present its own output as human-verified.
*Priority:* Critical. *Traceability:* AIRequirements.md AI-051; EthicalAICharter.md §3.3.

## 4. Prioritization and Explanation

**RI-004** — The engine shall present transcript confidence **by category** (e.g., speech recognition, speaker identification, terminology, names, numbers, dates), not only as a single overall score, to direct reviewer attention.
*Priority:* High. *Traceability:* AIRequirements.md (confidence reporting); briefing V13. *Note:* category set and thresholds are configurable/empirical — see Open Items (AR-076/AR-072).

**RI-005** — The engine shall explain *why* a segment is flagged in plain language (e.g., "speaker separation confidence is low here due to overlapping voices"), not merely display a numeric score.
*Priority:* High. *Traceability:* ProjectConstitution.md Commitment 8 (Transparency), Commitment 17-equivalent (Explainability); EthicalAICharter.md §3.6.

**RI-006** — The engine shall visually distinguish different types of uncertainty (e.g., names, numbers, dates, terminology, unclear audio, multiple speakers) using indicators that do not rely on color alone.
*Priority:* High. *Traceability:* UXRequirements.md (accessibility, color-independent indicators); DesignPrinciples.md §3.5.

**RI-007** — For a flagged item, the engine shall provide an **evidence panel** presenting the supporting audio snippet, waveform, confidence, alternative transcription candidates, relevant organization-dictionary entries, and (where available) similar previously-approved corrections — so the Reviewer can decide on evidence rather than guess.
*Priority:* High. *Traceability:* briefing V13; AIRequirements.md.

## 5. Review Efficiency Tools

**RI-008** — The engine shall support **contextual playback**: playing a selected segment with a short configurable lead-in/lead-out, and options to loop, slow, and switch between original and noise-reduced audio — none of which shall alter transcript content.
*Priority:* Medium. *Traceability:* briefing V13; RI-001.

**RI-009** — The engine shall support multiple audio views (e.g., original, noise-reduced, speech-enhanced, speaker-separated where available); switching views shall never automatically change the transcript.
*Priority:* Medium. *Traceability:* briefing V13; RI-001.

**RI-010** — The engine shall provide a **smart review queue** allowing a Reviewer to work by category (e.g., review all uncertain names, all numbers, all overlapping-speech segments) and to address highest-risk items first.
*Priority:* Medium. *Traceability:* briefing V13.

**RI-011** — The engine shall provide a **focus mode** presenting only the audio, transcript, confidence indicators, evidence panel, and keyboard controls, minimizing distraction.
*Priority:* Low. *Traceability:* briefing V13; UXRequirements.md.

**RI-012** — The engine shall support fully keyboard-driven review, with customizable shortcuts, such that an expert Reviewer can complete review without a pointing device (consistent with the accessibility requirement in `UXRequirements.md`).
*Priority:* High. *Traceability:* UXRequirements.md (keyboard operability); DesignPrinciples.md §3.5.

**RI-013** — The engine shall support configurable **review modes** (e.g., full review, risk-based review, spot check, training review, audit review), where the mode changes which segments require mandatory reviewer attention but never removes the human approval step.
*Priority:* Medium. *Traceability:* briefing V13; ADR-007; GovernanceEngineRequirements.md GE-012.

**RI-014** — The engine shall provide a **review heat map** indicating relative uncertainty across a transcript so a Reviewer can navigate directly to high-uncertainty regions.
*Priority:* Low. *Traceability:* briefing V13.

## 6. Review Structure and Records

**RI-015** — The engine shall provide side-by-side comparison (original AI transcript, current edited transcript, approved transcript) and a **difference viewer** that classifies changes by type (e.g., spelling, speaker, terminology, number, date, formatting), filterable by type.
*Priority:* Medium. *Traceability:* briefing V13; FunctionalRequirements.md (revision comparison); DatabaseArchitecture.md (append-only revisions).

**RI-016** — The engine shall support typed reviewer notes (e.g., general, question, correction-required, policy-reference, quality-concern, privacy-concern), each carrying author, time, status, and history, and optionally assignable — without those notes altering transcript content.
*Priority:* Medium. *Traceability:* briefing V13; FunctionalRequirements.md (commenting).

**RI-017** — The engine shall support a **quality review checklist** whose items are configurable per meeting type through the Governance & Policy Engine, so an organization can require specific verifications before approval.
*Priority:* Medium. *Traceability:* GovernanceEngineRequirements.md GE-011/GE-012; briefing V13.

**RI-018** — The engine's **AI Recommendation surface** shall present candidate action items, decisions, and unresolved questions as clearly-labelled suggestions, each linked to its supporting audio and transcript location, none of which is treated as a commitment until a human confirms it (per `AIRequirements.md` AI-015/AI-016).
*Priority:* Medium. *Traceability:* AIRequirements.md AI-015, AI-016; AcceptanceCriteria.md AC-025.

## 7. Controlled Learning Integration

**RI-019** — Where the engine detects a recurring reviewer correction, it may **propose** a dictionary/terminology addition, but shall never add it automatically; the proposal follows the governed, admin-approved controlled-learning workflow.
*Priority:* High. *Traceability:* AIRequirements.md AI-030/AI-031; EthicalAICharter.md §5; AcceptanceCriteria.md AC-027.

## 8. Continuity and Access Scope

**RI-020** — The engine shall support **intelligent pause/resume**: on interruption and return, it restores the Reviewer's cursor position, audio position, open panels, filters, and pending suggestions, consistent with the Recoverability commitment.
*Priority:* Medium. *Traceability:* ProjectConstitution.md Commitment 11; briefing V13/V19.

**RI-021** — All engine surfaces shall respect the Reviewer's authorization scope (ADR-004): the engine shall never surface content, evidence, or recommendations derived from material the Reviewer is not authorized to access.
*Priority:* Critical. *Traceability:* ADR-004 §4.1; AIRequirements.md AI-018.

## 9. Reviewer Analytics (Workload and Quality, Not Surveillance)

**RI-022** — The engine may present reviewer analytics (e.g., average review time, correction categories, outstanding reviews) for the purpose of **workload planning and quality improvement**, and shall not be used or presented as a per-individual performance-surveillance mechanism.
*Priority:* Medium. *Traceability:* briefing V13; ProjectConstitution.md Commitment 1.

**RI-023** — Reviewer analytics that process staff personal data shall have a defined lawful basis and be handled per `PrivacyRequirements.md`; the specific lawful-basis determination and retention for such analytics are deferred to `07-Privacy-Compliance/`.
*Priority:* Medium. *Traceability:* PrivacyRequirements.md; POPIA.

## 10. Open Items

1. Confidence categories and the mechanism for representing/deriving confidence (RI-004) depend on the AI confidence-representation question tracked as AR-072 and the performance/threshold question AR-076; neither is fixed here.
2. The heat-map granularity and difference-classification taxonomy (RI-014, RI-015) are design-level and deferred to `04-Design/`.
3. The lawful basis and retention for reviewer analytics (RI-023) are deferred to `07-Privacy-Compliance/`.
4. Acceptance criteria for the RI "assist, never decide" guarantees (RI-001–RI-003) will be authored alongside the AcceptanceCriteria coverage pass (AR-084), reusing AC-042 where applicable.

## 11. Challenge the Design

Before this document is approved:

1. Is there any engine feature (RI-004–RI-020) that could, in some configuration, apply a change to the record without a human action? (There must not be.)
2. Do the analytics requirements (RI-022) have adequate guardrails against becoming individual surveillance?
3. Does any efficiency tool (queue, heat map, focus mode) risk steering a Reviewer to *skip* segments in a way that undermines review completeness?
4. Are all confidence categories/thresholds kept configurable/empirical rather than hard-coded?
5. What is deferred (confidence representation, analytics lawful basis, heat-map design) and is each flagged?

## 12. Revision History

| Version | Date | Summary | Author |
|---|---|---|---|
| 0.1.0 | 2026-07-20 | Initial Review Intelligence Engine requirements (RI-001–RI-023): the reviewer-assistance layer over the ratified review workflow. Foundational "assist, never decide" constraint (non-binding outputs, no auto-apply, AI-generated marking retained); prioritization/explanation (confidence-by-category, plain-language flags, evidence panel); efficiency tools (contextual playback, review queue, focus mode, keyboard review, review modes, heat map); review structure (difference viewer, typed notes, quality checklist, recommendation surface); controlled-learning proposals; pause/resume continuity; RBAC-scoped surfacing; workload-not-surveillance analytics. Introduces RI-### prefix. Thresholds/confidence representation deferred (AR-076/AR-072); analytics lawful basis deferred. | Dr Ziyaad Moolla (ZM) |

---

*End of Document — PEKB-02-REQ-010 — Project Echo Review Intelligence Engine Requirements — PE-2026.001-ZM*
