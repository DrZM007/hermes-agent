# Project Echo — Source

Implementation of Project Echo, built against the PEKB (`../PEKB/`) and conducted by
`../MASTER_PROMPT.md`. Phase 1 (Foundation) is in progress.

## Architecture

Clean Architecture (per `PEKB/00-Governance/EngineeringPrinciples.md`, briefing V17): dependencies
point inward; no shortcuts between layers.

```
ProjectEcho.Domain          pure C#, no dependencies — entities, invariants, lifecycle
ProjectEcho.Application     use cases / services (planned)
ProjectEcho.Infrastructure  persistence (SQLite/PostgreSQL, ADR-010), security (DPAPI-NG keys,
                            ADR-013), audit — (planned)
ProjectEcho.Desktop         native .NET WinUI 3 client (ADR-009) — (planned)
tests/                      unit/integration (TestStrategy) — (planned)
```

## Build

Targets **.NET 8** (`Directory.Build.props`). On a machine with the .NET SDK:

```
dotnet build
```

(The CI/agent container used for the spec work has no .NET SDK; the code is standard .NET 8 and
builds on any SDK-equipped host. Windows is required for the Desktop/WinUI and DPAPI-NG parts.)

## Status — Domain layer (Phase 1, in progress)

- Strongly-typed ids; two-axis classification (ADR-006) with more-restrictive-governs;
  lifecycle state machine (ADR-007); append-only transcript revisions with the AI content-integrity
  guardrails encoded as invariants (AI-059/061/062); Meeting/Recording/Speaker aggregates with
  PR-019 (recording ≥ C2) and Legal-Hold disposal suspension (ADR-007 §4.4).

Next: Application services, Infrastructure (encrypted SQLite persistence + audit + key management),
then the Desktop client — per `MASTER_PROMPT.md` Phase 1.
