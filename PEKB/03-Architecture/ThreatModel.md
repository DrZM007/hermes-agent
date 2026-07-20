# Project Echo — Threat Model

## Document Metadata

| Field | Value |
|---|---|
| Document ID | PEKB-03-ARC-001 |
| Document Title | Threat Model |
| PEKB Section | 03-Architecture |
| Version | 0.1.0 |
| Status | Draft |
| Classification | Internal — Architecture / Security |
| Owner Role | Security Architect |
| Approval Required From | Principal Software Architect, Privacy Officer, AI/ML Architect |
| Related Documents | SecurityRequirements.md, PrivacyRequirements.md, AIRequirements.md, NonFunctionalRequirements.md (02-Requirements); ADR-001–ADR-004 (00-Governance/Decisions); AssumptionsRegister.md (00-Governance) |
| Original Creator | Dr Ziyaad Moolla |
| Creator ID | ZM |
| Document Provenance | PE-2026.001-ZM |

---

## 0. Structural Note

The PEKB structure originally listed `ThreatModel.md` under `06-Security/`. This document is created at `03-Architecture/ThreatModel.md` per explicit instruction, since it functions as an architecture-input document (informing `SecurityArchitecture.md`, `DeploymentArchitecture.md`, `DatabaseArchitecture.md`, and `AIArchitecture.md` directly) rather than a downstream security-operations artifact. This placement decision should be confirmed by the Principal Software Architect; if `06-Security/ThreatModel.md` is later also expected to exist, that document should reference this one as authoritative rather than duplicate it, per the Single Source of Truth rule in `00-Governance/DocumentStandards.md` §5.

This document resolves the previously tracked **AR-009** ("no threat model exists yet").

## 1. Purpose and Scope of This Document

This document identifies Project Echo's assets, threat actors, trust boundaries, attack surfaces, risks, and required mitigations, at a threat-modeling level. It does not design architecture, choose technologies, or select encryption algorithms — those belong to `SecurityArchitecture.md`, `DeploymentArchitecture.md`, and `AIArchitecture.md`, which this document is intended to inform directly. Every threat identified here traces to a requirement already established in `SecurityRequirements.md`, `PrivacyRequirements.md`, `AIRequirements.md`, or `NonFunctionalRequirements.md`, and to the relevant ADR.

This document uses the identifier format `TM-<###>` (Threat Model entry), following the established PEKB requirement-ID precedent.

## 2. Threat Modelling Approach

This threat model uses an **asset-and-actor-centric methodology**: assets are identified first (Section 3), actors capable of affecting those assets are identified next (Section 4), trust boundaries between actors and assets are mapped (Section 5), and attack surfaces are analyzed against those boundaries (Section 6) before threats are cataloged (Section 7).

No named industry security framework (e.g., STRIDE, PASTA, DREAD) is adopted wholesale in this document. This is a deliberate choice, not an oversight: `SecurityRequirements.md` SR-006 already specifies the minimum threat categories this model must cover (device loss/theft, insider excess access, network exfiltration, administrator compromise, audit tampering, supply-chain risk), and this document organizes around those categories plus the AI- and privacy-specific categories requested here, rather than forcing them into an external framework's taxonomy. Should `03-Architecture/SecurityArchitecture.md` later determine that a named framework's structure would aid control design, that is an architecture-stage decision, not a threat-modeling one, and does not require this document to be rewritten — it would be an additional lens applied to the same underlying threats.

Risk is assessed qualitatively as **Likelihood × Impact = Risk**, using the same Critical/High/Medium/Low scale defined in `SecurityRequirements.md` §3, reused here without redefinition per `00-Governance/DocumentStandards.md` §5.

## 3. System Assets

Each asset is classified per the four-level framework defined in `PrivacyRequirements.md` §6.1 (C1–C4).

