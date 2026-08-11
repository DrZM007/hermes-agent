// On This Day — Wikipedia's historical feed for today's date, with births and
// deaths behind tabs. Goes through /api/onthisday so it inherits the standard
// cache → live → sample path and stays useful offline.

import { h, clear } from "../utils.js";

const TABS = [["events", "Events"], ["births", "Born"], ["deaths", "Died"]];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July",
  "August", "September", "October", "November", "December"];

export default {
  type: "onthisday",
  title: "On This Day",
  icon: "📜",
  defaultSize: "m",

  render(body, ctx) {
    const { store } = ctx;
    const state = () => store.state.onthisday || {};
    const persist = (patch) =>
      store.update((s) => { s.onthisday = { ...(s.onthisday || {}), ...patch }; }, "onthisday");

    const draw = async () => {
      clear(body).append(h("div.widget-loading", {}, "LOADING HISTORY…"));
      let data;
      try {
        data = await ctx.api.onthisday();
      } catch (err) {
        clear(body).append(h("div.widget-error", {}, `Couldn't load: ${err.message}`));
        return;
      }

      const active = state().tab || "events";
      const items = data[active] || [];
      // The date comes from the response, not the browser clock: a cached or
      // sample payload may be for a different day, and labelling it "today"
      // would be a lie.
      const heading = data.month && data.day
        ? `${MONTHS[data.month - 1]} ${data.day}` : "Today";

      const tabs = h("div.tabs", { role: "tablist", "aria-label": "On this day" },
        TABS.map(([id, label]) => {
          const count = (data[id] || []).length;
          const b = h("button.tab", { type: "button", role: "tab",
            "aria-selected": String(id === active) }, `${label}${count ? ` (${count})` : ""}`);
          b.addEventListener("click", () => { persist({ tab: id }); draw(); });
          return b;
        }));

      const list = items.length
        ? h("ul.otd-list", {}, items.map((it) => h("li.otd-item", {},
          h("a.otd-link", { href: it.url, target: "_blank", rel: "noopener noreferrer" },
            h("span.otd-year", {}, it.year == null ? "—" : String(it.year)),
            h("span.otd-text", {}, it.text)))))
        : h("div.muted.small", {}, "Nothing recorded for this date.");

      clear(body).append(
        h("div.otd-head", {}, h("span.otd-date", {}, heading)),
        tabs, list,
        h("div.muted.small.otd-note", {}, data.attribution || "Wikipedia (CC BY-SA)"));
    };

    ctx.onRefresh(draw);
    draw();
  },
};

/** Command-palette entries: jump to each section. */
export function searchIndex() {
  return TABS.map(([id, label]) => ({
    label: `On this day — ${label}`, hint: "history", type: "onthisday",
    apply: (store) => store.update((s) => {
      s.onthisday = { ...(s.onthisday || {}), tab: id };
    }, "onthisday"),
  }));
}
