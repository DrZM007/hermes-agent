// SGP4 — the standard orbital propagator for two-line element sets.
//
// Near-Earth branch only (orbital period under 225 minutes), which covers the
// ISS and everything else in low Earth orbit. Deep-space objects (SDP4) are
// rejected rather than propagated wrongly: a Molniya or geostationary TLE fed
// through the near-Earth path returns plausible-looking nonsense, and silently
// wrong is the worst outcome for a tracker.
//
// Follows the Spacetrack Report #3 / Vallado formulation with WGS-72 constants,
// which is what TLEs are fitted against — using WGS-84 here is a classic and
// subtle source of error. Verified against the reference `sgp4` Python package
// (Vallado) to 0 m over a week — see tests/test_sgp4.py.

const PI = Math.PI;
const TWO_PI = 2 * PI;
const DEG = 180 / PI;
const RAD = PI / 180;
const X2O3 = 2 / 3;

// WGS-72, deliberately. TLE mean elements are generated in this model.
const RADIUS_EARTH_KM = 6378.135;
const MU = 398600.8;
const XKE = 60 / Math.sqrt((RADIUS_EARTH_KM ** 3) / MU);
const J2 = 0.001082616;
const J3 = -0.00000253881;
const J4 = -0.00000165597;
const J3OJ2 = J3 / J2;

const XPDOTP = 1440 / TWO_PI;   // rev/day -> rad/min

/** Julian day for a Date (UTC). */
const julianDay = (date) => date.valueOf() / 86400000 + 2440587.5;

/** TLE checksum: sum of digits, minus signs count 1, over the first 68 chars. */
export function tleChecksum(line) {
  let sum = 0;
  for (const ch of line.slice(0, 68)) {
    if (ch >= "0" && ch <= "9") sum += Number(ch);
    else if (ch === "-") sum += 1;
  }
  return sum % 10;
}

/** Parse a TLE's exponential fields, e.g. " 10270-3" -> 0.00010270. */
function parseExp(field) {
  const s = field.trim();
  if (!s || s === "00000-0" || s === "00000+0") return 0;
  const m = /^([+-]?)(\d+)([+-]\d)$/.exec(s.replace(/\s+/g, ""));
  if (!m) return Number(s) || 0;
  const sign = m[1] === "-" ? -1 : 1;
  return sign * Number(`0.${m[2]}`) * 10 ** Number(m[3]);
}

/**
 * Parse a two-line element set.
 * @throws if the lines are malformed or the checksums do not match — a
 *   corrupted TLE propagates to a confidently wrong position, so it is better
 *   to refuse it.
 */
export function parseTLE(line1, line2, name = "") {
  const l1 = String(line1).trimEnd();
  const l2 = String(line2).trimEnd();
  if (l1.length < 69 || l2.length < 69) throw new Error("TLE lines too short");
  if (l1[0] !== "1" || l2[0] !== "2") throw new Error("TLE line numbers wrong");
  for (const [i, line] of [[1, l1], [2, l2]]) {
    const want = tleChecksum(line);
    const got = Number(line[68]);
    if (!Number.isFinite(got) || got !== want) {
      throw new Error(`TLE line ${i} checksum ${got} != ${want}`);
    }
  }

  const epochyr = Number(l1.slice(18, 20));
  const epochdays = Number(l1.slice(20, 32));
  const year = epochyr < 57 ? 2000 + epochyr : 1900 + epochyr;
  // Day-of-year is 1-based, so day 1.0 is 1 January 00:00.
  const epoch = new Date(Date.UTC(year, 0, 1) + (epochdays - 1) * 86400000);

  return {
    name: name || l1.slice(2, 7),
    satnum: l1.slice(2, 7).trim(),
    epoch,
    epochJD: julianDay(epoch),
    bstar: parseExp(l1.slice(53, 61)),
    inclo: Number(l2.slice(8, 16)) * RAD,
    nodeo: Number(l2.slice(17, 25)) * RAD,
    ecco: Number(`0.${l2.slice(26, 33).trim()}`),
    argpo: Number(l2.slice(34, 42)) * RAD,
    mo: Number(l2.slice(43, 51)) * RAD,
    noKozai: Number(l2.slice(52, 63)) / XPDOTP,   // rad/min
    revPerDay: Number(l2.slice(52, 63)),
  };
}

