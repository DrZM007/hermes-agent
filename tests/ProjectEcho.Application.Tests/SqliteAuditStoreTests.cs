using ProjectEcho.Domain.Audit;
using ProjectEcho.Domain.Classification;
using ProjectEcho.Domain.Common;
using ProjectEcho.Infrastructure.Auditing;
using Xunit;

namespace ProjectEcho.Application.Tests;

public class SqliteAuditStoreTests : IDisposable
{
    private readonly string _path = Path.Combine(Path.GetTempPath(), $"echo-audit-{Guid.NewGuid():N}.db");
    private string Cs => $"Data Source={_path}";

    private static AuditEvent Event(AuditEventType type) => new(
        AuditEventId.New(), type, UserId.New(), "Reviewer",
        scope: "t1", targetRef: "t1", DataClass.C2, DateTimeOffset.UtcNow);

    [Fact] // Append + read round-trip; entries persist across store instances (durability).
    public async Task Append_Persists_AndReadsBack()
    {
        var store = new SqliteAuditStore(Cs);
        await store.AppendAsync(Event(AuditEventType.ReviewSubmitted));
        await store.AppendAsync(Event(AuditEventType.ApprovalGranted));

        // New instance over the same database sees the persisted rows.
        var reopened = new SqliteAuditStore(Cs);
        var entries = await reopened.ReadAllAsync();

        Assert.Equal(2, entries.Count);
        Assert.Contains(entries, e => e.Type == AuditEventType.ReviewSubmitted);
        Assert.Contains(entries, e => e.Type == AuditEventType.ApprovalGranted);
    }

    [Fact] // The store exposes no mutation of recorded events — append-only by construction (SR-043).
    public void Store_HasNoUpdateOrDeleteApi()
    {
        var methods = typeof(SqliteAuditStore).GetMethods()
            .Select(m => m.Name).ToArray();
        Assert.DoesNotContain(methods, n =>
            n.Contains("Update", StringComparison.OrdinalIgnoreCase) ||
            n.Contains("Delete", StringComparison.OrdinalIgnoreCase) ||
            n.Contains("Remove", StringComparison.OrdinalIgnoreCase));
    }

    public void Dispose()
    {
        try { if (File.Exists(_path)) File.Delete(_path); }
        catch (IOException) { /* best-effort cleanup */ }
    }
}
