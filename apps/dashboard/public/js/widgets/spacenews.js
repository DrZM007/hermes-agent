// Spaceflight news — Spaceflight News API via /api/spacenews. Opens in the
// in-app viewer where available, like the other news widgets.

import { h, clear } from "../utils.js";

function relative(iso) {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "";
  const mins = Math.round((Date.now() - t) / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export default {
  type: "spacenews",
  title: "Space News",
  icon: "🛰️",
  defaultSize: "m",

  render(body, ctx) {
    const draw = async () => {
      clear(body).append(h("div.widget-loading", {}, "LOADING SPACE NEWS…"));
      let data;
      try { data = await ctx.api.spacenews(); }
      catch (err) {
        clear(body).append(h("div.widget-error", {}, `Couldn't load: ${err.message}`));
        return;
      }
      const items = data.articles || [];
      if (!items.length) {
        clear(body).append(h("div.muted.small", {}, "No space news right now."));
        return;
      }
      clear(body).append(h("div.sn-list", {}, items.map((a) => {
        const link = h("a.sn-item", { href: a.url, target: "_blank", rel: "noopener noreferrer" },
          h("div.sn-title", {}, a.title),
          h("div.sn-meta.muted.small", {}, `${a.site}${a.published ? ` · ${relative(a.published)}` : ""}`));
        return link;
      })));
    };

    ctx.onRefresh(draw);
    draw();
  },
};
