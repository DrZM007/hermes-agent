using ProjectEcho.Domain.Classification;
using ProjectEcho.Domain.Common;

namespace ProjectEcho.Domain.Audit;

// Consequential action types recorded in the immutable audit layer (SR-041-043; MA-002).
public enum AuditEventType
{
    ReviewSubmitted,
    ApprovalGranted,
    ApprovalReturned,
    TranscriptReopened,
    SpeakerRenamed,
    RevisionAppended,
    RecordingReceived,
    AccessDenied,
    ExportPerformed,
    DeletionPerformed,
    DisposalPerformed,
    RoleAssigned,
    PolicyChanged,
    LegalHoldApplied,
    LegalHoldRemoved,
    KeyEscrowRecovered,
}

/// <summary>
/// An immutable audit entry (ADR-004 S4.4; SR-043). Append-only: no code path updates or deletes
/// an entry (enforced by the audit store, which exposes append + read only). Records who did what
/// to which target, with the affected classification — never meeting content (OPS-005).
/// </summary>
public sealed class AuditEvent
{
    public AuditEventId Id { get; }
    public AuditEventType Type { get; }
    public UserId ActorUserId { get; }
    public string ActorRole { get; }
    public string Scope { get; }
    public string TargetRef { get; }
    public DataClass AffectedDataClass { get; }
    public DateTimeOffset Timestamp { get; }
    public string? Detail { get; }   // no confidential content (OPS-005)

    public AuditEvent(
        AuditEventId id,
        AuditEventType type,
        UserId actorUserId,
        string actorRole,
        string scope,
        string targetRef,
        DataClass affectedDataClass,
        DateTimeOffset timestamp,
        string? detail = null)
    {
        Id = id;
        Type = type;
        ActorUserId = actorUserId;
        ActorRole = actorRole;
        Scope = scope;
        TargetRef = targetRef;
        AffectedDataClass = affectedDataClass;
        Timestamp = timestamp;
        Detail = detail;
    }
}
