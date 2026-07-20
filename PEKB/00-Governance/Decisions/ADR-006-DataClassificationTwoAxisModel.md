# ADR-006 — Data Classification (Two-Axis Model)

## Document Metadata

| Field | Value |
|---|---|
| Document ID | PEKB-00-GOV-019 |
| Decision ID | ADR-006 |
| Document Title | Data Classification (Two-Axis Model) |
| PEKB Section | 00-Governance/Decisions |
| Version | 0.1.0 |
| Status | Proposed |
| Classification | Internal — Governance |
| Owner Role | Privacy Officer |
| Approval Required From | Principal Software Architect, Security Architect, Product Manager |
| Related Documents | ProjectConstitution.md, AssumptionsRegister.md (00-Governance); ADR-002-DeploymentModel.md, ADR-003-DataOwnershipGovernance.md, ADR-004-AccessControlRBACModel.md (00-Governance/Decisions); PrivacyRequirements.md, SecurityRequirements.md (02-Requirements); Scope.md (01-Product) |
| Original Creator | Dr Ziyaad Moolla |
| Creator ID | ZM |
| Document Provenance | PE-2026.001-ZM |

---

## 1. Context

`02-Requirements/PrivacyRequirements.md` §6 defines a ratified four-level **data classification framework** — C1 (Organizational Confidential), C2 (Personal Information), C3 (Sensitive Personal Information), C4 (Audit/Governance Metadata). This framework is indexed as decision #5 in `ArchitectureDecisionIndex.md` and drives retention, consent, data-subject-rights, and access requirements. It classifies data by **what kind of data it is** — its privacy/data-type character.

The product-owner briefing (notably the governance chapters, Versions 12 and 16) introduced a **second** classification vocabulary — Public, Internal, Confidential, Restricted, Highly Restricted — that automatically drives **permissions, watermarks, export eligibility, approval requirements, printing rules, and retention defaults**. This classifies data by **how sensitive it is to handle and disclose** — its business-sensitivity/handling character.

These two vocabularies were flagged during the briefing as a potential conflict. They are not the same axis: a routine board decision may be *business-Highly-Restricted* yet contain no personal information (C1), while an ordinary staff meeting transcript is *Personal Information* (C2) but only *business-Confidential*. Collapsing them into one scale would either over-restrict ordinary personal content or under-protect highly sensitive non-personal content. This ADR resolves how the two coexist.

## 2. Problem

Decide, at a strategic level:

1. Do the C1–C4 data-classification levels and the Public→Highly-Restricted sensitivity labels describe the same thing or different things?
2. If different, how do they coexist on a single meeting/artifact without contradiction, and which governs when a control (e.g., export approval) is driven by both?
3. Where does each axis's authoritative definition and handling rules live?

## 3. Options Considered

### Option A — Replace C1–C4 with the five-level sensitivity scheme
Adopt Public/Internal/Confidential/Restricted/Highly Restricted as the single classification framework.

- **Pros:** One vocabulary; matches common enterprise DLP labelling.
- **Cons:** Discards the POPIA-aligned data-type semantics (C2/C3) that retention, consent, and data-subject-rights requirements in `PrivacyRequirements.md` depend on; a "Highly Restricted" label says nothing about whether the content is *personal information* subject to POPIA. Rejected — would break ratified privacy requirements.

### Option B — Keep only C1–C4 and fold business sensitivity into it
Map "Restricted/Highly Restricted" onto C-levels.

- **Pros:** Retains the ratified framework unchanged.
- **Cons:** Conflates two independent concerns; forces non-personal-but-sensitive content (a confidential financial figure with no personal data) into a "personal information" level it doesn't belong in, or invents C-level meanings that contradict §6. Rejected.

### Option C — Two orthogonal axes
Retain C1–C4 as **Axis 1 (Data Classification — privacy/data-type)**, unchanged, and add the five-level scheme as **Axis 2 (Sensitivity Label — business handling sensitivity)**. Every meeting/artifact carries a value on *each* axis; handling rules combine both.

- **Pros:** Neither concern is distorted; POPIA data-type semantics stay intact while business handling sensitivity gains a first-class, policy-driven home; matches how mature enterprise governance actually works (data-type classification and handling/sensitivity labels are standardly separate). Directly implements the reconciliation flagged during the briefing.
- **Cons:** Two axes are marginally more complex to explain to users; requires a clear rule for which axis governs a jointly-driven control. Both are addressed in Section 4.

## 4. Decision

**Project Echo adopts Option C: a two-axis data classification model.**

1. **Axis 1 — Data Classification (C1–C4).** Unchanged. Its authoritative home remains `PrivacyRequirements.md` §6. It classifies data by privacy/data-type character and drives retention, consent, data-subject rights, and minimization. It is largely **derived** from content (e.g., a recording is classified no lower than C2 by default, per PR-019).

2. **Axis 2 — Sensitivity Label (Public, Internal, Confidential, Restricted, Highly Restricted).** New. It classifies a meeting/artifact by business handling sensitivity and drives **permissions, watermarking, export eligibility, approval requirements, printing rules, and sensitivity-based retention defaults**, enforced through the enterprise governance/policy engine (`Scope.md` §2.13). It is primarily **assigned** — by the meeting owner at creation (often via a meeting-template default), constrained and overridable per organization policy.

3. **Orthogonality.** The two axes are independent. Every meeting and every derived artifact carries exactly one Axis-1 value and exactly one Axis-2 value. Neither is inferred from the other; e.g., "Highly Restricted" does not imply C3, and C1 does not imply "Public."

