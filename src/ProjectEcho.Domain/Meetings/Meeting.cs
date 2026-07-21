using ProjectEcho.Domain.Classification;
using ProjectEcho.Domain.Common;
using ProjectEcho.Domain.Lifecycle;

namespace ProjectEcho.Domain.Meetings;

/// <summary>
/// Meeting aggregate (DataModel-Core S3). Owns one or more recordings and carries the
/// two-axis classification, lifecycle state, owner, retention policy and Legal Hold flag.
/// </summary>
public sealed class Meeting
{
    private readonly List<Recording> _recordings = new();

    public MeetingId Id { get; }
    public string Title { get; private set; }
    public string? Description { get; private set; }
    public DataClassification Classification { get; private set; }
    public LifecycleState State { get; private set; }
    public UserId OwnerUserId { get; }
    public DateTimeOffset CreatedAt { get; }
    public bool LegalHold { get; private set; }

    public IReadOnlyList<Recording> Recordings => _recordings;

    public Meeting(
        MeetingId id,
        string title,
        string? description,
        DataClassification classification,
        UserId ownerUserId,
        DateTimeOffset createdAt)
    {
        if (string.IsNullOrWhiteSpace(title)) throw new ArgumentException("Title is required.", nameof(title));
        Id = id;
        Title = title;
        Description = description;
        Classification = classification;
        OwnerUserId = ownerUserId;
        CreatedAt = createdAt;
        State = LifecycleState.RecordingReceived;
    }

    public void AddRecording(Recording recording)
    {
        if (recording.MeetingId != Id)
            throw new ArgumentException("Recording belongs to a different meeting.", nameof(recording));
        _recordings.Add(recording);
        // A meeting recording is classified no lower than C2 (PR-019).
        RaiseClassification(new DataClassification(DataClass.C2, Classification.SensitivityLabel));
    }

    public void TransitionTo(LifecycleState next)
    {
        if (!LifecycleTransitions.CanTransition(State, next))
            throw new InvalidOperationException($"Illegal lifecycle transition {State} -> {next} (ADR-007).");
        // Legal Hold suspends disposal transitions (ADR-007 S4.4).
        if (LegalHold && next is LifecycleState.EligibleForDisposal or LifecycleState.Disposed)
            throw new InvalidOperationException("Disposal is blocked while a Legal Hold is in effect (ADR-007 S4.4).");
        State = next;
    }

    public void ApplyLegalHold() => LegalHold = true;
    public void RemoveLegalHold() => LegalHold = false;

    public void RaiseClassification(DataClassification other) =>
        Classification = DataClassification.MostSensitive(Classification, other);
}
