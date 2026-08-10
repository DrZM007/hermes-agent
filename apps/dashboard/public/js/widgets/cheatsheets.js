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
  {
    id: "htn",
    title: "Hypertension",
    blurb: "Diagnosis, targets, drug choice and emergencies — SA context.",
    sections: [
      {
        heading: "Diagnosis & staging",
        rows: [
          ["Diagnose", "Office BP ≥ 140/90 on ≥ 2 occasions; confirm with ABPM (≥ 130/80 daytime) or home readings where available"],
          ["Grade 1 / 2 / 3", "140–159/90–99 · 160–179/100–109 · ≥ 180/110"],
          ["White-coat / masked", "Office high but ambulatory normal (white-coat) — or the reverse (masked); both need ambulatory or home confirmation"],
          ["Technique matters", "Correct cuff size, seated 5 min, arm supported, no talking; check both arms once"],
          ["Baseline workup", "U&E + creatinine/eGFR, urine dipstick + ACR, glucose/HbA1c, lipids, ECG; fundoscopy if severe"],
        ],
      },
      {
        heading: "Secondary causes — when to suspect",
        rows: [
          ["Young onset / resistant", "Onset < 30, or BP uncontrolled on 3 drugs including a diuretic"],
          ["Renal", "Renal parenchymal disease (commonest), renal artery stenosis (bruit, flash pulmonary oedema)"],
          ["Endocrine", "Primary aldosteronism (hypokalaemia — but often normokalaemic), phaeochromocytoma (paroxysms), Cushing's, thyroid"],
          ["Other", "Obstructive sleep apnoea, coarctation (radio-femoral delay), drugs (NSAIDs, steroids, decongestants, COCP, alcohol)"],
        ],
      },
      {
        heading: "Targets",
        rows: [
          ["Most adults", "< 140/90; aim < 130/80 if tolerated, especially with diabetes, CKD, or established CV disease"],
          ["Elderly / frail", "Individualise; avoid symptomatic hypotension and falls — systolic 140–150 may be appropriate"],
          ["CKD with albuminuria", "< 130/80 with an ACE-i or ARB as part of the regimen"],
        ],
      },
      {
        heading: "Drug choice",
        rows: [
          ["First line", "Thiazide-like diuretic, calcium-channel blocker, or ACE-i/ARB. Most patients need ≥ 2 drugs — start combination if ≥ 20/10 above target"],
          ["Black African patients", "CCB or thiazide preferred as initial monotherapy; ACE-i/ARB less effective alone and higher angioedema risk"],
          ["Never combine", "ACE-i + ARB — no benefit, more renal failure and hyperkalaemia"],
          ["Add-on (step 3)", "ACE-i/ARB + CCB + thiazide-like diuretic"],
          ["Resistant (step 4)", "Add spironolactone 25 mg (watch K⁺ and renal function), or beta-blocker/alpha-blocker; confirm adherence first"],
          ["Compelling indications", "Post-MI/HF → ACE-i + beta-blocker; diabetes/albuminuria → ACE-i/ARB; angina → beta-blocker or CCB"],
          ["Pregnancy", "Methyldopa, labetalol, nifedipine. ACE-i, ARB and spironolactone are contraindicated"],
        ],
      },
      {
        heading: "Hypertensive emergency vs urgency",
        rows: [
          ["Emergency", "Severe BP + ACUTE target-organ damage (encephalopathy, stroke, ACS, pulmonary oedema, dissection, AKI, eclampsia, papilloedema) → IV therapy, monitored setting"],
          ["Urgency", "Severe BP, NO acute organ damage → oral therapy, lower over 24–48 h. Do not drop rapidly"],
          ["Rate of reduction", "Generally ≤ 25% MAP in the first hour, then toward 160/100 over 2–6 h — except aortic dissection (fast, SBP ~120) and eclampsia"],
          ["Danger", "Rapid uncontrolled lowering (e.g. sublingual nifedipine) causes stroke, MI and blindness — avoid"],
          ["Stroke caveat", "In acute ischaemic stroke, permissive hypertension is usual — treat only per thrombolysis/specific protocols"],
        ],
      },
    ],
  },
  {
    id: "hiv",
    title: "HIV",
    blurb: "Testing, ART initiation, monitoring and complications — SA programme.",
    sections: [
      {
        heading: "Testing & staging",
        rows: [
          ["Test", "Rapid test, confirmed by a second different rapid assay; PCR for infants < 18 months (maternal antibody crosses placenta)"],
          ["Baseline", "CD4 count (assesses risk of opportunistic infection), creatinine, TB symptom screen, cryptococcal antigen if CD4 < 100, hepatitis B surface antigen, pregnancy test"],
          ["WHO staging", "1 asymptomatic · 2 minor (zoster, seborrhoeic) · 3 (TB, oral candida, chronic diarrhoea) · 4 AIDS-defining (cryptococcal meningitis, PJP, Kaposi's, oesophageal candida)"],
        ],
      },
      {
        heading: "ART",
        rows: [
          ["When", "Everyone, regardless of CD4 — same day where possible, unless the patient has TB meningitis or cryptococcal meningitis (defer, see below)"],
          ["First line", "TLD — tenofovir DF + lamivudine + dolutegravir, one pill daily"],
          ["Dolutegravir notes", "Weight gain; raises metformin levels (cap metformin); rifampicin needs DTG 50 mg twice daily"],
          ["Tenofovir cautions", "Check creatinine — avoid/adjust if eGFR < 50; also treats hepatitis B (never stop abruptly if HBsAg positive — risk of flare)"],
          ["Adherence", "The single strongest predictor of outcome. Address disclosure, mental health, substance use, food security, transport"],
        ],
      },
      {
        heading: "Monitoring",
        rows: [
          ["Viral load", "At 6 months, 12 months, then annually if suppressed (< 50 copies/mL)"],
          ["Unsuppressed VL", "Enhanced adherence counselling → repeat VL in 3 months → if still > 1000, switch regimen (do not simply continue)"],
          ["CD4", "At baseline and while < 200 (guides prophylaxis); not needed routinely once suppressed with CD4 > 200"],
          ["Prophylaxis", "Co-trimoxazole if CD4 < 200 or WHO stage 3/4; TPT (TB preventive therapy) once active TB excluded"],
        ],
      },
      {
        heading: "Key complications",
        rows: [
          ["IRIS", "Paradoxical worsening days–weeks after ART start, as immunity recovers. Treat the underlying infection; continue ART; steroids for severe TB-IRIS"],
          ["Cryptococcal meningitis", "Screen CrAg if CD4 < 100. Induction antifungals + manage raised ICP with therapeutic lumbar punctures. DELAY ART 4–6 weeks — early ART increases mortality"],
          ["TB meningitis", "Delay ART ~4–8 weeks — early initiation increases adverse events"],
          ["TB co-infection", "Start TB treatment first, then ART within 2 weeks if CD4 < 50, otherwise within 8 weeks"],
        ],
      },
      {
        heading: "Prevention",
        rows: [
          ["PrEP", "Daily oral TDF/FTC for substantial ongoing risk; test HIV-negative before and 3-monthly"],
          ["PEP", "Within 72 h of exposure, 28 days of ART; baseline and follow-up testing; emergency contraception and STI cover as needed"],
          ["PMTCT", "Maternal ART, infant prophylaxis, infant PCR testing; undetectable maternal VL makes transmission very unlikely"],
          ["U=U", "Sustained undetectable viral load means HIV is not sexually transmitted — a message worth giving explicitly"],
        ],
      },
    ],
  },
  {
    id: "tb",
    title: "Tuberculosis",
    blurb: "Screening, diagnosis, regimens and drug-resistant TB — SA context.",
    sections: [
      {
        heading: "Screening & diagnosis",
        rows: [
          ["Symptom screen", "Cough (any duration in PLHIV), fever, night sweats, weight loss — any one triggers investigation"],
          ["First test", "Xpert MTB/RIF Ultra on sputum — detects TB and rifampicin resistance simultaneously"],
          ["Can't produce sputum", "Sputum induction, gastric aspirate (children), or urine LAM if HIV-positive and seriously ill or CD4 < 200"],
          ["Culture + DST", "For treatment failure, retreatment, resistance, or Xpert-negative but clinically strong suspicion"],
          ["Extrapulmonary", "Send the relevant fluid/tissue for Xpert, culture and histology; TB is often paucibacillary"],
          ["Always", "Offer HIV testing to every TB patient; screen TB contacts"],
        ],
      },
      {
        heading: "Drug-susceptible treatment",
        rows: [
          ["Intensive phase", "2 months RHZE — rifampicin, isoniazid, pyrazinamide, ethambutol (weight-banded FDC)"],
          ["Continuation", "4 months RH (longer for TB meningitis and bone/joint TB — typically 9–12 months)"],
          ["Pyridoxine", "25 mg daily with isoniazid to prevent peripheral neuropathy — essential in PLHIV, pregnancy, alcohol use, diabetes, malnutrition"],
          ["Steroids", "Adjunctive corticosteroids in TB meningitis and TB pericarditis"],
          ["Monitor", "Sputum at months 2 and 5; weight monthly (redose FDC); ask about vision (ethambutol) and symptoms of hepatitis"],
        ],
      },
      {
        heading: "Adverse effects",
        rows: [
          ["Hepatotoxicity", "Stop all hepatotoxic TB drugs if ALT > 5× ULN, or > 3× with symptoms/jaundice; reintroduce sequentially once recovered"],
          ["Rifampicin", "Orange secretions (harmless — warn the patient); potent enzyme inducer — reduces contraceptives, warfarin, sulfonylureas, some ART"],
          ["Isoniazid", "Peripheral neuropathy, hepatitis, drug-induced lupus"],
          ["Pyrazinamide", "Hepatitis, hyperuricaemia/gout, arthralgia"],
          ["Ethambutol", "Optic neuritis — check colour vision and acuity; stop immediately if visual change"],
        ],
      },
      {
        heading: "Drug-resistant TB",
        rows: [
          ["Rifampicin-resistant (RR)", "Detected by Xpert → refer to the DR-TB pathway urgently; send culture and extended DST"],
          ["Regimens", "Shorter all-oral bedaquiline-based regimens are now standard — follow the current national DR-TB guideline; regimens change"],
          ["Never", "Add a single drug to a failing regimen — that manufactures further resistance"],
          ["QT risk", "Bedaquiline, delamanid, moxifloxacin and clofazimine prolong QT — baseline and serial ECGs (see the QTcF calculator), correct K⁺/Mg²⁺"],
          ["Support", "Longer, harder regimens — adherence support, nutrition and psychosocial care materially change outcomes"],
        ],
      },
      {
        heading: "Prevention & infection control",
        rows: [
          ["TPT", "TB preventive therapy for PLHIV and child contacts once active TB is excluded — isoniazid or a rifapentine-based short course"],
          ["Contacts", "Screen all household contacts, prioritising children < 5 and PLHIV"],
          ["Facility measures", "Ventilation, separating coughing patients, and respirators for staff — administrative and environmental controls come before PPE"],
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