| Asset | Description | Classification |
|---|---|---|
| Audio recordings | Raw captured or imported meeting audio. | C2 (default); C3 if containing sensitive personal information per PrivacyRequirements.md §6.1 |
| Transcripts | Text representation of meeting content, at any lifecycle state (Draft Transcript through Archived). | C2 (default); C3 for sensitive content |
| Summaries | AI-generated or approved condensed meeting content. | Inherits source classification (PrivacyRequirements.md PR-036) |
| Action items / key points / decisions (AI outputs) | Draft or confirmed extracted artifacts. | Inherits source classification |
| Comments and annotations | Reviewer/Approver notes attached to transcripts. | Inherits classification of annotated content (PrivacyRequirements.md PR-041 pattern; FunctionalRequirements.md FR-057) |
| User identities | Account records, role/scope assignments. | C1, unless the identity record itself is treated as personal information of the account holder (C2) |
| Credentials / authentication material | Whatever proves a user's identity at login (mechanism not yet defined, per AR-051). | C1/security-critical regardless of content classification |
| Encryption keys | Keys protecting C2/C3 data at rest and in transit (mechanism not yet defined, per AR-052). | Security-critical; compromise directly threatens all C2/C3 assets |
| Audit records | Logs of authentication, role changes, workflow transitions, approvals, deletions, exports. | C4 |
| Configuration | Organization-level settings: role assignments, retention rules, AI processing opt-in status, export approval configuration. | C1, but security-critical — misconfiguration can expose C2/C3 assets |
| Speaker recognition data (if offered) | Persistent, cross-meeting biometric-style voice profiles. | C3, per PrivacyRequirements.md §12; existence contingent on unresolved AR-060 |

**TM-Note-1**: Encryption keys and credentials are treated as first-class assets distinct from the content they protect, since their compromise is a single point of failure for confidentiality across many C2/C3 assets simultaneously — this drives several High/Critical threats in Section 7.

## 4. Actors

### 4.1 Internal Actors (per ADR-004 §4.1)

| Actor | Relevant Threat Posture |
|---|---|
| Meeting Owner | Legitimate broad access to owned meetings; a compromised or careless Meeting Owner account exposes all meetings they own. |
| Recorder | Narrow, capture-confirmation-only access by design (ADR-004 §4.1); limited blast radius even if compromised, provided the role boundary is enforced. |
| Reviewer | Legitimate access to assigned transcripts at Draft/Review Required states; a malicious or compromised Reviewer could introduce false corrections. |
| Approver | Legitimate finalization authority; a compromised or complicit Approver could finalize an inaccurate or tampered record as the organizational record. |
| Organization Administrator | Broad configuration and delegation authority (ADR-003 §4.7); the highest-impact internal actor if compromised or acting maliciously, since they can alter role assignments and policy. |
| System Administrator | Infrastructure access without content access by design (ADR-004 §4.5); a compromised System Administrator threatens availability, updates, and backups, but not content confidentiality directly — unless the role boundary itself is broken (see TM-004). |
| Auditor | Read-only access to audit metadata, not content, by design (ADR-004 §4.1); low direct content-exposure risk, but a compromised Auditor account could be used to surveil organizational activity patterns or, if the independence boundary (ADR-004 §4.3.3) is violated, mask wrongdoing. |

### 4.2 External Actors

| Actor | Relevant Threat Posture |
|---|---|
| External attacker (no legitimate access) | Motivated to exfiltrate confidential meeting content, credentials, or encryption keys; primary vector is the organizational network boundary, exported artifacts, or a compromised endpoint. |
| Compromised endpoint | A managed laptop running Project Echo that has been compromised by malware unrelated to Project Echo itself; threatens any C2/C3 data or keys resident on that device. |
| Unauthorized insider | An organizational member with legitimate network/device access but no Project Echo role, attempting to access content beyond their authorization (e.g., via local file inspection, network sniffing, or social engineering of a legitimate user). |
| Malicious third party (supply chain) | A compromised dependency, AI model artifact, or update package introduced into Project Echo's build or distribution chain before reaching the organization. |

**TM-Note-2**: Because ADR-002 defines the organization's isolated deployment as the trust boundary, "insider" threats (Section 4.1) and "unauthorized insider" (Section 4.2, someone inside the organization but outside any Project Echo role) are treated as distinct actor categories — the former have some legitimate system access to abuse, the latter have none and must escalate to gain any.

## 5. Trust Boundaries

