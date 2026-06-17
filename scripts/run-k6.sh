#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

K6_IMAGE="${K6_IMAGE:-grafana/k6:1.0.0}"
DASHBOARD_PORT="${K6_WEB_DASHBOARD_PORT:-5665}"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

BASE_URL="${BASE_URL:-http://localhost:5050}"

dashboard_enabled() {
  [[ "${K6_DASHBOARD:-}" == "1" || "${K6_DASHBOARD:-}" == "true" ]]
}

open_in_browser() {
  local target="$1"
  if [[ ! -e "$target" ]]; then
    return 0
  fi
  if command -v open >/dev/null 2>&1; then
    open "$target"
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$target"
  else
    echo "Open manually: ${target}" >&2
  fi
}

configure_dashboard() {
  if ! dashboard_enabled; then
    return 0
  fi

  local scenario="${K6_SCENARIO:-run}"
  export K6_WEB_DASHBOARD=true
  export K6_WEB_DASHBOARD_HOST="${K6_WEB_DASHBOARD_HOST:-0.0.0.0}"
  export K6_WEB_DASHBOARD_PORT="${DASHBOARD_PORT}"
  export K6_WEB_DASHBOARD_EXPORT="${K6_WEB_DASHBOARD_EXPORT:-results/report-${scenario}.html}"
  export K6_WEB_DASHBOARD_PERIOD="${K6_WEB_DASHBOARD_PERIOD:-1s}"

  mkdir -p results

  if [[ -n "${CI:-}" || "${K6_DASHBOARD_OPEN:-true}" == "false" ]]; then
    export K6_WEB_DASHBOARD_OPEN=false
  elif command -v k6 >/dev/null 2>&1; then
    export K6_WEB_DASHBOARD_OPEN=true
  else
    export K6_WEB_DASHBOARD_OPEN=false
  fi

  echo "k6 web dashboard enabled" >&2
  echo "  live:    http://localhost:${DASHBOARD_PORT}" >&2
  echo "  export:  ${K6_WEB_DASHBOARD_EXPORT}" >&2
}

after_dashboard_run() {
  if ! dashboard_enabled; then
    return 0
  fi

  local report="${K6_WEB_DASHBOARD_EXPORT:-results/report.html}"
  if [[ -f "$report" ]]; then
    echo "HTML report saved: ${report}" >&2
    if [[ -z "${CI:-}" && "${K6_DASHBOARD_OPEN:-true}" != "false" ]]; then
      open_in_browser "$report"
    fi
  else
    echo "Warning: expected HTML report not found at ${report}" >&2
  fi
}

docker_base_url() {
  local url="$1"
  url="${url//127.0.0.1/host.docker.internal}"
  url="${url//localhost/host.docker.internal}"
  echo "$url"
}

run_with_docker() {
  local docker_url
  docker_url="$(docker_base_url "$BASE_URL")"

  echo "k6 not found locally — running via Docker (${K6_IMAGE})" >&2
  echo "BASE_URL=${docker_url}" >&2

  local -a docker_args=(--rm)
  if dashboard_enabled; then
    docker_args+=(-p "${DASHBOARD_PORT}:5665")
  fi

  docker run "${docker_args[@]}" \
    -v "${ROOT_DIR}:/scripts" \
    -w /scripts \
    -e "BASE_URL=${docker_url}" \
    -e DEMO_EMAIL \
    -e DEMO_PASSWORD \
    -e K6_PROFILE \
    -e K6_SCENARIO \
    -e K6_SOAK_MINUTES \
    -e CI \
    -e SERVICE_CLIENT_ID \
    -e SERVICE_CLIENT_SECRET \
    -e K6_WEB_DASHBOARD \
    -e K6_WEB_DASHBOARD_HOST \
    -e K6_WEB_DASHBOARD_PORT \
    -e K6_WEB_DASHBOARD_EXPORT \
    -e K6_WEB_DASHBOARD_OPEN \
    -e K6_WEB_DASHBOARD_PERIOD \
    "${K6_IMAGE}" "$@"

  after_dashboard_run
}

configure_dashboard

if command -v k6 >/dev/null 2>&1; then
  export BASE_URL
  k6 "$@"
  after_dashboard_run
else
  if ! command -v docker >/dev/null 2>&1; then
    echo "Error: k6 is not installed and Docker is unavailable." >&2
    echo "Install k6: brew install k6" >&2
    echo "Or install Docker Desktop and retry." >&2
    exit 127
  fi
  run_with_docker "$@"
fi
