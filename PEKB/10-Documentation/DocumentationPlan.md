# Project Echo — Documentation Plan

## Document Metadata

| Field | Value |
|---|---|
| Document ID | PEKB-10-DOC-001 |
| Document Title | Documentation Plan |
| PEKB Section | 10-Documentation |
| Version | 0.1.0 |
| Status | Draft |
| Classification | Internal — Documentation |
| Owner Role | Technical Documentation Lead |
| Approval Required From | Product Manager, UX Lead, Accessibility Specialist, QA Lead |
| Related Documents | ProjectConstitution.md, DocumentStandards.md, EngineeringQualityGates.md (00-Governance); UXRequirements.md (02-Requirements); ProductCharter.md (01-Product); ReleaseStrategy.md (11-Roadmap) |
| Original Creator | Dr Ziyaad Moolla |
| Creator ID | ZM |
| Document Provenance | PE-2026.001-ZM |

---

## 1. Purpose and Scope

This document defines how Project Echo's **user- and administrator-facing documentation and in-product learning** are produced and kept current. It realizes Foundational Commitment 10 (Documentation Equals Code) — a feature is not complete until its documentation is complete — and the product-owner briefing's emphasis (Versions 5, 6, 18) on documentation and learning as first-class build deliverables.

It concerns *product* documentation (what users and administrators read/see). The internal engineering documentation *is* the PEKB, governed by `DocumentStandards.md`; this plan does not restate that.

## 2. Documentation as a Build Deliverable

**DOC-001** — No feature is "done" until its documentation is complete (`EngineeringQualityGates.md` DoD). For every feature this includes, as applicable: user guide, administrator guide, troubleshooting guide, interactive walkthrough updates, "What's New" release-note entry, API/interface documentation (where applicable), and accessibility notes.
*Traceability:* ProjectConstitution.md Commitment 10; EngineeringQualityGates.md; briefing V5/V18.

**DOC-002** — Documentation is **version-locked** to the software: each document states the product version it applies to, and a walkthrough/manual is updated in the same change as the behavior it describes, never after.
*Traceability:* briefing V5 (version-locked docs); DOC-001.

## 3. Documentation Set

| Artifact | Audience | Notes |
|---|---|---|
| User Guide | Reviewers, Meeting Owners, Knowledge Consumers | Task-oriented; plain language (briefing V6 Plain-Language) |
| Administrator Guide | Org/System Administrators | Roles, policy/workflow config, retention, backups; hosts the Information Officer guidance referenced by `07-Privacy-Compliance/POPIAComplianceMapping.md` |
| Troubleshooting Guide | All + IT | Common issues, diagnostics, links to `08-Operations/` runbooks |
| Interactive Walkthroughs | First-time & new-feature users | Dismissible; never re-appear once dismissed (AC-033) |
| PDF / offline manuals | Regulated/offline sites | Accurate offline export of the above |
| Tutorial videos (optional) | Visual learners | Captioned (accessibility) |
| Release Notes / Changelog | Administrators | Per `ReleaseStrategy.md` RDM-006 |
| Glossary (product) | All | Plain-language product terms |

## 4. Learning Centre

**DOC-003** — An in-product **Learning Centre** shall provide walkthroughs, training, documentation, videos (captioned), and a glossary, accessible without leaving the application, with content appropriate to the user's role.
*Traceability:* briefing V5 (Learning & Support Centre); UXRequirements.md.

**DOC-004** — Guidance shall be **adaptive and non-intrusive**: context-sensitive help offered when a user appears to need it, always dismissible, never repeating after dismissal unless the user resets tutorials; adaptive onboarding must be disableable for sites requiring a fixed UI.
*Traceability:* briefing V6/V19; AC-033.

## 5. Accessibility of Documentation

**DOC-005** — Documentation and learning content shall themselves meet accessibility expectations: plain language, captions on videos, alternative text on illustrations, keyboard-navigable help, and readable structure — consistent with `UXRequirements.md` §11 and the "accessibility beyond compliance" stance.
*Traceability:* UXRequirements.md §11; briefing V19.

## 6. Documentation Certification (release gate)

**DOC-006** — Before a production release, documentation certification confirms: user/administrator/developer/troubleshooting guides complete, walkthroughs complete, PDF exports accurate, API docs complete (where applicable), and version numbers synchronized. Incomplete documentation blocks the release (`ReleaseStrategy.md` RDM-005).
*Traceability:* briefing V20 (documentation certification); ReleaseStrategy.md RDM-005.

## 7. Open Items

1. The concrete content of each artifact is produced alongside the feature it documents (Phases 2–5); this plan defines the set and the discipline.
2. `AdministratorGuide.md` (referenced here and by `08-Operations/`) is pending.
3. Whether tutorial videos are provided, and their production approach, is an organizational/build decision; the storage footprint must respect the Zero-IT-Friction/offline constraints.

## 8. Challenge the Design

1. Does the DoD truly block a feature whose documentation is incomplete (DOC-001)?
2. Is version-locking (DOC-002) enforceable, or could docs drift from behavior?
3. Is adaptive guidance (DOC-004) genuinely non-intrusive and disableable for regulated sites?
4. Is the documentation itself held to the accessibility bar (DOC-005)?
5. What is deferred (artifact content, AdministratorGuide, videos) and is each flagged?

## 9. Revision History

| Version | Date | Summary | Author |
|---|---|---|---|
| 0.1.0 | 2026-07-20 | Initial Documentation Plan: documentation as a build deliverable (Commitment 10; DoD-blocking), version-locked to the software; the documentation set (user/admin/troubleshooting/walkthroughs/PDF/videos/release notes); the in-product adaptive, non-intrusive Learning Centre; accessibility of documentation itself; and the documentation-certification release gate. Establishes 10-Documentation. Artifact content produced alongside features; AdministratorGuide deferred. | Dr Ziyaad Moolla (ZM) |

---

*End of Document — PEKB-10-DOC-001 — Project Echo Documentation Plan — PE-2026.001-ZM*
