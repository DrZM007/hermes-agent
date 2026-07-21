using ProjectEcho.Domain.Audit;
using ProjectEcho.Domain.Common;
using ProjectEcho.Domain.Meetings;
using ProjectEcho.Domain.Transcripts;

namespace ProjectEcho.Application.Abstractions;

// Ports (interfaces) the Application layer depends on; Infrastructure implements them
// (Clean Architecture / dependency inversion). Business logic never touches a concrete
// database, clock, or authorization mechanism directly.

public interface IClock
{
    DateTimeOffset UtcNow { get; }
}

public interface ICurrentUser
{
    UserId Id { get; }
    string Role { get; }   // resolved from the Identity & Access layer (ADR-004)
}

/// <summary>
/// The single authorization point (SA-014/SA-030; MA-001). No use case implements parallel access
/// logic; it asks this port. Implementations enforce ADR-004 roles, ADR-008 custom roles, and the
/// mandatory separations of duty (e.g., the approver of a transcript is not its sole reviewer).
/// </summary>
public interface IAccessControl
{
    bool CanSubmitReview(UserId user, TranscriptId transcript);
    bool CanApprove(UserId user, TranscriptId transcript);
    bool CanReopen(UserId user, TranscriptId transcript);
    bool CanRead(UserId user, TranscriptId transcript);
}

/// <summary>Append-only audit sink (SR-043). Exposes append + read only — no update/delete.</summary>
public interface IAuditLog
{
    Task AppendAsync(AuditEvent auditEvent, CancellationToken ct = default);
}

public interface IMeetingRepository
{
    Task<Meeting?> GetAsync(MeetingId id, CancellationToken ct = default);
    Task AddAsync(Meeting meeting, CancellationToken ct = default);
}

public interface ITranscriptRepository
{
    Task<Transcript?> GetAsync(TranscriptId id, CancellationToken ct = default);
    Task AddAsync(Transcript transcript, CancellationToken ct = default);
}

/// <summary>Atomic commit boundary so a state change and its audit entry persist together.</summary>
public interface IUnitOfWork
{
    Task<int> SaveChangesAsync(CancellationToken ct = default);
}

/// <summary>Result of a use case that may be denied by authorization.</summary>
public enum UseCaseOutcome { Success, Denied, InvalidState }

public readonly record struct UseCaseResult(UseCaseOutcome Outcome, string? Message = null)
{
    public static UseCaseResult Ok() => new(UseCaseOutcome.Success);
    public static UseCaseResult Deny(string message) => new(UseCaseOutcome.Denied, message);
    public static UseCaseResult Invalid(string message) => new(UseCaseOutcome.InvalidState, message);
    public bool IsSuccess => Outcome == UseCaseOutcome.Success;
}