4. **Combination rule (which axis governs).** Where a single control is driven by both axes, the **more restrictive requirement of the two applies** — the axes tighten controls, never relax them. Examples: export of content that is C3 (Axis 1) *or* Restricted/Highly Restricted (Axis 2) requires the heightened approval of whichever axis demands it; a control required by C-level is never waived because the Sensitivity Label is lower, and vice versa.

5. **Inheritance.** Consistent with PR-036 (no classification laundering), a derived artifact (summary, action item, evidence package) inherits **both** the Axis-1 classification and the Axis-2 label of its most-sensitive source; it is never assigned a lower value on either axis by default.

6. **Authoritative homes.** Axis 1 stays in `PrivacyRequirements.md` §6. Axis 2's levels are established by this ADR; its detailed, numbered handling requirements (which permissions/watermarks/export/print/approval each label triggers) are **pending** and will be authored in `SecurityRequirements.md` (access/export/watermark controls) and `PrivacyRequirements.md` (sensitivity-based retention defaults), cross-referencing this ADR. No document may redefine either axis's levels; they reference these homes (`DocumentStandards.md` §5).

## 5. Rationale

The two vocabularies answer different questions — *what kind of data is this?* (POPIA-facing) versus *how sensitive is it to handle and disclose?* (governance-facing). Keeping them as separate axes preserves the ratified, POPIA-aligned C1–C4 semantics that retention/consent/DSR requirements already depend on, while giving the briefing's business-sensitivity labels a first-class, policy-enforced home. The "more restrictive of the two governs" rule keeps the model safe by construction: adding an axis can only tighten handling, never weaken it, consistent with Constitution Commitment 3 (Security by Design) and the Section 2A precedence of *Privacy* and *Security* before convenience.

## 6. Consequences

1. `PrivacyRequirements.md` §6 gains a note establishing that C1–C4 is Axis 1 of a two-axis model per this ADR; its content is otherwise unchanged and remains authoritative for Axis 1.
2. `SecurityRequirements.md` must author numbered requirements defining, for each Axis-2 Sensitivity Label, the permissions/watermark/export/print/approval controls it triggers, and must implement the "more restrictive governs" combination rule (Section 4.4).
3. The enterprise governance/policy engine (`Scope.md` §2.13) is the enforcement point for Axis-2-driven controls; classification labels must be explicit, inspectable state (per `DesignPrinciples.md` §3.12), not inferred.
4. Meeting templates (`Scope.md`, briefing V12) may set a default Sensitivity Label per meeting type; the default is a starting point, overridable within policy, never a ceiling that weakens Axis-1 handling.
5. `ArchitectureDecisionIndex.md` decision #5 is updated to note the two-axis model.
6. Any future change to either axis's level set requires an amendment to its authoritative home (and, for the model itself, to this ADR).

## 7. Risks

| Risk | Likelihood | Impact | Notes |
|---|---|---|---|
| Users conflate the two axes ("isn't Restricted the same as C3?"), mislabelling content. | Medium | Medium | UX must present them as distinct with plain-language help; the two-axis distinction is explained once, not repeated per screen. |
| Implementers apply only one axis to a jointly-driven control, weakening handling. | Medium | High | The "more restrictive governs" rule (4.4) must be a tested acceptance criterion in `SecurityRequirements.md`. |
| Axis-2 handling requirements drift or get redefined in multiple documents. | Low | Medium | Single-source-of-truth: Axis-2 handling lives in `SecurityRequirements.md`/`PrivacyRequirements.md` only, referencing this ADR. |

## 8. Related Requirements

- `02-Requirements/PrivacyRequirements.md` §6 (Axis 1; sensitivity-based retention defaults for Axis 2)
- `02-Requirements/SecurityRequirements.md` (Axis-2 handling controls; combination rule)
- `01-Product/Scope.md` §2.13 (policy engine as enforcement point), §2.19 (export/redaction)
- `00-Governance/Decisions/ADR-004-AccessControlRBACModel.md` (permissions that Axis 2 modulates)

## 9. Assumptions Updated

- This ADR does not resolve `AssumptionsRegister.md` AR-076 (performance) or introduce new numeric thresholds.
- New open item: the per-label handling matrix (Axis 2) is **pending** authoring in `SecurityRequirements.md`/`PrivacyRequirements.md`; until authored, Axis 2's levels exist but their triggered controls are not yet specified. This is recorded as a requirements-pending item, not a resolved control set.

## 10. Challenge the Design

Before this ADR is approved:

1. Are the two axes genuinely orthogonal, or is there a case where one truly determines the other (which would argue for one axis)?
2. Is "more restrictive of the two governs" (4.4) always the safe rule, or is there a control where it produces an absurd result?
3. Does adding Axis 2 create any path to *lower* handling than C1–C4 alone required? (It must not.)
4. Is the assignment model (Axis 1 derived, Axis 2 assigned) correct, or are there Axis-1 values that must be assigned or Axis-2 values that must be derived?
5. What have we left pending (the Axis-2 handling matrix), and is that clearly flagged rather than presented as complete?

## 11. Revision History

| Version | Date | Summary | Author |
|---|---|---|---|
| 0.1.0 | 2026-07-20 | Initial ADR-006: adopt a two-axis data classification model. Axis 1 = C1–C4 (privacy/data-type, unchanged, home in PrivacyRequirements §6); Axis 2 = Public/Internal/Confidential/Restricted/Highly Restricted (business handling sensitivity, new, enforced via the policy engine). Axes are orthogonal; the more restrictive of the two governs any jointly-driven control; derived artifacts inherit both. Axis-2 handling matrix flagged as requirements-pending. Reconciles the two classification vocabularies raised during the briefing without weakening ratified privacy semantics. | Dr Ziyaad Moolla (ZM) |

---

*End of Document — PEKB-00-GOV-019 — ADR-006 — Data Classification (Two-Axis Model) — PE-2026.001-ZM*
