"""Regression tests for public/js/sgp4.js — TLE orbital propagation.

Verified against the reference `sgp4` Python package (Vallado's official port of
Spacetrack Report #3) over a week of propagation from a single ISS-like TLE.
Agreement is EXACT to the printed precision: 0.0000 m in position and 0.0000
mm/s in velocity at every sample from epoch to +168 h. That is the expected
result for two correct implementations of the same deterministic algorithm — a
propagator that merely gets "close" is a propagator with a bug in it.

Getting there took one fix. The classic Spacetrack formulation writes the
un-Kozai step in terms of K2 = J2/2; substituting J2 directly doubles that
correction. The symptom was 0.5 km of error at epoch growing to 500 km after a
week — plausible-looking numbers the whole way, which is exactly why this is
pinned against an external reference rather than eyeballed.

An earlier comparison against PyEphem showed ~12 km at epoch growing to ~480 km.
That turned out to be PyEphem's own older, simplified propagator rather than a
fault here, and is the reason this suite uses the Vallado port as its reference.
"""

import json
import math
import pathlib
import shutil
import subprocess
import unittest

APP = pathlib.Path(__file__).resolve().parent.parent
FIXTURES = APP / "tests" / "fixtures_sgp4.json"
SGP4_JS = APP / "public" / "js" / "sgp4.js"


def _node():
    return shutil.which("node")


def _run_js(script: str):
    proc = subprocess.run([_node(), "--input-type=module", "-e", script],
                          capture_output=True, text=True, timeout=90)
    if proc.returncode != 0:
        raise AssertionError(f"node failed: {proc.stderr[-2000:]}")
    return json.loads(proc.stdout)


def _js(body: str):
    return _run_js(body.replace("__SGP4_JS__", str(SGP4_JS)))


@unittest.skipIf(_node() is None, "node not installed")
class Sgp4Fixtures(unittest.TestCase):
    def test_matches_verified_fixtures(self):
        fx = json.loads(FIXTURES.read_text())
        l1, l2 = fx["tle"]
        got = _js("""
        import { parseTLE, sgp4init, sgp4, satelliteAt } from "file://__SGP4_JS__";
        const rec = sgp4init(parseTLE(%s, %s, "ISS"));
        const offsets = %s;
        console.log(JSON.stringify({ epoch: rec.epoch.toISOString(), periodMin: rec.periodMin,
          samples: offsets.map((m) => {
            const { position, velocity } = sgp4(rec, m);
            const s = satelliteAt(rec, new Date(rec.epoch.getTime() + m * 60000));
            return { minutes: m, r: position, v: velocity, lat: s.latitude,
              lon: s.longitude, alt: s.altitudeKm, speed: s.speedKms };
          }) }));
        """ % (json.dumps(l1), json.dumps(l2),
               json.dumps([s["minutes"] for s in fx["samples"]])))

        self.assertEqual(got["epoch"], fx["epoch"], "TLE epoch parsing changed")
        self.assertAlmostEqual(got["periodMin"], fx["periodMin"], places=6)
        for want, have in zip(fx["samples"], got["samples"]):
            label = f"t+{want['minutes']} min"
            # 1 metre and 1 mm/s: far tighter than any real propagation error,
            # so any change to the algorithm trips this immediately.
            dr = math.dist(want["r"], have["r"])
            dv = math.dist(want["v"], have["v"])
            self.assertLess(dr, 1e-3, f"position moved {dr * 1000:.3f} m at {label}")
            self.assertLess(dv, 1e-6, f"velocity moved at {label}")
            self.assertLess(abs(want["lat"] - have["lat"]), 1e-5, f"lat at {label}")
            self.assertLess(abs(want["alt"] - have["alt"]), 1e-4, f"altitude at {label}")


