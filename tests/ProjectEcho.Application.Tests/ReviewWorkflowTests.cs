using ProjectEcho.Application.Abstractions;
using ProjectEcho.Application.Review;
using ProjectEcho.Domain.Audit;
using ProjectEcho.Domain.Classification;
using ProjectEcho.Domain.Common;
using ProjectEcho.Domain.Lifecycle;
using ProjectEcho.Domain.Transcripts;
using ProjectEcho.Infrastructure.Auditing;
using ProjectEcho.Infrastructure.Persistence;
using ProjectEcho.Infrastructure.Time;
using Xunit;

namespace ProjectEcho.Application.Tests;

public class ReviewWorkflowTests
{
    private sealed class FakeUser : ICurrentUser
    {
        public UserId Id { get; init; } = UserId.New();
        public string Role { get; init; } = "Reviewer";
    }

    private sealed class FakeAccess : IAccessControl
    {
        public bool Submit, Approve, Reopen, Read = true;
        public bool CanSubmitReview(UserId u, TranscriptId t) => Submit;
        public bool CanApprove(UserId u, TranscriptId t) => Approve;
        public bool CanReopen(UserId u, TranscriptId t) => Reopen;
        public bool CanRead(UserId u, TranscriptId t) => Read;
    }

    private static Transcript SeedReviewRequired(InMemoryTranscriptRepository repo)
    {
        var t = new Transcript(TranscriptId.New(), MeetingId.New(),
            new DataClassification(DataClass.C2, SensitivityLabel.Internal), "engine-x", "model-y");
        t.TransitionTo(LifecycleState.ReviewRequired);
        repo.AddAsync(t).GetAwaiter().GetResult();
        return t;
    }

    private static (ReviewWorkflowService svc, InMemoryAuditLog audit) Build(
        InMemoryTranscriptRepository repo, FakeAccess access, ICurrentUser user)
    {
        var audit = new InMemoryAuditLog();
        var svc = new ReviewWorkflowService(repo, access, audit,
            new InMemoryUnitOfWork(), new SystemClock(), user);
        return (svc, audit);
    }

    [Fact] // FR-048 — reviewer submits: Review Required -> Reviewed, audited.
    public async Task Submit_TransitionsAndAudits()
    {
        var repo = new InMemoryTranscriptRepository();
        var t = SeedReviewRequired(repo);
        var (svc, audit) = Build(repo, new FakeAccess { Submit = true }, new FakeUser());

        var result = await svc.SubmitForApprovalAsync(t.Id);

        Assert.True(result.IsSuccess);
        Assert.Equal(LifecycleState.Reviewed, t.State);
        Assert.Contains(audit.Entries, e => e.Type == AuditEventType.ReviewSubmitted);
    }

    [Fact] // ADR-004 S4.3.2 — the sole reviewer cannot approve; denial is audited; state unchanged.
    public async Task Approve_DeniedForReviewer_IsAudited()
    {
        var repo = new InMemoryTranscriptRepository();
        var t = SeedReviewRequired(repo);
        t.TransitionTo(LifecycleState.Reviewed);
        var access = new FakeAccess { Approve = false };
        var (svc, audit) = Build(repo, access, new FakeUser());

        var result = await svc.ApproveAsync(t.Id);

        Assert.Equal(UseCaseOutcome.Denied, result.Outcome);
        Assert.Equal(LifecycleState.Reviewed, t.State);
        Assert.Contains(audit.Entries, e => e.Type == AuditEventType.AccessDenied);
    }

    [Fact] // FR-050 — an authorized approver approves: Reviewed -> Approved, audited.
    public async Task Approve_TransitionsAndAudits()
    {
        var repo = new InMemoryTranscriptRepository();
        var t = SeedReviewRequired(repo);
        t.TransitionTo(LifecycleState.Reviewed);
        var (svc, audit) = Build(repo, new FakeAccess { Approve = true },
            new FakeUser { Role = "Approver" });

        var result = await svc.ApproveAsync(t.Id);

        Assert.True(result.IsSuccess);
        Assert.Equal(LifecycleState.Approved, t.State);
        Assert.Contains(audit.Entries, e => e.Type == AuditEventType.ApprovalGranted);
    }
}
