using ProjectEcho.Application.Abstractions;
using ProjectEcho.Domain.Audit;
using ProjectEcho.Domain.Common;
using ProjectEcho.Domain.Lifecycle;
using ProjectEcho.Domain.Transcripts;

namespace ProjectEcho.Application.Review;

/// <summary>
/// Review-workflow use cases. Every consequential action follows the same pattern:
/// AUTHORIZE (single access-control point, MA-001) -> ACT (domain enforces lifecycle) ->
/// AUDIT (append-only, MA-002) -> COMMIT (atomic). A denial is itself audited (AccessDenied).
/// Separation of duties (ADR-004 S4.3) is enforced by IAccessControl, not by this service.
/// </summary>
public sealed class ReviewWorkflowService
{
    private readonly ITranscriptRepository _transcripts;
    private readonly IAccessControl _access;
    private readonly IAuditLog _audit;
    private readonly IUnitOfWork _uow;
    private readonly IClock _clock;
    private readonly ICurrentUser _user;

    public ReviewWorkflowService(
        ITranscriptRepository transcripts,
        IAccessControl access,
        IAuditLog audit,
        IUnitOfWork uow,
        IClock clock,
        ICurrentUser user)
    {
        _transcripts = transcripts;
        _access = access;
        _audit = audit;
        _uow = uow;
        _clock = clock;
        _user = user;
    }

    /// <summary>Reviewer submits a transcript for approval: Review Required -> Reviewed (FR-048).</summary>
    public async Task<UseCaseResult> SubmitForApprovalAsync(TranscriptId transcriptId, CancellationToken ct = default)
    {
        var transcript = await _transcripts.GetAsync(transcriptId, ct);
        if (transcript is null) return UseCaseResult.Invalid("Transcript not found.");

        if (!_access.CanSubmitReview(_user.Id, transcriptId))
            return await DenyAsync(transcriptId, "submit for approval", ct);

        if (transcript.State != LifecycleState.ReviewRequired)
            return UseCaseResult.Invalid($"Cannot submit from state {transcript.State}.");

        transcript.TransitionTo(LifecycleState.Reviewed);
        await AuditAsync(AuditEventType.ReviewSubmitted, transcript, ct);
        await _uow.SaveChangesAsync(ct);
        return UseCaseResult.Ok();
    }

    /// <summary>
    /// Approver approves a Reviewed transcript: Reviewed -> Approved (FR-050). Denied if the caller
    /// may not approve this transcript — including the separation-of-duties rule that its sole
    /// reviewer cannot approve it (ADR-004 S4.3.2), enforced in IAccessControl.
    /// Multi-stage approval (ADR-007 S4.2) is handled by the approval workflow feeding CanApprove.
    /// </summary>
    public async Task<UseCaseResult> ApproveAsync(TranscriptId transcriptId, CancellationToken ct = default)
    {
        var transcript = await _transcripts.GetAsync(transcriptId, ct);
        if (transcript is null) return UseCaseResult.Invalid("Transcript not found.");

        if (!_access.CanApprove(_user.Id, transcriptId))
            return await DenyAsync(transcriptId, "approve", ct);

        if (transcript.State != LifecycleState.Reviewed)
            return UseCaseResult.Invalid($"Cannot approve from state {transcript.State}.");

        transcript.TransitionTo(LifecycleState.Approved);
        await AuditAsync(AuditEventType.ApprovalGranted, transcript, ct);
        await _uow.SaveChangesAsync(ct);
        return UseCaseResult.Ok();
    }

    /// <summary>Approver returns a Reviewed transcript for changes: Reviewed -> Review Required (FR-051).</summary>
    public async Task<UseCaseResult> ReturnForChangesAsync(TranscriptId transcriptId, CancellationToken ct = default)
    {
        var transcript = await _transcripts.GetAsync(transcriptId, ct);
        if (transcript is null) return UseCaseResult.Invalid("Transcript not found.");

        if (!_access.CanApprove(_user.Id, transcriptId))
            return await DenyAsync(transcriptId, "return for changes", ct);

        if (transcript.State != LifecycleState.Reviewed)
            return UseCaseResult.Invalid($"Cannot return from state {transcript.State}.");

        transcript.TransitionTo(LifecycleState.ReviewRequired);
        await AuditAsync(AuditEventType.ApprovalReturned, transcript, ct);
        await _uow.SaveChangesAsync(ct);
        return UseCaseResult.Ok();
    }

    private async Task AuditAsync(AuditEventType type, Transcript transcript, CancellationToken ct) =>
        await _audit.AppendAsync(new AuditEvent(
            AuditEventId.New(), type, _user.Id, _user.Role,
            scope: transcript.Id.ToString(), targetRef: transcript.Id.ToString(),
            affectedDataClass: transcript.Classification.DataClass, _clock.UtcNow), ct);

    private async Task<UseCaseResult> DenyAsync(TranscriptId transcriptId, string action, CancellationToken ct)
    {
        await _audit.AppendAsync(new AuditEvent(
            AuditEventId.New(), AuditEventType.AccessDenied, _user.Id, _user.Role,
            scope: transcriptId.ToString(), targetRef: transcriptId.ToString(),
            affectedDataClass: Domain.Classification.DataClass.C4, _clock.UtcNow,
            detail: $"Denied: {action}"), ct);
        await _uow.SaveChangesAsync(ct);
        return UseCaseResult.Deny($"Not authorized to {action} this transcript.");
    }
}
