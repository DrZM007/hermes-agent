// Space live streams and mission control — a directory of official agency and
// operator channels. Links only, exactly like the guideline directory: an
// embedded player would be blocked by most content-security setups and would
// break silently, whereas a link always works.

import { h, clear } from "../utils.js";

const GROUPS = [
  {
    name: "Agencies",
    entries: [
      { name: "NASA+", who: "NASA", what: "Live launches, spacewalks, mission coverage.",
        url: "https://plus.nasa.gov/" },
      { name: "NASA YouTube", who: "NASA", what: "Launch streams and press conferences.",
        url: "https://www.youtube.com/@NASA" },
      { name: "ESA Web TV", who: "European Space Agency", what: "Ariane launches and ESA missions.",
        url: "https://www.esa.int/ESA_Multimedia/ESA_Web_TV" },
      { name: "ISS live stream", who: "NASA", what: "Live Earth views from the station.",
        url: "https://www.nasa.gov/live/" },
    ],
  },
  {
    name: "Operators",
    entries: [
      { name: "SpaceX", who: "SpaceX", what: "Falcon and Starship launch webcasts.",
        url: "https://www.youtube.com/@SpaceX" },
      { name: "Rocket Lab", who: "Rocket Lab", what: "Electron and Neutron launches.",
        url: "https://www.youtube.com/@RocketLab" },
      { name: "Blue Origin", who: "Blue Origin", what: "New Shepard and New Glenn.",
        url: "https://www.youtube.com/@blueorigin" },
      { name: "Arianespace", who: "Arianespace", what: "Ariane and Vega launches.",
        url: "https://www.youtube.com/@arianespace" },
    ],
  },
  {
    name: "Tracking & data",
    entries: [
      { name: "Where is the ISS", who: "ESA", what: "Live ground track of the station.",
        url: "https://www.esa.int/Science_Exploration/Human_and_Robotic_Exploration/International_Space_Station/Where_is_the_International_Space_Station" },
      { name: "Spot the Station", who: "NASA", what: "Visible ISS passes for your location.",
        url: "https://spotthestation.nasa.gov/" },
      { name: "Eyes on the Solar System", who: "NASA/JPL", what: "Interactive 3D mission viewer.",
        url: "https://eyes.nasa.gov/apps/solar-system/" },
      { name: "JPL Horizons", who: "NASA/JPL", what: "Authoritative ephemerides for any body.",
        url: "https://ssd.jpl.nasa.gov/horizons/" },
      { name: "Space Weather Prediction Center", who: "NOAA", what: "Aurora forecast, solar storms.",
        url: "https://www.swpc.noaa.gov/" },
      { name: "Minor Planet Center", who: "IAU", what: "Asteroid and comet designations and orbits.",
        url: "https://www.minorplanetcenter.net/" },
    ],
  },
];

const ALL = GROUPS.flatMap((g) => g.entries);

export default {
  type: "spacestreams",
  title: "Streams & Trackers",
  icon: "📡",
  defaultSize: "m",

  render(body, ctx) {
    const draw = () => {
      // Transient filter, like the other directory widgets: a store write per
      // keystroke forces a redraw and steals focus.
      let query = "";
      const search = h("input.input.gl-search", { type: "search",
        placeholder: "Filter streams…", "aria-label": "Filter streams" });
      const list = h("div.gl-list");
      const paint = () => {
        const q = query.trim().toLowerCase();
        clear(list);
        let shown = 0;
        for (const g of GROUPS) {
          const entries = g.entries.filter((e) =>
            !q || `${e.name} ${e.who} ${e.what}`.toLowerCase().includes(q));
          if (!entries.length) continue;
          shown += entries.length;
          list.append(h("div.gl-group", {}, g.name),
            ...entries.map((e) => h("a.gl-item", {
              href: e.url, target: "_blank", rel: "noopener noreferrer",
            },
            h("div.gl-name", {}, e.name),
            h("div.gl-issuer.muted.small", {}, e.who),
            h("div.gl-covers.small", {}, e.what))));
        }
        if (!shown) list.append(h("div.muted.small", {}, "No matching stream."));
      };
      search.addEventListener("input", () => { query = search.value; paint(); });
      clear(body).append(search, list,
        h("div.muted.small.gl-note", {},
          "Official channels only. Streams go live around events — most are dark between missions."));
      paint();
    };
    ctx.onRefresh(draw);
    draw();
  },
};

/** Command-palette entries. */
export function searchIndex() {
  return ALL.map((e) => ({ label: e.name, hint: `space · ${e.who}`, type: "spacestreams" }));
}
