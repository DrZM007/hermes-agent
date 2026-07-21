using ProjectEcho.Domain.Classification;
using ProjectEcho.Domain.Common;
using ProjectEcho.Domain.Lifecycle;
using ProjectEcho.Domain.Meetings;
using Xunit;

namespace ProjectEcho.Domain.Tests;

public class LifecycleAndClassificationTests
{
    [Fact] // ADR-007 — Disposed is terminal.
    public void Disposed_HasNoOnwardTransition()
    {
        Assert.Empty(LifecycleTransitions.AllowedFrom(LifecycleState.Disposed));
        Assert.False(LifecycleTransitions.CanTransition(LifecycleState.Disposed, LifecycleState.Archived));
    }

    [Fact] // ADR-007 — illegal jumps are rejected.
    public void IllegalTransition_IsRejected()
    {
        Assert.False(LifecycleTransitions.CanTransition(LifecycleState.DraftTranscript, LifecycleState.Approved));
        Assert.True(LifecycleTransitions.CanTransition(LifecycleState.Reviewed, LifecycleState.Approved));
    }

    [Fact] // ADR-007 S4.4 — Legal Hold blocks disposal transitions.
    public void LegalHold_BlocksDisposal()
    {
        var meeting = NewMeeting(LifecycleState.Archived);
        DriveTo(meeting, LifecycleState.Archived);
        meeting.ApplyLegalHold();
        Assert.Throws<InvalidOperationException>(() => meeting.TransitionTo(LifecycleState.EligibleForDisposal));
    }

    [Fact] // PR-019 — a recording is never below C2.
    public void Recording_BelowC2_IsRejected()
    {
        Assert.Throws<ArgumentException>(() => new Recording(
            RecordingId.New(), MeetingId.New(), RecordingSource.LiveCapture, 1000, "abc", "loc",
            new DataClassification(DataClass.C1, SensitivityLabel.Internal), DateTimeOffset.UtcNow));
    }

    [Fact] // ADR-006 — more restrictive of the two axes governs; no laundering.
    public void MostSensitive_TakesHigherOnEachAxis()
    {
        var a = new DataClassification(DataClass.C2, SensitivityLabel.Internal);
        var b = new DataClassification(DataClass.C3, SensitivityLabel.Confidential);
        var combined = DataClassification.MostSensitive(a, b);
        Assert.Equal(DataClass.C3, combined.DataClass);
        Assert.Equal(SensitivityLabel.Confidential, combined.SensitivityLabel);
    }

    private static Meeting NewMeeting(LifecycleState _) => new(
        MeetingId.New(), "m", null,
        new DataClassification(DataClass.C2, SensitivityLabel.Internal),
        UserId.New(), DateTimeOffset.UtcNow);

    private static void DriveTo(Meeting m, LifecycleState target)
    {
        var path = new[]
        {
            LifecycleState.Processing, LifecycleState.DraftTranscript, LifecycleState.ReviewRequired,
            LifecycleState.Reviewed, LifecycleState.Approved, LifecycleState.Archived,
        };
        foreach (var s in path)
        {
            m.TransitionTo(s);
            if (s == target) return;
        }
    }
}
