// Orrery — an explorable 3D solar system at real positions, computed locally
// from ephemeris.js (no API, correct offline, right on the first frame).
//
// Orbit, zoom and click any body for its data. Time can be advanced or reversed
// at a chosen rate, or snapped back to now. Falls back to a 2D top-down view
// where WebGL is unavailable, on the same tier pattern as the Anatomy Explorer.

import { h, clear } from "../utils.js";
import { solarSystemAt, orbitPath, planetPosition, BODIES } from "../ephemeris.js";

const SVGNS = "http://www.w3.org/2000/svg";
const svgEl = (tag, attrs = {}) => {
  const el = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
};

let FACTS = null;
async function loadFacts() {
  if (FACTS) return FACTS;
  const raw = await fetch("/space/bodies.json").then((r) => r.json());
  FACTS = Object.fromEntries(raw.bodies.map((b) => [b.id, b]));
  return FACTS;
}

// Radii are drawn on a log scale. At true scale the Sun is 109 Earths across
// and Neptune sits 30 AU out, so a faithful model is a blank screen with a dot.
const drawRadius = (km) => 0.055 + 0.085 * Math.log10(km / 1000 + 1);
// Distance likewise: linear AU puts the inner planets in a single pixel.
const drawDistance = (au) => Math.pow(au, 0.55) * 2.4;

const TIME_RATES = [
  ["-1y", -365], ["-1m", -30], ["-1d", -1], ["live", 0],
  ["1d", 1], ["1m", 30], ["1y", 365],
];

let webglSupport = null;
function hasWebGL() {
  if (webglSupport === true) return true;
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2") || c.getContext("webgl");
    if (gl) {
      webglSupport = true;
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      return true;
    }
  } catch { /* fall through */ }
  return false;
}