@unittest.skipIf(_node() is None, "node not installed")
class Sgp4Invariants(unittest.TestCase):
    def test_orbit_is_physically_sane(self):
        fx = json.loads(FIXTURES.read_text())
        l1, l2 = fx["tle"]
        r = _js("""
        import { parseTLE, sgp4init, satelliteAt, RADIUS_EARTH_KM }
          from "file://__SGP4_JS__";
        const rec = sgp4init(parseTLE(%s, %s, "ISS"));
        const track = [];
        for (let m = 0; m <= 186; m += 1) {          // two full orbits
          const s = satelliteAt(rec, new Date(rec.epoch.getTime() + m * 60000));
          track.push({ m, lat: s.latitude, lon: s.longitude, alt: s.altitudeKm,
            speed: s.speedKms });
        }
        console.log(JSON.stringify({ track, periodMin: rec.periodMin,
          inclinationDeg: rec.inclo * 180 / Math.PI }));
        """ % (json.dumps(l1), json.dumps(l2)))

        track = r["track"]
        lats = [p["lat"] for p in track]
        alts = [p["alt"] for p in track]
        speeds = [p["speed"] for p in track]

        # Latitude cannot exceed the orbital inclination.
        inc = r["inclinationDeg"]
        self.assertLessEqual(max(abs(x) for x in lats), inc + 0.5)
        # ...and a full orbit should very nearly reach it.
        self.assertGreater(max(abs(x) for x in lats), inc - 2)

        # ISS altitude and speed sit in well-known bands.
        self.assertGreater(min(alts), 380)
        self.assertLess(max(alts), 460)
        self.assertGreater(min(speeds), 7.5)
        self.assertLess(max(speeds), 7.8)

        # Longitude must be wrapped, never accumulating past 180.
        self.assertTrue(all(-180 <= p["lon"] <= 180 for p in track))

        # The ground track repeats roughly a period later, displaced west by
        # Earth's rotation during that orbit — the defining signature of a LEO
        # ground track. Compare latitude, which is periodic in the orbit alone.
        period = r["periodMin"]
        self.assertGreater(period, 88)
        self.assertLess(period, 96)
        idx = int(round(period))
        self.assertLess(abs(track[0]["lat"] - track[idx]["lat"]), 1.0,
                        "ground track did not repeat after one period")

    def test_rejects_bad_input(self):
        fx = json.loads(FIXTURES.read_text())
        l1, l2 = fx["tle"]
        # Corrupt a digit in line 2 without fixing the checksum.
        bad2 = l2[:20] + ("9" if l2[20] != "9" else "8") + l2[21:]
        r = _js("""
        import { parseTLE, sgp4init } from "file://__SGP4_JS__";
        const out = {};
        const tryIt = (fn) => { try { fn(); return null; } catch (e) { return e.message; } };
        out.badChecksum = tryIt(() => parseTLE(%s, %s));
        out.tooShort = tryIt(() => parseTLE("1 25544U", "2 25544"));
        out.wrongLineNo = tryIt(() => parseTLE(%s, %s));
        // A geostationary TLE must be REFUSED, not propagated by the
        // near-Earth branch, which would return confident nonsense. This TLE
        // is synthetic but structurally valid, checksums included — otherwise
        // it would be rejected at parse and never reach the check under test.
        out.deepSpace = tryIt(() => sgp4init(parseTLE("1 41866U 16071A   26222.50000000 -.00000271  00000-0  00000+0 0  9999", "2 41866   0.0182  84.7532 0001724 121.4426 249.6560  1.00271234 10004")));
        console.log(JSON.stringify(out));
        """ % (json.dumps(l1), json.dumps(bad2), json.dumps(l2), json.dumps(l1)))

        self.assertIn("checksum", (r["badChecksum"] or "").lower())
        self.assertTrue(r["tooShort"], "short lines accepted")
        self.assertIn("line numbers", (r["wrongLineNo"] or "").lower())
        self.assertIn("deep-space", (r["deepSpace"] or "").lower(),
                      "geostationary TLE was propagated by the near-Earth branch")


if __name__ == "__main__":
    unittest.main()
