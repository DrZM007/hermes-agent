// Sun & Moon — rise, set, twilight, day length and lunar phase for the active
// weather location. Computed locally from public/js/sun.js: no API, no key, no
// network, and therefore correct offline and instantly on load.
//
// Location follows the Weather widget's active city (Durban by default) so
// there is one place to change it rather than two.

import { h, clear } from "../utils.js";
import { sunTimes, moonIllumination, moonTimes } from "../sun.js";

const pad = (n) => String(n).padStart(2, "0");
const hhmm = (d) => (d ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : "—");
const duration = (mins) => {
  if (mins == null) return "—";
  return `${Math.floor(mins / 60)}h ${pad(mins % 60)}m`;
};

/** Moon glyph for an illuminated fraction and waxing/waning sense. */
function moonGlyph(phase) {
  const glyphs = ["🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘"];
  return glyphs[Math.round(phase * 8) % 8];
}

/** Difference in day length against the previous day, in minutes. */
function dayLengthDelta(date, lat, lon) {
  const today = sunTimes(date, lat, lon).dayLengthMinutes;
  const prev = sunTimes(new Date(date.getTime() - 86400000), lat, lon).dayLengthMinutes;
  if (today == null || prev == null) return null;
  return today - prev;
}

export default {
  type: "sunmoon",
  title: "Sun & Moon",
  icon: "🌗",
  defaultSize: "m",

  render(body, ctx) {
    const { store } = ctx;

    const draw = () => {
      const w = store.state.weather || {};
      const loc = (w.locations || [])[w.active] || (w.locations || [])[0];
      if (!loc) {
        clear(body).append(h("div.muted.small", {},
          "Set a location in the Weather widget to see sun and moon times."));
        return;
      }
      const now = new Date();
      const t = sunTimes(now, loc.lat, loc.lon);
      const moon = moonIllumination(now);
      const mt = moonTimes(now, loc.lat, loc.lon);
      const delta = dayLengthDelta(now, loc.lat, loc.lon);

      // Progress through the daylight span, for the arc.
      let progress = null;
      if (t.sunrise && t.sunset) {
        progress = (now - t.sunrise) / (t.sunset - t.sunrise);
        progress = Math.max(0, Math.min(1, progress));
      }
      const isUp = t.sunrise && t.sunset && now >= t.sunrise && now <= t.sunset;

      const arc = () => {
        const W = 220, H = 74, R = 92, cx = W / 2, cy = H + 6;
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("viewBox", `0 0 ${W} ${H + 8}`);
        svg.setAttribute("class", "sm-arc");
        svg.setAttribute("aria-hidden", "true");
        const el = (tag, attrs) => {
          const n = document.createElementNS("http://www.w3.org/2000/svg", tag);
          for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
          svg.append(n);
          return n;
        };
        const pt = (frac) => {
          const a = Math.PI * (1 - frac);
          return [cx + R * Math.cos(a), cy - R * Math.sin(a)];
        };
        const [sx, sy] = pt(0), [ex, ey] = pt(1);
        el("path", { d: `M${sx} ${sy} A${R} ${R} 0 0 1 ${ex} ${ey}`, class: "sm-arc-track" });
        el("line", { x1: 8, y1: cy, x2: W - 8, y2: cy, class: "sm-arc-horizon" });
        if (progress != null) {
          const [px, py] = pt(progress);
          el("circle", { cx: px, cy: py, r: 5.5, class: `sm-sun ${isUp ? "up" : "down"}` });
        }
        return svg;
      };

      const row = (label, value, extra) => h("div.sm-row", {},
        h("span.sm-label", {}, label),
        h("span.sm-value", {}, value),
        extra ? h("span.sm-extra.muted.small", {}, extra) : null);

      const polarNote = t.polar === "day" ? "Sun does not set today (polar day)."
        : t.polar === "night" ? "Sun does not rise today (polar night)." : null;

      const twilight = [
        ["Civil", t.dawn, t.dusk],
        ["Nautical", t.nauticalDawn, t.nauticalDusk],
        ["Astronomical", t.astronomicalDawn, t.astronomicalDusk],
      ];

      clear(body).append(
        h("div.sm-place.muted.small", {}, loc.name),
        arc(),
        h("div.sm-main", {},
          row("Sunrise", hhmm(t.sunrise)),
          row("Sunset", hhmm(t.sunset)),
          row("Solar noon", hhmm(t.solarNoon)),
          row("Day length", duration(t.dayLengthMinutes),
            delta == null ? null
              : `${delta >= 0 ? "+" : "−"}${Math.abs(delta)} min vs yesterday`)),
        polarNote ? h("div.sm-polar.small", {}, polarNote) : null,
        h("div.sm-section-label", {}, "TWILIGHT"),
        h("div.sm-twilight", {}, twilight.map(([name, a, b]) =>
          h("div.sm-row", {},
            h("span.sm-label", {}, name),
            h("span.sm-value", {}, `${hhmm(a)} – ${hhmm(b)}`)))),
        h("div.sm-section-label", {}, "MOON"),
        h("div.sm-moon", {},
          h("span.sm-moon-glyph", {}, moonGlyph(moon.phase)),
          h("div.sm-moon-text", {},
            h("div.sm-moon-name", {}, moon.name),
            h("div.muted.small", {},
              `${Math.round(moon.fraction * 100)}% illuminated · day ${Math.round(moon.ageDays)} of 29.5`))),
        h("div.sm-twilight", {},
          mt.alwaysUp ? h("div.sm-row", {}, h("span.sm-label", {}, "Moon"),
            h("span.sm-value", {}, "up all day"))
            : mt.alwaysDown ? h("div.sm-row", {}, h("span.sm-label", {}, "Moon"),
              h("span.sm-value", {}, "below the horizon all day"))
              : [row("Moonrise", hhmm(mt.rise)), row("Moonset", hhmm(mt.set))]),
        h("div.muted.small.sm-note", {},
          "Computed locally — works offline. Sun times within about a minute; moon rise/set a few minutes."));
    };

    // Recompute on the hour: the arc and "day length vs yesterday" both drift,
    // and a dashboard left open overnight should not show yesterday's sunrise.
    const timer = setInterval(draw, 300000);
    ctx.onTeardown(() => clearInterval(timer));
    ctx.onRefresh(draw);
    ctx.onStore(draw);   // follow the Weather widget's active location
    draw();
  },
};
