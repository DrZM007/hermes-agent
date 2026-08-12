"""Regression tests for public/js/ephemeris.js — planetary positions.

Verified against PyEphem across 120 body/epoch combinations spanning 2000–2049.
PyEphem reports heliocentric longitude referred to the EQUINOX OF DATE while
this module works in the fixed J2000 ecliptic frame (which is what an orrery
wants — a scene whose axes drift would be worse than useless). Correcting for
general precession, the worst residual is 8.6 arcmin, on Jupiter and Saturn,
which is the great-inequality perturbation the approximate elements do not
model. Everything else lands inside ~1 arcmin.

8.6 arcmin is 0.14° — about a third of the Moon's apparent width, and far
below one pixel at any plausible orrery zoom.

The fixtures below are golden values from that verified build, so the maths is
pinned here without needing PyEphem in CI.
"""

import json
import math
import pathlib
import shutil
import subprocess
import unittest

APP = pathlib.Path(__file__).resolve().parent.parent
FIXTURES = APP / "tests" / "fixtures_ephemeris.json"
EPH_JS = APP / "public" / "js" / "ephemeris.js"


def _node():
    return shutil.which("node")


def _run_js(script: str):
    proc = subprocess.run([_node(), "--input-type=module", "-e", script],
                          capture_output=True, text=True, timeout=60)
    if proc.returncode != 0:
        raise AssertionError(f"node failed: {proc.stderr[-2000:]}")
    return json.loads(proc.stdout)


def _angdiff(a: float, b: float) -> float:
    d = abs(a - b) % 360
    return min(d, 360 - d)


@unittest.skipIf(_node() is None, "node not installed")
class EphemerisFixtures(unittest.TestCase):
    def test_matches_verified_fixtures(self):
        rows = json.loads(FIXTURES.read_text())
        script = f"""
        import {{ planetPosition }} from "file://{EPH_JS}";
        const rows = {json.dumps([[r["date"], r["body"]] for r in rows])};
        console.log(JSON.stringify(rows.map(([iso, b]) => {{
          const p = planetPosition(b, new Date(iso));
          return {{ lon: p.lon, lat: p.lat, r: p.r, x: p.x, y: p.y, z: p.z }};
        }})));
        """
        got = _run_js(script)
        self.assertEqual(len(got), len(rows))
        for want, have in zip(rows, got):
            label = f"{want['body']} @ {want['date']}"
            # 1 arcmin on angles, 1e-5 AU on distances: far tighter than the
            # model's own accuracy, so any real change trips this.
            self.assertLess(_angdiff(want["lon"], have["lon"]), 1 / 60, f"lon moved: {label}")
            self.assertLess(abs(want["lat"] - have["lat"]), 1 / 60, f"lat moved: {label}")
            self.assertLess(abs(want["r"] - have["r"]), 1e-5, f"distance moved: {label}")
            for axis in ("x", "y", "z"):
                self.assertLess(abs(want[axis] - have[axis]), 1e-5, f"{axis} moved: {label}")


@unittest.skipIf(_node() is None, "node not installed")
class EphemerisInvariants(unittest.TestCase):
    def test_physical_properties(self):
        script = """
        import { planetPosition, solarSystemAt, orbitPath, BODIES } from "file://%s";
        const now = new Date("2026-08-11T12:00:00Z");
        const all = solarSystemAt(now);
        // Distance at four points spread through each orbit, to bracket the
        // real perihelion/aphelion range.
        const spread = {};
        for (const b of BODIES) {
          const rs = [];
          for (let k = 0; k < 24; k++) {
            const d = new Date(now.getTime() + k * 4000 * 86400000 / 24 * 12);
            rs.push(planetPosition(b, d).r);
          }
          spread[b] = { min: Math.min(...rs), max: Math.max(...rs) };
        }
        const path = orbitPath("earth", now, 64);
        // The path must close: first and last sample are the same point.
        const closes = Math.hypot(path[0][0] - path[path.length - 1][0],
                                  path[0][1] - path[path.length - 1][1],
                                  path[0][2] - path[path.length - 1][2]);
        console.log(JSON.stringify({ all, spread, pathLen: path.length, closes,
          pathRadii: path.map((p) => Math.hypot(p[0], p[1], p[2])) }));
        """ % EPH_JS
        r = _run_js(script)

        # Semi-major axes, AU — ordering and rough magnitude must hold.
        expected = {"mercury": 0.387, "venus": 0.723, "earth": 1.0, "mars": 1.524,
                    "jupiter": 5.203, "saturn": 9.537, "uranus": 19.19,
                    "neptune": 30.07, "pluto": 39.48}
        for body, a in expected.items():
            span = r["spread"][body]
            self.assertLessEqual(span["min"], a * 1.02, f"{body} never comes within its orbit")
            self.assertGreaterEqual(span["max"], a * 0.98, f"{body} never reaches its orbit")

        # Planets are ordered outward from the Sun at any single instant, with
        # the sole exception of Pluto/Neptune, whose orbits cross.
        order = ["mercury", "venus", "earth", "mars", "jupiter", "saturn", "uranus", "neptune"]
        radii = [r["all"][b]["r"] for b in order]
        self.assertEqual(radii, sorted(radii), "planet ordering by distance broke")

        # Eccentricity shows up as a non-circular orbit: Pluto's perihelion is
        # well inside its aphelion, Venus's orbit is nearly circular.
        self.assertGreater(r["spread"]["pluto"]["max"] / r["spread"]["pluto"]["min"], 1.3)
        self.assertLess(r["spread"]["venus"]["max"] / r["spread"]["venus"]["min"], 1.02)

        # Latitudes stay small — every planet orbits near the ecliptic, and
        # Pluto (17° inclination) is the outlier.
        for body in order:
            self.assertLess(abs(r["all"][body]["lat"]), 8, f"{body} far off the ecliptic")
        self.assertLess(abs(r["all"]["pluto"]["lat"]), 20)

        # Earth is on the ecliptic essentially by definition of the frame.
        self.assertLess(abs(r["all"]["earth"]["lat"]), 0.01)

        self.assertEqual(r["pathLen"], 65)
        self.assertLess(r["closes"], 1e-9, "orbit path does not close")
        # Earth's drawn orbit stays near 1 AU all the way round.
        self.assertLess(max(r["pathRadii"]), 1.02)
        self.assertGreater(min(r["pathRadii"]), 0.98)

    def test_unknown_body_raises(self):
        script = """
        import { planetPosition } from "file://%s";
        let threw = false;
        try { planetPosition("vulcan", new Date()); } catch { threw = true; }
        console.log(JSON.stringify({ threw }));
        """ % EPH_JS
        self.assertTrue(_run_js(script)["threw"], "unknown body silently returned a position")


if __name__ == "__main__":
    unittest.main()
