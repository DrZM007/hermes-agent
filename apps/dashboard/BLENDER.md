# Blender → Tier-A anatomy model: full walkthrough

How to turn a public anatomical atlas into the `body.glb` that the Anatomy
widget's **"Load high-detail model"** button consumes.

Read `ANATOMY.md` first for what Tier A *is*. This document is the hands-on
half: what the loader actually requires, which Blender settings silently break
which dashboard feature, and how to check your work before you export.

---

## 0. The short version

```bash
# inspect what will map — changes nothing
blender atlas.blend --background --python scripts/blender_prep.py -- --dry-run

# filter, merge, decimate, export
blender atlas.blend --background --python scripts/blender_prep.py -- \
    --out public/anatomy/models/body.glb --ratio 0.08
```

Then reload the dashboard, open Health → Anatomy, switch Quality to **3D**, and
press **Load high-detail model**. The status line reports
`N parts, M mapped to structures` — **M is the number that matters.**

---

## 1. What the loader guarantees, so you don't do it by hand

These are real behaviours in `public/js/widgets/anatomy.js`, not aspirations.
Each one removes a step people habitually do in Blender:

| You might think you must… | Actually |
|---|---|
| Apply scale / set units to metres | **No.** The loader measures the bounding box and applies `scale = 3.4 / height`. Millimetres, inches, arbitrary — all frame identically. |
| Move the model to the world origin | **No.** It recentres on the bounding-box centre after scaling. |
| Rename every mesh to our ids | **Mostly no.** `anatomy-names.js` maps Latin names, strips `.l`/`.r`/`dexter`/`sinistra` and `.001` counters, and matches aliases. `Hepar` → `liver`, `Pulmo.l` → `lungs`, `Ren.r.001` → `kidneys`. |
| Split materials per structure | **No.** Materials are `.clone()`d per mesh on import so highlighting one part can't tint its neighbours. |
| Pre-compress with gltfpack | **No.** Draco is supported — the decoder is vendored at `/js/vendor/three/draco/gltf/` and wired via `setDRACOLoader`. |

What it can **not** do for you: decide what to keep, decimate, or fix a material
that breaks a feature. That's sections 3–5.

---

## 2. Choosing a source

| Source | Format | Notes |
|---|---|---|
| **Z-Anatomy** | `.blend` | Best fit. Already Latin-named with laterality suffixes — exactly what the resolver targets. CC-BY-SA. |
| **BodyParts3D** | thousands of OBJ/STL | Anatomically excellent, but you assemble it yourself and the names are numeric FMA ids that resolve to nothing without a mapping table. Much more work. |

Attribution is **required** for both (CC-BY-SA) and the widget footer already
carries the line — don't remove it.

---

## 3. Decide what to keep — the single highest-leverage step

The dashboard knows **31 structures**. Anything else is weight with no payoff:
an unmapped mesh still renders, but `o.userData.layer` falls back to `"organ"`,
so it clutters the Organs layer toggle and can never be highlighted, searched,
or driven by a condition.

```
skin  musculature
skull  spine  ribcage  pelvis  arm_bones  leg_bones
brain  heart  lungs  liver  stomach  intestines  kidneys  bladder
spleen  pancreas  trachea  thyroid  gallbladder  diaphragm
spinal_cord  sciatic_nerve  brachial_plexus  vagus_nerve
aorta  vena_cava  carotid  femoral_vessels  pulmonary_vessels
```

`scripts/blender_prep.py --dry-run` prints exactly which of your objects hit
which id, which structures it found nothing for, and which meshes it would
delete. Run that before touching anything.

**Merge siblings into one object per structure.** Four separate bowel segments
each resolving to `intestines` gives you four pickable things that all claim to
be the same structure; the widget's `focus(id)` finds only the first. The script
does this with `bpy.ops.object.join()` and renames the result to the canonical
id. By hand: select the group → `Ctrl+J` → F2 to rename.

---

## 4. Decimate

Add a **Decimate modifier, Collapse mode**, ratio ~`0.05–0.15`. Guidance by
tissue:

- **Organs** (liver, lungs, stomach) tolerate ratio `0.05` — smooth blobs.
- **Bone** shows artefacts earlier; keep `0.15–0.25` for skull and vertebrae.
- **Vessels and nerves** are thin tubes and collapse into spaghetti fast. Either
  keep them near `0.3` or accept losing them.

Apply to many objects at once: select all → `Ctrl+A` (Visual Geometry to Mesh),
or `Object → Convert → Mesh`. The script applies per object via
`modifier_apply`.

**Budget:** a few MB for phones. Over ~25 MB the script warns you; mobile Safari
in particular will drop the WebGL context on a large model and the widget will
fall back to 2D.

