// Planetary positions — heliocentric ecliptic coordinates for the major
// planets, computed from Keplerian elements with secular rates (the standard
// JPL "Approximate Positions of the Major Planets" formulation).
//
// Pure maths, no network, no key: the orrery is correct offline and paints on
// the first frame instead of waiting on an API. Accurate to arcminutes over
// 1800–2050, which is far beyond what a screen-sized solar system can show.
//
// Verified against PyEphem — see tests/test_ephemeris.py.

const RAD = Math.PI / 180;
const J2000 = 2451545;
const DAY_MS = 86400000;

/** Julian day for a Date. */
export const julianDay = (date) => date.valueOf() / DAY_MS + 2440587.5;
/** Julian centuries since J2000. */
export const centuriesSinceJ2000 = (date) => (julianDay(date) - J2000) / 36525;

// a (au), e, I (deg), L (deg), longPeri (deg), longNode (deg) at J2000,
// each followed by its rate per Julian century.
const ELEMENTS = {
  mercury: { a: [0.38709927, 0.00000037], e: [0.20563593, 0.00001906], i: [7.00497902, -0.00594749],
    L: [252.25032350, 149472.67411175], w: [77.45779628, 0.16047689], o: [48.33076593, -0.12534081] },
  venus: { a: [0.72333566, 0.00000390], e: [0.00677672, -0.00004107], i: [3.39467605, -0.00078890],
    L: [181.97909950, 58517.81538729], w: [131.60246718, 0.00268329], o: [76.67984255, -0.27769418] },
  earth: { a: [1.00000261, 0.00000562], e: [0.01671123, -0.00004392], i: [-0.00001531, -0.01294668],
    L: [100.46457166, 35999.37244981], w: [102.93768193, 0.32327364], o: [0.0, 0.0] },
  mars: { a: [1.52371034, 0.00001847], e: [0.09339410, 0.00007882], i: [1.84969142, -0.00813131],
    L: [-4.55343205, 19140.30268499], w: [-23.94362959, 0.44441088], o: [49.55953891, -0.29257343] },
  jupiter: { a: [5.20288700, -0.00011607], e: [0.04838624, -0.00013253], i: [1.30439695, -0.00183714],
    L: [34.39644051, 3034.74612775], w: [14.72847983, 0.21252668], o: [100.47390909, 0.20469106] },
  saturn: { a: [9.53667594, -0.00125060], e: [0.05386179, -0.00050991], i: [2.48599187, 0.00193609],
    L: [49.95424423, 1222.49362201], w: [92.59887831, -0.41897216], o: [113.66242448, -0.28867794] },
  uranus: { a: [19.18916464, -0.00196176], e: [0.04725744, -0.00004397], i: [0.77263783, -0.00242939],
    L: [313.23810451, 428.48202785], w: [170.95427630, 0.40805281], o: [74.01692503, 0.04240589] },
  neptune: { a: [30.06992276, 0.00026291], e: [0.00859048, 0.00005105], i: [1.77004347, 0.00035372],
    L: [-55.12002969, 218.45945325], w: [44.96476227, -0.32241464], o: [131.78422574, -0.00508664] },
  pluto: { a: [39.48211675, -0.00031596], e: [0.24882730, 0.00005170], i: [17.14001206, 0.00004818],
    L: [238.92903833, 145.20780515], w: [224.06891629, -0.04062942], o: [110.30393684, -0.01183482] },
};

const norm180 = (deg) => {
  let d = deg % 360;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d;
};
const norm360 = (deg) => ((deg % 360) + 360) % 360;

/** Solve Kepler's equation M = E - e·sinE by Newton iteration (M, E in degrees). */
function eccentricAnomaly(M, e) {
  const eStar = e / RAD;                 // e expressed in degrees, per the JPL note
  let E = M + eStar * Math.sin(M * RAD);
  for (let i = 0; i < 12; i++) {
    const dM = M - (E - eStar * Math.sin(E * RAD));
    const dE = dM / (1 - e * Math.cos(E * RAD));
    E += dE;
    if (Math.abs(dE) < 1e-9) break;
  }
  return E;
}

