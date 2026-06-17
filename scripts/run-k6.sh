#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

K6_IMAGE="${K6_IMAGE:-grafana/k6:1.0.0}"
K6_INFLUX_IMAGE="${K6_INFLUX_IMAGE:-testflow-k6-k6-influx:local}"
DASHBOARD_PORT="${K6_WEB_DASHBOARD_PORT:-5665}"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

BASE_URL="${BASE_URL:-http://localhost:5050}"
GRAFANA_PORT="${GRAFANA_PORT:-3000}"

influx_enabled() {
  [[ "${K6_INFLUXDB:-}" == "1" || "${K6_INFLUXDB:-}" == "true" ]]
}

dashboard_enabled() {
  [[ "${K6_DASHBOARD:-}" == "1" || "${K6_DASHBOARD:-}" == "true" ]]
}

configure_influx() {
  if ! influx_enabled; then
    return 0
  fi

  apply_influx_profile

  export K6_INFLUXDB_ORGANIZATION="${K6_INFLUXDB_ORGANIZATION:-testflow}"
  export K6_INFLUXDB_BUCKET="${K6_INFLUXDB_BUCKET:-k6}"
  export K6_INFLUXDB_TOKEN="${K6_INFLUXDB_TOKEN:-testflow-k6-dev-token}"
  export K6_INFLUXDB_ADDR="${K6_INFLUXDB_ADDR:-http://localhost:8086}"
  export K6_INFLUXDB_INSECURE="${K6_INFLUXDB_INSECURE:-true}"

  echo "k6 InfluxDB output enabled" >&2
  echo "  addr:  ${K6_INFLUXDB_ADDR}" >&2
  echo "  org:   ${K6_INFLUXDB_ORGANIZATION}" >&2
  echo "  bucket: ${K6_INFLUXDB_BUCKET}" >&2
  if ! influx_is_local && [[ "${K6_INFLUXDB_INSECURE}" != "true" ]]; then
    echo "  warn:  K6_INFLUXDB_INSECURE is not true — Docker → Cloud often fails with x509 TLS errors" >&2
  fi
  if influx_is_local; then
    echo "  live:  http://localhost:${GRAFANA_PORT}/d/4sk8QaJVx/k6-test-results (Grafana local)" >&2
  else
    echo "  live:  Grafana Cloud → dashboard K6 Test Results" >&2
  fi
  echo "  pages: https://lflucasferreira.github.io/testflow-k6/report/" >&2
}

influx_is_local() {
  local addr="${1:-${K6_INFLUXDB_ADDR:-}}"
  case "$addr" in
    ""|http://influxdb:*|http://localhost:*|http://127.0.0.1:*)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

apply_influx_profile() {
  if ! influx_enabled; then
    return 0
  fi

  if [[ -f "${ROOT_DIR}/.env.influx.cloud" && "${K6_INFLUXDB_TARGET:-}" == "cloud" ]]; then
    set -a
    # shellcheck disable=SC1091
    source "${ROOT_DIR}/.env.influx.cloud"
    set +a
  fi

  case "${K6_INFLUXDB_TARGET:-auto}" in
    local)
      export K6_INFLUXDB_ADDR="${K6_INFLUXDB_LOCAL_ADDR:-http://influxdb:8086}"
      export K6_INFLUXDB_ORGANIZATION="${K6_INFLUXDB_LOCAL_ORGANIZATION:-testflow}"
      export K6_INFLUXDB_BUCKET="${K6_INFLUXDB_LOCAL_BUCKET:-k6}"
      export K6_INFLUXDB_TOKEN="${K6_INFLUXDB_LOCAL_TOKEN:-testflow-k6-dev-token}"
      export K6_INFLUXDB_INSECURE="${K6_INFLUXDB_LOCAL_INSECURE:-true}"
      echo "InfluxDB target: local (Docker stack)" >&2
      ;;
    cloud)
      if influx_is_local; then
        echo "Error: K6_INFLUXDB_TARGET=cloud but addr is local (${K6_INFLUXDB_ADDR})." >&2
        echo "Set K6_INFLUXDB_ADDR=https://….cloud2.influxdata.com in .env or .env.influx.cloud" >&2
        exit 1
      fi
      echo "InfluxDB target: cloud (${K6_INFLUXDB_ADDR})" >&2
      ;;
    auto)
      if influx_is_local; then
        echo "InfluxDB target: auto → local (${K6_INFLUXDB_ADDR})" >&2
      else
        echo "InfluxDB target: auto → cloud (${K6_INFLUXDB_ADDR})" >&2
      fi
      ;;
    *)
      echo "Error: K6_INFLUXDB_TARGET must be local, cloud, or auto (got: ${K6_INFLUXDB_TARGET})" >&2
      exit 1
      ;;
  esac
}

