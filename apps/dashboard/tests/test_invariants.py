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

    def test_dockerfile_copies_every_local_module(self):
        local = {p.stem for p in APP.glob("*.py")}
        imported = set()
        for src in APP.glob("*.py"):
            for line in read(src).splitlines():
                m = re.match(r"\s*(?:from|import)\s+([A-Za-z_]\w*)", line)
                if m and m.group(1) in local:
                    imported.add(m.group(1))
        dockerfile = read(APP / "Dockerfile")
        for mod in sorted(imported):
            self.assertTrue("*.py" in dockerfile or f"{mod}.py" in dockerfile,
                            f"Dockerfile does not COPY {mod}.py — container will "
                            f"crash at import")

    def test_dockerfile_has_import_smoke_check(self):
        # A build-time import guards against this regressing silently.
        self.assertIn("import server", read(APP / "Dockerfile"))


class ServiceWorkerInvariants(unittest.TestCase):
    """A module missing from the SW shell is served stale or not at all."""

    def test_shell_lists_every_js_module(self):
        sw = read(PUBLIC / "sw.js")
        missing = []
        for path in sorted(JS.rglob("*.js")):
            if "vendor" in path.parts:      # vendored libs load on demand
                continue
            rel = "/" + str(path.relative_to(PUBLIC)).replace("\\", "/")
            if f'"{rel}"' not in sw:
                missing.append(rel)
        self.assertEqual(missing, [], f"sw.js SHELL is missing: {missing}")

    def test_version_is_bumped_beyond_shipped_baseline(self):
        m = re.search(r'VERSION = "hub-v(\d+)"', read(PUBLIC / "sw.js"))
        self.assertIsNotNone(m, "sw.js VERSION not found")
        self.assertGreaterEqual(int(m.group(1)), 61)


class WidgetInvariants(unittest.TestCase):
    """Widgets must be registered and must not bypass the API client."""

    def test_every_widget_module_is_registered(self):
        main = read(JS / "main.js")
        unregistered = []
        for path in sorted(WIDGETS.glob("*.js")):
            # a widget is registered if main.js imports its module
            if f'widgets/{path.name}"' not in main:
                unregistered.append(path.name)
        self.assertEqual(unregistered, [],
                         f"widget modules not imported by main.js: {unregistered}")

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
        keys = re.findall(r"^\s*(\w*(?:[Rr]ev|Seed|onboarded)\w*)\s*:",
                          default_block.group(1), re.M)
        unpinned = [k for k in keys if f"parsed.{k}" not in migrate_block.group(1)]
        self.assertEqual(unpinned, [],
                         f"defaultState keys not pinned in migrate(): {unpinned} "
                         f"— stored states will look up-to-date and skip upgrades")


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

    def test_draco_decoder_present_when_docs_promise_it(self):
        """ANATOMY.md tells users to export Draco-compressed GLB; without the
        decoder the loader throws 'No DRACOLoader instance provided'."""
        docs = read(APP / "ANATOMY.md") + read(PUBLIC / "anatomy/models/README.md")
        if "draco" not in docs.lower():
            self.skipTest("docs no longer recommend Draco")
        self.assertTrue((JS / "vendor/three/DRACOLoader.js").is_file(),
                        "DRACOLoader.js not vendored")
        self.assertTrue((JS / "vendor/three/draco/gltf/draco_decoder.wasm").is_file(),
                        "draco decoder not vendored")
        self.assertIn("setDRACOLoader", read(WIDGETS / "anatomy.js"))


if __name__ == "__main__":
    unittest.main()