| Boundary | Description | Governing ADR |
|---|---|---|
| **Local device boundary** | The boundary between a single managed endpoint (laptop) running Project Echo and everything external to it — including other devices within the same organization. | ADR-001 §4.1 (offline processing occurs within this boundary by default) |
| **Organization environment boundary** | The boundary around an organization's entire isolated deployment (all its devices, users, and — if applicable — any organization-controlled server component), beyond which no data crosses without explicit governance. | ADR-002 §4 (isolation is the default; this is the primary trust boundary in this threat model) |
| **Optional networked AI processing boundary** | The boundary crossed only when an organization has explicitly enabled the ADR-001 §4.2 opt-in; data crossing this boundary leaves the organization environment boundary for AI processing purposes only. | ADR-001 §4.2 |
| **Update channel boundary** | The boundary between the software distribution mechanism (however implemented, per AR-007/AR-054) and the running application; a compromised update channel could introduce malicious code inside the organization environment boundary. | SecurityRequirements.md §18 (Update Security) |
| **Storage boundary** | The boundary between data at rest (local device storage, and any organization-controlled backup/archival storage) and any process or actor attempting to read it directly rather than through the application's authorization layer. | SecurityRequirements.md §10–11 (Encryption, Data Protection) |

**TM-Note-3**: Per ADR-003, ownership of all data within the Organization Environment Boundary belongs to the organization, not to Project Echo (the platform) or to any individual user — this means a threat that breaches the Organization Environment Boundary is a breach of the organization's own asset, and Project Echo's controls exist to prevent and detect that breach on the organization's behalf, not to protect a Project Echo-owned interest.

## 6. Attack Surface Analysis

| Surface | Consideration |
|---|---|
| **Authentication** | The authentication mechanism (undefined, AR-051) is the primary gate to the Local Device and Organization Environment boundaries; weak or absent authentication is the highest-leverage single attack surface, since it grants an attacker the access of whichever role's credentials are compromised. |
| **Authorization** | Every role/scope check (ADR-004 §4.1) is a potential surface for privilege-escalation attempts (e.g., a Reviewer attempting to access transcripts outside their assigned scope). |
| **Local storage** | Recordings, transcripts, and keys resident on an endpoint are exposed if the Local Device Boundary is breached (device loss/theft, malware) and encryption (SR-023–SR-025, mechanism undefined per AR-052) is insufficient or its keys are also locally exposed. |
| **Exports** | Every Controlled Export (SecurityRequirements.md §17) is a deliberate crossing of the Organization Environment Boundary and is therefore a natural attack surface for exfiltration disguised as a legitimate export, or for export-approval-authority abuse. |
| **Imports** | Recording import (FunctionalRequirements.md §7) accepts external content into the system; a malicious or malformed import could be used to attempt to inject unexpected content into downstream AI processing (see Section 8, AI-specific threats). |
| **AI models** | The AI processing components themselves (transcription, summarization, extraction) are a surface both for malicious input (Section 8) and for supply-chain compromise of the model artifact itself (TM-016). |
| **Updates** | The update channel (Section 5) is a surface for supply-chain compromise; a malicious update could silently weaken protective defaults (SR-052) or introduce a backdoor. |
| **Network communication** | Limited by design under ADR-001's offline default, but becomes a live surface whenever the networked AI processing opt-in (ADR-001 §4.2) or any export/notification mechanism is active. |
| **Logs (audit records)** | Audit records are a surface both for tampering (an attacker or malicious insider attempting to hide their actions) and for unauthorized read access (audit metadata itself can reveal organizational activity patterns even without content access). |

## 7. Threat Catalogue

**TM-001**
*Threat:* Loss or theft of a managed laptop exposes locally stored recordings/transcripts.
*Affected Asset:* Audio recordings, transcripts (C2/C3).
*Threat Actor:* External attacker; compromised endpoint (physical).
*Likelihood:* Medium. *Impact:* Critical. *Risk:* Critical.
*Mitigation Requirement:* Encryption at rest with key management such that device compromise alone does not expose keys (SecurityRequirements.md SR-023, SR-025).

**TM-002**
*Threat:* An Organization Administrator account is compromised, allowing an attacker to reassign roles and grant themselves content access.
*Affected Asset:* User identities, configuration, and transitively all C2/C3 content.
*Threat Actor:* External attacker (via credential theft); unauthorized insider (via social engineering).
*Likelihood:* Medium. *Impact:* Critical. *Risk:* Critical.
*Mitigation Requirement:* Strong authentication (SecurityRequirements.md SR-011–SR-013); audit logging of all role changes with anomaly visibility for the Auditor role (SR-041, SR-046).

