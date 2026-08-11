"""Regression tests for public/js/sun.js — solar and lunar event times.

The implementation was verified against the `astral` reference library across
120 randomly sampled latitude/longitude/date combinations: sunrise and sunset
agreed to a maximum of 49 s (mean 15 s, p95 25 s) and solar noon to 28 s. The
fixtures in fixtures_sun.json are golden values captured from that verified
build, so the accuracy is pinned here without requiring astral (or a network)
in CI.

If a change moves any of these by more than a minute, the astronomy changed —
regenerate the fixtures only after re-verifying against an independent source.
"""

import json
import pathlib
import shutil
import subprocess
import unittest
from datetime import datetime, timezone

APP = pathlib.Path(__file__).resolve().parent.parent
FIXTURES = APP / "tests" / "fixtures_sun.json"
SUN_JS = APP / "public" / "js" / "sun.js"
TOLERANCE_S = 60


def _node():
    return shutil.which("node")


def _run_js(script: str):
    """Evaluate an ES-module snippet that prints JSON, and parse it."""
    proc = subprocess.run(
        [_node(), "--input-type=module", "-e", script],
        capture_output=True, text=True, timeout=60,
    )
    if proc.returncode != 0:
        raise AssertionError(f"node failed: {proc.stderr[-2000:]}")
    return json.loads(proc.stdout)


def _parse(value):
    return None if value is None else datetime.fromisoformat(value.replace("Z", "+00:00"))


@unittest.skipIf(_node() is None, "node not installed")
class SunTimesFixtures(unittest.TestCase):
    def test_matches_verified_fixtures(self):
        cases = json.loads(FIXTURES.read_text())
        script = f"""
        import {{ sunTimes }} from "file://{SUN_JS}";
        const cases = {json.dumps([c["case"] for c in cases])};
        const f = (d) => (d ? d.toISOString().slice(0, 19) + "Z" : null);
        console.log(JSON.stringify(cases.map(([iso, lat, lon]) => {{
          const t = sunTimes(new Date(`${{iso}}T12:00:00Z`), lat, lon);
          return {{ sunrise: f(t.sunrise), sunset: f(t.sunset), solarNoon: f(t.solarNoon),
            dawn: f(t.dawn), dusk: f(t.dusk), polar: t.polar,
            dayLengthMinutes: t.dayLengthMinutes }};
        }})));
        """
        got = _run_js(script)
        self.assertEqual(len(got), len(cases))
        for expected, actual in zip(cases, got):
            label = expected["case"]
            self.assertEqual(actual["polar"], expected["polar"], f"polar flag changed for {label}")
            self.assertEqual(actual["dayLengthMinutes"], expected["dayLengthMinutes"],
                             f"day length changed for {label}")
            for key in ("sunrise", "sunset", "solarNoon", "dawn", "dusk"):
                want, have = _parse(expected[key]), _parse(actual[key])
                if want is None or have is None:
                    self.assertEqual(want, have, f"{key} nullness changed for {label}")
                    continue
                drift = abs((have - want).total_seconds())
                self.assertLessEqual(drift, TOLERANCE_S,
                                     f"{key} moved {drift:.0f}s for {label}")