/** Pre-compute the constants SGP4 needs. Throws for deep-space orbits. */
export function sgp4init(tle) {
  const { ecco, inclo, argpo, mo, nodeo, noKozai, bstar } = tle;

  const cosio = Math.cos(inclo);
  const theta2 = cosio * cosio;
  const con41 = 3 * theta2 - 1;
  const con42 = 1 - 5 * theta2;
  const x1mth2 = 1 - theta2;
  const x7thm1 = 7 * theta2 - 1;
  const sinio = Math.sin(inclo);
  const eosq = ecco * ecco;
  const betao2 = 1 - eosq;
  const betao = Math.sqrt(betao2);

  // Recover the original (un-Kozai'd) mean motion and semi-major axis.
  // NOTE the 0.75, not 1.5: the classic Spacetrack formulation writes this
  // step in terms of K2 = J2/2, and substituting J2 directly here doubles the
  // correction. That single factor put the propagated position 0.5 km out at
  // epoch and 500 km out after a week.
  const a1 = (XKE / noKozai) ** X2O3;
  const del1 = 0.75 * J2 * con41 / (a1 * a1 * betao * betao2);
  const aoTemp = a1 * (1 - del1 * (0.5 * X2O3 + del1 * (1 + (134 / 81) * del1)));
  const delo = 0.75 * J2 * con41 / (aoTemp * aoTemp * betao * betao2);
  const no = noKozai / (1 + delo);
  const ao = (XKE / no) ** X2O3;

  const periodMin = TWO_PI / no;
  if (periodMin >= 225) {
    throw new Error("deep-space orbit (period >= 225 min); SDP4 not implemented");
  }

  const po = ao * betao2;
  const posq = po * po;
  const pinvsq = 1 / posq;
  const rp = ao * (1 - ecco);
  if (rp < 1) throw new Error("perigee inside the Earth — bad TLE");

  // Atmospheric drag term, tapered for low perigees.
  const perigeeKm = (rp - 1) * RADIUS_EARTH_KM;
  let sfour = 78 / RADIUS_EARTH_KM + 1;
  let qzms24 = ((120 - 78) / RADIUS_EARTH_KM) ** 4;
  if (perigeeKm < 156) {
    sfour = perigeeKm - 78;
    if (perigeeKm < 98) sfour = 20;
    qzms24 = ((120 - sfour) / RADIUS_EARTH_KM) ** 4;
    sfour = sfour / RADIUS_EARTH_KM + 1;
  }

  const tsi = 1 / (ao - sfour);
  const eta = ao * ecco * tsi;
  const etasq = eta * eta;
  const eeta = ecco * eta;
  const psisq = Math.abs(1 - etasq);
  const coef = qzms24 * tsi ** 4;
  const coef1 = coef / psisq ** 3.5;

  const cc2 = coef1 * no * (ao * (1 + 1.5 * etasq + eeta * (4 + etasq))
    + 0.375 * J2 * tsi / psisq * con41 * (8 + 3 * etasq * (8 + etasq)));
  const cc1 = bstar * cc2;
  const cc3 = ecco > 1e-4 ? -2 * coef * tsi * J3OJ2 * no * sinio / ecco : 0;
  const cc4 = 2 * no * coef1 * ao * betao2 * (
    eta * (2 + 0.5 * etasq) + ecco * (0.5 + 2 * etasq)
    - J2 * tsi / (ao * psisq) * (
      -3 * con41 * (1 - 2 * eeta + etasq * (1.5 - 0.5 * eeta))
      + 0.75 * x1mth2 * (2 * etasq - eeta * (1 + etasq)) * Math.cos(2 * argpo)));
  const cc5 = 2 * coef1 * ao * betao2 * (1 + 2.75 * (etasq + eeta) + eeta * etasq);

  const cosio4 = theta2 * theta2;
  const temp1 = 1.5 * J2 * pinvsq * no;
  const temp2 = 0.5 * temp1 * J2 * pinvsq;
  const temp3 = -0.46875 * J4 * pinvsq * pinvsq * no;
  const mdot = no + 0.5 * temp1 * betao * con41
    + 0.0625 * temp2 * betao * (13 - 78 * theta2 + 137 * cosio4);
  const argpdot = -0.5 * temp1 * con42
    + 0.0625 * temp2 * (7 - 114 * theta2 + 395 * cosio4)
    + temp3 * (3 - 36 * theta2 + 49 * cosio4);
  const xhdot1 = -temp1 * cosio;
  const nodedot = xhdot1
    + (0.5 * temp2 * (4 - 19 * theta2) + 2 * temp3 * (3 - 7 * theta2)) * cosio;

  const omgcof = bstar * cc3 * Math.cos(argpo);
  const xmcof = ecco > 1e-4 ? -X2O3 * coef * bstar / eeta : 0;
  const nodecf = 3.5 * betao2 * xhdot1 * cc1;
  const t2cof = 1.5 * cc1;
  // Guard the near-polar singularity at cosio = -1.
  const xlcof = Math.abs(cosio + 1) > 1.5e-12
    ? -0.25 * J3OJ2 * sinio * (3 + 5 * cosio) / (1 + cosio)
    : -0.25 * J3OJ2 * sinio * (3 + 5 * cosio) / 1.5e-12;
  const aycof = -0.5 * J3OJ2 * sinio;
  const delmo = (1 + eta * Math.cos(mo)) ** 3;
  const sinmao = Math.sin(mo);

  // Very low orbits use the simplified drag model.
  const isimp = (ao * (1 - ecco)) < (220 / RADIUS_EARTH_KM + 1);

  let d2 = 0, d3 = 0, d4 = 0, t3cof = 0, t4cof = 0, t5cof = 0;
  if (!isimp) {
    const cc1sq = cc1 * cc1;
    d2 = 4 * ao * tsi * cc1sq;
    const temp = d2 * tsi * cc1 / 3;
    d3 = (17 * ao + sfour) * temp;
    d4 = 0.5 * temp * ao * tsi * (221 * ao + 31 * sfour) * cc1;
    t3cof = d2 + 2 * cc1sq;
    t4cof = 0.25 * (3 * d3 + cc1 * (12 * d2 + 10 * cc1sq));
    t5cof = 0.2 * (3 * d4 + 12 * cc1 * d3 + 6 * d2 * d2 + 15 * cc1sq * (2 * d2 + cc1sq));
  }

  return { ...tle, no, ao, cosio, sinio, theta2, con41, con42, x1mth2, x7thm1,
    eta, cc1, cc4, cc5, mdot, argpdot, nodedot, omgcof, xmcof, nodecf, t2cof,
    xlcof, aycof, delmo, sinmao, isimp, d2, d3, d4, t3cof, t4cof, t5cof,
    periodMin };
}

