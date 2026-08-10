// Clinical cheat sheets — condensed, bedside-oriented reference cards for the
// South African setting (SEMDSA / EML / STG flavoured). Pure client-side, works
// offline. Educational decision support: always verify against the current
// SEMDSA guideline, the EML/STGs and your own clinical judgement.
//
// Structure is data-driven so more sheets drop in without touching the render:
//   SHEETS = [{ id, title, blurb, sections: [{ heading, rows: [[label, detail]] }] }]

import { h, clear } from "../utils.js";

const SHEETS = [
  {
    id: "dm",
    title: "Diabetes mellitus",
    blurb: "Diagnosis, targets, treatment ladder, emergencies — SA context.",
    sections: [
      {
        heading: "Diagnosis (any one, repeat to confirm if asymptomatic)",
        rows: [
          ["Fasting plasma glucose", "≥ 7.0 mmol/L (no calories ≥ 8 h)"],
          ["2-h OGTT (75 g)", "≥ 11.1 mmol/L"],
          ["HbA1c", "≥ 6.5% (48 mmol/mol) — assay must be standardised"],
          ["Random glucose", "≥ 11.1 mmol/L with classic symptoms → diagnostic alone"],
          ["Prediabetes", "IFG 6.1–6.9 · IGT 7.8–11.0 · HbA1c 6.0–6.4%"],
          ["Caveats", "HbA1c unreliable in anaemia, haemoglobinopathy, pregnancy, recent transfusion, CKD, HIV on some ART"],
        ],
      },
      {
        heading: "Targets (individualise — loosen for frailty, hypo unawareness, short life expectancy)",
        rows: [
          ["HbA1c", "< 7% for most; < 6.5% if young/short duration and no hypo risk; 7.5–8.5% if frail/elderly"],
          ["Pre-prandial glucose", "4–7 mmol/L"],
          ["Post-prandial (2 h)", "< 10 mmol/L (< 8 if aiming tight)"],
          ["Blood pressure", "< 140/90; < 130/80 if albuminuria or high CV risk and tolerated"],
          ["LDL-C", "< 1.8 mmol/L with ASCVD/very high risk; < 2.5 otherwise"],
          ["Lifestyle", "Weight −5–10%, ≥150 min/week activity, smoking cessation"],
        ],
      },
      {
        heading: "Type 2 — treatment ladder",
        rows: [
          ["1st line", "Metformin 500 mg bd with food → titrate to 1 g bd (max 2–3 g/day). Hold if eGFR < 30."],
          ["Compelling ASCVD / HF / CKD", "Add SGLT2 inhibitor (empagliflozin 10 mg daily) or GLP-1 RA — benefit independent of HbA1c"],
          ["Cost-constrained add-on", "Sulfonylurea — gliclazide MR 30 mg daily (titrate; hypo + weight gain risk)"],
          ["Other orals", "DPP-4 inhibitor (weight neutral, low hypo); pioglitazone (avoid in HF, fracture risk)"],
          ["Insulin", "Start basal 10 U nocte (or 0.1–0.2 U/kg); titrate ~2 U every 3 days to fasting target"],
          ["Escalation", "Add prandial insulin or GLP-1 if HbA1c above target on optimised basal"],
        ],
      },
      {
        heading: "Diabetic ketoacidosis (DKA)",
        rows: [
          ["Diagnose", "Glucose > 11 mmol/L (or known DM) + ketones ≥ 3 mmol/L (or ≥2+ urine) + pH < 7.3 or HCO₃ < 15"],
          ["Fluids", "0.9% NaCl — 1 L stat, then guided by shock/dehydration; slower in young, elderly, pregnancy, cardiac/renal disease"],
          ["Insulin", "Fixed-rate IV infusion 0.1 U/kg/h. Do NOT stop until ketones < 0.6 and pH normalised"],
          ["Potassium", "Add K⁺ once < 5.5 mmol/L and urine output adequate. If < 3.3, delay insulin and replace K⁺ first"],
          ["Glucose", "Add 10% dextrose when glucose < 14 mmol/L — keeps insulin running to clear ketones"],
          ["Monitor", "Hourly glucose + ketones, K⁺ at 2 h then 4-hourly; look for the precipitant (infection, missed insulin, MI, sepsis)"],
          ["Watch for", "Cerebral oedema (children — correct slowly), hypokalaemia, aspiration, VTE"],
        ],
      },
      {
        heading: "Hyperosmolar hyperglycaemic state (HHS)",
        rows: [
          ["Picture", "Glucose > 30 mmol/L, osmolality > 320 mOsm/kg, no significant ketosis/acidosis, profound dehydration"],
          ["Approach", "Fluid first — correct osmolality SLOWLY (target fall ≤ 3–8 mOsm/kg/h); insulin only after fluids started (or low-dose 0.05 U/kg/h)"],
          ["Risks", "Higher mortality than DKA; VTE prophylaxis; avoid rapid correction (central pontine myelinolysis, cerebral oedema)"],
        ],
      },
      {
        heading: "Hypoglycaemia",
        rows: [
          ["Define", "< 3.9 mmol/L (level 1); < 3.0 clinically significant; any level with impaired consciousness = severe"],
          ["Conscious", "15 g fast-acting carbohydrate (3 tsp sugar / 150 mL juice / glucose tabs) → recheck in 15 min → repeat if still low → then complex carb"],
          ["Impaired / NPO", "IV dextrose (e.g. 20–50 mL 50% or 100–200 mL 10%) or IM glucagon 1 mg; recheck 10–15 min"],
          ["After", "Find the cause — missed meal, alcohol, renal decline, sulfonylurea (may relapse — observe/admit), insulin error"],
          ["Note", "Sulfonylurea and long-acting insulin hypos can recur for many hours; do not discharge early"],
        ],
      },
      {
        heading: "Sick-day rules (patient advice)",
        rows: [
          ["Never stop insulin", "Requirements usually RISE with illness even if eating less"],
          ["Monitor", "Glucose ≥ 4-hourly; check ketones if type 1 or glucose > 14"],
          ["Hydrate", "Sugar-free fluids; sugary fluids if unable to eat"],
          ["Hold (SADMANS)", "Sulfonylureas, ACE-i/ARB, diuretics, metformin, NSAIDs, SGLT2i if dehydrated/vomiting"],
          ["Seek help if", "Persistent vomiting, ketones rising, glucose uncontrolled, drowsiness, breathlessness"],
        ],
      },
      {
        heading: "Annual complication screening",
        rows: [
          ["Eyes", "Dilated retinal exam / photography — from diagnosis in T2DM, 5 years after in T1DM"],
          ["Kidneys", "Urine albumin:creatinine ratio + eGFR yearly"],
          ["Feet", "Monofilament, pulses, skin/deformity; risk-stratify and educate"],
          ["Cardiovascular", "BP each visit, lipids yearly, smoking status"],
          ["Other", "Mental health, dental, immunisation (influenza, pneumococcal), erectile dysfunction, B12 if on long-term metformin"],
        ],
      },
      {
        heading: "SA-specific notes",
        rows: [
          ["Availability", "Metformin, gliclazide and NPH/biphasic insulin are the workhorses on the EML; SGLT2i/GLP-1 access varies by sector"],
          ["HIV", "Dolutegravir-associated weight gain may worsen glycaemia; watch drug interactions and lipodystrophy"],
          ["TB", "Diabetes triples TB risk — screen for TB in poorly controlled patients; rifampicin induces metabolism of sulfonylureas"],
          ["Screening", "Consider earlier screening given high prevalence and undiagnosed burden"],
        ],
      },
    ],
  },
];

