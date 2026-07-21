using Microsoft.Data.Sqlite;
using ProjectEcho.Application.Abstractions;
using ProjectEcho.Domain.Audit;
using ProjectEcho.Domain.Classification;
using ProjectEcho.Domain.Common;

namespace ProjectEcho.Infrastructure.Auditing;

/// <summary>
/// SQLite-backed append-only audit store (ADR-010; SR-043). The public surface is append + read
/// only — there is deliberately no update or delete method, so the immutable-audit guarantee holds
/// by construction (a privileged role cannot modify a prior entry through any code path here).
/// Encryption-at-rest of the database (SQLCipher keyed by the ADR-013 hierarchy) is wired with the
/// Windows/key-management increment; audit rows carry no meeting content (OPS-005).
/// </summary>
public sealed class SqliteAuditStore : IAuditLog
{
    private readonly string _connectionString;

    public SqliteAuditStore(string connectionString)
    {
        _connectionString = connectionString;
        EnsureCreated();
    }

    private void EnsureCreated()
    {
        using var conn = new SqliteConnection(_connectionString);
        conn.Open();
        using var cmd = conn.CreateCommand();
        cmd.CommandText = """
            CREATE TABLE IF NOT EXISTS AuditEvents (
                Id TEXT NOT NULL PRIMARY KEY,
                Type INTEGER NOT NULL,
                ActorUserId TEXT NOT NULL,
                ActorRole TEXT NOT NULL,
                Scope TEXT NOT NULL,
                TargetRef TEXT NOT NULL,
                AffectedDataClass INTEGER NOT NULL,
                Timestamp TEXT NOT NULL,
                Detail TEXT NULL
            );
            """;
        cmd.ExecuteNonQuery();
    }

    public async Task AppendAsync(AuditEvent auditEvent, CancellationToken ct = default)
    {
        await using var conn = new SqliteConnection(_connectionString);
        await conn.OpenAsync(ct);
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = """
            INSERT INTO AuditEvents
                (Id, Type, ActorUserId, ActorRole, Scope, TargetRef, AffectedDataClass, Timestamp, Detail)
            VALUES ($id, $type, $actor, $role, $scope, $target, $class, $ts, $detail);
            """;
        cmd.Parameters.AddWithValue("$id", auditEvent.Id.ToString());
        cmd.Parameters.AddWithValue("$type", (int)auditEvent.Type);
        cmd.Parameters.AddWithValue("$actor", auditEvent.ActorUserId.ToString());
        cmd.Parameters.AddWithValue("$role", auditEvent.ActorRole);
        cmd.Parameters.AddWithValue("$scope", auditEvent.Scope);
        cmd.Parameters.AddWithValue("$target", auditEvent.TargetRef);
        cmd.Parameters.AddWithValue("$class", (int)auditEvent.AffectedDataClass);
        cmd.Parameters.AddWithValue("$ts", auditEvent.Timestamp.ToString("o"));
        cmd.Parameters.AddWithValue("$detail", (object?)auditEvent.Detail ?? DBNull.Value);
        await cmd.ExecuteNonQueryAsync(ct);
    }

    /// <summary>Read entries in chronological order. Read-only projection; recorded events are never mutated.</summary>
    public async Task<IReadOnlyList<AuditEvent>> ReadAllAsync(CancellationToken ct = default)
    {
        var result = new List<AuditEvent>();
        await using var conn = new SqliteConnection(_connectionString);
        await conn.OpenAsync(ct);
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = """
            SELECT Id, Type, ActorUserId, ActorRole, Scope, TargetRef, AffectedDataClass, Timestamp, Detail
            FROM AuditEvents ORDER BY Timestamp ASC;
            """;
        await using var reader = await cmd.ExecuteReaderAsync(ct);
        while (await reader.ReadAsync(ct))
        {
            result.Add(new AuditEvent(
                new AuditEventId(Guid.Parse(reader.GetString(0))),
                (AuditEventType)reader.GetInt32(1),
                new UserId(Guid.Parse(reader.GetString(2))),
                reader.GetString(3),
                reader.GetString(4),
                reader.GetString(5),
                (DataClass)reader.GetInt32(6),
                DateTimeOffset.Parse(reader.GetString(7), null, System.Globalization.DateTimeStyles.RoundtripKind),
                reader.IsDBNull(8) ? null : reader.GetString(8)));
        }
        return result;
    }
}
