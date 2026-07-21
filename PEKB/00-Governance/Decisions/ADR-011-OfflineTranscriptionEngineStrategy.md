# ADR-011 — Offline Transcription Engine Strategy

## Document Metadata

| Field | Value |
|---|---|
| Document ID | PEKB-00-GOV-024 |
| Decision ID | ADR-011 |
| Document Title | Offline Transcription Engine Strategy |
| PEKB Section | 00-Governance/Decisions |
| Version | 0.2.0 |
| Status | Accepted |
| Classification | Internal — Governance |
| Owner Role | AI/ML Architect |
| Approval Required From | Product Owner (Dr Ziyaad Moolla), Principal Software Architect, Security Architect, DevOps/Deployment Engineer |
| Related Documents | ProjectConstitution.md, EthicalAICharter.md, AssumptionsRegister.md (00-Governance); ADR-001-AIProcessingModel.md, ADR-005-EnterpriseCompatibilityZeroITFriction.md, ADR-009-DesktopApplicationStack.md (00-Governance/Decisions); AIArchitecture.md (03-Architecture); AIRequirements.md, NonFunctionalRequirements.md, ThirdPartyComponentRegister.md (02/05) |
| Original Creator | Dr Ziyaad Moolla |
| Creator ID | ZM |
| Document Provenance | PE-2026.001-ZM |

---

## 1. Context

**ADR-001** requires every AI capability to have a default offline path, and the product-owner briefing (Versions 9, 12, 15) repeatedly required that Project Echo not be tied to a single speech model or vendor — an abstraction layer so transcription, speaker identification, and meeting intelligence can be replaced or upgraded independently. The offline transcription engine must run well on CPU-only managed laptops under **ADR-005**. Critically, the offline AI performance envelope on that hardware is still **empirically unresolved (AR-076)**.

This ADR decides the transcription-engine *strategy*. **Ratified by the Product Owner on 2026-07-20** (the abstraction-layer commitment and the deferral of the concrete default engine are ratified; the default engine itself is selected later, post-benchmark).

## 2. Problem

Decide how transcription is provided such that: it is vendor/model-independent (swappable), offline-by-default, viable on CPU-only devices, and packageable under ADR-005 — **without** hard-binding a specific engine before its performance has been measured against AR-076.

## 3. Options Considered

### Option A — Commit to the abstraction layer now; select the default engine after benchmarking
Ratify a pluggable STT interface immediately; defer the concrete default engine until it is benchmarked on representative hardware (closing part of AR-076).

- **Pros:** Honest about the unresolved performance question; locks in vendor-independence (the durable architectural commitment) without betting on an unmeasured engine; lets the Benchmark Suite (briefing V12) drive the choice with evidence. Fully consistent with ADR-001 and the "no invented thresholds" discipline.
- **Cons:** Leaves the concrete default engine open a while longer (but behind a stable interface, so downstream work is not blocked).

### Option B — Commit now to an embeddable CPU-first engine (whisper.cpp family) as default
- **Pros:** No Python runtime; smallest packaging footprint; best Zero-IT-Friction and CPU-only fit; easy to bundle in an MSI.
- **Cons:** Commits to a specific engine's accuracy/throughput before benchmarking against AR-076; may under-serve accuracy needs for domain terminology.

### Option C — Commit now to faster-whisper (Python/CTranslate2) as default
- **Pros:** Strong accuracy/throughput; GPU-capable where available; named in the briefing.
- **Cons:** Requires a bundled Python runtime — heavier to package and maintain in a locked-down estate; larger footprint on constrained devices; still unmeasured against AR-076.

## 4. Decision

**Option A.**

1. Project Echo adopts a **transcription abstraction layer** (a stable internal interface for speech-to-text, speaker labeling, and downstream AI modules) as the binding architectural commitment, realizing the vendor-independence required by ADR-001 and the briefing.
2. Every engine behind the abstraction must run **offline by default** (ADR-001) and be packageable under **ADR-005** (no admin, no container dependency; a bundled runtime is acceptable only if it satisfies these).
3. The **concrete default engine is deferred** until benchmarked on representative CPU-only managed-laptop hardware using the Benchmark Suite, as part of resolving **AR-076**. Embeddable CPU-first engines (whisper.cpp family) and faster-whisper are both **candidates**; neither is committed here.
4. Candidate engines are evaluated for accuracy (including domain terminology), speed, CPU/RAM usage, and packaging footprint before one is promoted to default; the AI content-integrity guardrails (`AIRequirements.md` §6A) apply to whichever engine is chosen.