**TM-003**
*Threat:* A Reviewer or Approver account is compromised, allowing an attacker to introduce false corrections or approve a tampered record.
*Affected Asset:* Transcripts, summaries, action items.
*Threat Actor:* External attacker; malicious insider.
*Likelihood:* Medium. *Impact:* High. *Risk:* High.
*Mitigation Requirement:* Strong authentication; complete revision history with attribution (SecurityRequirements.md SR-034) enabling detection of anomalous edit patterns.

**TM-004**
*Threat:* A System Administrator uses infrastructure-level access to circumvent the "no implicit content access" boundary (ADR-004 §4.5).
*Affected Asset:* All C2/C3 content.
*Threat Actor:* Malicious insider (System Administrator); external attacker who has compromised a System Administrator account.
*Likelihood:* Low–Medium. *Impact:* Critical. *Risk:* High.
*Mitigation Requirement:* Technical enforcement (not policy-only) of the System Administrator/content-access separation (SecurityRequirements.md SR-018); logged, bounded support-access mechanism (SR-022) as the only sanctioned exception.

**TM-005**
*Threat:* An Auditor account is compromised or colludes with an audited role, undermining independent oversight (ADR-004 §4.3.3).
*Affected Asset:* Audit records; organizational accountability.
*Threat Actor:* Malicious insider; external attacker.
*Likelihood:* Low. *Impact:* High. *Risk:* Medium.
*Mitigation Requirement:* Technical enforcement of Auditor role-exclusivity (SecurityRequirements.md SR-021); audit records themselves immutable even to compromised privileged accounts (SR-043).

**TM-006**
*Threat:* An unauthorized insider (no Project Echo role) accesses recordings/transcripts via direct file system inspection, bypassing the application's authorization layer entirely.
*Affected Asset:* Audio recordings, transcripts.
*Threat Actor:* Unauthorized insider.
*Likelihood:* Medium. *Impact:* Critical. *Risk:* Critical.
*Mitigation Requirement:* Encryption at rest independent of application-layer authorization (SecurityRequirements.md SR-023), so that bypassing the application does not yield readable content.

**TM-007**
*Threat:* Data exfiltration via the optional networked AI processing path after an organization has enabled it, exceeding the scope the organization approved.
*Affected Asset:* Audio recordings, transcripts (whatever content is routed via the networked path).
*Threat Actor:* External attacker (if the networked path itself is compromised); malicious insider (Organization Administrator misconfiguring scope).
*Likelihood:* Low–Medium. *Impact:* Critical. *Risk:* High.
*Mitigation Requirement:* Encryption in transit (SecurityRequirements.md SR-024); scope-limited processing consistent with organization approval (AIRequirements.md AI-035, AI-038); audit logging of the boundary-crossing configuration itself (SR-037).

**TM-008**
*Threat:* An export is used to exfiltrate more data than the export approval covered, or export authority is granted beyond what the organization intended.
*Affected Asset:* Any exported C1–C3 content.
*Threat Actor:* Malicious insider (abusing legitimate export authority); external attacker (if export credentials are compromised).
*Likelihood:* Medium. *Impact:* High. *Risk:* High.
*Mitigation Requirement:* Export authority strictly scoped per delegated authority (SecurityRequirements.md SR-049); complete export audit logging (SR-050); additional approval gate for C3 exports (PrivacyRequirements.md PR-048).

**TM-009**
*Threat:* A malicious or malformed imported recording is used to attempt to disrupt or manipulate downstream processing.
*Affected Asset:* Processing pipeline integrity; downstream transcripts.
*Threat Actor:* Malicious insider (importing crafted content); external attacker (if import sourcing is not adequately controlled).
*Likelihood:* Low. *Impact:* Medium. *Risk:* Medium.
*Mitigation Requirement:* Input validation before processing begins (FunctionalRequirements.md FR-024); processing failure handling that does not silently proceed with unusable/suspicious input (FR-024, FR-026).

**TM-010**
*Threat:* A compromised or malicious update introduces a backdoor or silently weakens a protective default (e.g., disabling the offline-by-default AI processing path).
*Affected Asset:* All assets, transitively, via compromised application integrity.
*Threat Actor:* Malicious third party (supply chain); external attacker (compromising the update channel).
*Likelihood:* Low. *Impact:* Critical. *Risk:* High.
*Mitigation Requirement:* Secure update delivery and verification before application (SecurityRequirements.md SR-051); updates must not silently alter protective defaults without explicit release documentation (SR-052); vulnerability management process (SR-054–SR-056).

