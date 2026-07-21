# ADR-001 — AI Processing Model

## Document Metadata

| Field | Value |
|---|---|
| Document ID | PEKB-00-GOV-010 |
| Decision ID | ADR-001 |
| Document Title | AI Processing Model |
| PEKB Section | 00-Governance/Decisions |
| Version | 0.2.0 |
| Status | Accepted |
| Classification | Internal — Governance |
| Owner Role | AI/ML Architect |
| Approval Required From | Principal Software Architect, Privacy Officer, Security Architect, Product Manager |
| Related Documents | ProjectConstitution.md, ProjectPhilosophy.md, Scope.md (01-Product), AssumptionsRegister.md |
| Original Creator | Dr Ziyaad Moolla |
| Creator ID | ZM |
| Document Provenance | PE-2026.001-ZM |

---

## 1. Context

Project Echo's Offline First commitment (`00-Governance/ProjectConstitution.md` §3.4) states that core functionality should operate without internet connectivity wherever technically feasible. At the same time, Project Echo's core value depends on AI capabilities — transcription, speaker identification, summarization, action item extraction, and insights — whose achievable accuracy is generally influenced by model scale, and high-accuracy models are frequently large, resource-intensive, or hosted rather than local.

This tension was identified as an unresolved, high-risk assumption in `00-Governance/AssumptionsRegister.md` (AR-001, AR-025) and in Project Echo Foundation Review v0.1 (Required Decision #1). It blocks meaningful progress on `02-Requirements/AIRequirements.md`, `02-Requirements/NonFunctionalRequirements.md`, and any future `03-Architecture/AIArchitecture.md`, because none of those documents can define testable requirements without knowing whether AI processing is permitted to leave the local device/organization boundary, and under what conditions.

## 2. Problem

Define, at a strategic product/architecture level (not implementation level), what Project Echo's AI processing model is:

1. Must AI capabilities (transcription, speaker identification, summarization, action items, insights) run entirely offline/on-device in all cases?
2. Or may Project Echo use networked/cloud-hosted AI processing under some conditions, and if so, what governs when that is permitted?
3. How does the answer interact with the Privacy First and Enterprise First commitments, and with the constraint that meeting data must not leave the organization's controlled environment "unless explicitly configured and approved" (per the governing product context)?

This decision does not select specific models, vendors, or runtime technologies — those are implementation decisions for `03-Architecture/AIArchitecture.md`, made only after this strategic question is resolved.

## 3. Options Considered

### Option A — Fully Offline, No Exceptions
All AI processing (transcription, speaker ID, summarization, action items, insights) must run entirely on-device/on-premises, with no networked AI processing permitted under any configuration.

- **Pros:** Simplest privacy posture; strongest alignment with Offline First taken literally; no data-leaves-org risk to govern at all.
- **Cons:** May permanently cap achievable transcription/summarization quality relative to what larger hosted models could provide; removes future flexibility for organizations that would willingly accept a governed hybrid option; risks conflating "Offline First" (a default/preference) with "Offline Only" (an absolute constraint), which is a stronger reading than the Constitution's wording ("wherever technically feasible") requires.

### Option B — Cloud-First with Optional Offline Mode
AI processing defaults to networked/cloud-hosted processing, with local/offline processing available only as an opt-in alternative.

- **Pros:** Likely maximizes achievable AI quality by default; may simplify initial delivery if hosted processing is easier to stand up than on-device processing.
- **Cons:** Directly contradicts the Offline First commitment's clear intent (offline as the default, not the exception); contradicts the Privacy First default-safe posture (data leaving the organization would be the default behavior, not a deliberate exception); rejected as inconsistent with governance.

### Option C — Offline-First Hybrid Model (Governed Opt-In Cloud Processing)
AI processing runs on-device/on-premises by default for all in-scope capabilities. Networked/cloud-hosted AI processing is permitted only as an explicit, organization-level, opt-in configuration — disabled by default — subject to the same "explicitly configured and approved" governance already required for Controlled Export (`Scope.md` §2.11).

- **Pros:** Preserves Offline First as the actual default behavior, not merely an available mode; preserves Privacy First's default-safe posture; gives organizations with different risk tolerances or accuracy needs a governed path to higher-capability processing without weakening the default for everyone else; consistent with the literal Constitution wording ("wherever technically feasible" implies exceptions are anticipated, but only as exceptions).
- **Cons:** Requires two processing paths to be supported at requirements/architecture level (adds scope compared to Option A); requires a clear governance mechanism (org-level configuration + approval + audit) to prevent the opt-in from becoming a silent default.

## 4. Decision

**Project Echo adopts Option C: an Offline-First Hybrid AI Processing Model.**

1. All in-scope AI capabilities (transcription, speaker identification, summarization, action item extraction, insights/search assistance) must have an on-device/on-premises processing path that requires no external connectivity, and this path is the default for every organization unless explicitly reconfigured.
2. Networked/cloud-hosted AI processing may be offered as an additional processing path, but only:
   - as an explicit, organization-level opt-in (never a per-user or silent default),
   - subject to the same approval and audit expectations as Controlled Export (`01-Product/Scope.md` §2.11),
   - with the resulting data flow disclosed transparently to the organization enabling it (per the Transparency commitment).
3. No AI capability may be defined in `02-Requirements/` as requiring networked processing with no offline path, unless a future amendment to this ADR explicitly carves out an exception with documented rationale.

## 5. Rationale

This decision resolves the tension identified in Section 1 by treating "Offline First" as a statement about defaults and architecture priority, not an absolute prohibition on ever using networked processing — which is consistent with the Constitution's own wording ("wherever technically feasible"). It keeps Privacy First intact by ensuring the safer behavior (no data leaving the organization) is what happens automatically, and any weakening of that posture is a deliberate, visible, organization-level decision rather than a product default. It also avoids permanently foreclosing future accuracy improvements via optional hosted processing, without allowing that option to erode the product's core privacy posture for organizations that do not choose it.

## 6. Consequences

1. `02-Requirements/AIRequirements.md` must specify both an offline processing path and, separately, the governance conditions for any optional networked path, for each in-scope AI capability.
2. `02-Requirements/NonFunctionalRequirements.md` must define acceptable on-device resource/performance envelopes (storage, memory, latency) for the offline path, since this is now a binding default rather than an aspiration.
3. Future `03-Architecture/AIArchitecture.md` must design for two processing paths (offline default, governed optional networked) rather than a single path — this is a larger architecture scope than Option A would have required, and must be accounted for in planning.
4. `02-Requirements/PrivacyRequirements.md` must define the specific approval/consent/audit mechanism referenced in Section 4.2, reusing or extending the Controlled Export governance model rather than inventing a parallel one.
5. This decision does not by itself resolve model size, accuracy thresholds, or specific technology choices — those remain open for architecture-phase work once requirements exist.

## 7. Risks

| Risk | Likelihood | Impact | Notes |
|---|---|---|---|
| On-device AI quality may be insufficient for some organizations' needs even with the hybrid option available, if the offline path is under-resourced during architecture design. | Medium | Medium | Must be tracked as a requirement, not discovered late in architecture. |
| The "explicit, organization-level opt-in" governance for networked processing could be implemented in a way that is effectively defaulted-on by IT administrators for convenience, undermining the intent of this decision. | Medium | High | Requirements and UX design must make the opt-in state highly visible and auditable, not a buried settings toggle. |
| Supporting two processing paths increases engineering and QA surface area compared to a single-path model. | High | Medium | Accepted as a deliberate trade-off in Section 5; must be reflected in realistic scoping/estimation once architecture begins. |

## 8. Related Requirements

This decision is a direct input to the following pending documents, which must not contradict it:

- `02-Requirements/AIRequirements.md`
- `02-Requirements/NonFunctionalRequirements.md`
- `02-Requirements/PrivacyRequirements.md`
- `02-Requirements/SecurityRequirements.md` (for the governance/audit mechanism of the optional networked path)
- (Future) `03-Architecture/AIArchitecture.md`

## 9. Assumptions Updated

The following entries in `00-Governance/AssumptionsRegister.md` are resolved by this decision and must be updated to Resolution Status **Resolved**, with a cross-reference to `ADR-001`:

- **AR-001** — "Core functionality" for Offline First is now defined: all in-scope AI capabilities require an offline path by default; networked processing is a governed opt-in only.
- **AR-025** — Hybrid Processing adoption and governance is now defined per Section 4 of this ADR.

The following new open items are introduced by this decision and must be added to `AssumptionsRegister.md`:

- Specific on-device resource/performance thresholds for the offline path are not yet defined (deferred to `NonFunctionalRequirements.md`).
- The specific approval/audit mechanism for enabling the networked processing opt-in is not yet defined (deferred to `PrivacyRequirements.md`/`SecurityRequirements.md`).

---

## Ratification

**Ratified by the Product Owner on 2026-07-20.** Status changed Proposed → Accepted (v0.2.0). This decision is authoritative for all downstream work; amendments follow `RevisionPolicy.md`.

---

*End of Document — PEKB-00-GOV-010 — ADR-001 — AI Processing Model — PE-2026.001-ZM*
