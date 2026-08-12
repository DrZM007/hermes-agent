// Sky Tonight — what is actually worth going outside for, from your location:
// which planets are up during darkness, how bright and where to look, plus any
// meteor shower near its peak and whether the Moon will ruin it.
//
// Entirely local: skyview.js + sun.js. No API, no key, correct offline.

import { h, clear } from "../utils.js";
import { sunTimes, moonIllumination } from "../sun.js";
import { visibleTonight, riseSet, compass } from "../skyview.js";

const pad = (n) => String(n).padStart(2, "0");
const hhmm = (d) => (d ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : "—");
const TITLE = { mercury: "Mercury", venus: "Venus", mars: "Mars", jupiter: "Jupiter",
  saturn: "Saturn", uranus: "Uranus", neptune: "Neptune", pluto: "Pluto" };

// Annual meteor showers. Peak dates shift by a day either way year to year;
// rates are the published zenithal hourly rate under ideal dark skies, which
// almost nobody has — treat them as a ranking, not a promise.
const SHOWERS = [
  { name: "Quadrantids", peak: [1, 3], from: [12, 28], to: [1, 12], zhr: 110, hemisphere: "north", radiant: "Boötes" },
  { name: "Lyrids", peak: [4, 22], from: [4, 16], to: [4, 25], zhr: 18, hemisphere: "both", radiant: "Lyra" },
  { name: "Eta Aquariids", peak: [5, 6], from: [4, 19], to: [5, 28], zhr: 50, hemisphere: "south", radiant: "Aquarius" },
  { name: "Delta Aquariids", peak: [7, 30], from: [7, 12], to: [8, 23], zhr: 25, hemisphere: "south", radiant: "Aquarius" },
  { name: "Perseids", peak: [8, 12], from: [7, 17], to: [8, 24], zhr: 100, hemisphere: "north", radiant: "Perseus" },
  { name: "Orionids", peak: [10, 21], from: [10, 2], to: [11, 7], zhr: 20, hemisphere: "both", radiant: "Orion" },
  { name: "Southern Taurids", peak: [11, 5], from: [9, 10], to: [11, 20], zhr: 5, hemisphere: "both", radiant: "Taurus" },
  { name: "Leonids", peak: [11, 17], from: [11, 6], to: [11, 30], zhr: 15, hemisphere: "both", radiant: "Leo" },
  { name: "Geminids", peak: [12, 14], from: [12, 4], to: [12, 17], zhr: 150, hemisphere: "both", radiant: "Gemini" },
  { name: "Ursids", peak: [12, 22], from: [12, 17], to: [12, 26], zhr: 10, hemisphere: "north", radiant: "Ursa Minor" },
];

/** Days from `date` to a [month, day] in the nearest year (can be negative). */
function daysToPeak(date, [month, day]) {
  const year = date.getFullYear();
  let best = null;
  for (const y of [year - 1, year, year + 1]) {
    const t = new Date(y, month - 1, day, 0, 0, 0, 0);
    const diff = Math.round((t - new Date(date.getFullYear(), date.getMonth(), date.getDate()))
      / 86400000);
    if (best === null || Math.abs(diff) < Math.abs(best)) best = diff;
  }
  return best;
}

/** Showers active now, nearest peak first. */
export function activeShowers(date, lat, withinDays = 21) {
  const south = lat < 0;
  return SHOWERS
    .map((s) => ({ ...s, days: daysToPeak(date, s.peak) }))
    .filter((s) => Math.abs(s.days) <= withinDays)
    .map((s) => ({
      ...s,
      favoured: s.hemisphere === "both"
        || (south ? s.hemisphere === "south" : s.hemisphere === "north"),
    }))
    .sort((a, b) => Math.abs(a.days) - Math.abs(b.days));
}

