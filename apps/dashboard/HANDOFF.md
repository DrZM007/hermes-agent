# HERMES//HUB — session handoff

Paste this into a new session to continue. It captures everything needed to
pick up cleanly.

## 1. What this is
A self-hosted, zero-dependency personal dashboard + "Jarvis" AI agent, living
in `apps/dashboard/` of the repo. Design language: dark-first, minimalist,
"intelligence-agency" aesthetic (mono labels, hairlines, cyan accent). It began
as an all-in-one widget board and grew into a full agent platform. The complete
Jarvis architecture is documented in `apps/dashboard/JARVIS.md`.

**Hard constraint / ethos:** zero-dependency **Python stdlib** server + zero-build
**vanilla ES-module** frontend. The only optional dependency is the official
`anthropic` SDK (unlocks the live agent). Do NOT add frameworks (no FastAPI,
React, bundlers, Docker-required flows, etc.). Everything must keep working with
just `python3 server.py`.

## 2. Repo, branch, git rules
- Repo: `DrZM007/hermes-agent` (aka `drzm007/hermes-agent`). Default branch: `main`.
- **Current workflow: topic branch → PR → squash-merge into `main`.** The old
  single-branch rule (`claude/all-in-one-dashboard-xqh6ct`) is DEAD — that branch
  was merged long ago. Branch from `origin/main` for each bundle.
- Push with `git push -u origin <topic-branch>`.
- After a squash-merge, a branch based on the pre-squash commit will conflict.
  Fix by patch-and-rebase, never by merging:
  ```bash
  git diff HEAD~1 HEAD > /tmp/p.patch
  git fetch origin main && git checkout -B <new-branch> origin/main
  git apply --3way /tmp/p.patch
  ```
- Commit footer convention (keep consistent):
  ```
  Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_<this-session-id>
  ```
- Never put the model id in commits, PR bodies, or code.
- Commit + push after each self-contained bundle (a stop-hook nags about
  uncommitted changes).

## 3. How the user runs it (their setup)
- The user is on **Windows**, runs Python via `python3` (Python 3.14). **Docker
  does NOT work on their laptop** — use the no-Docker paths.
- Their repo clone lives in their home dir (`C:\Users\ziyaad.moolla\hermes-agent`).
- Daily start: `cd $HOME\hermes-agent\apps\dashboard` then `python3 server.py`,
  open `http://127.0.0.1:8787`. They also have a `start-dashboard.bat` on the Desktop.
- To get updates: `git pull origin claude/all-in-one-dashboard-xqh6ct`.
- The dashboard only runs on THEIR machine — servers spun up in the cloud
  session are not reachable from their laptop.
- Always-on without Docker: `apps/dashboard/deploy/serve.sh` (nohup runner),
  `deploy/hermes-hub.service` (systemd user unit), `deploy/com.hermeshub.hub.plist`
  (macOS launchd).

## 4. Architecture (backend = Python, frontend = JS)
Server relays a Claude conversation; tool calls execute **client-side** against
the browser's localStorage (nothing personal stored server-side except synced
state in SQLite). Agent loop lives in `public/js/widgets/agent.js` +
`public/js/actions.js`. SSE streaming for live replies.

### Jarvis layers — ALL 6 PHASES COMPLETE
1. **Model router** (`router.py`) — cost-aware tiers FAST=Haiku / CORE=Sonnet /
   DEEP=Opus; picks cheapest viable per task, escalates hard/security/finance
   turns to deep, deep-tier rate-capped. Env overrides
   `HERMES_HUB_MODEL_FAST/_CORE/_DEEP`; `HERMES_HUB_MODEL` pins one model.
2. **Permission gate** (`assistant.TOOL_TIERS`) — auto/confirm/blocked. Confirm
   tools (add_app, open_url, create/delete_automation) pop an approval card in
   the Agent widget; unknown/sensitive tools blocked. Mirrored client-side in
   `actions.js`.
3. **Telemetry + System widget** (`telemetry.py`, `public/js/widgets/system.js`)
   — bounded `data/telemetry.jsonl` of routing + tool outcomes; widget shows
   engine/tiers, deep budget, permission split, recent tool calls.
4. **Kill switch** — one toggle freezes all autonomy; `automations.tick()`
   checks a persisted `frozen` flag before firing. `GET/POST /api/killswitch`.
5. **Advisor escalation** — when the core model self-reports low confidence
   (`needs_escalation`), `advise()` consults the deep tier (guidance only, no
   tools), core finishes confidently. Bounded by deep budget. In both
   `_chat_claude` and `chat_stream`.
