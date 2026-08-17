"""Prepare an anatomical atlas .blend for the dashboard's Tier-A loader.

Run OUTSIDE the dashboard, inside Blender:

    blender atlas.blend --background --python scripts/blender_prep.py -- \
        --out public/anatomy/models/body.glb --ratio 0.08

What it does, in order:

1. Resolves every mesh object's name against structures.json using the SAME
   matching rules as public/js/anatomy-names.js (Latin names, laterality
   suffixes, .001 counters). This is the point of the script: it tells you what
   WILL map before you export, instead of after.
2. Deletes every mesh that resolves to nothing — an unmapped mesh still renders
   but lands in the Organs layer and can't be highlighted or toggled, so it is
   pure weight.
3. Joins all meshes that resolve to the same structure into one object named
   with the canonical id (so `Pulmo.l` + `Pulmo.r` become one `lungs`).
4. Decimates each result to --ratio.
5. Exports Draco-compressed GLB.

--dry-run stops after step 1 and just prints the mapping report, which is the
sane first thing to do on an unfamiliar atlas.

NOTE: this needs Blender's bpy and cannot run in the dashboard's test suite; the
name-resolution half is pure Python and IS covered by tests/test_blender_prep.py.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys

# ---------------------------------------------------------------------------
# Name resolution — a faithful port of public/js/anatomy-names.js. If you change
# one, change both; tests/test_blender_prep.py pins them to the same fixtures.
# ---------------------------------------------------------------------------

LATERAL = {"l", "r", "lt", "rt", "left", "right",
           "dexter", "dextra", "dextrum", "sinister", "sinistra", "sinistrum"}


def normalize_name(raw: str) -> str:
    s = str(raw or "").lower()
    s = re.sub(r"[._\-/]+", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    s = re.sub(r"\s+\d+$", "", s).strip()
    return " ".join(t for t in s.split(" ") if t not in LATERAL).strip()


def _singular(s: str) -> str:
    return s[:-1] if s.endswith("s") and len(s) > 3 else s


def build_resolver(structures: list[dict]):
    """Return resolve(mesh_name) -> structure id | None."""
    exact: dict[str, str] = {}

    def add(name, sid):
        n = normalize_name(name)
        if n and n not in exact:
            exact[n] = sid

    for st in structures:
        add(st["id"], st["id"])
        add(st["name"], st["id"])
        for a in st.get("aliases", []):
            add(a, st["id"])
    by_length = sorted(exact, key=len, reverse=True)

    def resolve(mesh_name: str):
        n = normalize_name(mesh_name)
        if not n:
            return None
        if n in exact:
            return exact[n]
        sg = _singular(n)
        if sg in exact:
            return exact[sg]
        for key in by_length:
            if len(key) < 4:
                continue
            if re.search(rf"(^|\s){re.escape(key)}(\s|$)", n):
                return exact[key]
        return None

    return resolve


def load_structures(path: str) -> list[dict]:
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)["structures"]


# ---------------------------------------------------------------------------
# Blender half
# ---------------------------------------------------------------------------

def parse_args(argv: list[str]) -> argparse.Namespace:
    # Blender passes script args after a bare "--".
    if "--" in argv:
        argv = argv[argv.index("--") + 1:]
    else:
        argv = []
    here = os.path.dirname(os.path.abspath(__file__))
    ap = argparse.ArgumentParser(prog="blender_prep")
    ap.add_argument("--structures",
                    default=os.path.join(here, "..", "public", "anatomy", "structures.json"),
                    help="path to structures.json")
    ap.add_argument("--out", default="body.glb", help="output .glb path")
    ap.add_argument("--ratio", type=float, default=0.1,
                    help="decimate ratio, 0-1 (lower = smaller/coarser)")
    ap.add_argument("--keep", default="",
                    help="comma-separated structure ids to keep (default: all that resolve)")
    ap.add_argument("--no-draco", action="store_true", help="export uncompressed")
    ap.add_argument("--dry-run", action="store_true",
                    help="report the name mapping and exit without modifying anything")
    return ap.parse_args(argv)


def main() -> int:
    args = parse_args(sys.argv)
    structures = load_structures(args.structures)
    resolve = build_resolver(structures)
    wanted = {s.strip() for s in args.keep.split(",") if s.strip()} or None

    try:
        import bpy
    except ImportError:
        print("This script must run inside Blender:\n"
              "  blender atlas.blend --background --python scripts/blender_prep.py -- --help",
              file=sys.stderr)
        return 2

    meshes = [o for o in bpy.data.objects if o.type == "MESH"]
    print(f"{len(meshes)} mesh objects in file")

    by_structure: dict[str, list] = {}
    unmapped: list[str] = []
    for obj in meshes:
        sid = resolve(obj.name)
        if sid and (wanted is None or sid in wanted):
            by_structure.setdefault(sid, []).append(obj)
        else:
            unmapped.append(obj.name)

    print(f"\n== mapped: {len(by_structure)} of {len(structures)} known structures ==")
    for sid in sorted(by_structure):
        names = [o.name for o in by_structure[sid]]
        tris = sum(len(o.data.polygons) for o in by_structure[sid])
        print(f"  {sid:<18} {len(names):>4} obj  {tris:>9,} faces   {', '.join(names[:4])}"
              + (" …" if len(names) > 4 else ""))

    missing = sorted({s["id"] for s in structures} - set(by_structure))
    if missing:
        print(f"\n== NOT FOUND ({len(missing)}) — these stay procedural or vanish ==")
        print("  " + ", ".join(missing))
    if unmapped:
        print(f"\n== unmapped meshes ({len(unmapped)}) — will be DELETED ==")
        for n in unmapped[:40]:
            print(f"  {n}")
        if len(unmapped) > 40:
            print(f"  … and {len(unmapped) - 40} more")

    if args.dry_run:
        print("\n--dry-run: nothing modified.")
        return 0

    # -- destructive from here ------------------------------------------------
    bpy.ops.object.mode_set(mode="OBJECT") if bpy.context.object else None
    for obj in bpy.data.objects:
        if obj.type == "MESH" and resolve(obj.name) not in by_structure:
            bpy.data.objects.remove(obj, do_unlink=True)

    for sid, objs in by_structure.items():
        objs = [o for o in objs if o.name in bpy.data.objects]
        if not objs:
            continue
        bpy.ops.object.select_all(action="DESELECT")
        for o in objs:
            o.hide_set(False)
            o.select_set(True)
        bpy.context.view_layer.objects.active = objs[0]
        if len(objs) > 1:
            bpy.ops.object.join()
        merged = bpy.context.view_layer.objects.active
        merged.name = sid                      # canonical id — always resolves
        if merged.data:
            merged.data.name = sid
        if 0 < args.ratio < 1:
            mod = merged.modifiers.new(name="prep_decimate", type="DECIMATE")
            mod.ratio = args.ratio
            bpy.ops.object.modifier_apply(modifier=mod.name)
        print(f"  {sid}: {len(merged.data.polygons):,} faces after decimate")

    out = os.path.abspath(args.out)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(
        filepath=out,
        export_format="GLB",
        use_selection=True,
        export_draco_mesh_compression_enable=not args.no_draco,
    )
    size = os.path.getsize(out) / 1e6
    print(f"\nwrote {out} ({size:.1f} MB)")
    if size > 25:
        print("WARNING: over 25 MB — phones will struggle. Lower --ratio or --keep fewer.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
