// Solar and lunar position maths — pure functions, no network, no dependencies.
//
// Standard low-precision astronomy (Meeus, "Astronomical Algorithms"): good to
// well under a minute for sun events and a few minutes for moon rise/set at
// ordinary latitudes, which is all a dashboard needs. Everything here is a pure
// function of (date, latitude, longitude) so it works offline and is testable
// without a browser.
//
// Verified against the `astral` reference implementation across a spread of
// latitudes and dates — see tests/test_sun.py.

const RAD = Math.PI / 180;
const DAY_MS = 86400000;
const J1970 = 2440588;
const J2000 = 2451545;
const OBLIQUITY = 23.4397 * RAD;   // Earth's axial tilt

const toJulian = (date) => date.valueOf() / DAY_MS - 0.5 + J1970;
const fromJulian = (j) => new Date((j + 0.5 - J1970) * DAY_MS);
const toDays = (date) => toJulian(date) - J2000;

// --- position helpers -------------------------------------------------------

const solarMeanAnomaly = (d) => RAD * (357.5291 + 0.98560028 * d);

/** True ecliptic longitude of the sun, from its mean anomaly. */
function eclipticLongitude(M) {
  const C = RAD * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
  const P = RAD * 102.9372;        // perihelion of the Earth
  return M + C + P + Math.PI;
}

const declination = (l, b) =>
  Math.asin(Math.sin(b) * Math.cos(OBLIQUITY) + Math.cos(b) * Math.sin(OBLIQUITY) * Math.sin(l));
const rightAscension = (l, b) =>
  Math.atan2(Math.sin(l) * Math.cos(OBLIQUITY) - Math.tan(b) * Math.sin(OBLIQUITY), Math.cos(l));
const siderealTime = (d, lw) => RAD * (280.16 + 360.9856235 * d) - lw;
const altitude = (H, phi, dec) =>
  Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H));

// --- sun --------------------------------------------------------------------

/**
 * Anchor a date on the noon of its own calendar day.
 *
 * The Julian cycle rounds to the nearest solar transit, so a date given as
 * local midnight sits exactly on the rounding boundary and resolves to the
 * PREVIOUS day's noon — every event then comes back a day early. Anchoring at
 * noon puts the input half a day from either boundary, so any time of day on
 * the intended date yields that date's events.
 */
function noonOf(date) {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  return d;
}

/** Hour angle at which the sun's centre sits at altitude `h`. NaN when the sun
 *  never reaches that altitude on this date (polar day / polar night). */
const hourAngle = (h, phi, dec) =>
  Math.acos((Math.sin(h) - Math.sin(phi) * Math.sin(dec)) / (Math.cos(phi) * Math.cos(dec)));

// --- NOAA solar model -------------------------------------------------------
//
// The short Meeus form (a 3-term equation of centre and the two-term transit
// correction 0.0053 sinM - 0.0069 sin2L) left solar transit biased by a
// systematic ~75 s, and every rise/set time inherited that bias. The full NOAA
// equation of time below removes it: events land within about a minute of the
// astral reference across latitudes from the equator to Reykjavík.

/** Solar declination and equation of time for a Julian century T. */
function solarState(T) {
  const L0 = (280.46646 + T * (36000.76983 + T * 0.0003032)) % 360;
  const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
  const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
  const Mr = M * RAD;
  const C = Math.sin(Mr) * (1.914602 - T * (0.004817 + 0.000014 * T))
    + Math.sin(2 * Mr) * (0.019993 - 0.000101 * T)
    + Math.sin(3 * Mr) * 0.000289;
  const trueLong = L0 + C;
  const omega = 125.04 - 1934.136 * T;
  const lambda = trueLong - 0.00569 - 0.00478 * Math.sin(omega * RAD);
  const eps0 = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60;
  const eps = (eps0 + 0.00256 * Math.cos(omega * RAD)) * RAD;
  const dec = Math.asin(Math.sin(eps) * Math.sin(lambda * RAD));
  const y = Math.tan(eps / 2) ** 2;
  const L0r = L0 * RAD;
  // Equation of time, minutes.
  const eqTime = 4 / RAD * (y * Math.sin(2 * L0r) - 2 * e * Math.sin(Mr)
    + 4 * e * y * Math.sin(Mr) * Math.cos(2 * L0r)
    - 0.5 * y * y * Math.sin(4 * L0r) - 1.25 * e * e * Math.sin(2 * Mr));
  return { dec, eqTime };
}

const centuryOf = (jd) => (jd - J2000) / 36525;

