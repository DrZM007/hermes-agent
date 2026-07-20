# Project Echo — Definition of Ready, Definition of Done & Quality Gates

## Document Metadata

| Field | Value |
|---|---|
| Document ID | PEKB-00-GOV-017 |
| Document Title | Definition of Ready, Definition of Done & Quality Gates |
| PEKB Section | 00-Governance |
| Version | 0.1.0 |
| Status | Draft |
| Classification | Internal — Governance |
| Owner Role | QA Lead |
| Approval Required From | Principal Software Architect, Security Architect, Privacy Officer, Product Manager, Accessibility Specialist |
| Related Documents | ProjectConstitution.md, EngineeringPrinciples.md, DesignPrinciples.md, EthicalAICharter.md (00-Governance); AcceptanceCriteria.md, NonFunctionalRequirements.md (02-Requirements); all 03-Architecture baseline reviews |
| Original Creator | Dr Ziyaad Moolla |
| Creator ID | ZM |
| Document Provenance | PE-2026.001-ZM |

---

## 1. Purpose of This Document

This document defines the gates every unit of work must pass through in Project Echo: when work is allowed to **start** (Definition of Ready), when work is allowed to be called **complete** (Definition of Done), the ordered **Quality Gates** between those two points, and the **Red-Team Review** that must precede any milestone sign-off.

It is the operational enforcement of `ProjectConstitution.md` Commitment 12 (Quality Before Features) and Engineering-Conduct Rule 7 (no production code until the design is proven). It introduces no new product requirements; it defines *process discipline*, and every criterion below traces to a commitment or a ratified requirement.

## 2. The Five-Test Rule (Governing Definition of Done)

No feature is complete unless it simultaneously passes all five tests. This is the plain-language summary that the detailed checklists in Sections 3–5 make concrete:

1. **Useful** — it solves a genuine, documented user problem. *(Commitment: Product value; no invented requirements — Constitution §5 Rule 1.)*
2. **Usable** — users can understand and operate it without unnecessary training. *(Commitments 7 Accessibility, 13 Mistake Prevention.)*
3. **Secure** — it protects organizational data and follows least-privilege. *(Commitment 3 Security by Design.)*
4. **Maintainable** — future developers can understand, test, and modify it safely. *(Commitments 6 Simplicity, 9 Longevity.)*
5. **Verifiable** — it can be demonstrated, tested, audited, and documented objectively. *(Commitments 8 Transparency, 16 Measurable Trust, 10 Documentation Equals Code.)*

If any test fails, the work is not done, regardless of functional completeness or schedule pressure.

## 3. Definition of Ready (DoR)

Work on a module or capability may not begin implementation until **all** of the following exist and are sufficiently unambiguous. This gate enforces Constitution Engineering-Conduct Rule 7.

- [ ] Requirements exist in `02-Requirements/`, are numbered, and are traceable.
- [ ] Architecture for the capability is defined and reviewed in `03-Architecture/`.
- [ ] Data design (tables, relationships, classification, retention) is defined where the capability persists data.
- [ ] Security review of the design is complete (authentication, authorization, encryption, audit, attack surface).
- [ ] Privacy review is complete (classification, minimization, retention, deletion, logging).
- [ ] UX and accessibility of the design are reviewed.
- [ ] The threat model is updated to cover the capability.
- [ ] Tests are defined (what will be verified, at which levels).
- [ ] A documentation outline exists.
- [ ] No open assumption in `AssumptionsRegister.md` blocks the capability (or the blocking assumption is explicitly accepted as a risk by the appropriate role).

Only when the DoR is met may implementation start. A gap in any item is surfaced and resolved, never assumed away.

## 4. Definition of Done (DoD)

A module or capability is complete only when **all** of the following are true. A module that merely compiles is **not** done.

