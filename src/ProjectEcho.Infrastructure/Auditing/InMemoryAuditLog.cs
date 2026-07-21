using System.Collections.Concurrent;
using ProjectEcho.Application.Abstractions;
using ProjectEcho.Domain.Audit;

namespace ProjectEcho.Infrastructure.Auditing;

/// <summary>
/// Append-only in-memory audit sink. Exposes append + read only — there is deliberately no
/// update or delete path (SR-043; AC-007). The durable SQLite/PostgreSQL-backed store follows
/// the same contract; this implementation is used for tests and early wiring.
/// </summary>
public sealed class InMemoryAuditLog : IAuditLog
{
    private readonly ConcurrentQueue<AuditEvent> _events = new();

    public Task AppendAsync(AuditEvent auditEvent, CancellationToken ct = default)
    {
        _events.Enqueue(auditEvent);
        return Task.CompletedTask;
    }

    /// <summary>Read-only snapshot for verification. No mutation of recorded events is possible.</summary>
    public IReadOnlyList<AuditEvent> Entries => _events.ToArray();
}
