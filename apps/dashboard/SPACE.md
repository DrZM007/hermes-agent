# Space tab — design and roadmap

A dedicated Space page: an explorable real-time solar system, plus everything
else space-related the dashboard can source without a paid key.

## Principles

1. **Compute locally where the physics allows.** Planetary positions, sun/moon
   events and visibility are deterministic. Anything computable is computed —
   it is correct offline, paints on the first frame, and cannot be broken by an
   upstream going away. Only genuinely external facts (news, launch schedules,
   live streams, imagery) go over the network.
2. **Every network source ships a sample fixture**, per the `SOURCES` registry
   convention, so offline and e2e stay green.
3. **No keys.** Every upstream chosen must work unauthenticated.
4. **Honest scaling.** The orrery scales sizes and distances logarithmically and
   says so in the UI. At true scale the solar system is one dot and a lot of
   black.

## Phase 1 — shipped

**`public/js/ephemeris.js`** — heliocentric positions for the eight planets and
Pluto from Keplerian elements with secular rates (the standard JPL "Approximate
Positions of the Major Planets" formulation), plus orbit-path sampling.

Verified against PyEphem across 120 body/epoch combinations spanning 2000–2049.
PyEphem reports longitude referred to the equinox of date; this module works in
the fixed J2000 ecliptic frame, which is what an orrery needs. Correcting for
general precession, the worst residual is **8.6 arcmin** (Jupiter and Saturn —
the great-inequality perturbation the approximate elements omit), and everything
else is inside ~1 arcmin. That is 0.14°, far under a pixel at any usable zoom.

**Orrery widget** — three.js, with a 2D top-down SVG fallback on the same tier
pattern as the Anatomy Explorer:

- real positions for the current instant, orbit paths, labels, Saturn's rings
- orbit / zoom / pick; click any body for physical data and its live distance
  and ecliptic longitude
- time control: ±1 day / month / year rates, or snap back to live
- scope presets (whole system / inner / outer) and a "go to body" jump
- starfield backdrop, because an empty outer system is unreadable without one

**`public/space/bodies.json`** — physical data and notable facts per body.

## Phase 2 — partly shipped

**Shipped:**

- **Launch schedule** — Launch Library 2 (`ll.thespacedevs.com`, keyless):
  upcoming launches with vehicle, pad, window, status and stream link, plus a
  live T− countdown that flips to T+ once a window passes.
- **Space news** — Spaceflight News API (`api.spaceflightnewsapi.net`, keyless).
- **Streams & trackers** — a link directory of agency and operator channels,
  plus Spot the Station, Eyes on the Solar System, JPL Horizons, SWPC and the
  Minor Planet Center. Links only: an embedded player would be blocked by most
  content-security setups and fail silently.

- **Sky Tonight** — `public/js/skyview.js` plus a widget: which planets are up
  during astronomical darkness from the user's location, with magnitude, best
  altitude and compass bearing, rise/set, the Moon's interference, and any
  meteor shower near its peak (hemisphere-aware).

  `skyview.js` adds geocentric positions, alt/az, rise/transit/set, apparent
  magnitude and illuminated fraction. Verified against PyEphem over 84
  body/epoch/place combinations: altitude within 1 arcmin, azimuth within 3.5
  arcmin, magnitude within 0.18 (Saturn is the outlier on all three — the
  great-inequality perturbation plus unmodelled rings).

  **Precession is load-bearing here.** Alt/az is derived by rotating through
  sidereal time, which is measured against the equinox OF DATE. The first
  implementation fed J2000 coordinates straight in and was off by a consistent
  0.4° — small, but exactly the kind of error that never announces itself. A
  test asserts precession actually moves the coordinates, because a no-op there
  would leave the RA/Dec fixtures passing while alt/az silently drifted.

**Still to build:**
- **ISS tracker.** Live ground position, and visible passes for the user's
  location computed locally from a TLE (fetched occasionally, cached long).
- **Live streams.** A directory of NASA TV, ISS HDEV and agency channels —
  links only, in the style of the guideline directory.
- **Research.** arXiv `astro-ph` through the existing papers widget.
- **Near-Earth objects.** JPL SBDB close-approach API is keyless.

## Phase 3 — later

- Moons of Jupiter and Saturn in the orrery at sufficient zoom.
- Spacecraft positions (Voyager, JWST at L2, active Mars assets).
- Constellation / star chart for the user's location and time.
- Eclipse predictions.
- APOD, if a keyless route exists.

## Accuracy notes

`ephemeris.js` is valid 1800–2050 by construction. Outside that window the
secular rates drift and the orrery should not be trusted; the model is
deliberately not exposed to dates outside it through the UI (the time controls
step by at most a year at a time from now).

Positions are heliocentric and geometric — no light-time correction, no
aberration. For an orrery that is correct; for predicting where to point a
telescope it is not, and the widget does not claim otherwise.