**TM-011**
*Threat:* Audit logs are tampered with or deleted to conceal an unauthorized action.
*Affected Asset:* Audit records (C4).
*Threat Actor:* Malicious insider with privileged access (Organization Administrator, System Administrator); external attacker with elevated access.
*Likelihood:* Low. *Impact:* High. *Risk:* Medium.
*Mitigation Requirement:* Audit log immutability enforced even against privileged roles (SecurityRequirements.md SR-043); independent Auditor review capability (ADR-004 §4.1).

**TM-012**
*Threat:* Repeated failed authentication attempts against a user identity go undetected, enabling a credential-guessing attack to eventually succeed.
*Affected Asset:* User identities; transitively, whatever the compromised account can access.
*Threat Actor:* External attacker.
*Likelihood:* Medium. *Impact:* High. *Risk:* High.
*Mitigation Requirement:* Detection of repeated failed authentication attempts (SecurityRequirements.md SR-045).

**TM-013**
*Threat:* A backup of meeting data is stored or restored without the same protections as the primary data, creating a weaker-protected copy.
*Affected Asset:* Any backed-up C1–C4 data.
*Threat Actor:* Malicious insider; external attacker targeting backup infrastructure specifically as a softer target.
*Likelihood:* Medium. *Impact:* High. *Risk:* High.
*Mitigation Requirement:* Backups subject to identical encryption, access control, and isolation requirements as primary data (SecurityRequirements.md SR-060); recovery procedures that do not bypass the authorization model (SR-061).

**TM-014**
*Threat:* A vulnerability in Project Echo's own codebase or an incorporated component is discovered and exploited before remediation.
*Affected Asset:* All assets, transitively.
*Threat Actor:* External attacker.
*Likelihood:* Medium. *Impact:* Critical. *Risk:* Critical.
*Mitigation Requirement:* Vulnerability management process with defined remediation timelines for Critical/High findings (SecurityRequirements.md SR-054–SR-055).

## 8. AI-Specific Threats

**TM-015**
*Threat:* An AI capability (transcription, summarization, extraction) produces a hallucinated output — confident-seeming but factually incorrect content not actually present in the source recording.
*Affected Asset:* Transcripts, summaries, action items — organizational record integrity.
*Threat Actor:* Not an adversarial actor; an inherent AI-quality risk.
*Likelihood:* Medium. *Impact:* High. *Risk:* High.
*Mitigation Requirement:* Mandatory human review before any AI output is treated as authoritative (AIRequirements.md AI-002, AI-021); visible distinction between AI-generated and human-confirmed content (AI-022); uncertainty marking for low-confidence segments rather than confident-seeming guesses (AI-026).

**TM-016**
*Threat:* An AI model artifact (whichever is eventually selected at architecture stage) is tampered with or replaced, altering its behavior without authorization (model manipulation / supply-chain compromise of the model itself).
*Affected Asset:* AI processing integrity; transitively, all AI-generated outputs.
*Threat Actor:* Malicious third party (supply chain); malicious insider with infrastructure access.
*Likelihood:* Low. *Impact:* Critical. *Risk:* High.
*Mitigation Requirement:* Model integrity protection against unauthorized modification (AIRequirements.md AI-046); AI behavior changes only via the governed, version-controlled Improvement Loop (AI-003, AI-032).

**TM-017**
*Threat:* Organizational data is used to train or fine-tune an AI model without authorization, either through a platform defect or a malicious actor exploiting the AI Improvement Loop process.
*Affected Asset:* All C2/C3 content, transitively, if it leaks into model behavior.
*Threat Actor:* Malicious insider (exploiting or bypassing the Improvement Loop); platform defect (non-adversarial but still a threat to be modeled).
*Likelihood:* Low. *Impact:* Critical. *Risk:* High.
*Mitigation Requirement:* No autonomous self-learning (AIRequirements.md AI-030); no training without passing through the full governed Improvement Loop (AI-031); ADR-003's no-ownership-interest position reinforcing that organizational data may not be repurposed for model improvement without explicit governance.