// Altitudes (degrees) that define each event. -0.833 accounts for refraction
// and the solar disc's radius: "sunrise" is the upper limb touching the horizon.
export const SUN_EVENTS = [
  { angle: -0.833, rise: "sunrise", set: "sunset" },
  { angle: -6, rise: "dawn", set: "dusk" },                       // civil
  { angle: -12, rise: "nauticalDawn", set: "nauticalDusk" },
  { angle: -18, rise: "astronomicalDawn", set: "astronomicalDusk" },
];

/**
 * Sun event times for a date and position.
 * @returns {{solarNoon: Date, nadir: Date, dayLengthMinutes: number|null,
 *            polar: null|"day"|"night", [event: string]: Date|null}}
 */
export function sunTimes(date, lat, lon) {
  const phi = RAD * lat;
  // Midnight UTC of the calendar day `date` falls on. Anchoring at noon first
  // keeps a local-midnight input on its own day rather than the previous one.
  const jdMidnight = Math.floor(toJulian(noonOf(date)) - 0.5) + 0.5;
  const atMinutes = (mins) => fromJulian(jdMidnight + mins / 1440);

  // Solar transit, minutes past midnight UTC.
  let noonMin = 720 - 4 * lon;
  for (let pass = 0; pass < 2; pass++) {
    noonMin = 720 - 4 * lon - solarState(centuryOf(jdMidnight + noonMin / 1440)).eqTime;
  }
  const dec = solarState(centuryOf(jdMidnight + noonMin / 1440)).dec;
  const out = { solarNoon: atMinutes(noonMin), nadir: atMinutes(noonMin - 720) };

  // Each event sits at transit ± hourAngle. Both declination and the equation
  // of time are re-evaluated AT the event rather than at transit: declination
  // moves ~0.4°/day near the equinoxes, and holding it fixed across the day
  // pushed sunset out by up to three minutes there. Rise and set are solved
  // independently rather than mirrored around noon — mirroring assumes the
  // declination is equal at both, which is the very thing being corrected.
  const solve = (angleRad, before) => {
    let mins = noonMin;
    for (let pass = 0; pass < 3; pass++) {
      const st = solarState(centuryOf(jdMidnight + mins / 1440));
      const w = hourAngle(angleRad, phi, st.dec);
      if (Number.isNaN(w)) return null;
      mins = 720 - 4 * lon - st.eqTime + (before ? -1 : 1) * (w / RAD) * 4;
    }
    return mins;
  };
  for (const { angle, rise, set } of SUN_EVENTS) {
    const mr = solve(angle * RAD, true);
    const ms = solve(angle * RAD, false);
    out[rise] = mr == null ? null : atMinutes(mr);
    out[set] = ms == null ? null : atMinutes(ms);
  }

  // Distinguish "sun never rises" from "sun never sets": at the poles the hour
  // angle is undefined either way, and reporting both as "no sunrise" is wrong
  // half the year.
  out.polar = null;
  if (!out.sunrise) {
    const noonAlt = Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec));
    out.polar = noonAlt > -0.833 * RAD ? "day" : "night";
  }
  out.dayLengthMinutes = out.sunrise && out.sunset
    ? Math.round((out.sunset - out.sunrise) / 60000)
    : (out.polar === "day" ? 1440 : out.polar === "night" ? 0 : null);
  return out;
}

/** Sun altitude and azimuth (radians) at an instant. Azimuth measured from
 *  south, positive westward — add PI for a compass bearing from north. */
export function sunPosition(date, lat, lon) {
  const lw = RAD * -lon;
  const phi = RAD * lat;
  const d = toDays(date);
  const M = solarMeanAnomaly(d);
  const L = eclipticLongitude(M);
  const dec = declination(L, 0);
  const ra = rightAscension(L, 0);
  const H = siderealTime(d, lw) - ra;
  return {
    altitude: altitude(H, phi, dec),
    azimuth: Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(phi) - Math.tan(dec) * Math.cos(phi)),
  };
}

// --- moon -------------------------------------------------------------------

/** Geocentric ecliptic position of the moon (Meeus, low precision). */
function moonCoords(d) {
  const L = RAD * (218.316 + 13.176396 * d);   // ecliptic longitude
  const M = RAD * (134.963 + 13.064993 * d);   // mean anomaly
  const F = RAD * (93.272 + 13.229350 * d);    // mean distance
  const l = L + RAD * 6.289 * Math.sin(M);
  const b = RAD * 5.128 * Math.sin(F);
  const dt = 385001 - 20905 * Math.cos(M);     // distance, km
  return { ra: rightAscension(l, b), dec: declination(l, b), dist: dt };
}

