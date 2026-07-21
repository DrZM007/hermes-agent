namespace ProjectEcho.Application.Abstractions;

/// <summary>
/// Protects/unprotects key material at rest (ADR-013). The desktop implementation uses
/// OS-native DPAPI-NG bound to the user's Windows logon (no admin, no extra password); the
/// shared component uses the organization-controlled key store. Envelope encryption (KEK->DEK)
/// per SecurityArchitecture S5. This port keeps the encryption mechanism out of the domain/
/// application logic.
/// </summary>
public interface IKeyProtector
{
    byte[] Protect(byte[] plaintext);
    byte[] Unprotect(byte[] protectedData);
}
