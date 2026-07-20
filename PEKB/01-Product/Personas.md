# Project Echo — Personas

## Document Metadata

| Field | Value |
|---|---|
| Document ID | PEKB-01-PRD-005 |
| Document Title | Personas |
| PEKB Section | 01-Product |
| Version | 0.1.0 |
| Status | Draft |
| Classification | Internal — Product |
| Owner Role | Product Manager |
| Approval Required From | UX Lead, Accessibility Specialist |
| Related Documents | Stakeholders.md, Vision.md, Scope.md, UXRequirements.md (02-Requirements, pending) |
| Original Creator | Dr Ziyaad Moolla |
| Creator ID | ZM |
| Document Provenance | PE-2026.001-ZM |

---

## 1. Purpose of This Document

This document describes illustrative user archetypes ("personas") for Project Echo's Direct User stakeholder category (see `Stakeholders.md` §3), to give product, UX, and accessibility work a concrete basis for design decisions. These personas are **illustrative and provisional** — they are constructed from the product context and principles established so far (varying technical skill levels, enterprise context, review-workflow roles) rather than from confirmed user research, and must be validated or revised once real user research is available.

Per `00-Governance/EngineeringPrinciples.md` §4, no persona detail here should be treated as a confirmed requirement; personas inform design discussion, they do not themselves constitute `UXRequirements.md`.

## 2. How These Personas Were Constructed

Each persona corresponds to a Direct User stakeholder role identified in `Stakeholders.md` §3, elaborated with a plausible technical skill level and working context consistent with:

1. The stated UX principle that users may not have advanced computer knowledge (`00-Governance/ProjectConstitution.md`, User Experience Principles).
2. The Enterprise First and Accessibility commitments.
3. The Review Workflow (Draft → Reviewed → Approved → Archived).

No persona includes invented organizational, demographic, or behavioral detail beyond what is needed to illustrate the corresponding stakeholder role's interaction with Project Echo.

## 3. Persona: The Meeting Owner

| Attribute | Description |
|---|---|
| Corresponding Stakeholder | Meeting Owner (`Stakeholders.md` §3) |
| Role Context | Accountable for a specific meeting's record; may or may not personally perform detailed transcript correction. |
| Technical Skill Level | Moderate to low; comfortable with everyday business software, not expected to understand AI/transcription mechanics. |
| Primary Goals | Ensure a meeting they are accountable for produces an accurate, approved record with minimal personal effort. |
| Key Interactions | Initiating capture, assigning reviewers, monitoring review workflow progress, final approval. |
| Pain Points This Persona Represents | Difficulty trusting an AI-generated draft without clear indication of what needs review; uncertainty about who else can see or edit the record. |
| Design Implication | Needs clear status visibility (Draft/Reviewed/Approved/Archived) and confidence-inspiring cues about review completeness, without requiring understanding of the underlying AI. |

## 4. Persona: The Transcript Reviewer

| Attribute | Description |
|---|---|
| Corresponding Stakeholder | Transcript Reviewer (`Stakeholders.md` §3) |
| Role Context | Performs the detailed work of correcting transcript errors, adding comments, and comparing revisions. |
| Technical Skill Level | Varies widely — this persona represents the higher end of frequency-of-use, but not necessarily higher technical sophistication. |
| Primary Goals | Correct errors efficiently, flag ambiguous or sensitive content, track what has and hasn't been reviewed. |
| Key Interactions | Editing transcript text, reviewing AI suggestions, comparing revisions, tracking changes, adding comments. |
| Pain Points This Persona Represents | Fatigue from repetitive correction work; difficulty distinguishing AI-suggested content from confirmed human-edited content; losing track of review progress across a long transcript. |
| Design Implication | Needs clear visual distinction between AI-generated and human-confirmed content, efficient correction tools, and reliable progress tracking. |

## 5. Persona: The Approver

| Attribute | Description |
|---|---|
| Corresponding Stakeholder | Approver (`Stakeholders.md` §3) |
| Role Context | Holds authority to finalize a transcript as an organizational record; may be a manager, compliance-adjacent role, or the Meeting Owner themselves, pending resolution of AR-004/AR-023. |
| Technical Skill Level | Moderate; likely to be a less frequent user of the platform than the Transcript Reviewer. |
| Primary Goals | Confirm the transcript is accurate and appropriate to finalize, without needing to redo the Reviewer's detailed correction work. |
| Key Interactions | Reviewing summarized review status, spot-checking content, approving or rejecting/returning for further review. |
| Pain Points This Persona Represents | Uncertainty about how much of the document has actually been human-reviewed versus still AI-original; accountability concern about approving something not fully verified. |
| Design Implication | Needs a clear, trustworthy summary of review completeness and change history before approval, not just a single "approve" action with no context. |

## 6. Persona: The Knowledge Consumer

| Attribute | Description |
|---|---|
| Corresponding Stakeholder | Knowledge Consumer (`Stakeholders.md` §3) |
| Role Context | Did not attend the original meeting; later needs to find and understand what was discussed/decided. |
| Technical Skill Level | Varies widely; represents the broadest and least specialist audience for the platform. |
| Primary Goals | Quickly find relevant historical meeting knowledge and trust that it reflects an approved, accurate record. |
| Key Interactions | Search, browsing archived records, reading summaries and action items. |
| Pain Points This Persona Represents | Difficulty finding relevant content without knowing exact meeting names/dates; uncertainty about whether a found record is a final approved version or an in-progress draft. |
| Design Implication | Needs clear indication of record status (e.g., Archived/Approved vs. still in review) wherever content is surfaced via search, and accessible search/navigation regardless of technical skill level. |

## 7. Cross-Persona Accessibility Consideration

All four personas are explicitly assumed to include individuals who may need accessible design accommodations (per the Accessibility commitment in `00-Governance/ProjectConstitution.md` §3.7). No persona in this document should be read as technically expert by default; UX and Accessibility work should design for the described skill levels as a ceiling, not a floor.

## 8. Open Items

1. These personas are illustrative, not derived from confirmed user research or organizational data; they require validation once real user research becomes available.
2. Whether Meeting Owner, Transcript Reviewer, and Approver are always distinct individuals, or frequently the same person wearing multiple hats, is unconfirmed and affects UX flow design (overlaps AR-004, AR-023).
3. IT Administrator, Security Function, and Privacy/Compliance Function (from `Stakeholders.md` §4) are not represented as personas here because they are not Direct Users of the meeting-review interface; whether they need administrative-console-specific personas is a future open item once administrative functionality is scoped.

These are tracked in `00-Governance/AssumptionsRegister.md`.

## 9. Relationship to Other PEKB Documents

- `Stakeholders.md` §3 is the authoritative source for the Direct User roles this document elaborates.
- `04-Design/UXPrinciples.md` and `04-Design/Accessibility.md` (pending) should design against these personas' stated skill levels and pain points.
- `02-Requirements/UXRequirements.md` (pending) should derive testable requirements informed by, but not limited to, the design implications noted per persona.

---

*End of Document — PEKB-01-PRD-005 — Project Echo Personas — PE-2026.001-ZM*
