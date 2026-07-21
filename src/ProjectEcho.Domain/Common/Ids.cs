namespace ProjectEcho.Domain.Common;

// Strongly-typed GUID identifiers — every object has identity (briefing V14).
// A readonly record struct prevents mixing a MeetingId with a TranscriptId.

public readonly record struct MeetingId(Guid Value)
{
    public static MeetingId New() => new(Guid.NewGuid());
    public override string ToString() => Value.ToString();
}

public readonly record struct RecordingId(Guid Value)
{
    public static RecordingId New() => new(Guid.NewGuid());
    public override string ToString() => Value.ToString();
}

public readonly record struct TranscriptId(Guid Value)
{
    public static TranscriptId New() => new(Guid.NewGuid());
    public override string ToString() => Value.ToString();
}

public readonly record struct RevisionId(Guid Value)
{
    public static RevisionId New() => new(Guid.NewGuid());
    public override string ToString() => Value.ToString();
}

public readonly record struct SegmentId(Guid Value)
{
    public static SegmentId New() => new(Guid.NewGuid());
    public override string ToString() => Value.ToString();
}

public readonly record struct SpeakerId(Guid Value)
{
    public static SpeakerId New() => new(Guid.NewGuid());
    public override string ToString() => Value.ToString();
}

public readonly record struct UserId(Guid Value)
{
    public static UserId New() => new(Guid.NewGuid());
    public override string ToString() => Value.ToString();
}

public readonly record struct ApprovalId(Guid Value)
{
    public static ApprovalId New() => new(Guid.NewGuid());
    public override string ToString() => Value.ToString();
}

public readonly record struct AuditEventId(Guid Value)
{
    public static AuditEventId New() => new(Guid.NewGuid());
    public override string ToString() => Value.ToString();
}
