"""Structural invariants for the dashboard.

Every check here encodes a bug class that actually shipped and was caught only
by manual review — the unit and e2e suites exercise happy paths and missed all
of them. Keep adding to this file whenever a class of bug slips through.
"""

import json
import re
import unittest
from pathlib import Path

APP = Path(__file__).resolve().parent.parent
PUBLIC = APP / "public"
JS = PUBLIC / "js"
WIDGETS = JS / "widgets"


def read(p: Path) -> str:
    return p.read_text(encoding="utf-8")


class DeployInvariants(unittest.TestCase):
    """The container must contain everything the app imports."""

    @staticmethod
    def _image_files():
        """Expand the Dockerfile's COPY sources into the set of files that will
        exist in the image. Checking for the literal string "*.py" would be a
        tautology — this resolves the globs for real."""
        files = set()
        for line in read(APP / "Dockerfile").splitlines():
            m = re.match(r"\s*COPY\s+(?!--)(.+)", line)
            if not m:
                continue
            parts = m.group(1).split()
            for src in parts[:-1]:            # last token is the destination
                for path in APP.glob(src):
                    if path.is_file():
                        files.add(path.name)
                    else:
                        files.update(p.name for p in path.rglob("*") if p.is_file())
        return files

    def test_dockerfile_copies_every_local_module(self):
        local = {p.stem for p in APP.glob("*.py")}
        imported = set()
        for src in APP.glob("*.py"):
            for line in read(src).splitlines():
                m = re.match(r"\s*(?:from|import)\s+([A-Za-z_]\w*)", line)
                if m and m.group(1) in local:
                    imported.add(m.group(1))
        in_image = self._image_files()
        missing = sorted(f"{m}.py" for m in imported if f"{m}.py" not in in_image)
        self.assertEqual(missing, [],
                         f"Dockerfile COPY set omits {missing} — the container "
                         f"will crash at import")

    def test_dockerfile_has_import_smoke_check(self):
        # A build-time import guards against this regressing silently.
        self.assertIn("import server", read(APP / "Dockerfile"))


class ServiceWorkerInvariants(unittest.TestCase):
    """A module missing from the SW shell is served stale or not at all."""

    @staticmethod
    def _shell_entries():
        sw = read(PUBLIC / "sw.js")
        block = re.search(r"const SHELL = \[(.*?)\];", sw, re.S)
        assert block, "SHELL array not found in sw.js"
        return set(re.findall(r'"([^"]+)"', block.group(1)))

    def test_shell_lists_every_js_module(self):
        shell = self._shell_entries()
        missing = []
        for path in sorted(JS.rglob("*.js")):
            if "vendor" in path.parts:      # vendored libs load on demand
                continue
            rel = "/" + str(path.relative_to(PUBLIC)).replace("\\", "/")
            if rel not in shell:
                missing.append(rel)
        self.assertEqual(missing, [], f"sw.js SHELL is missing: {missing}")

    def test_version_is_well_formed(self):
        # Whether it was BUMPED for this change is a git question — see
        # scripts/check.sh, which compares against the merge base.
        m = re.search(r'VERSION = "hub-v(\d+)"', read(PUBLIC / "sw.js"))
        self.assertIsNotNone(m, "sw.js VERSION missing or malformed")


