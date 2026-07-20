# Project Echo — Creator Provenance Framework

## Document Metadata

| Field | Value |
|---|---|
| Document ID | PEKB-00-GOV-008 |
| Document Title | Creator Provenance Framework |
| PEKB Section | 00-Governance |
| Version | 0.1.0 |
| Status | Draft |
| Classification | Internal — Governance |
| Owner Role | Principal Software Architect |
| Approval Required From | Security Architect, Privacy Officer, DevOps/Deployment Engineer |
| Related Documents | ProjectConstitution.md, DocumentStandards.md, RevisionPolicy.md |
| Original Creator | Dr Ziyaad Moolla |
| Creator ID | ZM |
| Document Provenance | PE-2026.001-ZM |

---

## 1. Purpose of This Document

`ProjectConstitution.md` §6 establishes that Project Echo maintains a formal record of original creator provenance, and that this provenance must never interfere with functionality, security, performance, usability, or maintainability. This document defines the concrete framework for how that provenance is expressed, where it appears, how it is implemented, and the boundaries on its use.

## 2. Creator Identity

| Field | Value |
|---|---|
| Original Creator | Dr Ziyaad Moolla |
| Creator ID | ZM |

This identity is fixed and authoritative for all Project Echo provenance markers described in this document. It is not configurable per deployment, per organization, or per build.

## 3. Purpose of Provenance

Creator provenance in Project Echo serves exactly one purpose: **professional software provenance** — a durable, verifiable record of original authorship attached to versions, builds, documentation, and release artifacts, for attribution and audit continuity over the product's long lifespan (see the Longevity commitment, `ProjectConstitution.md` §3).

Provenance is explicitly **not**:

- A licensing or entitlement mechanism.
- A security or access-control mechanism.
- A telemetry or tracking mechanism.
- A mechanism that alters, gates, or conditions any product behavior.

## 4. Provenance Surfaces

Creator provenance appears in the following, and only the following, surfaces:

### 4.1 Version Identifiers
Product version strings append the Creator ID as a suffix:

```
Project Echo v1.2.0-ZM
```

Format: `<Product Name> v<MAJOR>.<MINOR>.<PATCH>-<CreatorID>`. This applies to the software product version, distinct from PEKB document versioning defined in `RevisionPolicy.md` §3.

### 4.2 Build Identifiers
Build identifiers follow the pattern:

```
PE-<Year>.<SequenceNumber>-ZM
```

Example: `PE-2026.001-ZM`. This identifier is used in release manifests, build metadata, and PEKB document provenance fields (see `DocumentStandards.md` §2).

### 4.3 Documentation Metadata
Every PEKB document's metadata block includes `Original Creator` and `Creator ID` fields, per `DocumentStandards.md` §2, and a `Document Provenance` field carrying the applicable Build Identifier.

### 4.4 Release Manifests
Software release manifests (to be formally specified in `05-Engineering/ReleaseStrategy.md`) must include the Build Identifier and Creator ID as a manifest field, alongside release contents, checksums, and change references.

### 4.5 Artifact Provenance
Distributable artifacts (installers, packaged builds) must carry the Build Identifier in a discoverable but non-intrusive location — for example, an "About" panel, a manifest file bundled with the artifact, or equivalent metadata field. The exact implementation mechanism is an architecture decision deferred to `03-Architecture/DeploymentArchitecture.md` (pending); see Section 6 (Acceptable Implementation Methods) for constraints on that decision.

## 5. Where Provenance Must Not Appear

To satisfy the "must never interfere" constraint in `ProjectConstitution.md` §6, provenance markers must **not**:

1. Appear inside user-facing meeting content, transcripts, summaries, or any organizational data artifact.
2. Be embedded in a way that requires network calls, external services, or added runtime dependencies to render or verify.
3. Be used as a license key, activation code, or feature-gating token.
4. Be logged, transmitted, or processed as part of any AI training, analytics, or telemetry pipeline.
5. Require elevated privileges to write, verify, or display, given the target environment constraints (no administrator rights) described in `ProjectIntent.md` and the Foundation Review.

## 6. Acceptable Implementation Methods

Provenance markers must be implemented using methods that are:

1. **Static and inert** — e.g., a constant string in version metadata, a field in a manifest or configuration file, a line in an "About" dialog — not executable logic that branches product behavior based on provenance state.
2. **Human-readable** — visible in plain text within manifests, About panels, or documentation, not obfuscated or encoded in a way that hinders auditability.
3. **Verifiable without special tooling** — a maintainer or auditor should be able to confirm the provenance marker's presence using standard tools (a text editor, a file properties dialog), not a proprietary decoder.
4. **Consistent with existing versioning/build tooling** — provenance suffixes must compose cleanly with whatever version-control and build-numbering approach is selected in `05-Engineering/ReleaseStrategy.md`, rather than requiring a bespoke parallel system.

The specific technical mechanism (e.g., which manifest file format, which build script step appends the suffix) is an implementation decision belonging to `03-Architecture/DeploymentArchitecture.md` and `05-Engineering/ReleaseStrategy.md`, and must be proposed and approved through the normal engineering workflow before implementation — this document constrains *what is acceptable*, not the specific mechanism.

## 7. Privacy Considerations

1. Creator provenance identifies the original creator of the *software*, not any user, meeting participant, or organizational data subject. It carries no personal data belonging to Project Echo's end users and is out of scope for POPIA-alignment analysis of *product* data.
2. Because the Creator Identity (Dr Ziyaad Moolla / ZM) is itself a named individual, provenance metadata should be handled with ordinary professional discretion (e.g., not unnecessarily duplicated into public-facing user documentation beyond what is proposed in Section 4), but this is a matter of professional practice, not a POPIA data-subject-rights concern, since the creator is not a data subject of the product's meeting-intelligence processing.
3. Provenance markers must not be repurposed to identify or fingerprint end users, organizations, or deployments — they identify the software's origin only.

## 8. Governance and Change Control

1. The Creator Identity in Section 2 is fixed and may not be altered through routine document revision. Any change would require a Constitution-level amendment per `ProjectConstitution.md` §7.
2. Changes to the *surfaces* (Section 4) or *implementation constraints* (Sections 5–6) follow the standard change control process in `RevisionPolicy.md` §5, with required approval from the Security Architect and DevOps/Deployment Engineer, given the potential for provenance implementation to intersect with build and deployment tooling.

## 9. Relationship to Other PEKB Documents

- `ProjectConstitution.md` §6 establishes the binding requirement this document elaborates.
- `DocumentStandards.md` §2 and §8 define how provenance appears in PEKB documentation specifically.
- `RevisionPolicy.md` §6 defines the relationship between PEKB document versions, build identifiers, and software releases.
- `05-Engineering/ReleaseStrategy.md` (pending) will define the concrete release/build numbering process that generates the identifiers described here.
- `03-Architecture/DeploymentArchitecture.md` (pending) will define the concrete technical mechanism for artifact-level provenance (Section 4.5).

---

*End of Document — PEKB-00-GOV-008 — Project Echo Creator Provenance Framework — PE-2026.001-ZM*