/**
 * Heliocentric ecliptic position of a planet.
 * @returns {{x: number, y: number, z: number, lon: number, lat: number, r: number}}
 *   x/y/z in AU (J2000 ecliptic frame), lon/lat in degrees, r in AU.
 */
export function planetPosition(name, date) {
  const el = ELEMENTS[name];
  if (!el) throw new Error(`unknown body ${name}`);
  const T = centuriesSinceJ2000(date);
  const a = el.a[0] + el.a[1] * T;
  const e = el.e[0] + el.e[1] * T;
  const I = el.i[0] + el.i[1] * T;
  const L = el.L[0] + el.L[1] * T;
  const wBar = el.w[0] + el.w[1] * T;    // longitude of perihelion
  const omega = el.o[0] + el.o[1] * T;   // longitude of ascending node

  const argPeri = wBar - omega;
  const M = norm180(L - wBar);
  const E = eccentricAnomaly(M, e);

  // Position in the orbital plane.
  const xOrb = a * (Math.cos(E * RAD) - e);
  const yOrb = a * Math.sqrt(1 - e * e) * Math.sin(E * RAD);

  const cw = Math.cos(argPeri * RAD), sw = Math.sin(argPeri * RAD);
  const co = Math.cos(omega * RAD), so = Math.sin(omega * RAD);
  const ci = Math.cos(I * RAD), si = Math.sin(I * RAD);

  const x = (cw * co - sw * so * ci) * xOrb + (-sw * co - cw * so * ci) * yOrb;
  const y = (cw * so + sw * co * ci) * xOrb + (-sw * so + cw * co * ci) * yOrb;
  const z = (sw * si) * xOrb + (cw * si) * yOrb;

  const r = Math.hypot(x, y, z);
  return {
    x, y, z, r,
    lon: norm360(Math.atan2(y, x) / RAD),
    lat: Math.asin(z / r) / RAD,
  };
}

/** Every modelled body's position at once. */
export function solarSystemAt(date) {
  const out = {};
  for (const name of Object.keys(ELEMENTS)) out[name] = planetPosition(name, date);
  return out;
}

/** Orbital period in Julian years, from the mean-longitude rate. */
export function orbitalPeriodYears(name) {
  return 36000 / ELEMENTS[name].L[1] * 100 / 360 * 3.6;
}

/** Sample a full orbit as heliocentric points, for drawing the path. */
export function orbitPath(name, date, samples = 180) {
  const el = ELEMENTS[name];
  const T = centuriesSinceJ2000(date);
  const a = el.a[0] + el.a[1] * T;
  const e = el.e[0] + el.e[1] * T;
  const I = el.i[0] + el.i[1] * T;
  const wBar = el.w[0] + el.w[1] * T;
  const omega = el.o[0] + el.o[1] * T;
  const argPeri = wBar - omega;
  const cw = Math.cos(argPeri * RAD), sw = Math.sin(argPeri * RAD);
  const co = Math.cos(omega * RAD), so = Math.sin(omega * RAD);
  const ci = Math.cos(I * RAD), si = Math.sin(I * RAD);
  const pts = [];
  for (let k = 0; k <= samples; k++) {
    // Step through eccentric anomaly, not time: equal-time steps bunch points
    // at aphelion and leave the perihelion arc visibly faceted.
    const E = (k / samples) * 360;
    const xOrb = a * (Math.cos(E * RAD) - e);
    const yOrb = a * Math.sqrt(1 - e * e) * Math.sin(E * RAD);
    pts.push([
      (cw * co - sw * so * ci) * xOrb + (-sw * co - cw * so * ci) * yOrb,
      (cw * so + sw * co * ci) * xOrb + (-sw * so + cw * co * ci) * yOrb,
      (sw * si) * xOrb + (cw * si) * yOrb,
    ]);
  }
  return pts;
}

export const BODIES = Object.keys(ELEMENTS);