export default {
  type: "skytonight",
  title: "Sky Tonight",
  icon: "✨",
  defaultSize: "m",

  render(body, ctx) {
    const { store } = ctx;

    const draw = () => {
      const w = store.state.weather || {};
      const loc = (w.locations || [])[w.active] || (w.locations || [])[0];
      if (!loc) {
        clear(body).append(h("div.muted.small", {},
          "Set a location in the Weather widget to see tonight's sky."));
        return;
      }
      const now = new Date();
      const t = sunTimes(now, loc.lat, loc.lon);

      // Observing window: tonight's dusk to tomorrow's dawn. Past midnight the
      // "tonight" the user means started yesterday evening, so step back a day.
      const afterMidnight = t.dawn && now < t.dawn;
      const eveningDay = afterMidnight ? new Date(now.getTime() - 86400000) : now;
      const dusk = sunTimes(eveningDay, loc.lat, loc.lon).astronomicalDusk
        || sunTimes(eveningDay, loc.lat, loc.lon).dusk;
      const nextDay = new Date(eveningDay.getTime() + 86400000);
      const dawn = sunTimes(nextDay, loc.lat, loc.lon).astronomicalDawn
        || sunTimes(nextDay, loc.lat, loc.lon).dawn;

      const moon = moonIllumination(now);
      const parts = [h("div.sm-place.muted.small", {}, loc.name)];

      if (!dusk || !dawn) {
        parts.push(h("div.sk-note.small", {},
          "No astronomical darkness at this latitude tonight — the sky never fully darkens."));
      } else {
        parts.push(h("div.sk-window.muted.small", {},
          `Darkness ${hhmm(dusk)} → ${hhmm(dawn)}`));
      }

      // Planets. Without a dark window, still report positions across the night.
      const from = dusk || new Date(eveningDay.setHours(20, 0, 0, 0));
      const to = dawn || new Date(from.getTime() + 8 * 3600000);
      const planets = visibleTonight(from, to, loc.lat, loc.lon);
      const visible = planets.filter((p) => p.visible);

      parts.push(h("div.sm-section-label", {}, `PLANETS · ${visible.length} up`));
      if (!visible.length) {
        parts.push(h("div.muted.small", {}, "No planets well placed tonight."));
      }
      parts.push(h("div.sk-list", {}, planets.map((p) => {
        const rs = riseSet(p.name, now, loc.lat, loc.lon);
        return h("div.sk-row", { class: `sk-row ${p.visible ? "" : "sk-dim"}` },
          h("div.sk-name", {}, TITLE[p.name] || p.name,
            p.nakedEye ? null : h("span.sk-tele", {}, "scope")),
          h("div.sk-figures", {},
            h("span.sk-mag", {}, `mag ${p.magnitude.toFixed(1)}`),
            p.visible
              ? h("span.sk-alt", {}, `${Math.round(p.bestAltitude)}° ${compass(p.azimuth)} at ${hhmm(p.bestTime)}`)
              : h("span.sk-why.muted", {}, p.note)),
          h("div.sk-rise.muted.small", {},
            rs.alwaysUp ? "up all night"
              : rs.alwaysDown ? "below the horizon"
                : `rises ${hhmm(rs.rise)} · sets ${hhmm(rs.set)}`));
      })));

      // Moon interference — the single biggest factor in whether a faint
      // target or a shower is worth attempting.
      const pct = Math.round(moon.fraction * 100);
      const glare = pct > 70 ? "washes out faint objects"
        : pct > 40 ? "some interference" : "little interference";
      parts.push(h("div.sm-section-label", {}, "MOON"));
      parts.push(h("div.sk-moonline.small", {},
        `${moon.name}, ${pct}% lit — ${glare}.`));

      // Meteor showers
      const showers = activeShowers(now, loc.lat);
      parts.push(h("div.sm-section-label", {}, "METEOR SHOWERS"));
      if (!showers.length) {
        parts.push(h("div.muted.small", {}, "No major shower within three weeks."));
      } else {
        parts.push(h("div.sk-list", {}, showers.slice(0, 3).map((s) => {
          const when = s.days === 0 ? "peaks tonight"
            : s.days > 0 ? `peaks in ${s.days} day${s.days === 1 ? "" : "s"}`
              : `peaked ${-s.days} day${s.days === -1 ? "" : "s"} ago`;
          return h("div.sk-row", { class: `sk-row ${s.favoured ? "" : "sk-dim"}` },
            h("div.sk-name", {}, s.name,
              s.favoured ? null : h("span.sk-tele", {}, "other hemisphere")),
            h("div.sk-figures", {},
              h("span.sk-mag", {}, `~${s.zhr}/h`),
              h("span.sk-alt", {}, when)),
            h("div.sk-rise.muted.small", {}, `radiant in ${s.radiant}`));
        })));
      }

      parts.push(h("div.muted.small.sm-note", {},
        "Computed locally. Altitudes are geometric — allow for hills, buildings and haze near the horizon."));
      clear(body).append(...parts);
    };

    // Half-hourly: what is up changes across a night, and this widget is most
    // useful precisely when someone leaves it open in the evening.
    const timer = setInterval(draw, 30 * 60 * 1000);
    ctx.onTeardown(() => clearInterval(timer));
    ctx.onRefresh(draw);
    const locKey = () => {
      const w = store.state.weather || {};
      const loc = (w.locations || [])[w.active] || (w.locations || [])[0];
      return loc ? `${loc.name}:${loc.lat}:${loc.lon}` : "";
    };
    let lastLoc = locKey();
    ctx.onStore(() => {
      const key = locKey();
      if (key === lastLoc) return;
      lastLoc = key;
      draw();
    });
    draw();
  },
};
