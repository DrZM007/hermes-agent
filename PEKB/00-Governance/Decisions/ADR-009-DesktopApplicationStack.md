# ADR-009 — Desktop Application Stack

## Document Metadata

| Field | Value |
|---|---|
| Document ID | PEKB-00-GOV-022 |
| Decision ID | ADR-009 |
| Document Title | Desktop Application Stack |
| PEKB Section | 00-Governance/Decisions |
| Version | 0.2.0 |
| Status | Accepted |
| Classification | Internal — Governance |
| Owner Role | Principal Software Architect |
| Approval Required From | Product Owner (Dr Ziyaad Moolla), DevOps/Deployment Engineer, Security Architect, UX Lead |
| Related Documents | ProjectConstitution.md, ProjectIntent.md, AssumptionsRegister.md (00-Governance); ADR-001-AIProcessingModel.md, ADR-002-DeploymentModel.md, ADR-005-EnterpriseCompatibilityZeroITFriction.md (00-Governance/Decisions); DesktopArchitecture.md (03-Architecture); NonFunctionalRequirements.md, ThirdPartyComponentRegister.md (02-Requirements/05-Engineering) |
| Original Creator | Dr Ziyaad Moolla |
| Creator ID | ZM |
| Document Provenance | PE-2026.001-ZM |

---

## 1. Context

`AssumptionsRegister.md` **AR-003** records that no desktop technology stack has been chosen, and **ADR-005** ratified the binding constraints any stack must satisfy: runs in a standard-user session with no administrator rights, no container/Docker/WSL dependency, offline-capable, strong on CPU-only managed laptops, and deployable via MSI/portable/silent/GPO/Intune/SCCM. Web and mobile clients are deferred (**AR-086**), so the initial client is a Windows desktop application.

This ADR selects the desktop stack. **Ratified by the Product Owner on 2026-07-20.**

## 2. Problem

Select a desktop application stack that best satisfies ADR-005 for a Windows-managed, CPU-constrained, locked-down enterprise environment, while supporting a rich review/approval UI and strong offline operation, and keeping long-term maintainability (Constitution Commitment 9).

## 3. Options Considered

### Option A — .NET (C#) with WinUI/WPF, native Windows
- **Pros:** Lightest runtime footprint of the three; best integration with managed Windows, MSI/Intune/SCCM, and enterprise security tooling; excellent CPU-only performance; mature, long-supported platform aligned with a multi-year maintenance horizon; no browser runtime to ship. Strong fit for ADR-005.
- **Cons:** Windows-only. Acceptable because web/mobile are deferred (AR-086); if a web client is later revived, UI code is not directly reusable.

### Option B — Electron + React/TypeScript
- **Pros:** Richest UI ecosystem; a later web client could reuse much of the frontend; large talent pool.
- **Cons:** Significantly heavier RAM/disk footprint — a real cost on the CPU-only managed-laptop tier ADR-005 targets; ships a full browser runtime; higher baseline resource use competes with on-device transcription.

### Option C — Tauri + web frontend (Rust core)
- **Pros:** Web-tech UI with a much smaller footprint than Electron; strong security posture; frontend reusable for a future web client.
- **Cons:** Younger/smaller ecosystem; requires Rust expertise for the core, raising the long-term maintenance bar; less mature enterprise-deployment track record.

## 4. Decision

**Option A — .NET (C#) with a native Windows UI (WinUI 3, with WPF as a fallback where WinUI coverage is insufficient).**

1. The desktop client is a native Windows .NET application, running entirely in a standard-user session (ADR-005 §4.1).
2. No browser runtime is shipped; the UI is native, minimizing footprint on CPU-only devices.
3. Packaging targets MSI and portable/self-contained deployment, silent/GPO/Intune/SCCM-compatible (ADR-005 §4.4).
4. This decision governs the desktop *shell and UI*; the transcription engine is a separate decision (ADR-011) integrated behind an abstraction, and may be a native or bundled component provided it honors ADR-005.

## 5. Rationale

Among the three, native .NET best satisfies the binding ADR-005 constraints for the actual target environment — CPU-only managed Windows laptops in a locked-down estate — with the smallest footprint and the strongest enterprise-deployment and long-term-support story. The main cost (Windows-only) is not a real loss under the current deferral of web/mobile, and if that deferral is revisited, a web client would be a *new* surface decision, not a reason to carry Electron/Tauri's footprint now.

## 6. Consequences

1. Resolves the desktop-stack portion of **AR-003** (subject to ratification); the transcription-engine portion is ADR-011.
2. `03-Architecture/DesktopArchitecture.md` designs against a native .NET client; its two-part runtime (interactive + background) maps to .NET processes/services within the standard-user session.
3. Chosen .NET libraries/frameworks are admitted through `05-Engineering/ThirdPartyComponentRegister.md` per its criteria.
4. A future web client (if AR-086 is ever reopened) is a separate stack decision; this ADR does not preclude it but does not invest in shared UI code now.
5. `NonFunctionalRequirements.md` performance budgets remain empirical (AR-076); this choice supports, but does not by itself resolve, them.

## 7. Risks

| Risk | Likelihood | Impact | Notes |
|---|---|---|---|
| Windows-only choice constrains a future web/mobile strategy. | Medium | Medium | Accepted under AR-086 deferral; revisiting web is a separate decision, not blocked by this one. |
| WinUI 3 maturity gaps for specific controls. | Medium | Low | WPF fallback is available and mature; both are supported .NET UI stacks. |
| Native UI is less familiar to web-oriented contributors. | Medium | Low | Offset by .NET's large enterprise talent pool and long support life. |

## 8. Related Requirements

- `03-Architecture/DesktopArchitecture.md` (DT-005–DT-007 standard-user runtime)
- `02-Requirements/NonFunctionalRequirements.md` (performance budgets, AR-076)
- `00-Governance/Decisions/ADR-005` (constraints), ADR-011 (transcription engine)
- `05-Engineering/ThirdPartyComponentRegister.md` (dependency admission)

## 9. Assumptions Updated

- **AR-003** — the desktop-stack portion is **proposed resolved** (native .NET/WinUI) pending ratification; the transcription-engine portion is addressed by ADR-011. On ratification, AR-003 is annotated Resolved for the stack.
- No numeric performance target is set here; AR-076 remains open.

## 10. Challenge the Design

1. Does the Windows-only choice foreclose anything the ratified scope actually needs now (not deferred)?
2. Is native .NET genuinely the lightest fit for the CPU-only tier, or would a measured comparison change the ranking?
3. Does WinUI 3 cover the review/approval UI needs, or will WPF fallback dominate — and if so, should WPF be primary?
4. Does this decision accidentally constrain the transcription-engine choice (ADR-011)? (It should not.)

## 11. Revision History

| Version | Date | Summary | Author |
|---|---|---|---|
| 0.1.0 | 2026-07-20 | Initial ADR-009 (Proposed): recommend native .NET (C#) with WinUI 3 / WPF fallback for the Windows desktop client, as the lightest, best-integrated fit for the ADR-005 managed, CPU-only, no-admin environment. Windows-only accepted under AR-086 (web/mobile deferred). Proposes resolving the desktop-stack portion of AR-003 pending ratification; transcription engine handled separately in ADR-011. | Dr Ziyaad Moolla (ZM) |
| 0.2.0 | 2026-07-20 | Ratified by the Product Owner. Status Proposed → Accepted; desktop-stack portion of AR-003 now resolved to native .NET/WinUI. | Dr Ziyaad Moolla (ZM) |

---

*End of Document — PEKB-00-GOV-022 — ADR-009 — Desktop Application Stack — PE-2026.001-ZM*
