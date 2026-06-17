#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

mkdir -p results/runs

RUN_ID="$(date -u +%Y-%m-%dT%H-%M-%SZ)"
export K6_PROFILE=smoke
export BASE_URL="${BASE_URL:-http://localhost:5050}"

declare -a SUITES=(
  "smoke|scenarios/smoke/api-health.js"
  "load-auth|scenarios/load/api-auth.js"
  "load-users|scenarios/load/api-users.js"
  "mixed-traffic|scenarios/load/mixed-traffic.js"
  "login-flow|journeys/login-flow.js"
  "authenticated-user|journeys/authenticated-user.js"
  "spike|scenarios/spike/api-spike.js"
)

declare -a FAILURES=()

echo "=== testflow-k6 report run (${RUN_ID}) ==="

for entry in "${SUITES[@]}"; do
  name="${entry%%|*}"
  script="${entry##*|}"
  export K6_SCENARIO="$name"
  out="results/runs/${RUN_ID}-${name}.json"
  exit_file="results/runs/${RUN_ID}-${name}.exit"

  echo ""
  echo ">>> Running: ${name}"
  exit_code=0
  if bash scripts/run-k6.sh run --summary-export="${out}" "${script}"; then
    echo "PASS: ${name}"
  else
    exit_code=$?
    echo "FAIL: ${name} (exit ${exit_code})" >&2
    FAILURES+=("${name}")
  fi
  echo "${exit_code}" > "${exit_file}"
done

node scripts/generate-report.mjs "${RUN_ID}"

echo ""
echo "Report written to results/REPORT.md"
echo "HTML report: results/report/index.html"

if [ "${#FAILURES[@]}" -gt 0 ]; then
  echo "Failed scenarios: ${FAILURES[*]}" >&2
  exit 1
fi