**TM-018**
*Threat:* Data leakage between organizations occurs via a shared component of the networked AI processing path, if such shared infrastructure is ever used.
*Affected Asset:* Any C2/C3 content processed via the networked path.
*Threat Actor:* External attacker; platform defect in isolation enforcement.
*Likelihood:* Low. *Impact:* Critical. *Risk:* High.
*Mitigation Requirement:* Cross-organization isolation maintained for any shared networked processing (AIRequirements.md AI-049–AI-050); specific technical isolation mechanism remains deferred to `AIArchitecture.md` (AR-045, AR-073).

**TM-019**
*Threat:* Prompt injection — meeting content crafted to instruct an AI capability to bypass review requirements, disclose unauthorized data, or otherwise act outside its intended function.
*Affected Asset:* AI processing integrity; transitively, confidentiality and Human Authority guarantees.
*Threat Actor:* Malicious insider (a meeting participant crafting adversarial speech/text); external attacker (if content can be injected via import).
*Likelihood:* Medium. *Impact:* High. *Risk:* High.
*Mitigation Requirement:* AI capabilities designed to treat meeting content as untrusted input, not a trusted administrative channel (AIRequirements.md AI-047); AI output limited to producing draft content artifacts, never capable of executing a privileged action (AI-048).

**TM-020**
*Threat:* Malicious or adversarial audio/text input (beyond prompt injection specifically) is used to degrade AI processing quality or availability (e.g., crafted audio intended to cause a processing failure or resource exhaustion).
*Affected Asset:* AI processing availability; transitively, meeting records dependent on it.
*Threat Actor:* Malicious insider; external attacker (if import path is exposed).
*Likelihood:* Low. *Impact:* Medium. *Risk:* Medium.
*Mitigation Requirement:* Input validation before processing (FunctionalRequirements.md FR-024); graceful failure handling that does not cascade into broader unavailability (FR-026–FR-028).

## 9. Privacy Threats

**TM-021**
*Threat:* Unauthorized recording occurs — a meeting is captured without the participant notification required by `PrivacyRequirements.md` PR-022 having been satisfied.
*Affected Asset:* Participant personal information; organizational compliance posture.
*Threat Actor:* Malicious or careless insider (a Meeting Owner/Recorder bypassing notification); platform defect.
*Likelihood:* Low–Medium. *Impact:* High. *Risk:* High.
*Mitigation Requirement:* Recording shall not begin without the notification mechanism being satisfied (PrivacyRequirements.md PR-020, FunctionalRequirements.md FR-010, FR-022).

**TM-022**
*Threat:* Personal information about a third party referenced in meeting content (not a participant) is exposed or mishandled without the protections applicable to participant information.
*Affected Asset:* Third-party personal information (C2/C3).
*Threat Actor:* Not necessarily adversarial — a process gap treating third-party mentions as exempt from standard protections.
*Likelihood:* Medium. *Impact:* Medium. *Risk:* Medium.
*Mitigation Requirement:* Third-party-referenced information classified and protected identically to participant information (PrivacyRequirements.md PR-028–PR-029); specific request-mechanism for third parties remains deferred (AR-036, AR-063).

**TM-023**
*Threat:* Biometric exposure — persistent speaker recognition data (if offered, per unresolved AR-060) is exposed, enabling re-identification of individuals across meetings beyond what was consented to.
*Affected Asset:* Speaker recognition data (C3).
*Threat Actor:* External attacker; malicious insider.
*Likelihood:* Low (contingent on the capability shipping at all). *Impact:* Critical (if it does ship and is exposed). *Risk:* High (conditional).
*Mitigation Requirement:* C3 classification with opt-in-only enablement (PrivacyRequirements.md PR-032); distinct consent basis from general recording consent (PR-026); heightened handling expectations per the C3 classification tier (PrivacyRequirements.md §6.1).

**TM-024**
*Threat:* Retention failure — data is retained beyond its configured or expected retention period (or, conversely, deleted prematurely), due to a defect in retention enforcement.
*Affected Asset:* All C1–C4 data subject to retention rules.
*Threat Actor:* Platform defect (non-adversarial); potentially a malicious insider disabling retention enforcement to preserve data beyond its intended lifecycle for improper use.
*Likelihood:* Medium. *Impact:* High. *Risk:* High.
*Mitigation Requirement:* Retention periods enforced per classification level, not left to silent indefinite default (PrivacyRequirements.md PR-040–PR-041); specific retention values remain deferred (AR-062).

