// Clinical guideline directory — a curated index of the ISSUING BODIES' own
// guideline pages, South African first, then the international societies most
// referenced in SA practice.
//
// Deliberately links only. This widget stores no guideline content: a summary
// frozen in a dashboard goes stale silently and invisibly, and a stale dose is
// worse than no dose. Every entry points at the publisher's own landing page
// rather than a versioned PDF, so the link keeps working when the edition turns
// over and you always land on whatever is current.
//
// Links were sourced from search results in August 2026 and are unverified
// against live fetches (the build environment cannot reach these hosts) — treat
// a dead link as a moved page, not as evidence the guideline is withdrawn.

import { h, clear } from "../utils.js";

const GROUPS = [
  {
    id: "sa-national",
    name: "South Africa — national",
    entries: [
      { name: "Standard Treatment Guidelines & EML",
        issuer: "National Department of Health",
        covers: "PHC, adult hospital, paediatric and tertiary levels. The reference standard for the SA public sector.",
        url: "https://knowledgehub.health.gov.za/content/standard-treatment-guidelines-and-essential-medicines-list" },
      { name: "National TB Management Guidelines",
        issuer: "National Department of Health",
        covers: "Tuberculosis — DS-TB and DR-TB diagnosis, regimens and programmatic management.",
        url: "https://knowledgehub.health.gov.za/elibrary/national-tuberculosis-management-guidelines" },
      { name: "Treatment of TB Infection (TPT)",
        issuer: "National Department of Health",
        covers: "Tuberculosis preventive therapy (TPT) — eligibility, regimens, and who to exclude first.",
        url: "https://knowledgehub.health.gov.za/elibrary/national-guidelines-treatment-tuberculosis-infection" },
      { name: "Paediatric Hospital Level STGs & EML",
        issuer: "National Department of Health",
        covers: "Paediatric inpatient standard treatment guidelines and medicines list.",
        url: "https://knowledgehub.health.gov.za/elibrary/hospital-level-paediatric-standard-treatment-guidelines-stgs-and-essential-medicines-list" },
      { name: "NDoH & WHO guideline index",
        issuer: "SA HIV Clinicians Society (mirror)",
        covers: "A consolidated index of current NDoH and WHO guideline documents.",
        url: "https://www.sahivsoc.org/Subheader/Index/ndoh-and-who-guidelines" },
      { name: "NDoH guideline directory",
        issuer: "Medicines Information Centre, UCT",
        covers: "Curated links to current NDoH guidelines, maintained by UCT Clinical Pharmacology.",
        url: "https://mic.uct.ac.za/ndoh-guidelines" },
      { name: "SAHPRA",
        issuer: "SA Health Products Regulatory Authority",
        covers: "Product registration, safety alerts, recalls and regulatory guidance.",
        url: "https://www.sahpra.org.za/" },
      { name: "NICD",
        issuer: "National Institute for Communicable Diseases",
        covers: "Communicable disease A–Z, outbreak alerts, surveillance and clinician guidance.",
        url: "https://www.nicd.ac.za/" },
    ],
  },
  {
    id: "sa-societies",
    name: "South Africa — societies",
    entries: [
      { name: "Adult ART Guidelines",
        issuer: "Southern African HIV Clinicians Society",
        covers: "Adult antiretroviral therapy — private and public sector, harmonised with NDoH.",
        url: "https://www.sahivsoc.org/Guidelines/GuidelinesLandingPage" },
      { name: "Type 2 Diabetes Guidelines",
        issuer: "SEMDSA",
        covers: "Diagnosis, targets and the SA treatment ladder for type 2 diabetes.",
        url: "https://www.semdsa.org.za/for-members/guidelines" },
      { name: "Hypertension Practice Guideline",
        issuer: "Southern African Hypertension Society",
        covers: "Diagnosis, thresholds, drug sequencing and resistant hypertension.",
        url: "https://www.hypertension.org.za/guidelines" },
      { name: "Position statements & guidelines",
        issuer: "Allergy Society of South Africa (ALLSA)",
        covers: "Childhood asthma, allergic rhinitis, anaphylaxis and immunotherapy.",
        url: "https://allsa.org/allsa-position-statements-guidelines/" },
      { name: "Professional guidelines",
        issuer: "SA Society of Obstetricians & Gynaecologists",
        covers: "Obstetric and gynaecological practice guidance, including BetterObs labour management.",
        url: "https://sasog.co.za/professional-guideli/" },
      { name: "South African Medicines Formulary",
        issuer: "SAMA / UCT Clinical Pharmacology",
        covers: "The SA drug reference — dosing, interactions and availability. Paid publication.",
        url: "https://samedical.org/product/south-african-medicines-formulary-samf-14th-edition/" },
    ],
  },
  {
    id: "international",
    name: "International",
    entries: [
      { name: "WHO Guidelines",
        issuer: "World Health Organization",
        covers: "Global clinical and public-health recommendations; the upstream source for much of the SA STG.",
        url: "https://www.who.int/publications/who-guidelines" },
      { name: "NICE Guidance",
        issuer: "National Institute for Health and Care Excellence (UK)",
        covers: "Condition-by-condition guidance, often the most detailed free write-up available.",
        url: "https://www.nice.org.uk/guidance" },
      { name: "ESC Clinical Practice Guidelines",
        issuer: "European Society of Cardiology",
        covers: "ACS, heart failure, arrhythmia, valve disease, hypertension, lipids.",
        url: "https://www.escardio.org/guidelines/clinical-practice-guidelines/" },
      { name: "KDIGO Guidelines",
        issuer: "Kidney Disease: Improving Global Outcomes",
        covers: "CKD evaluation and management, diabetes in CKD, AKI, glomerular disease.",
        url: "https://kdigo.org/guidelines/" },
      { name: "GINA Strategy Report",
        issuer: "Global Initiative for Asthma",
        covers: "Asthma diagnosis, control assessment and the stepwise treatment tracks.",
        url: "https://ginasthma.org/" },
      { name: "GOLD Report",
        issuer: "Global Initiative for Chronic Obstructive Lung Disease",
        covers: "COPD diagnosis, ABE grouping, pharmacological and exacerbation management.",
        url: "https://goldcopd.org/" },
    ],
  },
];

