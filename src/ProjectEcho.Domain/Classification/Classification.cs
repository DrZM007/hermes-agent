namespace ProjectEcho.Domain.Classification;

// Two-axis classification model — ADR-006.
// Axis 1 (DataClass, C1-C4) = privacy/data-type; authoritative in PrivacyRequirements S6.
// Axis 2 (SensitivityLabel) = business handling sensitivity.
// The axes are orthogonal; the MORE RESTRICTIVE of the two governs any joint control.

/// <summary>Axis 1 — data/privacy classification (ADR-006; PrivacyRequirements S6.1).</summary>
public enum DataClass
{
    /// <summary>C1 — Organizational Confidential.</summary>
    C1 = 1,
    /// <summary>C2 — Personal Information.</summary>
    C2 = 2,
    /// <summary>C3 — Sensitive Personal Information.</summary>
    C3 = 3,
    /// <summary>C4 — Audit / Governance Metadata.</summary>
    C4 = 4,
}

/// <summary>Axis 2 — business handling sensitivity (ADR-006).</summary>
public enum SensitivityLabel
{
    Public = 0,
    Internal = 1,
    Confidential = 2,
    Restricted = 3,
    HighlyRestricted = 4,
}

/// <summary>
/// Both-axis classification carried by every content-bearing entity.
/// Inheritance uses the most-sensitive source value per axis — no laundering (PR-036, KB-004).
/// </summary>
public readonly record struct DataClassification(DataClass DataClass, SensitivityLabel SensitivityLabel)
{
    /// <summary>
    /// Combine two classifications taking the more restrictive value on EACH axis independently.
    /// Used when deriving artifacts from sources (ADR-006 S4.5). For C-levels, C3 (sensitive) is
    /// treated as most restrictive and C4 (audit metadata) as a distinct governance category that
    /// never lowers content sensitivity.
    /// </summary>
    public static DataClassification MostSensitive(DataClassification a, DataClassification b)
    {
        var dataClass = MoreRestrictiveDataClass(a.DataClass, b.DataClass);
        var label = (SensitivityLabel)Math.Max((int)a.SensitivityLabel, (int)b.SensitivityLabel);
        return new DataClassification(dataClass, label);
    }

    private static DataClass MoreRestrictiveDataClass(DataClass a, DataClass b)
    {
        // Content sensitivity ordering C1 < C2 < C3. C4 (audit metadata) is orthogonal and
        // is only produced for genuine audit records, never by deriving content — so if either
        // side is content (C1-C3), the content class wins over C4.
        static int Rank(DataClass c) => c switch
        {
            DataClass.C1 => 1,
            DataClass.C2 => 2,
            DataClass.C3 => 3,
            DataClass.C4 => 0, // not a content-sensitivity level
            _ => 0,
        };
        if (a == DataClass.C4 && b == DataClass.C4) return DataClass.C4;
        return Rank(a) >= Rank(b) ? a : b;
    }
}
