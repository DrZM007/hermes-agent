using ProjectEcho.Domain.Classification;
using ProjectEcho.Domain.Common;
using ProjectEcho.Domain.Lifecycle;
using ProjectEcho.Domain.Transcripts;
using ProjectEcho.Infrastructure.Persistence;
using Xunit;

namespace ProjectEcho.Application.Tests;

public class SqliteTranscriptStoreTests : IDisposable
{
    private readonly string _path = Path.Combine(Path.GetTempPath(), $"echo-tx-{Guid.NewGuid():N}.db");
    private string Cs => $"Data Source={_path}";

    [Fact] // Aggregate round-trip: state, append-only revision, and structured segment persist.
    public async Task Save_Reload_RoundTrips()
    {
        var store = new SqliteTranscriptStore(Cs);
        var t = new Transcript(TranscriptId.New(), MeetingId.New(),
            new DataClassification(DataClass.C2, SensitivityLabel.Confidential), "engine-x", "model-y");

        var seg = new Segment(SegmentId.New(), 0, 0, 1500, SpeakerId.New(), "the protocol was approved",
            0.97, new ConfidenceByCategory(0.98, 0.9, 0.95, 0.88, 0.99, 0.98), UncertaintyFlags.Name, isInaudible: false);
        var rev = new TranscriptRevision(RevisionId.New(), t.Id, null, AuthorType.Ai, null,
            DateTimeOffset.UtcNow, isVerbatim: false, new[] { seg });
        t.AppendRevision(rev);
        t.TransitionTo(LifecycleState.ReviewRequired);

        await store.AddAsync(t);

        var loaded = await new SqliteTranscriptStore(Cs).GetAsync(t.Id);

        Assert.NotNull(loaded);
        Assert.Equal(LifecycleState.ReviewRequired, loaded!.State);
        Assert.Equal(DataClass.C2, loaded.Classification.DataClass);
        Assert.Equal(SensitivityLabel.Confidential, loaded.Classification.SensitivityLabel);
        Assert.Single(loaded.Revisions);
        Assert.Equal(AuthorType.Ai, loaded.Revisions[0].AuthorType);
        Assert.Single(loaded.Revisions[0].Segments);
        Assert.Equal("the protocol was approved", loaded.Revisions[0].Segments[0].Text);
        Assert.Equal(rev.Id, loaded.CurrentRevisionId);
    }

    [Fact] // Re-saving does not rewrite an existing revision (append-only, INSERT OR IGNORE).
    public async Task Resave_DoesNotDuplicateOrRewriteRevisions()
    {
        var store = new SqliteTranscriptStore(Cs);
        var t = new Transcript(TranscriptId.New(), MeetingId.New(),
            new DataClassification(DataClass.C2, SensitivityLabel.Internal), null, null);
        var rev = new TranscriptRevision(RevisionId.New(), t.Id, null, AuthorType.Ai, null,
            DateTimeOffset.UtcNow, false, Array.Empty<Segment>());
        t.AppendRevision(rev);

        await store.AddAsync(t);
        await store.AddAsync(t); // save again

        var loaded = await store.GetAsync(t.Id);
        Assert.NotNull(loaded);
        Assert.Single(loaded!.Revisions);
    }

    public void Dispose()
    {
        try { if (File.Exists(_path)) File.Delete(_path); }
        catch (IOException) { /* best-effort cleanup */ }
    }
}
