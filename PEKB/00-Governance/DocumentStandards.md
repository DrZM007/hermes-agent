# Project Echo — Document Standards

## Document Metadata

| Field | Value |
|---|---|
| Document ID | PEKB-00-GOV-005 |
| Document Title | Document Standards |
| PEKB Section | 00-Governance |
| Version | 0.1.0 |
| Status | Draft |
| Classification | Internal — Governance |
| Owner Role | Technical Documentation Lead |
| Approval Required From | Principal Software Architect |
| Related Documents | ProjectConstitution.md, RevisionPolicy.md, Glossary.md |
| Original Creator | Dr Ziyaad Moolla |
| Creator ID | ZM |
| Document Provenance | PE-2026.001-ZM |

---

## 1. Purpose of This Document

This document defines the structural, formatting, metadata, and lifecycle standards that all PEKB documents must follow. Its purpose is to make the PEKB consistent, navigable, and maintainable over years of evolution, in keeping with the Longevity and Documentation Equals Code commitments in `ProjectConstitution.md`.

## 2. Required Document Metadata

Every PEKB document must begin with a metadata block containing, at minimum, the following fields:

| Field | Description |
|---|---|
| Document ID | Unique identifier following the convention in Section 3 |
| Document Title | Human-readable title matching the filename's intent |
| PEKB Section | The numbered PEKB folder the document belongs to |
| Version | Semantic version per `RevisionPolicy.md` |
| Status | One of: Draft, In Review, Approved, Deprecated |
| Classification | Sensitivity/handling classification (e.g., Internal — Governance) |
| Owner Role | The governance role responsible for the document's accuracy |
| Approval Required From | Role(s) whose sign-off is required to advance status |
| Related Documents | Other PEKB documents this one depends on or is depended on by |
| Original Creator | Dr Ziyaad Moolla |
| Creator ID | ZM |
| Document Provenance | Build/release identifier under which the document was authored or last revised |

Documents missing required metadata are considered incomplete and must not be treated as authoritative.

## 3. Document ID Convention

Document IDs follow the pattern:

```
PEKB-<SectionNumber>-<SectionCode>-<SequenceNumber>
```

Where:
- `<SectionNumber>` is the two-digit PEKB folder number (e.g., `00`, `02`, `03`).
- `<SectionCode>` is a short uppercase code for the folder (e.g., `GOV` for Governance, `REQ` for Requirements, `ARC` for Architecture, `SEC` for Security, `PRIV` for Privacy-Compliance).
- `<SequenceNumber>` is a three-digit sequence unique within that section, assigned in authoring order.

Example: `PEKB-00-GOV-001` is the first document authored in `00-Governance`.

Section codes are recorded centrally in `Glossary.md` once that document is authored, to prevent duplicate or inconsistent codes.

## 4. Structural Standards

1. Every document begins with a Level-1 heading matching the Document Title, followed immediately by the metadata block.
2. Documents are organized into numbered sections (`## 1. ...`, `## 2. ...`) for stable cross-referencing.
3. Every document ends with a standard closing line identifying the Document ID, title, and provenance build identifier, in the form:
   `*End of Document — <Document ID> — <Document Title> — <Build ID>*`
4. Tables are used for structured, enumerable information (metadata, requirement lists, decision logs); prose is used for reasoning and explanation.
5. Cross-references to other PEKB documents use the exact filename (e.g., `ProjectConstitution.md`), not paraphrased titles, so references remain machine- and human-searchable.

## 5. Single Source of Truth Principle

Project Echo documentation must not duplicate the same fact in multiple locations. Specifically:

1. Each fact, rule, or decision has exactly one authoritative home document.
2. Other documents that need to reference that fact must link/cite the authoritative document rather than restating the fact in their own words.
3. Where a restatement is necessary for readability, it must be clearly marked as a summary and cite its authoritative source (e.g., "See `SecurityRequirements.md` §4 for the authoritative control list.").
4. If duplication is discovered, it is treated as a defect and corrected by removing the non-authoritative copy, not by trying to keep both in sync manually.

## 6. Document Lifecycle and Status

Every PEKB document moves through the following statuses:

1. **Draft** — actively being authored or revised; not yet suitable as a basis for implementation decisions.
2. **In Review** — complete draft submitted to the required approvers listed in its metadata.
3. **Approved** — signed off by all required approvers; authoritative for engineering and architecture decisions.
4. **Deprecated** — superseded or no longer applicable; retained for historical/audit purposes but no longer authoritative.

Status transitions, versioning rules, and change history requirements are governed in detail by `RevisionPolicy.md`.

## 7. Writing Standards

1. **Professional and precise.** Avoid marketing language, hype, and unqualified superlatives ("best-in-class," "cutting-edge") in favor of specific, verifiable statements.
2. **Implementation-independent where appropriate.** Documents in `00-Governance/`, `01-Product/`, and `02-Requirements/` describe *what* and *why*; they should avoid prescribing *how* unless the "how" is itself the requirement (e.g., a specific compliance obligation).
3. **Written for future maintainers**, not only for the current team. Assume the reader has no access to conversations or context outside the PEKB itself.
4. **Terminology consistency.** Terms defined in `Glossary.md` must be used consistently across all documents; local redefinition of a glossary term within another document is not permitted.
5. **No placeholder content presented as final.** Sections that are intentionally incomplete must be marked as such (e.g., "Pending — see Assumptions/Open Items") rather than left ambiguous.

## 8. Creator Provenance in Documentation

Per `CreatorProvenanceFramework.md` and `ProjectConstitution.md` §6, every PEKB document's metadata block must include the Original Creator (Dr Ziyaad Moolla) and Creator ID (ZM), and a Document Provenance field identifying the build/release identifier associated with the document's authorship or most recent substantive revision. This provenance is an attribution and audit record; it must never be used to gate access, alter behavior, or substitute for substantive version control history.

## 9. Relationship to Other PEKB Documents

- `RevisionPolicy.md` defines versioning mechanics and change history requirements in detail.
- `Glossary.md` is the authoritative source for all defined terms and section codes referenced here.
- `CreatorProvenanceFramework.md` is the authoritative source for provenance mechanics referenced in Section 8.
- All documents authored after this one must conform to these standards; any pre-existing document found not to conform should be corrected opportunistically, not left inconsistent.

---

*End of Document — PEKB-00-GOV-005 — Project Echo Document Standards — PE-2026.001-ZM*
