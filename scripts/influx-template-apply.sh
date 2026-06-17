#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEMPLATE="${ROOT_DIR}/monitoring/influxdb/k6-test-results-template.yml"

if [[ -f "${ROOT_DIR}/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "${ROOT_DIR}/.env"
  set +a
fi

: "${K6_INFLUXDB_ADDR:?Set K6_INFLUXDB_ADDR in .env}"
: "${K6_INFLUXDB_ORGANIZATION:?Set K6_INFLUXDB_ORGANIZATION in .env}"
: "${K6_INFLUXDB_TOKEN:?Set K6_INFLUXDB_TOKEN in .env}"

ARGS=(
  apply
  -f "${TEMPLATE}"
  --host "${K6_INFLUXDB_ADDR}"
  --org "${K6_INFLUXDB_ORGANIZATION}"
  --token "${K6_INFLUXDB_TOKEN}"
  --force yes
)

if [[ "${K6_INFLUXDB_INSECURE:-false}" == "true" ]]; then
  ARGS+=(--skip-verify)
fi

echo "Applying ${TEMPLATE} to ${K6_INFLUXDB_ADDR}" >&2
influx "${ARGS[@]}"
echo "Done. Open InfluxDB Cloud → Boards → K6 Test Results" >&2