/**
 * Propagate to `tsince` minutes past the TLE epoch.
 * @returns {{position: number[], velocity: number[]}} TEME frame, km and km/s.
 */
export function sgp4(s, tsince) {
  const t = tsince;
  const xmdf = s.mo + s.mdot * t;
  const argpdf = s.argpo + s.argpdot * t;
  const nodedf = s.nodeo + s.nodedot * t;
  let argpm = argpdf;
  let mm = xmdf;
  const t2 = t * t;
  let nodem = nodedf + s.nodecf * t2;
  let tempa = 1 - s.cc1 * t;
  let tempe = s.bstar * s.cc4 * t;
  let templ = s.t2cof * t2;

  if (!s.isimp) {
    const delomg = s.omgcof * t;
    const delm = s.xmcof * ((1 + s.eta * Math.cos(xmdf)) ** 3 - s.delmo);
    const temp = delomg + delm;
    mm = xmdf + temp;
    argpm = argpdf - temp;
    const t3 = t2 * t;
    const t4 = t3 * t;
    tempa = tempa - s.d2 * t2 - s.d3 * t3 - s.d4 * t4;
    tempe += s.bstar * s.cc5 * (Math.sin(mm) - s.sinmao);
    templ += s.t3cof * t3 + t4 * (s.t4cof + t * s.t5cof);
  }

  let nm = s.no;
  let em = s.ecco;
  const inclm = s.inclo;
  const am = ((XKE / nm) ** X2O3) * tempa * tempa;
  nm = XKE / am ** 1.5;
  em -= tempe;
  if (em >= 1 || em < -0.001) throw new Error("SGP4 decayed: eccentricity out of range");
  if (em < 1e-6) em = 1e-6;

  mm += s.no * templ;
  let xlm = mm + argpm + nodem;
  nodem %= TWO_PI;
  argpm %= TWO_PI;
  xlm %= TWO_PI;
  mm = (xlm - argpm - nodem) % TWO_PI;

  const emsq = em * em;
  const temp = 1 - emsq;

  // Long-period periodics.
  const axnl = em * Math.cos(argpm);
  const tempInv = 1 / (am * temp);
  const aynl = em * Math.sin(argpm) + tempInv * s.aycof;
  const xl = mm + argpm + nodem + tempInv * s.xlcof * axnl;

  // Kepler's equation for the eccentric-longitude form.
  const u = (xl - nodem) % TWO_PI;
  let eo1 = u;
  let sineo1 = 0, coseo1 = 0;
  for (let k = 0; k < 10; k++) {
    sineo1 = Math.sin(eo1);
    coseo1 = Math.cos(eo1);
    let tem5 = 1 - coseo1 * axnl - sineo1 * aynl;
    tem5 = (u - aynl * coseo1 + axnl * sineo1 - eo1) / tem5;
    if (Math.abs(tem5) >= 0.95) tem5 = tem5 > 0 ? 0.95 : -0.95;
    eo1 += tem5;
    if (Math.abs(tem5) < 1e-12) break;
  }

  // Short-period periodics.
  const ecose = axnl * coseo1 + aynl * sineo1;
  const esine = axnl * sineo1 - aynl * coseo1;
  const el2 = axnl * axnl + aynl * aynl;
  const pl = am * (1 - el2);
  if (pl < 0) throw new Error("SGP4: negative semi-latus rectum");

  const rl = am * (1 - ecose);
  const rdotl = Math.sqrt(am) * esine / rl;
  const rvdotl = Math.sqrt(pl) / rl;
  const betal = Math.sqrt(1 - el2);
  const tempB = esine / (1 + betal);
  const sinu = (am / rl) * (sineo1 - aynl - axnl * tempB);
  const cosu = (am / rl) * (coseo1 - axnl + aynl * tempB);
  let su = Math.atan2(sinu, cosu);
  const sin2u = (cosu + cosu) * sinu;
  const cos2u = 1 - 2 * sinu * sinu;
  const tempC = 1 / pl;
  const temp1 = 0.5 * J2 * tempC;
  const temp2 = temp1 * tempC;

  const mrt = rl * (1 - 1.5 * temp2 * betal * s.con41) + 0.5 * temp1 * s.x1mth2 * cos2u;
  su -= 0.25 * temp2 * s.x7thm1 * sin2u;
  const xnode = nodem + 1.5 * temp2 * s.cosio * sin2u;
  const xinc = inclm + 1.5 * temp2 * s.cosio * s.sinio * cos2u;
  const mvt = rdotl - nm * temp1 * s.x1mth2 * sin2u / XKE;
  const rvdot = rvdotl + nm * temp1 * (s.x1mth2 * cos2u + 1.5 * s.con41) / XKE;

  // Orientation vectors.
  const sinsu = Math.sin(su), cossu = Math.cos(su);
  const snod = Math.sin(xnode), cnod = Math.cos(xnode);
  const sini = Math.sin(xinc), cosi = Math.cos(xinc);
  const xmx = -snod * cosi;
  const xmy = cnod * cosi;
  const ux = xmx * sinsu + cnod * cossu;
  const uy = xmy * sinsu + snod * cossu;
  const uz = sini * sinsu;
  const vx = xmx * cossu - cnod * sinsu;
  const vy = xmy * cossu - snod * sinsu;
  const vz = sini * cossu;

  if (mrt < 1) throw new Error("SGP4 decayed: satellite below the surface");

  const kmPerDU = RADIUS_EARTH_KM;
  const kmsPerVU = RADIUS_EARTH_KM * XKE / 60;
  return {
    position: [mrt * ux * kmPerDU, mrt * uy * kmPerDU, mrt * uz * kmPerDU],
    velocity: [(mvt * ux + rvdot * vx) * kmsPerVU,
      (mvt * uy + rvdot * vy) * kmsPerVU,
      (mvt * uz + rvdot * vz) * kmsPerVU],
  };
}

