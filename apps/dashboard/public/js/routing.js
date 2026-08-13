// Model routing overrides (Jarvis Phase 1 UI). Shows the FAST / CORE / DEEP
// tiers and lets you override the model per tier. Precedence is env var >
// this file override > built-in default, so a tier pinned by an env var is
// shown locked. Overrides persist server-side in data/routing.json.

import { h, clear, toast } from "./utils.js";
import { api } from "./api.js";

let panelEl = null;

function closePanel() {
  panelEl?.remove();
  panelEl = null;
}

document.addEventListener("keydown", (ev) => {
  if (ev.key === "Escape" && panelEl) closePanel();
});

const TIER_LABEL = {
  fast: "FAST — cheap, high-volume (summaries)",
  core: "CORE — default conversation + tools",
  deep: "DEEP — hard reasoning + escalation",
};

export async function openRouting() {
  closePanel();
  const body = h("div.sum-body.sources-body", {}, h("div.widget-loading", {}, "LOADING ROUTING…"));
  panelEl = h("div.sum-backdrop", {
    onclick: (ev) => { if (ev.target === panelEl) closePanel(); },
  },
    h("div.sum-pop.sources-pop", { role: "dialog", "aria-label": "Model routing" },
      h("header.sum-head", {},
        h("span.sum-title", {}, "MODEL ROUTING"),
        h("button.icon-btn", { type: "button", "aria-label": "Close", onclick: closePanel }, "✕"),
      ),
      body,
    ),
  );
  document.body.append(panelEl);

  async function draw() {
    let snap;
    try {
      snap = await api.routing();
    } catch (err) {
      clear(body).append(h("div.widget-error", {}, `Cannot load routing: ${err.message}`));
      return;
    }
    clear(body);
    body.append(h("p.muted.small", {},
      "Pick the model for each tier. Env vars (HERMES_HUB_MODEL_*) win over these and show as locked. Blank a field to fall back to the default."));

    // Live catalogue, so the panel offers models these credentials can actually
    // reach. The tier DEFAULTS are hardcoded in router.py and never move on
    // their own — this is the only part of the dashboard that knows what the
    // current line-up is. Never let it block the panel: on any failure we fall
    // through to a plain text field, which is what shipped before.
    let catalogue = { models: [] };
    try {
      catalogue = await api.models();
    } catch (err) {
      catalogue = { models: [], error: err.message };
    }
    const listId = "routing-models";
    if (catalogue.models.length) {
      body.append(h("datalist", { id: listId },
        ...catalogue.models.map((m) => h("option", { value: m.id }, m.display_name))));
    }

    // A tier pointing at a model the account can't reach fails at call time
    // with an opaque 404 — surface it here instead.
    const known = new Set(catalogue.models.map((m) => m.id));
    const stale = (id) => known.size > 0 && id && !known.has(id);

    const inputs = {};
    for (const tier of ["fast", "core", "deep"]) {
      const locked = snap.env_locked?.[tier];
      const input = h("input.input.routing-input", {
        type: "text",
        value: snap.overrides?.[tier] || "",
        placeholder: snap.defaults?.[tier] || "",
        disabled: locked,
        list: catalogue.models.length ? listId : null,
        "aria-label": `${tier} tier model`,
      });
      inputs[tier] = input;
      body.append(h("div.routing-row", {},
        h("div.routing-meta", {},
          h("div.routing-tier", {}, TIER_LABEL[tier]),
          h("div.muted.small", {}, locked
            ? `Locked by env → ${snap.tiers[tier]}`
            : `Active: ${snap.tiers[tier]} · default: ${snap.defaults?.[tier]}`),
          stale(snap.tiers[tier])
            ? h("div.small.routing-stale", {},
              `⚠ ${snap.tiers[tier]} is not in this account's model list`)
            : null,
        ),
        input,
      ));
    }

    body.append(h("div.routing-actions", {},
      h("button.btn.btn-primary", {
        type: "button",
        onclick: async () => {
          const overrides = {};
          for (const tier of ["fast", "core", "deep"]) {
            if (!inputs[tier].disabled) overrides[tier] = inputs[tier].value.trim();
          }
          try {
            await api.setRouting(overrides);
            toast("Routing saved");
            draw();
          } catch (err) { toast(err.message, "error"); }
        },
      }, "Save"),
      h("button.btn", {
        type: "button",
        onclick: async () => {
          try {
            await api.setRouting({ fast: "", core: "", deep: "" });
            toast("Routing reset to defaults");
            draw();
          } catch (err) { toast(err.message, "error"); }
        },
      }, "Reset to defaults"),
      h("button.btn", {
        type: "button",
        onclick: async () => {
          try {
            await api.models(true);   // bust the server-side cache
            toast("Model list refreshed");
            draw();
          } catch (err) { toast(err.message, "error"); }
        },
      }, "Refresh model list"),
    ));

    body.append(h("p.muted.small", {}, catalogue.models.length
      ? `${catalogue.models.length} models available to these credentials${catalogue.cached ? " (cached)" : ""}. `
        + "Tier defaults are baked into the build and do NOT update themselves when new models ship — set them here."
      : `Model list unavailable${catalogue.error ? ` (${catalogue.error})` : ""} — type a model id by hand.`));
  }

  await draw();
}
