#!/usr/bin/env bash
# HERMES//HUB pre-commit gate. Run from anywhere:
#   apps/dashboard/scripts/check.sh          # fast checks (~10s)
#   apps/dashboard/scripts/check.sh --full   # + end-to-end suite
#
# Exits non-zero on the first failure so hooks/CI can gate on it.
set -uo pipefail
cd "$(dirname "$0")/.." || exit 1

FULL=0
[ "${1:-}" = "--full" ] && FULL=1
fail=0
step() { printf "\n\033[1m▸ %s\033[0m\n" "$1"; }
ok()   { printf "  \033[32m✓\033[0m %s\n" "$1"; }
bad()  { printf "  \033[31m✗ %s\033[0m\n" "$1"; fail=1; }

PY=$(command -v python3 || command -v python)
NODE=$(command -v node || true)

step "Python syntax"
if "$PY" -m compileall -q . >/dev/null 2>&1; then ok "compiles"; else bad "syntax error"; fi

step "Python imports (what the container does)"
if "$PY" -c "import server" >/dev/null 2>&1; then ok "server imports"; else bad "import failure"; fi

step "JavaScript syntax"
if [ -n "$NODE" ]; then
  # `node --check file.js` parses as CommonJS-with-ESM-detection and silently
  # PASSES malformed module code. Copying to .mjs forces true module parsing.
  js_bad=0
  tmp=$(mktemp -d)
  while IFS= read -r f; do
    cp "$f" "$tmp/probe.mjs"
    if ! "$NODE" --check "$tmp/probe.mjs" >/dev/null 2>&1; then
      bad "$f"
      "$NODE" --check "$tmp/probe.mjs" 2>&1 | sed -n '2,4p' | sed 's/^/      /'
      js_bad=1
    fi
  done < <(find public/js -name "*.js" -not -path "*/vendor/*")
  rm -rf "$tmp"
  [ "$js_bad" -eq 0 ] && ok "all modules parse"
else
  printf "  (node not found — skipped)\n"
fi

step "JSON data files"
json_bad=0
while IFS= read -r f; do
  "$PY" -c "import json,sys; json.load(open(sys.argv[1]))" "$f" 2>/dev/null \
    || { bad "$f"; json_bad=1; }
done < <(find public -name "*.json" -not -path "*/vendor/*")
[ "$json_bad" -eq 0 ] && ok "all valid"

step "Structural invariants"
if "$PY" -m unittest tests.test_invariants -q >/dev/null 2>&1; then
  ok "invariants hold"
else
  bad "invariant violated — rerun: python -m unittest tests.test_invariants -v"
fi

step "Service worker freshness"
# A hardcoded floor in a unit test can never force a bump — this is a git
# question: if any cached asset changed vs the merge base, VERSION must too.
BASE=$(git merge-base HEAD origin/main 2>/dev/null || echo "")
if [ -z "$BASE" ]; then
  printf "  (no origin/main to compare — skipped)\n"
else
  # Diff the WORKING TREE against the merge base (not BASE..HEAD): a pre-commit
  # hook must judge what is about to be committed, not what already is.
  changed=$(git diff --name-only "$BASE" -- public/js public/css public/index.html \
            public/anatomy/structures.json public/anatomy/conditions.json 2>/dev/null)
  if [ -z "$changed" ]; then
    ok "no cached assets changed"
  elif git diff "$BASE" -- public/sw.js | grep -q '^[-+]const VERSION'; then
    ok "VERSION bumped for changed assets"
  else
    bad "cached assets changed but sw.js VERSION was not bumped — clients will run stale code"
  fi
fi

step "Unit tests"
if "$PY" -m unittest discover -s tests -q >/dev/null 2>&1; then
  ok "unit suite passes"
else
  bad "unit tests failed — rerun: python -m unittest discover -s tests -v"
fi

if [ "$FULL" -eq 1 ]; then
  step "End-to-end (offline demo mode)"
  # Resolvable playwright-core, or PW_CORE_DIR pointing at one. Missing it is a
  # skip, not a failure: the local gate must not block a commit just because a
  # browser harness isn't installed — CI runs e2e in its own job regardless.
  have_pw=0
  "$NODE" -e "require.resolve('playwright-core')" >/dev/null 2>&1 && have_pw=1
  [ -n "${PW_CORE_DIR:-}" ] && [ -d "${PW_CORE_DIR}/node_modules/playwright-core" ] && have_pw=1
  if [ -z "$NODE" ]; then
    printf "  (node not found — skipped)\n"
  elif [ "$have_pw" -eq 0 ]; then
    printf "  (playwright-core not installed — skipped; set PW_CORE_DIR to run)\n"
  else
    D=$(mktemp -d)
    "$PY" server.py --offline --port 8799 --data-dir "$D" >/tmp/hub-e2e.log 2>&1 &
    SRV=$!
    for _ in $(seq 1 20); do
      curl -sf http://127.0.0.1:8799/api/health >/dev/null 2>&1 && break; sleep 0.5
    done
    if "$NODE" tests/e2e.mjs http://127.0.0.1:8799 >/tmp/hub-e2e-run.log 2>&1; then
      ok "e2e passed"
    else
      bad "e2e failed — see /tmp/hub-e2e-run.log"
      tail -20 /tmp/hub-e2e-run.log
    fi
    kill "$SRV" 2>/dev/null
    rm -rf "$D"
  fi
fi

echo
if [ "$fail" -eq 0 ]; then
  printf "\033[32mAll checks passed.\033[0m\n"
else
  printf "\033[31mChecks FAILED — commit blocked.\033[0m\n"
fi
exit "$fail"
