namespace ProjectEcho.Domain.Lifecycle;

// Transcript & record lifecycle — FunctionalRequirements S3.1 as amended by ADR-007.
// Forward chain plus the records-management tail (Eligible for Disposal, Disposed).

public enum LifecycleState
{
    RecordingReceived = 0,
    Processing = 1,
    DraftTranscript = 2,
    ReviewRequired = 3,
    Reviewed = 4,
    Approved = 5,
    Archived = 6,
    EligibleForDisposal = 7,
    Disposed = 8,
}

/// <summary>
/// Authoritative transition rules for the transcript lifecycle (ADR-007).
/// Multi-stage approval (ADR-007 S4.2) is a sub-process of Reviewed -> Approved handled by the
/// approval workflow, not a macro state. Legal Hold suspends entry to EligibleForDisposal and
/// blocks Disposed (enforced in the retention service, ADR-007 S4.4).
/// </summary>
public static class LifecycleTransitions
{
    private static readonly Dictionary<LifecycleState, LifecycleState[]> Allowed = new()
    {
        [LifecycleState.RecordingReceived] = new[] { LifecycleState.Processing },
        [LifecycleState.Processing] = new[] { LifecycleState.DraftTranscript },
        [LifecycleState.DraftTranscript] = new[] { LifecycleState.ReviewRequired },
        [LifecycleState.ReviewRequired] = new[] { LifecycleState.Reviewed },
        // Approver requests changes: Reviewed -> Review Required (backward, audited).
        [LifecycleState.Reviewed] = new[] { LifecycleState.Approved, LifecycleState.ReviewRequired },
        // Re-open an approved record (SR-035), or archive it.
        [LifecycleState.Approved] = new[] { LifecycleState.Archived, LifecycleState.Reviewed },
        [LifecycleState.Archived] = new[] { LifecycleState.EligibleForDisposal },
        // Retention re-extended or Legal Hold applied returns to Archived; or dispose.
        [LifecycleState.EligibleForDisposal] = new[] { LifecycleState.Disposed, LifecycleState.Archived },
        // Terminal — content no longer exists.
        [LifecycleState.Disposed] = Array.Empty<LifecycleState>(),
    };

    public static bool CanTransition(LifecycleState from, LifecycleState to) =>
        Allowed.TryGetValue(from, out var targets) && Array.IndexOf(targets, to) >= 0;

    public static IReadOnlyCollection<LifecycleState> AllowedFrom(LifecycleState from) =>
        Allowed.TryGetValue(from, out var targets) ? targets : Array.Empty<LifecycleState>();
}