export default {
  type: "orrery",
  title: "Orrery",
  icon: "🪐",
  defaultSize: "xl",

  render(body, ctx) {
    const { store } = ctx;
    if (!store.state.orrery) store.state.orrery = {};
    const S = store.state.orrery;
    if (S.orbits === undefined) S.orbits = true;
    if (S.labels === undefined) S.labels = true;
    S.scope = S.scope || "all";
    S.rate = S.rate ?? 0;

    let engine = null;
    let drawToken = 0;
    const persist = () => store.update((s) => { s.orrery = S; }, "orrery");

    const draw = async () => {
      clear(body).append(h("div.widget-loading", {}, "PLOTTING ORBITS…"));
      let facts;
      try { facts = await loadFacts(); }
      catch (err) {
        clear(body).append(h("div.widget-error", {}, `Body data unavailable: ${err.message}`));
        return;
      }

      const tier = S.quality === "2d" || !hasWebGL() ? "2d" : "3d";
      const info = h("div.or-info");
      const clock = h("div.or-clock.muted.small", {});

      const showBody = (id) => {
        const f = facts[id];
        if (!f) return;
        S.selected = id; persist();
        const pos = id === "sun" ? null : planetPosition(id, engine?.currentDate() || new Date());
        const num = (v, unit, digits = 0) =>
          v == null ? "—" : `${Number(v).toLocaleString(undefined, {
            maximumFractionDigits: digits })}${unit}`;
        const rows = [
          ["Type", f.kind],
          ["Radius", num(f.radiusKm, " km")],
          ["Gravity", `${f.gravity} m/s²`],
          ["Mean temp", `${f.tempC} °C`],
          ["Moons", String(f.moons)],
          ["Day", f.dayHours == null ? "—"
            : `${Math.abs(f.dayHours).toLocaleString(undefined, { maximumFractionDigits: 2 })} h${
              f.dayHours < 0 ? " (retrograde)" : ""}`],
          ["Year", f.yearDays == null ? "—" : num(f.yearDays, " Earth days", 1)],
        ];
        if (pos) {
          rows.push(["Distance from Sun", `${pos.r.toFixed(3)} AU`]);
          rows.push(["Ecliptic longitude", `${pos.lon.toFixed(2)}°`]);
        }
        clear(info).append(
          h("div.or-info-name", {}, h("span.or-dot", { style: `background:${f.colour}` }), f.name),
          h("div.or-info-blurb.small", {}, f.blurb),
          h("dl.or-facts", {}, rows.map(([k, v]) => h("div.or-fact", {},
            h("dt", {}, k), h("dd", {}, v)))),
          h("div.or-info-label.muted.small", {}, "NOTABLE"),
          h("ul.or-notables", {}, (f.facts || []).map(([k, v]) =>
            h("li", {}, h("b", {}, `${k}: `), v))));
      };

      // --- controls ---
      const rateRow = h("div.or-rates");
      const setRate = (r) => {
        S.rate = r; persist();
        engine?.setRate(r);
        for (const b of rateRow.children) b.classList.toggle("on", Number(b.dataset.rate) === r);
      };
      for (const [label, days] of TIME_RATES) {
        const b = h("button.btn.btn-tiny.or-rate", { type: "button" }, label);
        b.dataset.rate = String(days);
        b.classList.toggle("on", S.rate === days);
        b.addEventListener("click", () => setRate(days));
        rateRow.append(b);
      }
      const nowBtn = h("button.btn.btn-tiny", { type: "button" }, "Reset to now");
      nowBtn.addEventListener("click", () => { engine?.resetTime(); setRate(0); });

      const scopeSel = h("select.select.or-scope", { "aria-label": "Scope" },
        ...[["all", "Whole system"], ["inner", "Inner planets"], ["outer", "Outer planets"]]
          .map(([v, l]) => h("option", { value: v, selected: S.scope === v }, l)));
      scopeSel.addEventListener("change", () => {
        S.scope = scopeSel.value; persist(); engine?.setScope(S.scope);
      });

      const toggle = (label, key, apply) => {
        const wrap = h("label.an-check", {},
          h("input", { type: "checkbox", checked: !!S[key] }), label);
        wrap.querySelector("input").addEventListener("change", (e) => {
          S[key] = e.target.checked; persist(); apply(S[key]);
        });
        return wrap;
      };

      const jump = h("select.select.or-jump", { "aria-label": "Go to body" },
        h("option", { value: "" }, "Go to…"),
        ...["sun", ...BODIES].map((id) =>
          h("option", { value: id }, facts[id]?.name || id)));
      jump.addEventListener("change", () => {
        if (!jump.value) return;
        engine?.focus(jump.value); showBody(jump.value);
        jump.value = "";
      });

      const viewport = h("div.or-viewport", { class: `or-viewport tier-${tier}` });
      const rail = h("div.or-rail", {},
        h("div.an-rail-group", {}, h("div.an-rail-label", {}, "TIME"), clock, rateRow, nowBtn),
        h("div.an-rail-group", {}, h("div.an-rail-label", {}, "VIEW"), scopeSel, jump,
          toggle("Orbit paths", "orbits", (on) => engine?.setOrbits(on)),
          toggle("Labels", "labels", (on) => engine?.setLabels(on))),
        info,
        h("div.muted.small.or-note", {},
          tier === "2d" ? "2D view — WebGL unavailable. " : "",
          "Positions computed locally from Keplerian elements; sizes and distances are scaled to be visible, not to scale."));

      clear(body).append(h("div.or-wrap", {}, rail, viewport));

      const token = ++drawToken;
      let next;
      try {
        next = tier === "3d"
          ? await build3D(viewport, facts, S, showBody, clock)
          : build2D(viewport, facts, S, showBody, clock);
      } catch {
        next = build2D(viewport, facts, S, showBody, clock);
      }
      if (token !== drawToken) { next.dispose?.(); return; }
      const previous = engine;
      engine = next;
      previous?.dispose?.();
      engine.setOrbits(!!S.orbits);
      engine.setLabels(!!S.labels);
      engine.setScope(S.scope);
      engine.setRate(S.rate);
      if (S.selected) showBody(S.selected);
    };

    ctx.onTeardown(() => { engine?.dispose?.(); engine = null; });
    ctx.onRefresh(draw);
    draw();
  },
};

const SCOPES = {
  all: BODIES,
  inner: ["mercury", "venus", "earth", "mars"],
  outer: ["jupiter", "saturn", "uranus", "neptune", "pluto"],
};

const fmtClock = (d) => d.toLocaleString(undefined, {
  year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });

