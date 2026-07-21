using System.Collections.Concurrent;
using ProjectEcho.Application.Abstractions;
using ProjectEcho.Domain.Common;
using ProjectEcho.Domain.Meetings;
using ProjectEcho.Domain.Transcripts;

namespace ProjectEcho.Infrastructure.Persistence;

// In-memory adapters used for early wiring and tests. They are replaced by the encrypted
// SQLite (local) / PostgreSQL (shared) EF Core implementation per ADR-010; the Application
// layer depends only on the ports, so that swap requires no change above this layer.

public sealed class InMemoryMeetingRepository : IMeetingRepository
{
    private readonly ConcurrentDictionary<MeetingId, Meeting> _store = new();

    public Task AddAsync(Meeting meeting, CancellationToken ct = default)
    {
        _store[meeting.Id] = meeting;
        return Task.CompletedTask;
    }

    public Task<Meeting?> GetAsync(MeetingId id, CancellationToken ct = default) =>
        Task.FromResult(_store.TryGetValue(id, out var m) ? m : null);
}

public sealed class InMemoryTranscriptRepository : ITranscriptRepository
{
    private readonly ConcurrentDictionary<TranscriptId, Transcript> _store = new();

    public Task AddAsync(Transcript transcript, CancellationToken ct = default)
    {
        _store[transcript.Id] = transcript;
        return Task.CompletedTask;
    }

    public Task<Transcript?> GetAsync(TranscriptId id, CancellationToken ct = default) =>
        Task.FromResult(_store.TryGetValue(id, out var t) ? t : null);
}

/// <summary>No-op unit of work for the in-memory adapters (entities mutate by reference).</summary>
public sealed class InMemoryUnitOfWork : IUnitOfWork
{
    public Task<int> SaveChangesAsync(CancellationToken ct = default) => Task.FromResult(0);
}