- [ ] Feature works against its acceptance criteria.
- [ ] Tests written and passing (unit, integration, and any capability-specific levels per Section 5).
- [ ] Security reviewed; no known unmitigated security defect.
- [ ] Privacy reviewed; classification, retention, and logging behavior verified.
- [ ] Performance validated against its stated budget (budgets are measured, not guessed; see AR-076 for unresolved thresholds).
- [ ] Accessibility verified (keyboard operation, focus order, contrast, screen-reader text, color-independent indicators).
- [ ] Documentation complete (user, administrator, and troubleshooting as applicable).
- [ ] Interactive walkthrough updated where the capability changes user-facing behavior.
- [ ] PDF/offline guide updated where applicable.
- [ ] Logging implemented to the standard.
- [ ] Audit events implemented and verified for every consequential action.
- [ ] Recovery/rollback behavior tested where the capability touches persisted state.
- [ ] Deployment and, where applicable, backup/restore tested.
- [ ] Reviewed and approved by the required roles.

## 5. Quality Gates (Ordered)

Every capability proceeds through these gates in order. A gate that fails returns the work to the appropriate earlier stage; gates are not skipped and are not waived under schedule pressure (Constitution Commitment 12).

1. Requirements review
2. Architecture review
3. Implementation
4. Unit tests
5. Integration tests
6. Security tests
7. Privacy review
8. Accessibility review
9. Performance review
10. Documentation review
11. Compliance review (POPIA, retention, audit completeness)
12. Final review and approval
13. Merge / release

Each of the review gates (1, 2, 6–12) corresponds to one of the standing review perspectives — Architecture, Security, Privacy, Accessibility, UX, AI-Ethics — that map onto the eleven governance roles in `ProjectConstitution.md` §4. No single role may waive another role's gate without a documented resolution.

## 6. Red-Team Review (Milestone Gate)

Before any milestone is declared complete, the work is deliberately challenged by asking — and answering with a mitigation or a recorded residual risk — at least the following:

- How could an attacker abuse this?
- How could a user accidentally lose data?
- What if the AI is wrong?
- What if the server fails during an approval?
- What if synchronization conflicts occur?
- What if an update is interrupted?
- What if a reviewer makes a mistake?
- What if a device is lost or stolen?
- What if an insider misuses their permissions?
- What if regulations change?

Each answer produces either a mitigation (folded back into requirements/design) or an explicitly documented residual risk recorded in the risk register. A milestone with unanswered Red-Team questions is not complete.

## 7. Relationship to Other PEKB Documents

- This document enforces `ProjectConstitution.md` Commitment 12 and Engineering-Conduct Rule 7; the Constitution governs if they conflict.
- The verification levels referenced here (unit → disaster-recovery → upgrade → backup/restore → synchronization tests) are elaborated in the forthcoming `09-Testing/` documents; this document defines *which gates exist*, not the full test strategy.
- Acceptance criteria referenced by the DoD live in `02-Requirements/AcceptanceCriteria.md`.
- Performance budgets referenced by the DoD remain empirically unresolved under `AssumptionsRegister.md` AR-076 and are not fixed here.

## 8. Open Items

1. The mapping from each Quality Gate to the specific `09-Testing/` procedure that satisfies it is pending authoring of the testing documents.
2. The risk register that receives Red-Team residual risks (Section 6) is referenced in the briefing but not yet a discrete PEKB document; it is queued.

## 9. Challenge the Design

Before this document is approved:

1. Is any DoR/DoD item unverifiable as written (a checkbox no one can objectively confirm)?
2. Can the gate sequence in Section 5 be simplified without losing a necessary check?
3. Does any gate duplicate another, creating process cost without added assurance?
4. Are the Red-Team questions sufficient for a regulated healthcare/research context, or is one missing?
5. What have we assumed about who performs each review when one person holds several roles?

## 10. Revision History

| Version | Date | Summary | Author |
|---|---|---|---|
| 0.1.0 | 2026-07-20 | Initial Definition of Ready, Definition of Done, ordered Quality Gates, five-test rule, and Red-Team milestone review. Consolidates briefing Versions 19–20; enforces Constitution Commitment 12 and Engineering-Conduct Rule 7. Records open items (testing-procedure mapping, risk register). | Dr Ziyaad Moolla (ZM) |

---

*End of Document — PEKB-00-GOV-017 — Project Echo Definition of Ready, Definition of Done & Quality Gates — PE-2026.001-ZM*
