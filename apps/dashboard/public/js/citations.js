// Inline citation rendering, shared by MedBot (PMIDs) and Notebook (passage
// numbers).
//
// Answers come back with bracketed markers like [12345678] or [2]. This turns
// each marker into a chip wired to its source. A marker the model invented —
// one with no matching source — is NOT dressed up as a citation: it renders in
// an "unverified" style so a fabricated reference can never look authoritative.
// That matters most in the clinical widget, where a plausible-looking PMID is
// exactly the kind of thing a reader would trust without checking.

const MARKER = /(\[[0-9]{1,10}\])/g;

/**
 * Build a DocumentFragment from `text`, converting bracketed markers to chips.
 *
 * @param {string} text
 * @param {(token: string) => ({title?: string, onClick?: Function}|null)} resolve
 *        Given the inner token (e.g. "12345678"), return the source it refers
 *        to, or null/undefined if there is no such source.
 * @returns {{fragment: DocumentFragment, cited: Set<string>, unverified: Set<string>}}
 */
export function renderCitations(text, resolve) {
  const fragment = document.createDocumentFragment();
  const cited = new Set();
  const unverified = new Set();

  for (const part of String(text ?? "").split(MARKER)) {
    const m = part.match(/^\[([0-9]{1,10})\]$/);
    if (!m) {
      if (part) fragment.append(document.createTextNode(part));
      continue;
    }
    const token = m[1];
    let source = null;
    try { source = resolve(token); } catch { source = null; }
    if (!source) {
      // Unknown reference — show it, but never as a live citation.
      unverified.add(token);
      const bad = document.createElement("span");
      bad.className = "cite cite-unverified";
      bad.textContent = part;
      bad.title = "No matching source — treat this reference as unverified";
      fragment.append(bad);
      continue;
    }
    cited.add(token);
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "cite";
    chip.textContent = part;
    if (source.title) chip.title = source.title;
    if (source.onClick) chip.addEventListener("click", source.onClick);
    fragment.append(chip);
  }
  return { fragment, cited, unverified };
}