// ---------------------------------------------------------------------------
// 2D fallback — top-down orthographic plot
// ---------------------------------------------------------------------------
function build2D(viewport, facts, S, onSelect, clock) {
  clear(viewport);
  const SIZE = 460, C = SIZE / 2;
  const svg = svgEl("svg", { viewBox: `0 0 ${SIZE} ${SIZE}`, class: "or2",
    role: "img", "aria-label": "Solar system, top-down view" });
  viewport.append(svg);

  let date = new Date();
  let rate = 0;
  let scope = S.scope || "all";
  let showOrbits = true, showLabels = true;
  let timer = null;

  const project = (x, y, maxAU) => {
    const k = (C - 22) / drawDistance(maxAU);
    return [C + drawDistance(Math.abs(x)) * Math.sign(x) * k,
      C - drawDistance(Math.abs(y)) * Math.sign(y) * k];
  };

  const paint = () => {
    clear(svg);
    const names = SCOPES[scope] || BODIES;
    const maxAU = Math.max(...names.map((n) => planetPosition(n, date).r)) * 1.05;
    if (showOrbits) {
      for (const name of names) {
        const pts = orbitPath(name, date, 120)
          .map(([x, y]) => project(x, y, maxAU).join(","));
        svg.append(svgEl("polyline", { points: pts.join(" "), class: "or2-orbit" }));
      }
    }
    const sun = svgEl("circle", { cx: C, cy: C, r: 7, class: "or2-sun" });
    sun.addEventListener("click", () => onSelect("sun"));
    svg.append(sun);
    for (const name of names) {
      const p = planetPosition(name, date);
      const [px, py] = project(p.x, p.y, maxAU);
      const f = facts[name] || {};
      const dot = svgEl("circle", { cx: px, cy: py, r: Math.max(2.5, drawRadius(f.radiusKm || 3000) * 22),
        fill: f.colour || "#ccc", class: "or2-body" });
      dot.dataset.body = name;
      dot.addEventListener("click", () => onSelect(name));
      svg.append(dot);
      if (showLabels) {
        const t = svgEl("text", { x: px + 8, y: py + 3, class: "or2-label" });
        t.textContent = f.name || name;
        svg.append(t);
      }
    }
    clock.textContent = fmtClock(date);
  };

  const tick = () => { date = new Date(date.getTime() + rate * 86400000 / 24); paint(); };
  const setRate = (r) => {
    rate = r;
    if (timer) { clearInterval(timer); timer = null; }
    if (r === 0) { date = new Date(); paint(); return; }
    timer = setInterval(tick, 60);
  };

  paint();
  return {
    setRate,
    setScope(s) { scope = s; paint(); },
    setOrbits(on) { showOrbits = on; paint(); },
    setLabels(on) { showLabels = on; paint(); },
    focus() { /* no camera in 2D */ },
    resetTime() { date = new Date(); paint(); },
    currentDate: () => date,
    dispose() { if (timer) clearInterval(timer); },
  };
}

