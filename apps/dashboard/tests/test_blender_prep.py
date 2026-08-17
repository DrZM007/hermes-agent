"""The Blender prep script duplicates the browser's name resolver in Python.

Two copies of one algorithm is a bug factory: the script would happily tell you
"31 of 31 mapped" while the loader in the browser resolved something else. So
these tests run BOTH implementations over the same names and require identical
answers. If you touch either file, this fails until you touch the other.
"""

import json
import re
import shutil
import subprocess
import sys
import unittest
from pathlib import Path

APP = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(APP / "scripts"))

import blender_prep  # noqa: E402

STRUCTURES = json.loads((APP / "public/anatomy/structures.json").read_text(encoding="utf-8"))

# Names drawn from how real atlases label things: Latin, laterality, duplicate
# counters, plurals, embedded qualifiers, and a few that must NOT match.
SAMPLES = [
    "Hepar", "hepar", "Pulmo.l", "Pulmo.r", "Ren.r.001", "Cor",
    "Vesica biliaris", "Vesica urinaria", "Encephalon", "Medulla spinalis",
    "Nervus ischiadicus", "Plexus brachialis", "Nervus vagus",
    "Arcus aortae", "Vena cava superior", "Arteria carotis",
    "Arteria femoralis", "Arteria pulmonalis", "Glandula thyroidea",
    "Columna vertebralis", "Costae", "Os coxae", "Femur", "Humerus",
    "Cranium", "Diaphragma", "Lien", "Gaster", "Intestinum tenue",
    "liver", "lungs", "arm_bones", "leg_bones", "spinal_cord",
    "Musculus biceps brachii", "Cutis",
    # non-anatomical / out of scope — must resolve to nothing
    "Camera", "Lamp", "Armature", "Ligamentum flavum", "", "   ", "001",
]

JS_HARNESS = """
import { buildResolver } from "%s";
const structures = %s;
const names = %s;
const resolve = buildResolver(structures);
console.log(JSON.stringify(names.map((n) => resolve(n))));
"""


class ResolverParityTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if not shutil.which("node"):
            raise unittest.SkipTest("node not available to run the JS resolver")

    def test_python_and_js_resolvers_agree(self):
        harness = JS_HARNESS % (
            (APP / "public/js/anatomy-names.js").as_uri(),
            json.dumps(STRUCTURES["structures"]),
            json.dumps(SAMPLES),
        )
        proc = subprocess.run([shutil.which("node"), "--input-type=module", "-e", harness],
                              capture_output=True, text=True, timeout=60)
        self.assertEqual(proc.returncode, 0, proc.stderr)
        js = json.loads(proc.stdout)
        resolve = blender_prep.build_resolver(STRUCTURES["structures"])
        py = [resolve(n) for n in SAMPLES]
        mismatches = [(n, p, j) for n, p, j in zip(SAMPLES, py, js) if p != j]
        self.assertEqual(mismatches, [],
                         "python/JS resolver disagreement (name, python, js): "
                         f"{mismatches}")

    def test_known_latin_names_actually_map(self):
        """Parity with a broken JS resolver would still pass the test above."""
        resolve = blender_prep.build_resolver(STRUCTURES["structures"])
        for name, expected in [("Hepar", "liver"), ("Pulmo.l", "lungs"),
                               ("Ren.r.001", "kidneys"), ("Cor", "heart"),
                               ("Vesica biliaris", "gallbladder"),
                               ("Encephalon", "brain"), ("Cranium", "skull")]:
            self.assertEqual(resolve(name), expected, name)

    def test_unrelated_names_resolve_to_nothing(self):
        resolve = blender_prep.build_resolver(STRUCTURES["structures"])
        for name in ("Camera", "Lamp", "Armature", "", "001"):
            self.assertIsNone(resolve(name), name)


class ScriptContractTests(unittest.TestCase):
    def test_script_does_not_import_bpy_at_module_scope(self):
        """It has to be importable outside Blender or the tests above can't run
        and nobody can check their mapping without launching Blender."""
        src = (APP / "scripts/blender_prep.py").read_text(encoding="utf-8")
        top_level = [ln for ln in src.splitlines() if re.match(r"^import bpy|^from bpy", ln)]
        self.assertEqual(top_level, [], "bpy must be imported inside main(), not at module scope")

    def test_dry_run_is_the_documented_default_path(self):
        self.assertIn("--dry-run", (APP / "scripts/blender_prep.py").read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