6. **Bounded self-evolution** (`evolve.py`) — reflection over telemetry+memory
   queues proposals in an approval inbox (⚙ → Agent proposals…, or System widget
   PROPOSALS row). **Policy: only `memory_prune` auto-applies**; `prompt_addendum`
   (learned guidelines → `data/agent_notes.md`, injected into system prompt)
   needs a click. Every apply snapshots the hub first (rollback). `reflect`
   automation action runs it nightly.

### Other major features (all shipped)
- Widgets: clock, worldstate (State-of-the-World index), agent, weather
  (multi-city + AQI + sunrise/sunset), launcher, news (custom RSS sources),
  reading list, tasks, notes, calendar (+ICS subscriptions), markets
  (watchlist), focus timer (Pomodoro), system.
- In-app viewer (reader + embed), summarize-everywhere (∑ buttons), voice
  (push-to-talk + speak replies), command palette (Ctrl/⌘-K) that also searches
  your own data and jumps to it.
- Cross-device sync (SQLite `data/hub.db`, optimistic concurrency), bearer-token
  auth + lock screen, PWA (manifest + service worker, currently **hub-v10**).
- Automations engine (`automations.py`): daily/market/worldstate triggers →
  notify/briefing/backup/reflect actions; 20s daemon thread.
- Server-side backups (`/api/backup`, `/api/backups`, `/api/backup/restore`);
  snapshots include memory **and** agent_notes.

### Post-phase feature additions (all shipped, tested)
- **News search** — filter box in the news widget; client-side, no refetch.
- **Accent presets** — settings swatches switch the UI accent (cyan default /
  amber / green / magenta); sets `--accent*` inline, persisted in state.
- **Structured tasks** — optional due date + priority via inline tokens
  (`!high`/`!low`, `@YYYY-MM-DD`/`@today`/`@tomorrow`); priority rail + overdue
  due chip; open tasks sort by priority then due; due tasks overlay the
  calendar; `add_task` tool + local parser learned the tokens.
- **Evolution rollback + audit** (Phase 6) — applied proposals show a one-click
  "Roll back" that restores the pre-apply snapshot; `evolve.history()` +
  `GET /api/evolve/history`; `rollback` op on `/api/evolve/proposal`.
- **Model-augmented reflection** (Phase 6) — in claude mode the deep tier
  proposes richer `prompt_addendum` guidelines into the same approval inbox
  (validated, capped, never auto-applies). `assistant.reflect_candidates()`.
- **Routing overrides UI** — "Model routing…" panel edits per-tier models,
  persisted in `data/routing.json`; precedence env > file > default (env-pinned
  tiers shown locked). `GET/POST /api/assistant/routing`.
- **SSRF hardening** — the reader resolves the host and rejects non-global
  addresses and re-validates every redirect hop (`host_is_blocked`); all
  upstream fetches capped at 8 MiB.

## 5. File map (`apps/dashboard/`)
```
server.py         stdlib HTTP server: static + JSON API + live/sample fallback
assistant.py      AI layer: Claude (optional SDK) or local rule-based; routing,
                  permission tiers, advisor escalation, summarize, briefing
router.py         cost-aware model routing (Phase 1)
telemetry.py      bounded routing + tool-call telemetry (Phase 3)
automations.py    standing-rules engine + kill switch (Phase 4)
evolve.py         self-evolution / reflection engine (Phase 6)
ics.py            minimal RFC 5545 calendar parser
scripts/check.sh  ONE-COMMAND GATE (syntax, imports, invariants, SW, tests)
.githooks/        pre-commit + pre-push running check.sh
sample_data.json  bundled offline data
Dockerfile        OPTIONAL container (user can't use Docker); prefer deploy/
compose.yaml      OPTIONAL
deploy/           serve.sh + systemd/launchd units (no-Docker always-on)
JARVIS.md         merged agent architecture + phase status
HANDOFF.md        this file
ROADMAP.md        detailed future-feature build plans
README.md         full user docs
public/           zero-build frontend
  js/main.js        layout, palette (data search), settings menu
  js/store.js       localStorage state + defaults + sync merge
  js/api.js         API client (+ SSE reader)
  js/actions.js     executes agent tool calls; TOOL_TIERS mirror
  js/evolve.js      Agent-proposals inbox panel (+ rollback/history)
  js/routing.js     Model-routing overrides panel
  js/sources.js / calendars.js   settings panels
  js/widgets/*.js   one module per widget (53)
  js/sun.js         solar/lunar maths (verified vs astral)
  js/ephemeris.js   planetary positions (verified vs PyEphem)
  js/citations.js   shared citation rendering (MedBot + Notebook)
  js/vendor/three/  vendored three.js + GLTF/Draco loaders
  anatomy/*.json    layers, structures, conditions
  space/bodies.json planetary physical data
tests/test_server.py   unit tests (276 across all test modules)
tests/e2e.mjs          295-check Playwright suite
.github/workflows/dashboard.yml  CI
```

