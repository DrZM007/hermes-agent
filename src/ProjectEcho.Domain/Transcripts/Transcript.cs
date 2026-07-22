using ProjectEcho.Domain.Classification;
using ProjectEcho.Domain.Common;
using ProjectEcho.Domain.Lifecycle;

namespace ProjectEcho.Domain.Transcripts;

/// <summary>
/// Transcript aggregate root. Holds an append-only chain of revisions and a lifecycle state.
/// Editing is never in place: every change appends a revision (DB-008-011). State changes go
/// through the lifecycle rules (ADR-007). The aggregate enforces the domain invariants; the
/// approval workflow, authorization (ADR-004) and audit (SR-041) are applied by services above.
/// </summary>
public sealed class Transcript
{
    private readonly List<TranscriptRevision> _revisions = new();

    public TranscriptId Id { get; }
    public MeetingId MeetingId { get; }
    public LifecycleState State { get; private set; }
    public DataClassification Classification { get; private set; }
    public string? AiEngineVersion { get; }
    public string? AiModelRef { get; }
    public RevisionId? CurrentRevisionId { get; private set; }

    public IReadOnlyList<TranscriptRevision> Revisions => _revisions;

    public Transcript(
        TranscriptId id,
        MeetingId meetingId,
        DataClassification classification,
        string? aiEngineVersion,
        string? aiModelRef)
    {
        Id = id;
        MeetingId = meetingId;
        Classification = classification;
        AiEngineVersion = aiEngineVersion;
        AiModelRef = aiModelRef;
        State = LifecycleState.DraftTranscript;
    }

    /// <summary>
    /// Reconstruct a transcript from persisted, already-valid state (persistence layer only).
    /// This bypasses the forward-only invariant checks that guard live edits (e.g. append-after
    /// -approved), because the stored state was itself produced through those checks. Not for
    /// use by application/domain logic — only by repositories rehydrating from storage.
    /// </summary>
    public static Transcript Rehydrate(
        TranscriptId id,
        MeetingId meetingId,
        DataClassification classification,
        string? aiEngineVersion,
        string? aiModelRef,
        LifecycleState state,
        IEnumerable<TranscriptRevision> revisions,
        RevisionId? currentRevisionId)
    {
        var t = new Transcript(id, meetingId, classification, aiEngineVersion, aiModelRef)
        {
            State = state,
            CurrentRevisionId = currentRevisionId,
        };
        foreach (var r in revisions)
            t._revisions.Add(r);
        return t;
    }

    /// <summary>Append a new immutable revision. The only way transcript content ever changes.</summary>
    public void AppendRevision(TranscriptRevision revision)
    {
        if (revision.TranscriptId != Id)
            throw new ArgumentException("Revision belongs to a different transcript.", nameof(revision));
        if (State is LifecycleState.Approved or LifecycleState.Archived
            or LifecycleState.EligibleForDisposal or LifecycleState.Disposed)
            // Editing an approved+ transcript requires the audited re-open path (FR-040/SR-035),
            // which moves state back to Reviewed first.
            throw new InvalidOperationException($"Cannot append a revision while state is {State}; re-open first.");

        _revisions.Add(revision);
        CurrentRevisionId = revision.Id;
    }

    /// <summary>Transition lifecycle state, enforcing the ADR-007 transition rules.</summary>
    public void TransitionTo(LifecycleState next)
    {
        if (!LifecycleTransitions.CanTransition(State, next))
            throw new InvalidOperationException($"Illegal lifecycle transition {State} -> {next} (ADR-007).");
        State = next;
    }

    /// <summary>
    /// Re-classify (e.g., on deriving from a more-sensitive source). Never lowers either axis
    /// below the current value — classification only tightens (ADR-006; no laundering).
    /// </summary>
    public void RaiseClassification(DataClassification other)
    {
        Classification = DataClassification.MostSensitive(Classification, other);
    }
}