---

## 5. Material settings that silently break features

This is the section worth reading twice — each of these fails *quietly*, with no
console error, and looks like the feature is broken rather than the asset.

### Ghost skin needs a transparent skin material
`setGhost()` skips any mesh whose material isn't already transparent:

```js
if (!m.material?.transparent) continue;
```

So an opaque skin mesh makes the **Ghost skin** checkbox a no-op. In Blender,
set the skin material's **Alpha below 1.0** (or Blend Mode → Alpha Blend) so the
glTF exporter writes `alphaMode: BLEND`; three.js then sets `transparent: true`
and the toggle works.

### Highlighting needs an emissive-capable material
Highlight sets `material.emissive`. A standard PBR material (the glTF default →
`MeshStandardMaterial`) has one. Export **unlit** (`KHR_materials_unlit`, from a
Background/Emission-only shader) and you get `MeshBasicMaterial`, which has no
`emissive` — clicking a structure then selects it in the info panel but nothing
lights up. Keep Principled BSDF.

### Cross-section shows hollow shells
The clipping plane removes *fragments*, not geometry, and three.js does not cap
the cut. Organs modelled as thin single-sided shells therefore look hollow and
you may see through their backfaces. Solid/manifold meshes section far better.
This is inherent to the technique, not something to debug — but it's a reason to
prefer a source with closed volumes.

*(Picking already accounts for the cut: the raycaster filters hits behind the
plane, so clicking into an open section selects what you can see, not the half
you sliced away.)*

### Focus/zoom uses object position
`focus(id)` reads `m.position`. If every object's origin sits at the world origin
(common after a bulk import), focusing a structure won't meaningfully move the
camera. `Object → Set Origin → Origin to Geometry` on your keepers improves it.

---

## 6. Export settings

`File → Export → glTF 2.0`:

| Setting | Value | Why |
|---|---|---|
| Format | **glTF Binary (.glb)** | The loader fetches a single file. |
| Include → Selected Objects | on, if you isolated keepers | Otherwise cameras/lights ride along as unmapped junk. |
| Geometry → Compression | **Draco on** | Decoder is vendored; big size win. |
| Materials | Export | Needed for highlight + ghost skin (§5). |
| Animation | off | Nothing consumes it; it's pure weight. |
| +Y up | default (on) | The loader's auto-fit uses `size.y` as height. |

---

## 7. Install

```
apps/dashboard/public/anatomy/models/body.glb
```

Exact path — the server just does `is_file()` on it and reports
`{available, url}`. No restart needed, and the check goes through `api.js` so
it works on token-protected deployments.

The file is **not committed** (it's large and CC-BY-SA); it lives only on the
machine you put it on. Back it up outside the repo.

---

## 8. Verify

1. **Quality must be 3D.** The high-detail button only renders in the 3D tier —
   `detectTier()` needs WebGL, `deviceMemory >= 2`, `hardwareConcurrency >= 2`.
   On a weak machine force it with the Quality selector.
2. **Press Load high-detail model** and read the status:
   `High-detail model loaded — N parts, M mapped to structures.`
   - `M` far below your keeper count → names aren't resolving. Rename the misses
     to any alias (see `structures.json`) or the plain id, re-export.
   - `M` good, `N` enormous → you kept unmapped clutter; re-run the script.
3. **Toggle each layer** in the LAYERS rail. With a GLB loaded, visibility is
   per-mesh via `userData.layer` (from the resolved structure), *not* by group —
   a layer that won't toggle means those meshes resolved to nothing.
4. **Click structures** — info panel should name them correctly.
5. **Ghost skin**, then **Cross-section** on each axis (§5).
6. **Pick a condition** from the dropdown and confirm the right parts light up.

Failures are non-destructive by design: everything that can throw is awaited
*before* the procedural body is torn down, so a bad GLB leaves the working model
on screen with an error in the status line rather than an empty viewport.

---

## 9. The script

`scripts/blender_prep.py` ports the browser's resolver to Python so it can tell
you what will map *before* you export. Two copies of one algorithm is a bug
factory, so `tests/test_blender_prep.py` runs both over the same names via node
and fails if they ever disagree.

```
--dry-run          report the mapping, change nothing   (always start here)
--keep a,b,c       restrict to specific structure ids
--ratio 0.08       decimate ratio
--no-draco         uncompressed export
--structures PATH  alternate structures.json
```

It is **untested against a real Blender install** — it was written against the
bpy API and the dashboard's loader, not run end-to-end. Use `--dry-run` first,
and keep your source `.blend` — the script is destructive in-memory (it deletes
and joins objects) though it never writes back to the `.blend`.
