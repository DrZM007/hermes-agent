"""Regression tests for public/js/skyview.js — planets in the observer's sky.

Verified against PyEphem across 84 body/epoch/place combinations (Durban and
London, 2026 and 2030). Agreement after the precession fix:

    altitude   <= 1 arcmin   (Saturn 4.3')
    azimuth    <= 3.5 arcmin (Saturn 16')
    magnitude  <= 0.18       (Saturn 0.77)

Saturn is the outlier throughout for two documented reasons: the great-inequality
perturbation the approximate elements omit, and its rings, whose contribution to
brightness is not modelled. Azimuth is also ill-conditioned near the zenith,
which inflates its worst case without meaning much.

The precession step is the reason the altitudes are arcminutes rather than a
consistent 0.4 degrees: alt/az is derived by rotating through sidereal time,
which is measured against the equinox OF DATE, so J2000 coordinates must be
precessed first. Fixtures are golden values from the verified build.
"""

import json
import pathlib
import shutil
import subprocess
import unittest

APP = pathlib.Path(__file__).resolve().parent.parent
FIXTURES = APP / "tests" / "fixtures_skyview.json"
SKY_JS = APP / "public" / "js" / "skyview.js"


def _node():
    return shutil.which("node")


def _run_js(script: str):
    proc = subprocess.run([_node(), "--input-type=module", "-e", script],
                          capture_output=True, text=True, timeout=90)
    if proc.returncode != 0:
        raise AssertionError(f"node failed: {proc.stderr[-2000:]}")
    return json.loads(proc.stdout)


def _angdiff(a: float, b: float) -> float:
    d = abs(a - b) % 360
    return min(d, 360 - d)


@unittest.skipIf(_node() is None, "node not installed")
class SkyViewFixtures(unittest.TestCase):
    def test_matches_verified_fixtures(self):
        rows = json.loads(FIXTURES.read_text())
        script = f"""
        import {{ geocentric, altAz }} from "file://{SKY_JS}";
        const cases = {json.dumps([r["case"] for r in rows])};
        console.log(JSON.stringify(cases.map(([iso, body, lat, lon]) => {{
          const d = new Date(iso);
          const g = geocentric(body, d);
          const aa = altAz(g.raOfDate, g.decOfDate, d, lat, lon);
          return {{ ra: g.ra, dec: g.dec, raOfDate: g.raOfDate, decOfDate: g.decOfDate,
            magnitude: g.magnitude, elongation: g.elongation, illuminated: g.illuminated,
            distanceAU: g.distanceAU, altitude: aa.altitude, azimuth: aa.azimuth }};
        }})));
        """
        got = _run_js(script)
        self.assertEqual(len(got), len(rows))
        arcmin = 1 / 60
        for want, have in zip(rows, got):
            label = f"{want['case'][1]} @ {want['case'][0]} from {want['case'][2]}"
            for key in ("ra", "raOfDate", "azimuth"):
                self.assertLess(_angdiff(want[key], have[key]), arcmin, f"{key}: {label}")
            for key in ("dec", "decOfDate", "altitude", "elongation"):
                self.assertLess(abs(want[key] - have[key]), arcmin, f"{key}: {label}")
            self.assertLess(abs(want["magnitude"] - have["magnitude"]), 0.01, f"mag: {label}")
            self.assertLess(abs(want["illuminated"] - have["illuminated"]), 1e-4, f"phase: {label}")
            self.assertLess(abs(want["distanceAU"] - have["distanceAU"]), 1e-5, f"dist: {label}")

    def test_precession_actually_moves_coordinates(self):
        """Guards the fix: if precessFromJ2000 became a no-op the fixtures would
        still pass on `ra`, and only the alt/az figures would quietly drift."""
        rows = json.loads(FIXTURES.read_text())
        for r in rows:
            shift = _angdiff(r["ra"], r["raOfDate"])
            # ~0.36 deg by 2026, growing. Anything near zero means no precession.
            self.assertGreater(shift, 0.1, f"no precession applied for {r['case']}")
            self.assertLess(shift, 1.0, f"implausible precession for {r['case']}")