const ALL = GROUPS.flatMap((g) => g.entries.map((e) => ({ ...e, group: g.name })));

export default {
  type: "guidelines",
  title: "Guideline Directory",
  icon: "📚",
  defaultSize: "m",

  render(body, ctx) {
    const { store } = ctx;
    const state = () => store.state.guidelines || {};
    const persist = (patch) =>
      store.update((s) => { s.guidelines = { ...(s.guidelines || {}), ...patch }; }, "guidelines");

    const draw = () => {
      const activeId = state().group || "all";
      const tabs = h("div.tabs", { role: "tablist", "aria-label": "Guideline groups" },
        [["all", "All"], ...GROUPS.map((g) => [g.id, g.name])].map(([id, label]) => {
          const b = h("button.tab", { type: "button", role: "tab",
            "aria-selected": String(id === activeId) }, label);
          b.addEventListener("click", () => { persist({ group: id }); draw(); });
          return b;
        }));

      // Transient, like the cheat-sheet filter: a store write per keystroke
      // forces a redraw and steals focus from the input.
      let query = "";
      const search = h("input.input.gl-search", { type: "search",
        placeholder: "Filter guidelines…", "aria-label": "Filter guidelines" });
      search.addEventListener("input", () => { query = search.value; paint(); });

      const list = h("div.gl-list");
      const paint = () => {
        const q = query.trim().toLowerCase();
        const groups = activeId === "all" ? GROUPS : GROUPS.filter((g) => g.id === activeId);
        clear(list);
        let shown = 0;
        for (const g of groups) {
          const entries = g.entries.filter((e) =>
            !q || `${e.name} ${e.issuer} ${e.covers}`.toLowerCase().includes(q));
          if (!entries.length) continue;
          shown += entries.length;
          list.append(
            h("div.gl-group", {}, g.name),
            ...entries.map((e) => h("a.gl-item", {
              href: e.url, target: "_blank", rel: "noopener noreferrer",
            },
            h("div.gl-name", {}, e.name),
            h("div.gl-issuer.muted.small", {}, e.issuer),
            h("div.gl-covers.small", {}, e.covers))));
        }
        if (!shown) list.append(h("div.muted.small", {}, "No matching guideline."));
      };

      clear(body).append(tabs, search, list,
        h("div.muted.small.gl-note", {},
          "Links point at each issuer's own guideline page, not a stored copy — "
          + "always confirm you are reading the current edition."));
      paint();
    };

    ctx.onRefresh(draw);
    draw();
  },
};

/** Search index for the command palette: every guideline by name and issuer. */
export function searchIndex() {
  return ALL.map((e) => ({
    label: e.name, hint: `guideline · ${e.issuer}`, type: "guidelines",
  }));
}
