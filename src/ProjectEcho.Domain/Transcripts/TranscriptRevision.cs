using ProjectEcho.Domain.Common;

namespace ProjectEcho.Domain.Transcripts;

// Four-state provenance of a revision's authorship (SA-032; briefing V9).
public enum AuthorType
{
    Ai = 0,
    Human = 1,
    ReviewerCorrection = 2,
    Approved = 3,
}

/// <summary>
/// An immutable, append-only transcript revision (DB-008-DB-011; ADR-007).
/// Once created it is never mutated; corrections, accepted AI suggestions, and redactions
/// all create NEW revisions. Segments are the structured content (DataModel-Core S5).
/// </summary>
public sealed class TranscriptRevision
{
    private readonly List<Segment> _segments;

    public RevisionId Id { get; }
    public TranscriptId TranscriptId { get; }
    public RevisionId? ParentRevisionId { get; }
    public AuthorType AuthorType { get; }
    public UserId? AuthorUserId { get; }   // null only for AuthorType.Ai
    public DateTimeOffset CreatedAt { get; }

    /// <summary>
    /// True only when this content is a human-verified verbatim source. AI-produced or reworded
    /// text is never verbatim (AI-059 / AC-046).
    /// </summary>
    public bool IsVerbatim { get; }

    public IReadOnlyList<Segment> Segments => _segments;

    public TranscriptRevision(
        RevisionId id,
        TranscriptId transcriptId,
        RevisionId? parentRevisionId,
        AuthorType authorType,
        UserId? authorUserId,
        DateTimeOffset createdAt,
        bool isVerbatim,
        IEnumerable<Segment> segments)
    {
        // Guardrail (AI-059/AI-062): AI-authored content is attributable-to-no-human and
        // may never be flagged verbatim. Human authorship must carry an author id.
        if (authorType == AuthorType.Ai && authorUserId is not null)
            throw new ArgumentException("AI-authored revisions must not carry a human author id.", nameof(authorUserId));
        if (authorType == AuthorType.Ai && isVerbatim)
            throw new ArgumentException("AI-authored content can never be marked verbatim (AI-059).", nameof(isVerbatim));
        if (authorType != AuthorType.Ai && authorUserId is null)
            throw new ArgumentException("Human/reviewer/approved revisions require an author id.", nameof(authorUserId));

        Id = id;
        TranscriptId = transcriptId;
        ParentRevisionId = parentRevisionId;
        AuthorType = authorType;
        AuthorUserId = authorUserId;
        CreatedAt = createdAt;
        IsVerbatim = isVerbatim;
        _segments = segments.ToList();
    }
}
