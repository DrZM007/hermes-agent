// Sky view — where the planets actually are in YOUR sky: geocentric positions,
// altitude and azimuth, rise/transit/set, apparent magnitude and phase.
//
// Builds on ephemeris.js (heliocentric positions) and needs no network. Verified
// against PyEphem — see tests/test_skyview.py.

import { planetPosition, julianDay } from "./ephemeris.js";

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;
const OBLIQUITY = 23.4392911 * RAD;   // J2000 mean obliquity
const AU_KM = 149597870.7;

const norm360 = (d) => ((d % 360) + 360) % 360;

/**
 * Greenwich mean sidereal time in degrees.
 * Uses the IAU 1982 series — accurate to well under a second of time over the
 * range this module targets.
 */
export function siderealTimeDeg(date) {
  const jd = julianDay(date);
  const T = (jd - 2451545.0) / 36525;
  const gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0)
    + 0.000387933 * T * T - (T * T * T) / 38710000;
  return norm360(gmst);
}

/**
 * Precess equatorial coordinates from J2000 to the equinox of `date`
 * (Lieske 1977 rotation angles).
 *
 * This matters: altitude and azimuth are derived by rotating through sidereal
 * time, which is measured against the equinox OF DATE. Feeding J2000 coordinates
 * into that rotation leaves the whole sky off by the accumulated precession —
 * 0.4° by 2026 and growing ~50 arcsec a year. Small, but it is the difference
 * between "point here" and "point near here".
 */
export function precessFromJ2000(ra, dec, date) {
  const T = (julianDay(date) - 2451545.0) / 36525;
  const sec = 1 / 3600;
  const zeta = (2306.2181 * T + 0.30188 * T * T + 0.017998 * T ** 3) * sec * RAD;
  const z = (2306.2181 * T + 1.09468 * T * T + 0.018203 * T ** 3) * sec * RAD;
  const theta = (2004.3109 * T - 0.42665 * T * T - 0.041833 * T ** 3) * sec * RAD;
  const a = ra * RAD, d = dec * RAD;
  const A = Math.cos(d) * Math.sin(a + zeta);
  const B = Math.cos(theta) * Math.cos(d) * Math.cos(a + zeta) - Math.sin(theta) * Math.sin(d);
  const C = Math.sin(theta) * Math.cos(d) * Math.cos(a + zeta) + Math.cos(theta) * Math.sin(d);
  return { ra: norm360(Math.atan2(A, B) * DEG + z * DEG), dec: Math.asin(Math.max(-1, Math.min(1, C))) * DEG };
}

/**
 * Geocentric equatorial position of a planet, plus the quantities that decide
 * whether it is worth looking at.
 * @returns {{ra, dec, raOfDate, decOfDate, distanceAU, sunDistanceAU,
 *            elongation, phaseAngle, illuminated, magnitude}}
 *   `ra`/`dec` are J2000 (astrometric, for catalogues); `raOfDate`/`decOfDate`
 *   are precessed to the equinox of date and are what alt/az needs.
 */
export function geocentric(name, date) {
  if (name === "earth") throw new Error("earth has no geocentric position");
  const p = planetPosition(name, date);
  const e = planetPosition("earth", date);

  // Vector from Earth to the planet, in the J2000 ecliptic frame.
  const gx = p.x - e.x, gy = p.y - e.y, gz = p.z - e.z;
  const delta = Math.hypot(gx, gy, gz);

  // Ecliptic -> equatorial.
  const xe = gx;
  const ye = gy * Math.cos(OBLIQUITY) - gz * Math.sin(OBLIQUITY);
  const ze = gy * Math.sin(OBLIQUITY) + gz * Math.cos(OBLIQUITY);
  const ra = norm360(Math.atan2(ye, xe) * DEG);
  const dec = Math.asin(ze / delta) * DEG;

  // Phase angle: Sun–planet–Earth, from the triangle's three sides.
  const r = p.r;                    // Sun to planet
  const R = e.r;                    // Sun to Earth
  const cosPhase = Math.max(-1, Math.min(1,
    (r * r + delta * delta - R * R) / (2 * r * delta)));
  const phaseAngle = Math.acos(cosPhase) * DEG;
  const illuminated = (1 + cosPhase) / 2;

  // Elongation: how far from the Sun the planet appears. Under ~15° it is lost
  // in twilight no matter how bright it is.
  const cosElong = Math.max(-1, Math.min(1,
    (R * R + delta * delta - r * r) / (2 * R * delta)));
  const elongation = Math.acos(cosElong) * DEG;

  const ofDate = precessFromJ2000(ra, dec, date);
  return { ra, dec, raOfDate: ofDate.ra, decOfDate: ofDate.dec,
    distanceAU: delta, sunDistanceAU: r,
    elongation, phaseAngle, illuminated,
    magnitude: apparentMagnitude(name, r, delta, phaseAngle) };
}

/**
 * Apparent visual magnitude (Meeus, from the Astronomical Almanac).
 * Saturn's rings are NOT modelled — they swing its brightness by up to ~1
 * magnitude across its 29-year cycle, so treat Saturn as indicative.
 */
function apparentMagnitude(name, r, delta, i) {
  const base = 5 * Math.log10(r * delta);
  switch (name) {
    case "mercury":
      return -0.42 + base + 0.0380 * i - 0.000273 * i * i + 0.000002 * i ** 3;
    case "venus":
      return -4.40 + base + 0.0009 * i + 0.000239 * i * i - 0.00000065 * i ** 3;
    case "mars": return -1.52 + base + 0.016 * i;
    case "jupiter": return -9.40 + base + 0.005 * i;
    case "saturn": return -8.88 + base;
    case "uranus": return -7.19 + base;
    case "neptune": return -6.87 + base;
    case "pluto": return -1.00 + base;
    default: return base;
  }
}

