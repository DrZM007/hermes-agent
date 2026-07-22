using Microsoft.Data.Sqlite;
using ProjectEcho.Application.Abstractions;
using ProjectEcho.Domain.Classification;
using ProjectEcho.Domain.Common;
using ProjectEcho.Domain.Lifecycle;
using ProjectEcho.Domain.Transcripts;

namespace ProjectEcho.Infrastructure.Persistence;

/// <summary>
/// SQLite-backed transcript repository (ADR-010, local placement). Persists the transcript
/// aggregate across three tables (Transcripts, TranscriptRevisions, Segments). Revisions and
/// segments are written with INSERT OR IGNORE keyed by their id, preserving the append-only
/// history (DB-008-011) — a re-save never rewrites an existing revision. Encryption-at-rest
/// (SQLCipher keyed by ADR-013) wraps the database file with the Windows/key-management increment.
/// </summary>
public sealed class SqliteTranscriptStore : ITranscriptRepository
{
    private readonly string _connectionString;

    public SqliteTranscriptStore(string connectionString)
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
            CREATE TABLE IF NOT EXISTS Transcripts (
                Id TEXT PRIMARY KEY, MeetingId TEXT NOT NULL, State INTEGER NOT NULL,
                DataClass INTEGER NOT NULL, SensitivityLabel INTEGER NOT NULL,
                AiEngineVersion TEXT NULL, AiModelRef TEXT NULL, CurrentRevisionId TEXT NULL);
            CREATE TABLE IF NOT EXISTS TranscriptRevisions (
                Id TEXT PRIMARY KEY, TranscriptId TEXT NOT NULL, ParentRevisionId TEXT NULL,
                AuthorType INTEGER NOT NULL, AuthorUserId TEXT NULL, CreatedAt TEXT NOT NULL,
                IsVerbatim INTEGER NOT NULL);
            CREATE TABLE IF NOT EXISTS Segments (
                Id TEXT PRIMARY KEY, RevisionId TEXT NOT NULL, Sequence INTEGER NOT NULL,
                StartMs INTEGER NOT NULL, EndMs INTEGER NOT NULL, SpeakerId TEXT NULL,
                Text TEXT NOT NULL, OverallConfidence REAL NOT NULL,
                CSpeech REAL NOT NULL, CSpeaker REAL NOT NULL, CTerminology REAL NOT NULL,
                CNames REAL NOT NULL, CNumbers REAL NOT NULL, CDates REAL NOT NULL,
                Uncertainty INTEGER NOT NULL, IsInaudible INTEGER NOT NULL);
            """;
        cmd.ExecuteNonQuery();
    }

    public async Task AddAsync(Transcript transcript, CancellationToken ct = default)
    {
        await using var conn = new SqliteConnection(_connectionString);
        await conn.OpenAsync(ct);
        await using var tx = (SqliteTransaction)await conn.BeginTransactionAsync(ct);

        await using (var t = conn.CreateCommand())
        {
            t.Transaction = tx;
            t.CommandText = """
                INSERT OR REPLACE INTO Transcripts
                    (Id, MeetingId, State, DataClass, SensitivityLabel, AiEngineVersion, AiModelRef, CurrentRevisionId)
                VALUES ($id, $mid, $state, $dc, $sl, $eng, $model, $cur);
                """;
            t.Parameters.AddWithValue("$id", transcript.Id.ToString());
            t.Parameters.AddWithValue("$mid", transcript.MeetingId.ToString());
            t.Parameters.AddWithValue("$state", (int)transcript.State);
            t.Parameters.AddWithValue("$dc", (int)transcript.Classification.DataClass);
            t.Parameters.AddWithValue("$sl", (int)transcript.Classification.SensitivityLabel);
            t.Parameters.AddWithValue("$eng", (object?)transcript.AiEngineVersion ?? DBNull.Value);
            t.Parameters.AddWithValue("$model", (object?)transcript.AiModelRef ?? DBNull.Value);
            t.Parameters.AddWithValue("$cur", (object?)transcript.CurrentRevisionId?.ToString() ?? DBNull.Value);
            await t.ExecuteNonQueryAsync(ct);
        }

        foreach (var rev in transcript.Revisions)
        {
            await using (var r = conn.CreateCommand())
            {
                r.Transaction = tx;
                r.CommandText = """
                    INSERT OR IGNORE INTO TranscriptRevisions
                        (Id, TranscriptId, ParentRevisionId, AuthorType, AuthorUserId, CreatedAt, IsVerbatim)
                    VALUES ($id, $tid, $parent, $atype, $auid, $created, $verbatim);
                    """;
                r.Parameters.AddWithValue("$id", rev.Id.ToString());
                r.Parameters.AddWithValue("$tid", rev.TranscriptId.ToString());
                r.Parameters.AddWithValue("$parent", (object?)rev.ParentRevisionId?.ToString() ?? DBNull.Value);
                r.Parameters.AddWithValue("$atype", (int)rev.AuthorType);
                r.Parameters.AddWithValue("$auid", (object?)rev.AuthorUserId?.ToString() ?? DBNull.Value);
                r.Parameters.AddWithValue("$created", rev.CreatedAt.ToString("o"));
                r.Parameters.AddWithValue("$verbatim", rev.IsVerbatim ? 1 : 0);
                await r.ExecuteNonQueryAsync(ct);
            }

            foreach (var seg in rev.Segments)
            {
                await using var s = conn.CreateCommand();
                s.Transaction = tx;
                s.CommandText = """
                    INSERT OR IGNORE INTO Segments
                        (Id, RevisionId, Sequence, StartMs, EndMs, SpeakerId, Text, OverallConfidence,
                         CSpeech, CSpeaker, CTerminology, CNames, CNumbers, CDates, Uncertainty, IsInaudible)
                    VALUES ($id, $rid, $seq, $start, $end, $spk, $text, $conf,
                            $c1, $c2, $c3, $c4, $c5, $c6, $unc, $ina);
                    """;
                var c = seg.ConfidenceByCategory;
                s.Parameters.AddWithValue("$id", seg.Id.ToString());
                s.Parameters.AddWithValue("$rid", rev.Id.ToString());
                s.Parameters.AddWithValue("$seq", seg.Sequence);
                s.Parameters.AddWithValue("$start", seg.StartMs);
                s.Parameters.AddWithValue("$end", seg.EndMs);
                s.Parameters.AddWithValue("$spk", (object?)seg.SpeakerId?.ToString() ?? DBNull.Value);
                s.Parameters.AddWithValue("$text", seg.Text);
                s.Parameters.AddWithValue("$conf", seg.OverallConfidence);
                s.Parameters.AddWithValue("$c1", c.Speech);
                s.Parameters.AddWithValue("$c2", c.Speaker);
                s.Parameters.AddWithValue("$c3", c.Terminology);
                s.Parameters.AddWithValue("$c4", c.Names);
                s.Parameters.AddWithValue("$c5", c.Numbers);
                s.Parameters.AddWithValue("$c6", c.Dates);
                s.Parameters.AddWithValue("$unc", (int)seg.Uncertainty);
                s.Parameters.AddWithValue("$ina", seg.IsInaudible ? 1 : 0);
                await s.ExecuteNonQueryAsync(ct);
            }
        }

        await tx.CommitAsync(ct);
    }

    public async Task<Transcript?> GetAsync(TranscriptId id, CancellationToken ct = default)
    {
        await using var conn = new SqliteConnection(_connectionString);
        await conn.OpenAsync(ct);

        MeetingId meetingId;
        LifecycleState state;
        DataClassification classification;
        string? eng, model;
        RevisionId? current;

        await using (var t = conn.CreateCommand())
        {
            t.CommandText = "SELECT MeetingId, State, DataClass, SensitivityLabel, AiEngineVersion, AiModelRef, CurrentRevisionId FROM Transcripts WHERE Id = $id;";
            t.Parameters.AddWithValue("$id", id.ToString());
            await using var rd = await t.ExecuteReaderAsync(ct);
            if (!await rd.ReadAsync(ct)) return null;
            meetingId = new MeetingId(Guid.Parse(rd.GetString(0)));
            state = (LifecycleState)rd.GetInt32(1);
            classification = new DataClassification((DataClass)rd.GetInt32(2), (SensitivityLabel)rd.GetInt32(3));
            eng = rd.IsDBNull(4) ? null : rd.GetString(4);
            model = rd.IsDBNull(5) ? null : rd.GetString(5);
            current = rd.IsDBNull(6) ? null : new RevisionId(Guid.Parse(rd.GetString(6)));
        }

        var revisions = new List<TranscriptRevision>();
        var revRows = new List<(RevisionId Id, RevisionId? Parent, AuthorType AType, UserId? AUid, DateTimeOffset Created, bool Verbatim)>();
        await using (var r = conn.CreateCommand())
        {
            r.CommandText = "SELECT Id, ParentRevisionId, AuthorType, AuthorUserId, CreatedAt, IsVerbatim FROM TranscriptRevisions WHERE TranscriptId = $tid ORDER BY CreatedAt ASC;";
            r.Parameters.AddWithValue("$tid", id.ToString());
            await using var rd = await r.ExecuteReaderAsync(ct);
            while (await rd.ReadAsync(ct))
            {
                revRows.Add((
                    new RevisionId(Guid.Parse(rd.GetString(0))),
                    rd.IsDBNull(1) ? null : new RevisionId(Guid.Parse(rd.GetString(1))),
                    (AuthorType)rd.GetInt32(2),
                    rd.IsDBNull(3) ? null : new UserId(Guid.Parse(rd.GetString(3))),
                    DateTimeOffset.Parse(rd.GetString(4), null, System.Globalization.DateTimeStyles.RoundtripKind),
                    rd.GetInt32(5) == 1));
            }
        }

        foreach (var row in revRows)
        {
            var segments = await LoadSegmentsAsync(conn, row.Id, ct);
            revisions.Add(new TranscriptRevision(row.Id, id, row.Parent, row.AType, row.AUid, row.Created, row.Verbatim, segments));
        }

        return Transcript.Rehydrate(id, meetingId, classification, eng, model, state, revisions, current);
    }

    private static async Task<List<Segment>> LoadSegmentsAsync(SqliteConnection conn, RevisionId revisionId, CancellationToken ct)
    {
        var segments = new List<Segment>();
        await using var s = conn.CreateCommand();
        s.CommandText = "SELECT Id, Sequence, StartMs, EndMs, SpeakerId, Text, OverallConfidence, CSpeech, CSpeaker, CTerminology, CNames, CNumbers, CDates, Uncertainty, IsInaudible FROM Segments WHERE RevisionId = $rid ORDER BY Sequence ASC;";
        s.Parameters.AddWithValue("$rid", revisionId.ToString());
        await using var rd = await s.ExecuteReaderAsync(ct);
        while (await rd.ReadAsync(ct))
        {
            var conf = new ConfidenceByCategory(rd.GetDouble(7), rd.GetDouble(8), rd.GetDouble(9), rd.GetDouble(10), rd.GetDouble(11), rd.GetDouble(12));
            segments.Add(new Segment(
                new SegmentId(Guid.Parse(rd.GetString(0))),
                rd.GetInt32(1), rd.GetInt64(2), rd.GetInt64(3),
                rd.IsDBNull(4) ? null : new SpeakerId(Guid.Parse(rd.GetString(4))),
                rd.GetString(5), rd.GetDouble(6), conf,
                (UncertaintyFlags)rd.GetInt32(13), rd.GetInt32(14) == 1));
        }
        return segments;
    }
}
