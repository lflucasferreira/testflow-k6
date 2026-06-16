#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

K6_IMAGE="${K6_IMAGE:-grafana/k6:1.0.0}"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

BASE_URL="${BASE_URL:-http://localhost:5050}"

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

  docker run --rm \
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
    "${K6_IMAGE}" "$@"
}

if command -v k6 >/dev/null 2>&1; then
  export BASE_URL
  k6 "$@"
else
  if ! command -v docker >/dev/null 2>&1; then
    echo "Error: k6 is not installed and Docker is unavailable." >&2
    echo "Install k6: brew install k6" >&2
    echo "Or install Docker Desktop and retry." >&2
    exit 127
  fi
  run_with_docker "$@"
fi