build_k6_args() {
  K6_ARGS=()
  if ! influx_enabled; then
    K6_ARGS=("$@")
    return 0
  fi

  local injected=false
  for arg in "$@"; do
    K6_ARGS+=("$arg")
    if [[ "$arg" == "run" && "$injected" == false ]]; then
      K6_ARGS+=(-o "xk6-influxdb=${K6_INFLUXDB_ADDR}")
      injected=true
    fi
  done
}

testflow_container_running() {
  docker compose --profile monitoring ps testflow --status running -q 2>/dev/null | grep -q .
}

compose_base_url() {
  if testflow_container_running; then
    echo "http://testflow:5050"
  else
    echo "http://host.docker.internal:5050"
  fi
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

run_with_compose_influx() {
  if influx_is_local; then
    export K6_INFLUXDB_ADDR="${K6_INFLUXDB_ADDR:-http://influxdb:8086}"
    export K6_INFLUXDB_INSECURE="${K6_INFLUXDB_INSECURE:-true}"
  fi
  build_k6_args "$@"

  local compose_url
  compose_url="$(compose_base_url)"

  if influx_is_local; then
    echo "k6 via docker compose (k6-influx + local InfluxDB)" >&2
  else
    echo "k6 via docker compose (k6-influx + InfluxDB Cloud)" >&2
  fi
  echo "BASE_URL=${compose_url}" >&2
  echo "K6_INFLUXDB_ADDR=${K6_INFLUXDB_ADDR}" >&2

  local -a compose_run=(docker compose --profile monitoring run --rm)
  if ! testflow_container_running || ! influx_is_local; then
    compose_run+=(--no-deps)
  fi
  compose_run+=(
    -e "BASE_URL=${compose_url}"
    -e "K6_INFLUXDB_ADDR=${K6_INFLUXDB_ADDR}"
    -e "K6_INFLUXDB_ORGANIZATION=${K6_INFLUXDB_ORGANIZATION}"
    -e "K6_INFLUXDB_BUCKET=${K6_INFLUXDB_BUCKET}"
    -e "K6_INFLUXDB_TOKEN=${K6_INFLUXDB_TOKEN}"
    -e "K6_INFLUXDB_INSECURE=${K6_INFLUXDB_INSECURE}"
    k6-influx "${K6_ARGS[@]}"
  )

  "${compose_run[@]}"
  after_dashboard_run
}

run_with_docker() {
  local docker_url
  docker_url="$(docker_base_url "$BASE_URL")"
  local image="${K6_IMAGE}"

  if influx_enabled; then
    image="${K6_INFLUX_IMAGE}"
    export K6_INFLUXDB_ADDR="${K6_INFLUXDB_ADDR:-http://host.docker.internal:8086}"
  fi

  build_k6_args "$@"

  echo "k6 not found locally — running via Docker (${image})" >&2
  echo "BASE_URL=${docker_url}" >&2

  local -a docker_args=(--rm)
  if dashboard_enabled; then
    docker_args+=(-p "${DASHBOARD_PORT}:5665")
  fi
  if influx_enabled; then
    docker_args+=(--add-host=host.docker.internal:host-gateway)
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
    -e K6_INFLUXDB_ORGANIZATION \
    -e K6_INFLUXDB_BUCKET \
    -e K6_INFLUXDB_TOKEN \
    -e K6_INFLUXDB_ADDR \
    -e K6_INFLUXDB_INSECURE \
    "${image}" "${K6_ARGS[@]}"

  after_dashboard_run
}

configure_influx
configure_dashboard
build_k6_args "$@"

if influx_enabled && [[ "${K6_INFLUX_USE_COMPOSE:-true}" == "true" ]] && command -v docker >/dev/null 2>&1; then
  run_with_compose_influx "$@"
elif command -v k6 >/dev/null 2>&1; then
  export BASE_URL
  k6 "${K6_ARGS[@]}"
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