/** Greenwich mean sidereal time in radians (IAU 1982). */
export function gmst(date) {
  const jd = julianDay(date);
  const T = (jd - 2451545) / 36525;
  let deg = 280.46061837 + 360.98564736629 * (jd - 2451545)
    + 0.000387933 * T * T - (T ** 3) / 38710000;
  deg = ((deg % 360) + 360) % 360;
  return deg * RAD;
}

/**
 * TEME position -> geodetic latitude, longitude and altitude.
 * Uses the WGS-84 ellipsoid (the right choice HERE, unlike the propagator: the
 * output is a map position, not a mean element).
 */
export function geodetic(positionKm, date) {
  const [x, y, z] = positionKm;
  const theta = gmst(date);
  const a = 6378.137;                 // WGS-84 equatorial radius, km
  const f = 1 / 298.257223563;
  const e2 = 2 * f - f * f;

  let lon = Math.atan2(y, x) - theta;
  lon = ((lon + PI) % TWO_PI + TWO_PI) % TWO_PI - PI;   // wrap to [-pi, pi]
  const r = Math.hypot(x, y);
  let lat = Math.atan2(z, r);
  let c = 1;
  for (let k = 0; k < 20; k++) {
    c = 1 / Math.sqrt(1 - e2 * Math.sin(lat) ** 2);
    const next = Math.atan2(z + a * c * e2 * Math.sin(lat), r);
    if (Math.abs(next - lat) < 1e-12) { lat = next; break; }
    lat = next;
  }
  const alt = r / Math.cos(lat) - a * c;
  return { latitude: lat * DEG, longitude: lon * DEG, altitudeKm: alt };
}

/** Convenience: geodetic sub-point and speed at a moment. */
export function satelliteAt(satrec, date) {
  const minutes = (date - satrec.epoch) / 60000;
  const { position, velocity } = sgp4(satrec, minutes);
  const g = geodetic(position, date);
  return {
    ...g,
    speedKms: Math.hypot(...velocity),
    position, velocity,
    minutesSinceEpoch: minutes,
  };
}

export { RADIUS_EARTH_KM };
