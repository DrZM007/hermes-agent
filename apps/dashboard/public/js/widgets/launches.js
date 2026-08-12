// Upcoming launches — Launch Library 2 via /api/launches, with a live countdown
// to the next window.

import { h, clear } from "../utils.js";

const pad = (n) => String(n).padStart(2, "0");

/** Countdown text for a target time, or a past-tense marker. */
function countdown(target, now = Date.now()) {
  const ms = target - now;
  if (!Number.isFinite(ms)) return "—";
  const past = ms < 0;
  let s = Math.floor(Math.abs(ms) / 1000);
  const d = Math.floor(s / 86400); s -= d * 86400;
  const hrs = Math.floor(s / 3600); s -= hrs * 3600;
  const mins = Math.floor(s / 60); s -= mins * 60;
  const text = d > 0 ? `${d}d ${pad(hrs)}:${pad(mins)}:${pad(s)}`
    : `${pad(hrs)}:${pad(mins)}:${pad(s)}`;
  return past ? `T+${text}` : `T−${text}`;
}

const STATUS_TONE = {
  Go: "good", Success: "good", TBC: "warn", TBD: "warn",
  Hold: "warn", "In Flight": "good", Failure: "bad", Partial: "warn",
};

export default {
  type: "launches",
  title: "Launch Schedule",
  icon: "🚀",
  defaultSize: "m",

  render(body, ctx) {
    let ticker = null;
    const clocks = [];   // [{el, target}]

    const tick = () => {
      const now = Date.now();
      for (const { el, target } of clocks) el.textContent = countdown(target, now);
    };

    const draw = async () => {
      clear(body).append(h("div.widget-loading", {}, "LOADING LAUNCHES…"));
      let data;
      try { data = await ctx.api.launches(); }
      catch (err) {
        clear(body).append(h("div.widget-error", {}, `Couldn't load: ${err.message}`));
        return;
      }
      clocks.length = 0;

      const list = (data.launches || []);
      if (!list.length) {
        clear(body).append(h("div.muted.small", {}, "No upcoming launches listed."));
        return;
      }

      const rows = list.map((l) => {
        const t = Date.parse(l.net);
        const when = Number.isFinite(t)
          ? new Date(t).toLocaleString(undefined, { month: "short", day: "2-digit",
            hour: "2-digit", minute: "2-digit" })
          : "TBD";
        const clock = h("span.lx-clock", {}, Number.isFinite(t) ? countdown(t) : "—");
        if (Number.isFinite(t)) clocks.push({ el: clock, target: t });
        const tone = STATUS_TONE[l.status] || "info";
        return h("div.lx-row", {},
          h("div.lx-top", {},
            h("span.lx-name", {}, l.mission || l.name),
            h("span.lx-status", { class: `lx-status tone-${tone}` }, l.status)),
          h("div.lx-meta.muted.small", {}, `${l.provider} · ${l.rocket}`),
          h("div.lx-meta.muted.small", {}, `${l.pad}, ${l.location}`),
          h("div.lx-when", {}, h("span.lx-date.muted.small", {}, when), clock,
            l.webcast
              ? h("a.lx-watch", { href: l.webcast, target: "_blank", rel: "noopener noreferrer" }, "watch ↗")
              : null));
      });

      clear(body).append(h("div.lx-list", {}, rows));
      if (ticker) clearInterval(ticker);
      ticker = setInterval(tick, 1000);
    };

    ctx.onTeardown(() => { if (ticker) clearInterval(ticker); ticker = null; });
    ctx.onRefresh(draw);
    draw();
  },
};

export { countdown };
