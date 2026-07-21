# 🏠 Project Echo — Home

> Vault entry point for the Project Echo Engineering Knowledge Base (PEKB). This is a Map of Content: follow the `[[wikilinks]]` to any document. Provenance **PE-2026.001-ZM** · Original Creator **Dr Ziyaad Moolla (ZM)**.

**What Project Echo is:** a privacy-first, offline-capable, enterprise-grade **Meeting Intelligence Platform** and trusted system of record — secure transcription, structured human review, governance, knowledge management, and long-term record-keeping. See [[Vision]] and [[ProductCharter]].

**Read order for a new contributor:** [[ProjectConstitution]] → [[ArchitectureDecisionIndex]] (+ the ADRs) → the requirements → the architecture → design. The build is conducted by [[MASTER_PROMPT]].

---

## 🚦 Status at a glance
- **Decision layer:** complete — 13 ADRs, all **Accepted** (foundational 001–004 ratified; technology 009–013 ratified).
- **Buildable now:** Phase 1 (Foundation) — see [[MASTER_PROMPT]] §7 and [[DataModel-Core]].
- **Still open (empirical, resolve by doing):** default transcription engine (**AR-076**) and cryptographic algorithm selection — see [[AssumptionsRegister]].
- **Not yet authored:** most of `04-Design`, and the `06-Security` / `07-Privacy-Compliance` / `08-Operations` / `09-Testing` / `10-Documentation` / `11-Roadmap` sections (filled in phase-by-phase).

---

## 00 · Governance
- [[ProjectConstitution]] — highest authority: commitments, precedence ordering, conduct rules
- [[ProjectPhilosophy]] · [[ProjectIntent]] — why it exists / statement of intent
- [[EngineeringPrinciples]] · [[DesignPrinciples]] — how contributors work / design bar
- [[DocumentStandards]] — metadata, IDs, four-state requirements, Challenge box
- [[RevisionPolicy]] · [[CreatorProvenanceFramework]] — versioning / provenance
- [[Glossary]] — terminology, section codes, requirement-ID prefixes
- [[AssumptionsRegister]] — every open/resolved assumption (AR-###)
- [[ArchitectureDecisionIndex]] — index of all decisions
- [[EthicalAICharter]] — AI behavioural guarantees & hard prohibitions
- [[EngineeringQualityGates]] — Definition of Ready / Done / Quality Gates / Red-Team

### Architecture Decision Records
- [[ADR-001-AIProcessingModel|ADR-001 · Offline-first hybrid AI]]
- [[ADR-002-DeploymentModel|ADR-002 · Per-organization isolated deployment]]
- [[ADR-003-DataOwnershipGovernance|ADR-003 · Organization owns the data]]
- [[ADR-004-AccessControlRBACModel|ADR-004 · RBAC, 8 baseline roles]]
- [[ADR-005-EnterpriseCompatibilityZeroITFriction|ADR-005 · Zero-IT-Friction]]
- [[ADR-006-DataClassificationTwoAxisModel|ADR-006 · Two-axis classification]]
- [[ADR-007-TranscriptRecordLifecycle|ADR-007 · Transcript & record lifecycle]]
- [[ADR-008-ConstrainedCustomRoles|ADR-008 · Constrained custom roles]]
- [[ADR-009-DesktopApplicationStack|ADR-009 · Desktop stack (.NET/WinUI)]]
- [[ADR-010-DatabaseEngineStrategy|ADR-010 · SQLite + PostgreSQL]]
- [[ADR-011-OfflineTranscriptionEngineStrategy|ADR-011 · Transcription abstraction]]
- [[ADR-012-SynchronizationApproach|ADR-012 · Sync invariants]]
- [[ADR-013-KeyManagement|ADR-013 · Key management (DPAPI-NG + escrow)]]

## 01 · Product
- [[Vision]] · [[ProductCharter]] · [[Scope]]
- [[BusinessCase]] · [[Stakeholders]] · [[Personas]]

## 02 · Requirements
- [[FunctionalRequirements]] · [[NonFunctionalRequirements]]
- [[SecurityRequirements]] · [[PrivacyRequirements]]
- [[AIRequirements]] · [[UXRequirements]]
- [[AcceptanceCriteria]] · [[RequirementsBaselineReview]]
- **New-module requirements:** [[GovernanceEngineRequirements]] · [[ReviewIntelligenceEngineRequirements]] · [[RecoverabilityRequirements]] · [[KnowledgeBaseRequirements]] · [[SOPLibraryRequirements]] · [[EvidenceComplianceRequirements]] · [[RedactionSecureSharingRequirements]]

## 03 · Architecture
- [[SystemArchitecture]] · [[DeploymentArchitecture]] · [[DesktopArchitecture]]
- [[SecurityArchitecture]] · [[AIArchitecture]] · [[DatabaseArchitecture]]
- [[ThreatModel]] · [[ModuleArchitecture]] · [[ArchitectureBaselineReview]]

## 04 · Design
- [[ComponentDesign]] — 8-component design
- [[DataModel-Core]] — concrete core schema (Phase 1)
- [[UI-ReviewWorkspace]] — screen-design exemplar

## 05 · Engineering
- [[BranchingStrategy]] · [[TechnicalDebtRegister]] · [[ThirdPartyComponentRegister]]

## 🔨 Build
- [[MASTER_PROMPT]] — the orchestrator: how a coding agent executes the PEKB
- [[PROJECT_ECHO_COMPLETE_HANDOVER]] — session-continuity master reference

---

## 📥 How to get these files into this vault
These documents live in the GitHub repo `DrZM007/hermes-agent` (branch `claude/new-idea-g68xr2`). To populate your Obsidian **Project Echo** folder, do **one** of:

1. **Copy the folder (simplest):** download/clone the repo, then copy its `PEKB/` folder, `MASTER_PROMPT.md`, and this `Project-Echo-Home.md` into your Obsidian *Project Echo* folder. Obsidian indexes the nested folders automatically and the `[[wikilinks]]` above resolve.
2. **Point Obsidian at a clone:** `git clone` the repo into (or beside) your vault, so pulling updates keeps the vault current.

> Note: the documents' internal cross-references are written as `` `FileName.md` `` (code-formatted) per the Document Standards, so they read clearly everywhere. This Home note adds the Obsidian `[[wikilink]]` layer for click-through navigation.