@unittest.skipIf(_node() is None, "node not installed")
class SunTimesInvariants(unittest.TestCase):
    """Physical properties that must hold regardless of the algorithm."""

    def test_ordering_symmetry_and_polar_regions(self):
        script = """
        import { sunTimes } from "file://%s";
        const f = (d) => (d ? d.toISOString() : null);
        const probe = (iso, lat, lon) => {
          const t = sunTimes(new Date(`${iso}T12:00:00Z`), lat, lon);
          return { astroDawn: f(t.astronomicalDawn), dawn: f(t.dawn), sunrise: f(t.sunrise),
            noon: f(t.solarNoon), sunset: f(t.sunset), dusk: f(t.dusk),
            astroDusk: f(t.astronomicalDusk), polar: t.polar, len: t.dayLengthMinutes };
        };
        console.log(JSON.stringify({
          durban: probe("2026-08-11", -29.8587, 31.0218),
          equatorEquinox: probe("2026-03-20", 0, 0),
          svalbardJune: probe("2026-06-21", 78.2232, 15.6267),
          svalbardDec: probe("2026-12-21", 78.2232, 15.6267),
          // A local-midnight input must resolve to that same day, not the one
          // before: the Julian cycle rounds on exactly that boundary.
          midnightInput: (() => {
            const t = sunTimes(new Date("2026-08-11T00:00:00Z"), -29.8587, 31.0218);
            return { sunrise: f(t.sunrise) };
          })(),
        }));
        """ % SUN_JS
        r = _run_js(script)

        d = r["durban"]
        order = [_parse(d[k]) for k in
                 ("astroDawn", "dawn", "sunrise", "noon", "sunset", "dusk", "astroDusk")]
        self.assertEqual(order, sorted(order), "sun events out of chronological order")

        # Solar noon sits midway between sunrise and sunset, to within a minute.
        midpoint = _parse(d["sunrise"]) + (_parse(d["sunset"]) - _parse(d["sunrise"])) / 2
        self.assertLessEqual(abs((midpoint - _parse(d["noon"])).total_seconds()), 60)

        # Equator at the equinox: ~12 h of daylight.
        self.assertAlmostEqual(r["equatorEquinox"]["len"], 720, delta=10)

        # Polar day and polar night must be distinguished, not both reported as
        # "no sunrise".
        self.assertEqual(r["svalbardJune"]["polar"], "day")
        self.assertEqual(r["svalbardJune"]["len"], 1440)
        self.assertEqual(r["svalbardDec"]["polar"], "night")
        self.assertEqual(r["svalbardDec"]["len"], 0)

        # Regression: midnight input used to land on the previous day.
        self.assertTrue(r["midnightInput"]["sunrise"].startswith("2026-08-11"))


@unittest.skipIf(_node() is None, "node not installed")
class MoonTests(unittest.TestCase):
    def test_phase_cycle_and_rise_set(self):
        script = """
        import { moonIllumination, moonTimes } from "file://%s";
        const days = [];
        for (let i = 0; i < 60; i++) {
          const d = new Date(Date.UTC(2026, 0, 1) + i * 86400000);
          const m = moonIllumination(d);
          days.push({ iso: d.toISOString().slice(0, 10), fraction: m.fraction,
            phase: m.phase, name: m.name });
        }
        const t = moonTimes(new Date("2026-08-11T00:00:00Z"), -29.8587, 31.0218);
        console.log(JSON.stringify({ days,
          moon: { rise: t.rise && t.rise.toISOString(), set: t.set && t.set.toISOString(),
            alwaysUp: t.alwaysUp, alwaysDown: t.alwaysDown } }));
        """ % SUN_JS
        r = _run_js(script)
        fractions = [d["fraction"] for d in r["days"]]
        self.assertTrue(all(0 <= f <= 1 for f in fractions), "illumination outside 0..1")
        # Two synodic months must contain both a full and a new moon.
        self.assertGreater(max(fractions), 0.99)
        self.assertLess(min(fractions), 0.01)
        self.assertTrue(all(0 <= d["phase"] <= 1 for d in r["days"]))
        names = {d["name"] for d in r["days"]}
        self.assertIn("Full moon", names)
        self.assertIn("New moon", names)
        # Durban in August: the moon both rises and sets on this date.
        self.assertTrue(r["moon"]["rise"], "no moonrise computed")
        self.assertTrue(r["moon"]["set"], "no moonset computed")
        self.assertFalse(r["moon"]["alwaysUp"])
        self.assertFalse(r["moon"]["alwaysDown"])


if __name__ == "__main__":
    unittest.main()