## 10. Residual Risks

### 10.1 Accepted Risks

No risk identified in Sections 7–9 is formally accepted (i.e., deliberately left unmitigated with sign-off) at this stage — every threat identified above has an associated mitigation requirement already present in an approved requirements document. This is a threat *model*, not a risk *acceptance* record; formal risk acceptance (if any residual risk remains after `SecurityArchitecture.md` is designed) belongs in `06-Security/SecurityControls.md` or a future risk register, not here.

### 10.2 Deferred Risks

The following risks have adequate *requirement-level* mitigation defined, but their *architectural* mitigation is deferred pending resolution of open assumptions:

- **TM-001, TM-006** (device loss/theft, direct file access) — deferred pending AR-052 (encryption/key management mechanism).
- **TM-018** (cross-organization data leakage in shared networked processing) — deferred pending AR-045 (isolation boundary technical definition) and AR-073 (cross-org processing isolation mechanism).
- **TM-023** (biometric exposure) — deferred pending AR-060 (whether the capability ships at all).

### 10.3 Unresolved Assumptions Referenced by This Threat Model

This document references, without resolving, the following existing assumptions: AR-009 (resolved by this document's existence), AR-010, AR-045, AR-051, AR-052, AR-060, AR-062, AR-063, AR-073, AR-076. No new assumption is introduced by this document beyond the structural-placement question noted in Section 0.

## 11. Architecture Implications

### 11.1 For `SecurityArchitecture.md`

- Must design authentication (TM-002, TM-012) and technical enforcement of role/scope boundaries (TM-003, TM-004, TM-005) — resolving AR-051 (authentication mechanism) and AR-048 (scoped authorization mechanism).
- Must design encryption at rest and in transit, and key management resilient to device compromise (TM-001, TM-006, TM-007) — resolving AR-010/AR-052.
- Must design tamper-resistant, immutable audit logging (TM-011) and repeated-failed-authentication detection (TM-012) — resolving AR-053.
- Must design a vulnerability management process (TM-014) — resolving AR-054.
- Must design backup/recovery controls consistent with primary-data protections (TM-013) — resolving AR-056, AR-063.

### 11.2 For `DeploymentArchitecture.md`

- Must define the precise technical isolation boundary (TM-006, TM-018) — resolving AR-045.
- Must design a secure update channel resistant to supply-chain compromise (TM-010) — resolving AR-007/AR-054 (update delivery mechanism) in a security-conscious way.
- Must define deployment topology consistent with the Organization Environment Boundary (Section 5) — resolving AR-044.

### 11.3 For `AIArchitecture.md`

- Must design AI output handling that preserves human-review gating and visible AI/human distinction (TM-015) — building on already-approved `AIRequirements.md` requirements, not re-deciding them.
- Must design model integrity protection and the governed Improvement Loop mechanism (TM-016, TM-017) — resolving AR-074 (testing/rollback mechanics).
- Must design cross-organization isolation for any shared networked processing component (TM-018) — resolving AR-073.
- Must design input handling that treats meeting content as untrusted (TM-019, TM-020) — an architectural expression of `AIRequirements.md` AI-047–AI-048, not a new requirement.
- Must account for the conditional nature of TM-023 by designing speaker-recognition data handling (if the capability ships) to the C3 standard from the outset, rather than retrofitting it — pending resolution of AR-060.

## 12. Relationship to Other PEKB Documents

- This document derives its threats and required mitigations from `SecurityRequirements.md`, `PrivacyRequirements.md`, `AIRequirements.md`, and `NonFunctionalRequirements.md`; it introduces no new requirement obligations, only threat-level analysis of existing ones.
- This document resolves **AR-009**, previously blocking `SecurityArchitecture.md` per `SecurityRequirements.md` SR-005.
- `03-Architecture/SecurityArchitecture.md`, `DeploymentArchitecture.md`, and `AIArchitecture.md` must design controls traceable to the threats cataloged here (Section 11), consistent with SR-005's requirement that security controls be traceable to identified threats.
- `03-Architecture/DatabaseArchitecture.md` should reference this document's asset classification (Section 3) when designing data storage structure, without needing a separate threat catalogue of its own.

---

*End of Document — PEKB-03-ARC-001 — Project Echo Threat Model — PE-2026.001-ZM*