export default {
  type: "cheatsheets",
  title: "Clinical Cheat Sheets",
  icon: "📋",
  defaultSize: "l",

  render(body, ctx) {
    const { store } = ctx;
    const state = () => store.state.cheatsheets || {};
    const persist = (patch) =>
      store.update((s) => { s.cheatsheets = { ...(s.cheatsheets || {}), ...patch }; }, "cheatsheets");

    const draw = () => {
      const activeId = state().sheet || SHEETS[0].id;
      const sheet = SHEETS.find((s) => s.id === activeId) || SHEETS[0];
      const tabs = h("div.tabs", { role: "tablist", "aria-label": "Cheat sheets" },
        SHEETS.map((s) => {
          const b = h("button.tab", { type: "button", role: "tab",
            "aria-selected": String(s.id === sheet.id) }, s.title);
          b.addEventListener("click", () => { persist({ sheet: s.id }); draw(); });
          return b;
        }));

      // The filter is transient view state: keeping it in a local variable
      // avoids a localStorage write and a global store notification on every
      // keystroke (which also stole focus by forcing a redraw).
      let query = "";
      const search = h("input.input.cs-search", { type: "search",
        placeholder: "Filter this sheet…", "aria-label": "Filter cheat sheet" });
      search.addEventListener("input", () => { query = search.value; paint(); });

      const content = h("div.cs-content");
      const paint = () => {
        const q = query.trim().toLowerCase();
        clear(content);
        let shown = 0;
        for (const section of sheet.sections) {
          const rows = section.rows.filter(([label, detail]) =>
            !q || `${section.heading} ${label} ${detail}`.toLowerCase().includes(q));
          if (!rows.length) continue;
          shown += rows.length;
          content.append(
            h("div.cs-heading", {}, section.heading),
            h("dl.cs-rows", {}, rows.map(([label, detail]) => h("div.cs-row", {},
              h("dt.cs-label", {}, label),
              h("dd.cs-detail", {}, detail)))));
        }
        if (!shown) content.append(h("div.muted.small", {}, "No matches in this sheet."));
      };

      clear(body).append(tabs, search,
        h("div.muted.small.cs-blurb", {}, sheet.blurb), content,
        h("div.muted.small.cs-note", {},
          "Educational summary · verify against the current SEMDSA guideline, EML/STGs and local protocols."));
      paint();
    };

    ctx.onRefresh(draw);
    draw();
  },
};

/** Search index for the command palette: every row label, by sheet. */
export function searchIndex() {
  const out = [];
  for (const sheet of SHEETS) {
    for (const section of sheet.sections) {
      for (const [label] of section.rows) {
        out.push({ label, hint: `${sheet.title} · ${section.heading.split("(")[0].trim()}`,
          type: "cheatsheets" });
      }
    }
  }
  return out;
}