## 5. Rationale

The durable decision is *vendor-independence*, and that can and should be committed now. The *engine* decision depends on measured performance on the actual hardware, which AR-076 says we do not yet have — so committing to a specific engine now would be inventing a threshold judgement we have explicitly refused to invent elsewhere. Option A locks the architecture (unblocking all downstream work behind a stable interface) while letting evidence, not preference, pick the default. It keeps faith with ADR-001 and the "measured, not guessed" discipline that runs through the whole PEKB.

## 6. Consequences

1. `03-Architecture/AIArchitecture.md` defines the transcription abstraction interface and the module contract (draft-in/draft-out, no side channels) that any engine must satisfy.
2. The Benchmark Suite and the AR-076 resolution work must produce the evidence that selects the default engine; a follow-up ADR (or an amendment to this one) records the selection.
3. Whichever engine is chosen is admitted via `05-Engineering/ThirdPartyComponentRegister.md` and must satisfy ADR-005 packaging.
4. Downstream desktop and requirements work proceeds against the abstraction, not a specific engine, so it is not blocked by the deferral.
5. Speaker identification and meeting-intelligence modules sit behind the same abstraction and are independently replaceable.

## 7. Risks

| Risk | Likelihood | Impact | Notes |
|---|---|---|---|
| Deferring the default engine slows a concrete demo. | Medium | Low | The abstraction plus a candidate engine can be wired for prototyping without ratifying it as the default. |
| The eventual engine underperforms on CPU-only hardware. | Medium | High | This is exactly what benchmarking against AR-076 exists to catch before commitment. |
| Bundled-runtime engines (faster-whisper) strain ADR-005 packaging. | Medium | Medium | ADR-005 conformance is an explicit selection criterion (Section 4.2). |

## 8. Related Requirements

- `02-Requirements/AIRequirements.md` (§6A guardrails; AI-034 offline default)
- `03-Architecture/AIArchitecture.md` (abstraction/module contract)
- `02-Requirements/NonFunctionalRequirements.md` (AR-076 performance)
- ADR-001, ADR-005, ADR-009
- `05-Engineering/ThirdPartyComponentRegister.md`

## 9. Assumptions Updated

- **AR-076** — this ADR does not resolve it; it makes resolving it (via benchmarking) the explicit gate for selecting the default engine.
- Partially informs **AR-003** for the AI-tooling dimension (abstraction committed; engine deferred).
- **AR-060** (whether persistent speaker recognition ships) is unaffected and remains Open.

## 10. Challenge the Design

1. Is deferring the default engine genuinely lower-regret than committing to an embeddable CPU-first default now?
2. Is the abstraction interface specifiable well enough to be stable across very different engines (native vs. Python-runtime)?
3. Does any candidate engine's licensing or update model conflict with ADR-005 or the ThirdPartyComponentRegister criteria?
4. What must the Benchmark Suite measure to make the engine decision evidence-based rather than preference-based?

## 11. Revision History

| Version | Date | Summary | Author |
|---|---|---|---|
| 0.1.0 | 2026-07-20 | Initial ADR-011 (Proposed): commit now to a transcription abstraction layer (vendor-independence per ADR-001/briefing), require every engine to be offline-by-default and ADR-005-packageable, and defer the concrete default engine until benchmarked on CPU-only hardware as part of resolving AR-076. whisper.cpp-family and faster-whisper are candidates, neither committed. Avoids inventing an unmeasured engine/threshold decision. | Dr Ziyaad Moolla (ZM) |
| 0.2.0 | 2026-07-20 | Ratified by the Product Owner. Status Proposed → Accepted: the abstraction-layer commitment and the deferral of the default engine are ratified. The concrete default engine remains to be selected post-benchmark (AR-076) via a follow-up ADR/amendment. | Dr Ziyaad Moolla (ZM) |

---

*End of Document — PEKB-00-GOV-024 — ADR-011 — Offline Transcription Engine Strategy — PE-2026.001-ZM*
