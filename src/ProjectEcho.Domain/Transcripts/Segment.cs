using ProjectEcho.Domain.Common;

namespace ProjectEcho.Domain.Transcripts;

// Typed uncertainty indicators (RI-006). Conveyed by text/icon, never colour alone (UI layer).
[Flags]
public enum UncertaintyFlags
{
    None = 0,
    Name = 1 << 0,
    Number = 1 << 1,
    Date = 1 << 2,
    Terminology = 1 << 3,
    UnclearAudio = 1 << 4,
    MultipleSpeakers = 1 << 5,
}

// Per-category confidence (RI-004). Values are 0..1; category set is illustrative and
// the underlying representation remains subject to AR-072/AR-076 (no thresholds invented here).
public readonly record struct ConfidenceByCategory(
    double Speech,
    double Speaker,
    double Terminology,
    double Names,
    double Numbers,
    double Dates);

/// <summary>
/// Structured transcript content (DataModel-Core S5): text stored per segment with timing,
/// speaker, confidence and uncertainty. Inaudible segments are marked, never fabricated
/// (AI-026 / AI-061 / AC-043).
/// </summary>
public sealed class Segment
{
    public SegmentId Id { get; }
    public int Sequence { get; }
    public long StartMs { get; }
    public long EndMs { get; }
    public SpeakerId? SpeakerId { get; }
    public string Text { get; }          // encrypted at rest by the persistence layer (SR-025)
    public double OverallConfidence { get; }
    public ConfidenceByCategory ConfidenceByCategory { get; }
    public UncertaintyFlags Uncertainty { get; }
    public bool IsInaudible { get; }

    public Segment(
        SegmentId id,
        int sequence,
        long startMs,
        long endMs,
        SpeakerId? speakerId,
        string text,
        double overallConfidence,
        ConfidenceByCategory confidenceByCategory,
        UncertaintyFlags uncertainty,
        bool isInaudible)
    {
        if (endMs < startMs) throw new ArgumentException("EndMs must be >= StartMs.", nameof(endMs));
        // An inaudible segment carries no fabricated text (AI-061).
        if (isInaudible && !string.IsNullOrEmpty(text))
            throw new ArgumentException("Inaudible segments must not contain fabricated text (AI-061).", nameof(text));

        Id = id;
        Sequence = sequence;
        StartMs = startMs;
        EndMs = endMs;
        SpeakerId = speakerId;
        Text = text;
        OverallConfidence = overallConfidence;
        ConfidenceByCategory = confidenceByCategory;
        Uncertainty = uncertainty;
        IsInaudible = isInaudible;
    }
}
