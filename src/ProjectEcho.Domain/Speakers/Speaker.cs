using ProjectEcho.Domain.Classification;
using ProjectEcho.Domain.Common;

namespace ProjectEcho.Domain.Speakers;

/// <summary>
/// Speaker object (DataModel-Core S6). Per-meeting labelling is C2 and default-on (AI-040a);
/// persistent cross-meeting voice recognition is C3, opt-in only, and disabled by default
/// (AI-041; whether offered at all is AR-060). Uncertain attributions are marked, never
/// silently merged (AI-060 / AC-045).
/// </summary>
public sealed class Speaker
{
    public SpeakerId Id { get; }
    public MeetingId MeetingId { get; }
    public string DisplayName { get; private set; }
    public string? Role { get; private set; }
    public bool IsPersistentProfile { get; }   // true => C3, requires opt-in (AI-041)
    public bool IsUncertain { get; private set; }

    public DataClass DataClass => IsPersistentProfile ? DataClass.C3 : DataClass.C2;

    public Speaker(
        SpeakerId id,
        MeetingId meetingId,
        string displayName,
        string? role,
        bool isPersistentProfile,
        bool isUncertain)
    {
        if (string.IsNullOrWhiteSpace(displayName))
            throw new ArgumentException("Display name is required.", nameof(displayName));
        Id = id;
        MeetingId = meetingId;
        DisplayName = displayName;
        Role = role;
        IsPersistentProfile = isPersistentProfile;
        IsUncertain = isUncertain;
    }

    public void Rename(string displayName)
    {
        if (string.IsNullOrWhiteSpace(displayName))
            throw new ArgumentException("Display name is required.", nameof(displayName));
        DisplayName = displayName;
    }

    /// <summary>Resolve an uncertain attribution — an explicit human action (AI-060).</summary>
    public void ConfirmAttribution() => IsUncertain = false;
}