@unittest.skipIf(_node() is None, "node not installed")
class SkyViewInvariants(unittest.TestCase):
    def test_physical_and_geometric_properties(self):
        script = """
        import { geocentric, altAz, riseSet, visibleTonight, compass, siderealTimeDeg }
          from "file://__SKY_JS__";
        const durban = [-29.8587, 31.0218];
        const out = {};

        // Inner planets can never be far from the Sun; outer planets can be.
        const elong = {};
        for (const b of ["mercury", "venus", "mars", "jupiter", "saturn"]) {
          let max = 0;
          for (let k = 0; k < 400; k++) {
            const d = new Date(Date.UTC(2026, 0, 1) + k * 3 * 86400000);
            max = Math.max(max, geocentric(b, d).elongation);
          }
          elong[b] = max;
        }
        out.maxElongation = elong;

        // Phase: Venus swings through crescent to nearly full; Jupiter never does.
        const phase = {};
        for (const b of ["venus", "jupiter"]) {
          let lo = 1, hi = 0;
          for (let k = 0; k < 400; k++) {
            const d = new Date(Date.UTC(2026, 0, 1) + k * 3 * 86400000);
            const f = geocentric(b, d).illuminated;
            lo = Math.min(lo, f); hi = Math.max(hi, f);
          }
          phase[b] = { lo, hi };
        }
        out.phase = phase;

        // An object at transit is due north or south from mid-latitudes, and
        // its altitude then is the day's maximum.
        const rs = riseSet("jupiter", new Date("2026-06-15T12:00:00Z"), ...durban);
        out.jupiter = { rise: rs.rise && rs.rise.toISOString(),
          set: rs.set && rs.set.toISOString(),
          transit: rs.transit && rs.transit.toISOString(),
          alwaysUp: rs.alwaysUp, alwaysDown: rs.alwaysDown };
        if (rs.transit) {
          const g = geocentric("jupiter", rs.transit);
          const aa = altAz(g.raOfDate, g.decOfDate, rs.transit, ...durban);
          out.transitAz = aa.azimuth;
          out.transitAlt = aa.altitude;
          let maxAlt = -90;
          for (let k = 0; k <= 48; k++) {
            const t = new Date(rs.transit.getTime() - 12 * 3600000 + k * 1800000);
            const gg = geocentric("jupiter", t);
            maxAlt = Math.max(maxAlt, altAz(gg.raOfDate, gg.decOfDate, t, ...durban).altitude);
          }
          out.maxAltAroundTransit = maxAlt;
        }

        // visibleTonight must rank the visible first and sort by brightness.
        const from = new Date("2026-06-15T16:00:00Z"), to = new Date("2026-06-16T02:00:00Z");
        out.tonight = visibleTonight(from, to, ...durban).map((p) => ({
          name: p.name, visible: p.visible, mag: p.magnitude,
          alt: p.bestAltitude, note: p.note, nakedEye: p.nakedEye }));
        out.emptyWindow = visibleTonight(to, from, ...durban).length;
        out.compass = [compass(0), compass(90), compass(180), compass(270), compass(359)];
        // Sidereal time advances ~360.9856 deg per day, not 360.
        const t0 = new Date("2026-06-15T00:00:00Z");
        const t1 = new Date("2026-06-16T00:00:00Z");
        out.siderealDrift = ((siderealTimeDeg(t1) - siderealTimeDeg(t0)) % 360 + 360) % 360;
        console.log(JSON.stringify(out));
        """.replace("__SKY_JS__", str(SKY_JS))
        r = _run_js(script)

        # Inner planets are bounded by their orbits; Mercury never exceeds ~28
        # degrees from the Sun, Venus ~47. Outer planets reach opposition.
        self.assertLess(r["maxElongation"]["mercury"], 30)
        self.assertGreater(r["maxElongation"]["mercury"], 15)
        self.assertLess(r["maxElongation"]["venus"], 50)
        self.assertGreater(r["maxElongation"]["venus"], 40)
        for outer in ("mars", "jupiter", "saturn"):
            self.assertGreater(r["maxElongation"][outer], 150,
                               f"{outer} never reaches opposition")

        # Venus shows phases; Jupiter is always nearly full from Earth.
        self.assertLess(r["phase"]["venus"]["lo"], 0.15)
        self.assertGreater(r["phase"]["venus"]["hi"], 0.95)
        self.assertGreater(r["phase"]["jupiter"]["lo"], 0.97)

        # Transit really is the daily maximum, and lies on the meridian.
        self.assertIsNotNone(r["jupiter"]["transit"])
        self.assertAlmostEqual(r["transitAlt"], r["maxAltAroundTransit"], delta=1.5)
        az = r["transitAz"]
        self.assertTrue(min(az, abs(az - 180), abs(az - 360)) < 12,
                        f"transit azimuth {az} is not on the meridian")

        tonight = r["tonight"]
        self.assertTrue(tonight, "visibleTonight returned nothing")
        # Visible entries come first...
        flags = [p["visible"] for p in tonight]
        self.assertEqual(flags, sorted(flags, reverse=True), "visible not ranked first")
        # ...and within the visible group, brightest (lowest magnitude) first.
        vis = [p["mag"] for p in tonight if p["visible"]]
        self.assertEqual(vis, sorted(vis), "visible planets not sorted by brightness")
        # Anything marked not-visible must say why.
        for p in tonight:
            if not p["visible"]:
                self.assertTrue(p["note"], f"{p['name']} hidden with no reason given")
        # A backwards window is empty rather than an exception or garbage.
        self.assertEqual(r["emptyWindow"], 0)

        self.assertEqual(r["compass"], ["N", "E", "S", "W", "N"])
        self.assertAlmostEqual(r["siderealDrift"], 0.9856, delta=0.01)

    def test_earth_has_no_geocentric_position(self):
        script = """
        import { geocentric } from "file://__SKY_JS__";
        let threw = false;
        try { geocentric("earth", new Date()); } catch { threw = true; }
        console.log(JSON.stringify({ threw }));
        """.replace("__SKY_JS__", str(SKY_JS))
        self.assertTrue(_run_js(script)["threw"])


if __name__ == "__main__":
    unittest.main()