// ---------------------------------------------------------------------------
// 3D — three.js
// ---------------------------------------------------------------------------
async function build3D(viewport, facts, S, onSelect, clock) {
  const THREE = await import("three");
  clear(viewport);

  const width = viewport.clientWidth || 480;
  const height = viewport.clientHeight || 460;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(width, height);
  viewport.append(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.01, 2000);
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const sunLight = new THREE.PointLight(0xffffff, 2.2, 0, 0.6);
  scene.add(sunLight);

  const pivot = new THREE.Group();
  scene.add(pivot);

  // starfield — cheap depth cue, and it makes an empty outer system readable
  const starGeo = new THREE.BufferGeometry();
  const starCount = 900;
  const starPos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const r = 260 + Math.random() * 340;
    const th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
    starPos[i * 3] = r * Math.sin(ph) * Math.cos(th);
    starPos[i * 3 + 1] = r * Math.cos(ph);
    starPos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
  }
  starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
  const stars = new THREE.Points(starGeo,
    new THREE.PointsMaterial({ color: 0xffffff, size: 1.1, sizeAttenuation: false, opacity: 0.55, transparent: true }));
  scene.add(stars);

  const sunFacts = facts.sun || {};
  const sunMesh = new THREE.Mesh(
    new THREE.SphereGeometry(drawRadius(sunFacts.radiusKm || 695700) * 1.6, 24, 16),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(sunFacts.colour || "#ffcc33") }));
  sunMesh.userData.body = "sun";
  pivot.add(sunMesh);

  const bodyMeshes = [sunMesh];
  const orbitLines = {};
  const labelSprites = {};
  const planetMeshes = {};

  const makeLabel = (text, colour) => {
    const canvas = document.createElement("canvas");
    canvas.width = 256; canvas.height = 64;
    const g = canvas.getContext("2d");
    g.font = "600 30px system-ui, sans-serif";
    g.fillStyle = colour;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(text, 128, 32);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
    sprite.scale.set(1.5, 0.38, 1);
    return sprite;
  };

  for (const name of BODIES) {
    const f = facts[name] || {};
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(drawRadius(f.radiusKm || 3000), 20, 14),
      new THREE.MeshStandardMaterial({ color: new THREE.Color(f.colour || "#cccccc"),
        roughness: 0.85, metalness: 0.0 }));
    mesh.userData.body = name;
    pivot.add(mesh);
    bodyMeshes.push(mesh);
    planetMeshes[name] = mesh;

    const line = new THREE.Line(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: new THREE.Color(f.colour || "#888888"),
        transparent: true, opacity: 0.32 }));
    orbitLines[name] = line;
    pivot.add(line);

    const sprite = makeLabel(f.name || name, f.colour || "#ffffff");
    labelSprites[name] = sprite;
    pivot.add(sprite);
  }

  // Saturn's rings — the one visual detail nobody forgives you for omitting.
  const ringR = drawRadius(facts.saturn?.radiusKm || 58232);
  const rings = new THREE.Mesh(
    new THREE.RingGeometry(ringR * 1.4, ringR * 2.3, 48),
    new THREE.MeshBasicMaterial({ color: 0xd9cfa5, side: THREE.DoubleSide,
      transparent: true, opacity: 0.55 }));
  rings.rotation.x = Math.PI / 2 - 0.47;
  planetMeshes.saturn.add(rings);

  let date = new Date();
  let rate = 0;
  let scope = S.scope || "all";
  let showOrbits = true, showLabels = true;

  const rebuildOrbits = () => {
    for (const name of BODIES) {
      const pts = orbitPath(name, date, 220).map(([x, y, z]) =>
        new THREE.Vector3(...toScene(x, y, z)));
      orbitLines[name].geometry.dispose();
      orbitLines[name].geometry = new THREE.BufferGeometry().setFromPoints(pts);
    }
  };
  // Ecliptic x/y becomes the scene's x/z plane so "top down" is the default
  // camera view, with ecliptic z (inclination) becoming scene height.
  const toScene = (x, y, z) => {
    const r = Math.hypot(x, y, z) || 1e-9;
    const k = drawDistance(r) / r;
    return [x * k, z * k, -y * k];
  };

  const applyPositions = () => {
    const all = solarSystemAt(date);
    for (const name of BODIES) {
      const p = all[name];
      planetMeshes[name].position.set(...toScene(p.x, p.y, p.z));
      const lp = planetMeshes[name].position;
      labelSprites[name].position.set(lp.x, lp.y + drawRadius(facts[name]?.radiusKm || 3000) + 0.22, lp.z);
    }
    clock.textContent = fmtClock(date);
  };

  const applyScope = () => {
    const names = new Set(SCOPES[scope] || BODIES);
    for (const name of BODIES) {
      const on = names.has(name);
      planetMeshes[name].visible = on;
      orbitLines[name].visible = on && showOrbits;
      labelSprites[name].visible = on && showLabels;
    }
    const maxAU = Math.max(...[...names].map((n) => planetPosition(n, date).r));
    dist = drawDistance(maxAU) * 2.35;
  };

  rebuildOrbits();
  applyPositions();

  // --- orbit / zoom / pick ---
  let rotX = 0.72, rotY = 0.4, dist = 26, dragging = false, moved = 0, lx = 0, ly = 0, pinch = 0;
  const dom = renderer.domElement;
  dom.addEventListener("pointerdown", (e) => {
    dragging = true; moved = 0; lx = e.clientX; ly = e.clientY;
    dom.setPointerCapture?.(e.pointerId);
  });
  dom.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - lx, dy = e.clientY - ly;
    lx = e.clientX; ly = e.clientY; moved += Math.abs(dx) + Math.abs(dy);
    rotY += dx * 0.008;
    rotX = Math.max(0.02, Math.min(1.55, rotX + dy * 0.008));
  });
  const ray = new THREE.Raycaster();
  const ptr = new THREE.Vector2();
  const pick = (x, y) => {
    const rect = dom.getBoundingClientRect();
    ptr.x = ((x - rect.left) / rect.width) * 2 - 1;
    ptr.y = -((y - rect.top) / rect.height) * 2 + 1;
    ray.setFromCamera(ptr, camera);
    // Bodies are small on screen at low zoom; widen the pick radius so a tap
    // near a planet selects it instead of silently missing.
    ray.params.Points.threshold = 0.4;
    const hits = ray.intersectObjects(bodyMeshes.filter((m) => m.visible), false);
    if (hits.length) onSelect(hits[0].object.userData.body);
  };
  dom.addEventListener("pointerup", (e) => {
    dragging = false;
    if (moved < 6) pick(e.clientX, e.clientY);
  });
  dom.addEventListener("wheel", (e) => {
    e.preventDefault();
    dist = Math.max(1.2, Math.min(160, dist * (1 + Math.sign(e.deltaY) * 0.12)));
  }, { passive: false });
  dom.addEventListener("touchmove", (e) => {
    if (e.touches.length === 2) {
      const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY);
      if (pinch) dist = Math.max(1.2, Math.min(160, dist - (d - pinch) * 0.12));
      pinch = d;
    }
  }, { passive: true });
  dom.addEventListener("touchend", () => { pinch = 0; });

  let target = new THREE.Vector3(0, 0, 0);
  const focus = (id) => {
    if (id === "sun") { target.set(0, 0, 0); dist = 8; return; }
    const m = planetMeshes[id];
    if (!m) return;
    target = m.position.clone();
    dist = Math.max(1.4, drawRadius(facts[id]?.radiusKm || 3000) * 14);
  };

  let pendingResize = { w: width, h: height };
  const resizeObserver = new ResizeObserver((entries) => {
    const r = entries[0]?.contentRect;
    if (r && r.width > 0 && r.height > 0) pendingResize = { w: r.width, h: r.height };
  });
  resizeObserver.observe(viewport);

  let raf = null;
  let lastFrame = performance.now();
  let lastOrbitRebuild = date.getTime();
  const loop = () => {
    if (!dom.isConnected) { raf = null; return; }
    const now = performance.now();
    const dt = Math.min(now - lastFrame, 250);
    lastFrame = now;

    if (rate !== 0) {
      // rate is days per second of wall clock.
      date = new Date(date.getTime() + rate * dt * 86400);
      applyPositions();
      // Elements drift slowly; redrawing every frame is wasted work, but over
      // decades of scrubbing the paths would visibly detach from the planets.
      if (Math.abs(date.getTime() - lastOrbitRebuild) > 3.15e11) {   // ~10 years
        rebuildOrbits();
        lastOrbitRebuild = date.getTime();
      }
    }

    pivot.rotation.set(0, 0, 0);
    const cx = target.x + dist * Math.cos(rotX) * Math.sin(rotY);
    const cy = target.y + dist * Math.sin(rotX);
    const cz = target.z + dist * Math.cos(rotX) * Math.cos(rotY);
    camera.position.set(cx, cy, cz);
    camera.lookAt(target);

    const { w, h: hgt } = pendingResize;
    if (dom.clientWidth !== Math.round(w) || dom.clientHeight !== Math.round(hgt)) {
      renderer.setSize(w, hgt, true);
      camera.aspect = w / (hgt || 1);
      camera.updateProjectionMatrix();
    }
    renderer.render(scene, camera);
    raf = requestAnimationFrame(loop);
  };
  loop();

  return {
    setRate(r) {
      // The UI rate is "days per step"; map it to days per wall-clock second so
      // 1d steps read as a gentle crawl and 1y as a fast sweep.
      rate = r === 0 ? 0 : r / 30;
      if (r === 0) { date = new Date(); applyPositions(); }
    },
    setScope(s) { scope = s; applyScope(); },
    setOrbits(on) { showOrbits = on; applyScope(); },
    setLabels(on) { showLabels = on; applyScope(); },
    focus,
    resetTime() { date = new Date(); applyPositions(); rebuildOrbits(); },
    currentDate: () => date,
    dispose() {
      if (raf) { cancelAnimationFrame(raf); raf = null; }
      resizeObserver.disconnect();
      scene.traverse((o) => {
        o.geometry?.dispose?.();
        const mats = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
        for (const m of mats) { m.map?.dispose?.(); m.dispose?.(); }
      });
      renderer.dispose();
      renderer.forceContextLoss?.();
      dom.remove();
    },
  };
}

/** Command-palette entries: jump straight to a body. */
export function searchIndex() {
  const names = { sun: "Sun", mercury: "Mercury", venus: "Venus", earth: "Earth",
    mars: "Mars", jupiter: "Jupiter", saturn: "Saturn", uranus: "Uranus",
    neptune: "Neptune", pluto: "Pluto" };
  return Object.entries(names).map(([id, label]) => ({
    label, hint: "solar system", type: "orrery",
    apply: (store) => store.update((s) => {
      s.orrery = { ...(s.orrery || {}), selected: id };
    }, "orrery"),
  }));
}