## 6. Runtime data files (under `--data-dir`, default `data/`)
`hub.db` (synced state), `memory.md` (agent facts), `agent_notes.md` (learned
guidelines), `feeds.json`, `calendars.json`, `automations.json` (rules + frozen
flag + notifications), `telemetry.jsonl`, `proposals.json`, `routing.json`
(per-tier model overrides), `backups/*.json`.

## 7. Environment variables
- `HERMES_HUB_TOKEN` — access code (required when exposed beyond localhost).
- `HERMES_HUB_API_KEY` (or `ANTHROPIC_API_KEY`) — enables live Claude agent.
- `HERMES_HUB_MODEL` — pin one model for all tiers (back-compat).
- `HERMES_HUB_MODEL_FAST/_CORE/_DEEP` — override individual tiers.

## 8. Testing + verification standard
- **One command gates everything: `cd apps/dashboard && ./scripts/check.sh`.**
  Runs Python syntax → `import server` (what the container actually does) → JS
  module parse → JSON validity → structural invariants → service-worker
  freshness → the unit suite. `--full` adds e2e. See `CHECKS.md`.
- Git hooks run it automatically once the user enables them:
  `git config core.hooksPath .githooks` (pre-commit + pre-push).
- **Unit:** `python3 -m unittest discover -s tests` — **276 tests**.
- **E2E:** Playwright, **295 checks**. Ship standard = full unit suite green
  **plus 3 consecutive green e2e runs**.
- E2E needs `playwright-core` installed somewhere and Chromium at
  `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`. Two servers (open +
  token-locked):
  ```bash
  python3 apps/dashboard/server.py --offline --port 8787 --data-dir <fresh1> &
  python3 apps/dashboard/server.py --offline --port 8788 --token e2e-access-code --data-dir <fresh2> &
  PW_CORE_DIR=<scratch-with-node_modules> AUTH_URL=http://127.0.0.1:8788 \
    AUTH_TOKEN=e2e-access-code node apps/dashboard/tests/e2e.mjs http://127.0.0.1:8787 <shotsdir>
  ```
  Expected tail: `ALL E2E CHECKS PASSED`.
- **Give each e2e run a FRESH data dir.** The suite asserts first-run behaviour
  (welcome card, first calendar event); a server carrying state synced by the
  previous run fails runs 2 and 3 for no reason.
- **Verify every regression test actually fails against the bug** before keeping
  it. On this project that check has repeatedly exposed hollow tests — a
  Dockerfile assertion that short-circuited, a service-worker check that only
  diffed committed files, `node --check` silently passing malformed ESM
  (probe as `.mjs` instead), and a Playwright assertion that could never pass
  because `innerText()` returns text-transformed output.
- **Cross-check computed science against an independent implementation.** PyPI
  is reachable from the sandbox even though the web is not: `astral` verified
  `sun.js`, `ephem` verified `ephemeris.js`. Both found real bugs that reading
  the code did not.

## 9. Environment / session hazards (IMPORTANT for the agent)
- **Backend changes require restarting the e2e servers** (server.py imports are
  loaded once). Frontend files are served fresh from disk (no restart needed).
- **`pkill`/`pgrep` can match your own shell → exit 144 "suicide".** Use a
  bracket pattern that won't match the literal command, e.g.
  `pgrep -f "port 87[89]" | xargs -r kill`. Never pattern-match a string present
  in your own command line.
- **Background bash cwd resets** — use absolute paths when starting servers.
- **Never delete a SQLite data dir while a server is using it** → "readonly
  database" 500s. Stop server → wipe → start.
- **Container restarts can roll the workspace back** to an old snapshot. Recover
  with `git fetch origin claude/all-in-one-dashboard-xqh6ct &&
  git reset --hard origin/claude/all-in-one-dashboard-xqh6ct`. Everything is
  pushed after each bundle, so nothing is lost.
- E2E resets client state + clears automations/calendars/killswitch at startup
  for idempotency; keep new e2e sections idempotent (clean up what you create).
- Model identity: say the configured model id when asked. Do NOT put it in
  commits, PRs, or code.
- **The sandbox blocks most outbound hosts** (403 from the agent proxy) but
  **PyPI and npm ARE reachable**, and `WebSearch` works. That combination is how
  external facts get verified here: search for URLs, install a reference library
  to check maths against.

## 10. User preferences
- Replies: **normal English, terse and direct, no unnecessary words.** (There is
  NO "caveman skill" — that was a misunderstanding; write plainly.)
