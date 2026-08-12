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

## Phase 2 — next

- **Launch schedule.** Launch Library 2 (`ll.thespacedevs.com`) is keyless:
  upcoming launches with vehicle, pad, window and stream link.
- **Space news.** Spaceflight News API (`api.spaceflightnewsapi.net`), keyless,
  plus the existing topic-news plumbing.
- **ISS tracker.** Live ground position, and visible passes for the user's
  location computed locally from a TLE (fetched occasionally, cached long).
- **Visible tonight.** Which planets are up after dark from the user's
  location, with rise/set and magnitude — computed from `ephemeris.js` and
  `sun.js` together, no network.
- **Meteor showers.** A static almanac (dates and radiants are stable
  year to year) cross-referenced with the moon phase from `sun.js`, since a
  full moon ruins a shower.
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
