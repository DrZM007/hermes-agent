// Structure-name resolution for imported anatomical models.
//
// Pure (no DOM, no imports) so it can be unit-tested directly. Atlases such as
// Z-Anatomy name meshes in Latin, often with laterality and duplicate suffixes
// ("Hepar", "Pulmo.l", "Ren.r.001"). This maps those onto our structure ids so
// a stock export highlights correctly without renaming anything in Blender.

/** Lowercase, split separators, drop numeric/laterality suffixes. */
export function normalizeName(raw) {
  let s = String(raw || "").toLowerCase();
  s = s.replace(/[._\-/]+/g, " ");
  s = s.replace(/\s+/g, " ").trim();
  // trailing duplicate counters: "liver 001"
  s = s.replace(/\s+\d+$/g, "").trim();
  // laterality tokens anywhere: l, r, lt, rt, left, right, dexter, sinister
  const LATERAL = new Set(["l", "r", "lt", "rt", "left", "right",
    "dexter", "dextra", "dextrum", "sinister", "sinistra", "sinistrum"]);
  s = s.split(" ").filter((tok) => !LATERAL.has(tok)).join(" ").trim();
  return s;
}

const singular = (s) => (s.endsWith("s") && s.length > 3 ? s.slice(0, -1) : s);

/**
 * Build a resolver from the structures dataset. Each structure may carry an
 * `aliases` array. Returns resolve(meshName) -> structure id | null.
 */
export function buildResolver(structures) {
  const exact = new Map();   // normalized name -> id
  const add = (name, id) => {
    const n = normalizeName(name);
    if (!n || exact.has(n)) return;
    exact.set(n, id);
  };
  for (const st of structures) {
    add(st.id, st.id);
    add(st.name, st.id);
    for (const a of st.aliases || []) add(a, st.id);
  }
  // longest-first so "vesica biliaris" beats "vesica" when both are present
  const byLength = [...exact.keys()].sort((a, b) => b.length - a.length);

  return function resolve(meshName) {
    const n = normalizeName(meshName);
    if (!n) return null;
    if (exact.has(n)) return exact.get(n);
    const sg = singular(n);
    if (exact.has(sg)) return exact.get(sg);
    // whole-word containment, longest alias wins
    for (const key of byLength) {
      if (key.length < 4) continue;               // avoid noisy short matches
      const re = new RegExp(`(^|\\s)${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\s|$)`);
      if (re.test(n)) return exact.get(key);
    }
    return null;
  };
}