class WidgetInvariants(unittest.TestCase):
    """Widgets must be registered and must not bypass the API client."""

    def test_every_widget_module_is_registered(self):
        main = read(JS / "main.js")
        registry = re.search(r"const WIDGETS = Object\.fromEntries\(\s*\[(.*?)\]",
                             main, re.S)
        self.assertIsNotNone(registry, "WIDGETS registry not found in main.js")
        registered = {n.strip() for n in registry.group(1).split(",") if n.strip()}
        problems = []
        for path in sorted(WIDGETS.glob("*.js")):
            # Handles all three ESM forms: `import d from`, `import {n} from`,
            # and the combined `import d, {n} from`.
            imported = re.findall(
                rf'import\s+(?:(\w+)\s*,\s*)?(?:(\w+)|\{{([^}}]+)\}})\s+from\s+"\./widgets/{re.escape(path.name)}"',
                main)
            if not imported:
                problems.append(f"{path.name}: not imported by main.js")
                continue
            combined, default, named = imported[0]
            names = [n for n in [combined, default] if n]
            if named:
                names += [n.split(" as ")[-1].strip() for n in named.split(",") if n.strip()]
            # `*Index` imports are search-index helpers, not widgets. Every other
            # imported symbol must reach the registry.
            names = [n for n in names if not n.endswith("Index")]
            if not names:
                problems.append(f"{path.name}: imported but exposes no widget")
                continue
            for name in names:
                if name not in registered:
                    problems.append(f"{path.name}: '{name}' imported but not in WIDGETS")
        self.assertEqual(problems, [], f"widget registration: {problems}")

    def test_widgets_never_fetch_api_directly(self):
        """Raw fetch skips authHeaders(), so it 401s on token-protected
        deployments and the failure looks like an empty/absent resource."""
        offenders = []
        for path in sorted(WIDGETS.glob("*.js")):
            for i, line in enumerate(read(path).splitlines(), 1):
                if re.search(r'fetch\(\s*[`"\']/api/', line):
                    offenders.append(f"{path.name}:{i}")
        self.assertEqual(offenders, [],
                         f"use ctx.api.* instead of raw fetch: {offenders}")

    def test_api_client_methods_map_to_real_routes(self):
        api = read(JS / "api.js")
        server = read(APP / "server.py")
        routes = set(re.findall(r'"(/api/[\w/\-]+)"\s*:', server))
        used = set(re.findall(r'(?:getJSON|postJSON|streamJSON)\(\s*"(/api/[\w/\-]+)"', api))
        unknown = sorted(u for u in used if u not in routes)
        self.assertEqual(unknown, [],
                         f"api.js calls routes the server does not define: {unknown}")


class StateMigrationInvariants(unittest.TestCase):
    """The defaults-merge trap: load() does {...defaultState(), ...parsed}, so a
    version/seed key present in defaultState makes every STORED state look
    current unless migrate() pins it from the parsed object first. This shipped
    twice (pages backfill, per-tab widgets) and stranded users on stale layouts.
    """

    def test_versioning_keys_are_pinned_in_migrate(self):
        store = read(JS / "store.js")
        default_block = re.search(r"function defaultState\(\)\s*\{(.*?)\n\}",
                                  store, re.S)
        self.assertIsNotNone(default_block, "defaultState() not found")
        migrate_block = re.search(r"function migrate\(parsed\)\s*\{(.*?)\n\}",
                                  store, re.S)
        self.assertIsNotNone(migrate_block, "migrate() not found")
        load_block = re.search(r"function load\(\)\s*\{(.*?)\n\}", store, re.S)
        self.assertIsNotNone(load_block, "load() not found")
        # The requirement is that the STORED value is consulted before the
        # defaults merge — as an assignment in migrate() or a guard in load()
        # (e.g. `parsed.version !== 1`). Either satisfies it.
        consulted = migrate_block.group(1) + load_block.group(1)
        # Only true schema-version counters and one-time flags, anchored so
        # words merely CONTAINING "rev"/"seed" (preview, reverseSort…) don't match.
        keys = [k for k in re.findall(r"^\s*(\w+)\s*:", default_block.group(1), re.M)
                if re.fullmatch(r"(?:\w+?)(?:Rev|Seed)|onboarded|version", k)]
        unpinned = [k for k in keys if f"parsed.{k}" not in consulted]
        self.assertEqual(unpinned, [],
                         f"defaultState keys not pinned in migrate(): {unpinned} "
                         f"— stored states will look up-to-date and skip upgrades")


