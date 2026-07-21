using ProjectEcho.Application.Abstractions;

namespace ProjectEcho.Infrastructure.Time;

public sealed class SystemClock : IClock
{
    public DateTimeOffset UtcNow => DateTimeOffset.UtcNow;
}