/**
 * Altitude and azimuth of an equatorial position from a place on Earth.
 * Pass coordinates referred to the EQUINOX OF DATE (`geocentric().raOfDate`),
 * not J2000 — sidereal time is measured against the equinox of date.
 * @returns {{altitude: number, azimuth: number}} degrees; azimuth from north,
 *   increasing eastward.
 */
export function altAz(ra, dec, date, lat, lon) {
  const lst = siderealTimeDeg(date) + lon;         // local sidereal time, degrees
  const H = (lst - ra) * RAD;                      // hour angle
  const phi = lat * RAD, d = dec * RAD;
  const sinAlt = Math.sin(phi) * Math.sin(d) + Math.cos(phi) * Math.cos(d) * Math.cos(H);
  const altitude = Math.asin(Math.max(-1, Math.min(1, sinAlt))) * DEG;
  const azimuth = norm360(Math.atan2(
    Math.sin(H),
    Math.cos(H) * Math.sin(phi) - Math.tan(d) * Math.cos(phi)) * DEG + 180);
  return { altitude, azimuth };
}

/** Altitude of a planet at an instant, for a place. */
export function planetAltitude(name, date, lat, lon) {
  const g = geocentric(name, date);
  return altAz(g.raOfDate, g.decOfDate, date, lat, lon).altitude;
}

/**
 * Rise, transit and set for a planet on the local day containing `date`.
 * Scans hourly for a horizon crossing then bisects, like moonTimes in sun.js —
 * a planet's own motion is slow but the sky turns, so a closed-form solution
 * would need the position re-solved anyway.
 */
export function riseSet(name, date, lat, lon) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const H0 = -0.5667;                     // refraction at the horizon, degrees
  let rise = null, set = null, transit = null;
  let bestAlt = -Infinity;
  let prev = planetAltitude(name, start, lat, lon) - H0;
  let minAlt = prev, maxAlt = prev;
  for (let hour = 1; hour <= 24; hour++) {
    const t = new Date(start.getTime() + hour * 3600000);
    const cur = planetAltitude(name, t, lat, lon) - H0;
    minAlt = Math.min(minAlt, cur); maxAlt = Math.max(maxAlt, cur);
    if (cur > bestAlt) { bestAlt = cur; transit = t; }
    if ((prev < 0) !== (cur < 0)) {
      let lo = new Date(start.getTime() + (hour - 1) * 3600000), hi = t, loV = prev;
      for (let k = 0; k < 14; k++) {
        const mid = new Date((lo.getTime() + hi.getTime()) / 2);
        const midV = planetAltitude(name, mid, lat, lon) - H0;
        if ((loV < 0) === (midV < 0)) { lo = mid; loV = midV; } else { hi = mid; }
      }
      const when = new Date((lo.getTime() + hi.getTime()) / 2);
      if (prev < 0) rise = rise || when; else set = set || when;
    }
    prev = cur;
  }
  return { rise, set, transit,
    alwaysUp: !rise && !set && minAlt > 0,
    alwaysDown: !rise && !set && maxAlt < 0 };
}

export const NAKED_EYE = ["mercury", "venus", "mars", "jupiter", "saturn"];
const TELESCOPIC = ["uranus", "neptune", "pluto"];

/**
 * What is worth looking at tonight from a place.
 *
 * `darkFrom`/`darkTo` bound the observing window (normally dusk to dawn). Each
 * planet is sampled across that window and reported with its best altitude, so
 * "up at 3am at 60°" and "scraping the horizon at dusk" are distinguishable.
 *
 * @returns {Array<{name, magnitude, bestAltitude, bestTime, azimuth,
 *                  elongation, illuminated, nakedEye, visible, note}>}
 */
export function visibleTonight(darkFrom, darkTo, lat, lon, bodies = [...NAKED_EYE, ...TELESCOPIC]) {
  const span = darkTo - darkFrom;
  if (!(span > 0)) return [];
  const steps = 24;
  const out = [];
  for (const name of bodies) {
    let best = null;
    for (let k = 0; k <= steps; k++) {
      const t = new Date(darkFrom.getTime() + (span * k) / steps);
      const g = geocentric(name, t);
      const aa = altAz(g.raOfDate, g.decOfDate, t, lat, lon);
      if (!best || aa.altitude > best.altitude) best = { ...aa, at: t, g };
    }
    const nakedEye = NAKED_EYE.includes(name);
    // Visible = above a usable altitude during darkness, far enough from the
    // Sun not to be drowned, and bright enough for the intended instrument.
    const highEnough = best.altitude >= 10;
    const clearOfSun = best.g.elongation >= 15;
    const brightEnough = nakedEye ? best.g.magnitude <= 6.5 : best.g.magnitude <= 14;
    const visible = highEnough && clearOfSun && brightEnough;
    let note = "";
    if (!highEnough) note = best.altitude < 0 ? "below the horizon all night" : "too low";
    else if (!clearOfSun) note = "lost in the Sun's glare";
    else if (!brightEnough) note = "too faint";
    out.push({
      name,
      magnitude: best.g.magnitude,
      bestAltitude: best.altitude,
      bestTime: best.at,
      azimuth: best.azimuth,
      elongation: best.g.elongation,
      illuminated: best.g.illuminated,
      distanceAU: best.g.distanceAU,
      nakedEye, visible, note,
    });
  }
  // Brightest first among the visible; everything else after, so the list opens
  // with what you can actually walk outside and see.
  return out.sort((a, b) => (b.visible - a.visible) || (a.magnitude - b.magnitude));
}

/** Compass point for an azimuth in degrees. */
export function compass(az) {
  const points = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
    "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return points[Math.round(norm360(az) / 22.5) % 16];
}