- The user tests on their own Windows laptop; give Windows-exact commands when
  troubleshooting. Docker is not an option for them.
- Confirm genuinely irreversible/self-modifying decisions before building (e.g.
  the Phase 6 auto-apply boundary was confirmed via a question).

## 11. Current status

**Scale:** 8 pages (Main, Markets, Feeds, Sports, Space, Intel, Health, AI Lab),
**53 widgets**, 276 unit tests, 295 e2e checks, PWA cache **hub-v76**.

### Layout reconciler — read this before adding a widget or page
`store.js` holds `LAYOUT_REVISIONS`, an append-only list where each revision
declares **only what it introduced**. `LAYOUT_REV` derives from the last entry,
and `migrate()` replays anything a stored state has not seen. This is how new
widgets reach EXISTING users instead of only fresh installs. Currently at
**rev 10**.

Two traps, both of which shipped as bugs before being fixed:
1. **The defaults-merge trap.** `load()` does `{...defaultState(), ...parsed}`,
   so any version key present in `defaultState` makes a stored state look
   current. `migrate()` must pin the version from `parsed` FIRST.
2. Adding a widget to `defaultState()` alone does nothing for existing users.
   It needs a `LAYOUT_REVISIONS` entry too.

Also required for a new widget: import + registry array in `main.js`, entry in
`sw.js` SHELL, a **VERSION bump in `sw.js`** (the check script enforces this),
CSS, and the page map in `tests/e2e.mjs`.

### Health page
MedBot (SA decision support), Anatomy Explorer, PubMed, trials, drug lookup,
**52 clinical calculators**, Med Ed/OSCE, cheat sheets (diabetes/hypertension/
HIV/TB), **guideline directory**, health news.

- **Anatomy Explorer** (`ANATOMY.md`) — adaptive 3D (three.js, vendored locally
  under `public/js/vendor/three/`) with a 2D SVG fallback. 6 layers, 31
  structures, 46 conditions, cross-section clipping plane, optional high-detail
  GLB (Tier A) the user supplies themselves.
- Clinical content is *educational*; the user has been told plainly it is worth
  their own review before relying on it.

### Space page (`SPACE.md`)
- **`public/js/ephemeris.js`** — heliocentric planetary positions from Keplerian
  elements. Verified against PyEphem; worst residual 8.6 arcmin.
- **Orrery widget** — explorable 3D solar system at real positions, clickable
  bodies, time controls, orbit paths, 2D fallback.
- Phase 2 (launches, space news, ISS tracker, visible tonight, meteor showers,
  stream directory, astro-ph research) is specced in `SPACE.md`.

### Local-computation modules (no network, no key)
- **`public/js/sun.js`** — sunrise/sunset, three twilights, solar noon, day
  length, moon phase and moon rise/set. NOAA solar model; verified against
  `astral` to <50 s.
- **`public/js/ephemeris.js`** — see above.
These exist because the sandbox blocks every weather/astronomy API, and because
maths cannot go stale or rate-limit.

### Build guards
`scripts/check.sh` (5 layers), `.githooks/`, `tests/test_invariants.py` (encodes
previously-shipped bug classes: Dockerfile COPY globs, SW shell parsing, widget
registration reaching the `WIDGETS` map, no raw `fetch("/api/...")` in widgets,
api.js routes existing server-side, version keys pinned in `migrate()`, anatomy
condition→structure integrity, 2D/3D geometry parity), plus a CI auto-reviewer
workflow (`.github/workflows/dashboard-review.yml`).

## 12. Waiting on the user (cannot be done from a cloud session)
- `git pull origin main` on their laptop.
- `git config core.hooksPath .githooks` to enable the pre-commit/pre-push gates.
- Add an **`ANTHROPIC_API_KEY` repo secret** — gates the CI auto-reviewer AND
  the synthesised answers in MedBot / Notebook. Without it those degrade to
  extractive answers and the reviewer no-ops.
- Optionally supply a `body.glb` for Tier A anatomy (see `ANATOMY.md`).
- Click through the guideline directory links once — they were sourced from
  search results but could not be fetched from the sandbox to verify.
- Authorise any claude.ai MCP connectors they want available.

## 13. Open / future ideas
- Space phase 2 and 3 (`SPACE.md`) — the fullest specced backlog.
- `ROADMAP3.md` §C cross-cutting: palette entries for every new widget,
  per-widget settings, export/share, first-run tooltips for new tabs.
- **Web Push notifications** — payload-less VAPID "tickle" to stay stdlib-only.
- **Agent multi-step plan preview** — plan card before a multi-tool turn.
- **Command palette execution** — run agent commands from ⌘-K, not just navigate.
- Smaller: per-widget refresh intervals; backup download/upload; task recurrence.