const PHASE_NAMES = ["New moon", "Waxing crescent", "First quarter", "Waxing gibbous",
  "Full moon", "Waning gibbous", "Last quarter", "Waning crescent"];

/**
 * Moon illumination for an instant.
 * @returns {{fraction: number, phase: number, name: string, ageDays: number}}
 *   `phase` runs 0 (new) → 0.5 (full) → 1 (new again).
 */
export function moonIllumination(date) {
  const d = toDays(date);
  const s = { ra: rightAscension(eclipticLongitude(solarMeanAnomaly(d)), 0), dist: 149598000 };
  const m = moonCoords(d);
  const sdec = declination(eclipticLongitude(solarMeanAnomaly(d)), 0);
  const phi = Math.acos(Math.sin(sdec) * Math.sin(m.dec)
    + Math.cos(sdec) * Math.cos(m.dec) * Math.cos(s.ra - m.ra));
  const inc = Math.atan2(s.dist * Math.sin(phi), m.dist - s.dist * Math.cos(phi));
  const angle = Math.atan2(
    Math.cos(sdec) * Math.sin(s.ra - m.ra),
    Math.sin(sdec) * Math.cos(m.dec) - Math.cos(sdec) * Math.sin(m.dec) * Math.cos(s.ra - m.ra));
  const phase = 0.5 + 0.5 * inc * (angle < 0 ? -1 : 1) / Math.PI;
  const fraction = (1 + Math.cos(inc)) / 2;
  // Bucket to the eight conventional names, with the quarters as narrow bands
  // around the exact instants rather than 1/8 slices — "first quarter" should
  // not last three days.
  const p = phase;
  const near = (x) => Math.abs(p - x) < 0.02 || Math.abs(p - x) > 0.98;
  const name = near(0) ? PHASE_NAMES[0] : near(0.25) ? PHASE_NAMES[2]
    : near(0.5) ? PHASE_NAMES[4] : near(0.75) ? PHASE_NAMES[6]
      : p < 0.25 ? PHASE_NAMES[1] : p < 0.5 ? PHASE_NAMES[3]
        : p < 0.75 ? PHASE_NAMES[5] : PHASE_NAMES[7];
  return { fraction, phase, name, ageDays: phase * 29.530588853 };
}

function moonAltitude(date, lat, lon) {
  const lw = RAD * -lon;
  const phi = RAD * lat;
  const d = toDays(date);
  const c = moonCoords(d);
  const H = siderealTime(d, lw) - c.ra;
  const h = altitude(H, phi, c.dec);
  // Parallactic correction for the moon's proximity — without it rise/set can
  // be out by several minutes.
  return h - 0.017 * RAD / Math.tan(h + 0.0026 / (h + 0.089));
}

/**
 * Moon rise and set for the local day beginning at `date` (midnight).
 * Scans hour by hour for an altitude sign change, then bisects.
 * @returns {{rise: Date|null, set: Date|null, alwaysUp: boolean, alwaysDown: boolean}}
 */
export function moonTimes(date, lat, lon) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const H0 = 0.133 * RAD;       // mean lunar semidiameter + refraction
  let rise = null, set = null;
  let prev = moonAltitude(start, lat, lon) - H0;
  let maxAlt = prev, minAlt = prev;
  for (let hour = 1; hour <= 24; hour++) {
    const t = new Date(start.getTime() + hour * 3600000);
    const cur = moonAltitude(t, lat, lon) - H0;
    maxAlt = Math.max(maxAlt, cur); minAlt = Math.min(minAlt, cur);
    if (prev < 0 !== cur < 0) {
      // Bisect the crossing to the minute rather than interpolating linearly:
      // the moon's altitude curve is not straight over an hour.
      let lo = new Date(start.getTime() + (hour - 1) * 3600000), hi = t;
      let loV = prev;
      for (let i = 0; i < 12; i++) {
        const mid = new Date((lo.getTime() + hi.getTime()) / 2);
        const midV = moonAltitude(mid, lat, lon) - H0;
        if (loV < 0 === midV < 0) { lo = mid; loV = midV; } else { hi = mid; }
      }
      const when = new Date((lo.getTime() + hi.getTime()) / 2);
      if (prev < 0) rise = rise || when; else set = set || when;
    }
    prev = cur;
  }
  return { rise, set, alwaysUp: !rise && !set && minAlt > 0, alwaysDown: !rise && !set && maxAlt < 0 };
}