class NamingInvariants(unittest.TestCase):
    """The product is branded AIODashboard; the plumbing keeps the HERMES_HUB_*
    names. That split is deliberate and documented in HANDOFF.md §7.

    Renaming an environment variable does not fail loudly — an unread token
    means the dashboard comes up UNLOCKED, and an unread API key means the agent
    silently degrades to rule-based answers. So the old names are pinned here.
    A future rename must ADD a new name and keep these as a fallback, which
    leaves this test passing.
    """

    LEGACY_ENV = ["HERMES_HUB_TOKEN", "HERMES_HUB_API_KEY", "HERMES_HUB_MODEL",
                  "HERMES_HUB_MODEL_FAST", "HERMES_HUB_MODEL_CORE",
                  "HERMES_HUB_MODEL_DEEP"]

    def test_legacy_env_vars_are_still_read(self):
        sources = "\n".join(read(APP / name) for name in
                             ("server.py", "assistant.py", "router.py"))
        missing = [v for v in self.LEGACY_ENV if v not in sources]
        self.assertEqual(missing, [], f"env vars no longer read: {missing} — "
                         "renaming these breaks running installs SILENTLY; "
                         "see HANDOFF.md section 7")

    def test_service_worker_cache_prefix_is_stable(self):
        """activate deletes caches whose key != VERSION. Change the prefix and
        the old caches match nothing and are never evicted."""
        sw = read(PUBLIC / "sw.js")
        m = re.search(r'const VERSION = "([^"]+)"', sw)
        self.assertIsNotNone(m, "sw.js VERSION not found")
        self.assertRegex(m.group(1), r"^hub-v\d+$",
                         "service-worker cache prefix changed — old caches "
                         "would never be evicted; see HANDOFF.md section 7")

    def test_user_visible_brand_is_the_new_name(self):
        """The other half of the policy: what a user READS should be renamed."""
        for path, needle in ((JS / "main.js", "AIO"),
                             (PUBLIC / "manifest.webmanifest", "AIODashboard"),
                             (PUBLIC / "index.html", "AIODashboard")):
            self.assertIn(needle, read(path), f"{path.name} lost the brand")
        self.assertNotIn("HERMES//HUB", read(PUBLIC / "manifest.webmanifest"))


class AnatomyDataInvariants(unittest.TestCase):
    def test_conditions_reference_known_structures(self):
        base = PUBLIC / "anatomy"
        structures = json.loads(read(base / "structures.json"))
        conditions = json.loads(read(base / "conditions.json"))
        ids = {s["id"] for s in structures["structures"]}
        layers = {l["id"] for l in structures["layers"]}
        for s in structures["structures"]:
            self.assertIn(s["layer"], layers)
        for c in conditions["conditions"]:
            self.assertTrue(c["structures"], f"{c['slug']} maps to nothing")
            for sid in c["structures"]:
                self.assertIn(sid, ids, f"{c['slug']} → unknown structure {sid}")

    def test_every_structure_has_2d_and_3d_geometry(self):
        """A structure declared in structures.json but never built by a renderer
        is invisible and unpickable — it shows up in search and in condition
        highlights and then nothing happens on screen."""
        ids = {s["id"] for s in
               json.loads(read(PUBLIC / "anatomy/structures.json"))["structures"]}
        src = read(WIDGETS / "anatomy.js")
        two_d = src[src.index("function build2DRegions"):src.index("async function build3D")]
        three_d = src[src.index("async function build3D"):]
        for label, section in (("2D", two_d), ("3D", three_d)):
            built = set(re.findall(r'"([a-z_]+)"', section))
            missing = sorted(ids - built)
            self.assertEqual(missing, [], f"{label} renderer builds no geometry for {missing}")

    def test_draco_decoder_present_when_docs_promise_it(self):
        """ANATOMY.md tells users to export Draco-compressed GLB; without the
        decoder the loader throws 'No DRACOLoader instance provided'."""
        docs = read(APP / "ANATOMY.md")
        model_readme = PUBLIC / "anatomy/models/README.md"
        if model_readme.is_file():
            docs += read(model_readme)
        if "draco" not in docs.lower():
            self.skipTest("docs no longer recommend Draco")
        self.assertTrue((JS / "vendor/three/DRACOLoader.js").is_file(),
                        "DRACOLoader.js not vendored")
        self.assertTrue((JS / "vendor/three/draco/gltf/draco_decoder.wasm").is_file(),
                        "draco decoder not vendored")
        self.assertIn("setDRACOLoader", read(WIDGETS / "anatomy.js"))


if __name__ == "__main__":
    unittest.main()
