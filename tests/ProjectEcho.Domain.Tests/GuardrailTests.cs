using ProjectEcho.Domain.Common;
using ProjectEcho.Domain.Transcripts;
using Xunit;

namespace ProjectEcho.Domain.Tests;

// AI content-integrity guardrails encoded as domain invariants (AIRequirements S6A;
// verified by AcceptanceCriteria AC-042-047). These tests are safety-critical (TST-P3).
public class GuardrailTests
{
    private static Segment PlainSegment() => new(
        SegmentId.New(), 0, 0, 1000, null, "hello",
        1.0, new ConfidenceByCategory(1, 1, 1, 1, 1, 1), UncertaintyFlags.None, isInaudible: false);

    [Fact] // AC-046 / AI-059 — AI text is never verbatim.
    public void AiRevision_CannotBeVerbatim()
    {
        Assert.Throws<ArgumentException>(() => new TranscriptRevision(
            RevisionId.New(), TranscriptId.New(), null, AuthorType.Ai, null,
            DateTimeOffset.UtcNow, isVerbatim: true, new[] { PlainSegment() }));
    }

    [Fact] // AI-059 — AI authorship carries no human id.
    public void AiRevision_CannotHaveHumanAuthor()
    {
        Assert.Throws<ArgumentException>(() => new TranscriptRevision(
            RevisionId.New(), TranscriptId.New(), null, AuthorType.Ai, UserId.New(),
            DateTimeOffset.UtcNow, isVerbatim: false, new[] { PlainSegment() }));
    }

    [Fact] // Human/reviewer/approved revisions must be attributable.
    public void HumanRevision_RequiresAuthor()
    {
        Assert.Throws<ArgumentException>(() => new TranscriptRevision(
            RevisionId.New(), TranscriptId.New(), null, AuthorType.Human, null,
            DateTimeOffset.UtcNow, isVerbatim: false, new[] { PlainSegment() }));
    }

    [Fact] // AC-043 / AI-061 — an inaudible segment carries no fabricated text.
    public void InaudibleSegment_CannotContainText()
    {
        Assert.Throws<ArgumentException>(() => new Segment(
            SegmentId.New(), 0, 0, 1000, null, "invented words",
            0.1, new ConfidenceByCategory(0, 0, 0, 0, 0, 0), UncertaintyFlags.UnclearAudio, isInaudible: true));
    }
}
