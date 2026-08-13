# Build checks

Layers of defence, fastest first. Every check here exists because a real bug
got through — the unit and e2e suites exercise happy paths and missed all of
them.

## 1. Local gate — `scripts/check.sh`

```bash
apps/dashboard/scripts/check.sh          # ~10s: syntax, invariants, unit tests
apps/dashboard/scripts/check.sh --full   # + end-to-end suite
```

Runs: Python syntax → `import server` (what the container does) → JavaScript
module parsing → JSON validity → structural invariants → unit tests.

> **Note on JS syntax:** `node --check foo.js` parses as CommonJS-with-detection
> and *silently passes* malformed module code. The gate copies each file to
> `.mjs` first, which forces true module parsing. Verified to catch a real
> syntax error that `--check` alone missed.

## 2. Git hooks

Installed once per clone:

```bash
git config core.hooksPath .githooks
```

- **pre-commit** — runs the fast gate when `apps/dashboard/**` is staged.
- **pre-push** — runs the full gate including e2e.

Bypass in an emergency with `--no-verify`.

## 3. Structural invariants — `tests/test_invariants.py`

Each test encodes a bug class that shipped:

| Invariant | Bug it prevents |
|---|---|
| Dockerfile COPYs every local module | Container crashed at import; documented Fly deploy never booted |
| Dockerfile has an import smoke check | Above, regressing silently |
| SW SHELL lists every JS module | Module served stale / missing offline (caught `widgets/reading.js`) |
| SW VERSION not below baseline | Clients keep running old code |
| Every widget module imported by main.js | Widget silently absent |
| No raw `fetch("/api/…")` in widgets | Skips auth header → 401 on token deploys, looks like "no data" |
| api.js routes exist server-side | Typo'd endpoint 404s at runtime |
| Version/seed keys pinned in `migrate()` | **Defaults-merge trap** — stored state looks current, skips upgrades (stranded users on a single "Main" tab, twice) |
| Conditions reference known structures | Anatomy highlight silently no-ops |
| Draco decoder vendored while docs recommend it | Loader throws on the documented export path |

## 4. CI — `.github/workflows/dashboard.yml`

- **checks** — runs the exact same `scripts/check.sh`, so CI can't disagree
  with the local hook.
- **docker** — builds the image and boots it, asserting `/api/health` responds.
  This is the only layer that catches a missing module in the image.
- **e2e** — full browser suite.

## 5. Auto-review — `.github/workflows/dashboard-review.yml`

Claude reviews every dashboard PR and posts findings as a comment, primed with
the bug classes above. Comment `/review` on a PR to re-run.

**Setup:** add an `ANTHROPIC_API_KEY` repository secret
(Settings → Secrets and variables → Actions). Without it the job no-ops with a
notice rather than failing.

## Adding a check

When a bug escapes review, add an invariant here rather than only fixing the
instance — then verify the new check *fails* against the broken code before
committing the fix.

## Naming invariants

`tests/test_invariants.py::NamingInvariants` pins the deliberate split between
the product name and the plumbing (HANDOFF.md §7):

- `HERMES_HUB_TOKEN`, `_API_KEY`, `_MODEL*` must still be read by the server.
  Renaming an env var fails **silently** — an unread token means the dashboard
  comes up unlocked; an unread API key means the agent quietly degrades to
  rule-based answers.
- The service-worker cache prefix must stay `hub-vNN`. `activate` deletes
  caches whose key differs from `VERSION`; change the prefix and the old caches
  match nothing and are never evicted.
- The user-visible brand must still say AIODashboard.

A future rename must ADD the new name and keep the old one as a fallback, which
leaves these tests passing.
