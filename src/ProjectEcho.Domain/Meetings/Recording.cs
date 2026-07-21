using ProjectEcho.Domain.Classification;
using ProjectEcho.Domain.Common;

namespace ProjectEcho.Domain.Meetings;

public enum RecordingSource
{
    LiveCapture = 0,
    Import = 1,
    RoomSystem = 2,
}

/// <summary>
/// Recording (DataModel-Core S3). A meeting may have several recordings. Classified no lower
/// than C2 (PR-019). Content bytes live in the storage layer; this entity holds metadata and
/// integrity information (checksum, verification) per RC-016.
/// </summary>
public sealed class Recording
{
    public RecordingId Id { get; }
    public MeetingId MeetingId { get; }
    public RecordingSource Source { get; }
    public long DurationMs { get; }
    public string Checksum { get; }
    public string StorageLocation { get; }
    public DataClassification Classification { get; }
    public DateTimeOffset CreatedAt { get; }
    public DateTimeOffset? IntegrityVerifiedAt { get; private set; }

    public Recording(
        RecordingId id,
        MeetingId meetingId,
        RecordingSource source,
        long durationMs,
        string checksum,
        string storageLocation,
        DataClassification classification,
        DateTimeOffset createdAt)
    {
        if (durationMs < 0) throw new ArgumentException("Duration cannot be negative.", nameof(durationMs));
        if (string.IsNullOrWhiteSpace(checksum)) throw new ArgumentException("Checksum is required.", nameof(checksum));
        // A recording inherently captures voices/statements — never below C2 (PR-019).
        if (classification.DataClass is DataClass.C1)
            throw new ArgumentException("A recording must be classified no lower than C2 (PR-019).", nameof(classification));

        Id = id;
        MeetingId = meetingId;
        Source = source;
        DurationMs = durationMs;
        Checksum = checksum;
        StorageLocation = storageLocation;
        Classification = classification;
        CreatedAt = createdAt;
    }

    public void MarkIntegrityVerified(DateTimeOffset at) => IntegrityVerifiedAt = at;
}
