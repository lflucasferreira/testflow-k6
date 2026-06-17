#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

GRAFANA_PORT="${GRAFANA_PORT:-3000}"

testflow_ready() {
  curl -sf http://localhost:5050/health >/dev/null 2>&1
}

echo "Starting InfluxDB + Grafana (monitoring profile)..."
docker compose --profile monitoring build k6-influx

if testflow_ready; then
  echo "TestFlow already reachable on http://localhost:5050 — skipping testflow container."
  docker compose --profile monitoring up -d influxdb grafana
else
  echo "Starting TestFlow + InfluxDB + Grafana..."
  docker compose --profile monitoring up -d testflow influxdb grafana
fi

echo ""
echo "Waiting for services..."
for _ in $(seq 1 30); do
  if testflow_ready \
    && curl -sf http://localhost:8086/health >/dev/null 2>&1 \
    && curl -sf "http://localhost:${GRAFANA_PORT}/api/health" >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

echo ""
echo "=== Real-time monitoring stack ==="
echo "  Grafana:  http://localhost:${GRAFANA_PORT}  (anonymous admin — local dev only)"
echo "  Dashboard: http://localhost:${GRAFANA_PORT}/d/4sk8QaJVx/k6-test-results"
echo "  InfluxDB: http://localhost:8086"
echo "  TestFlow: http://localhost:5050"
echo ""
echo "Published HTML report (CI): https://lflucasferreira.github.io/testflow-k6/report/"
echo ""
echo "Run a test with live metrics:"
echo "  K6_INFLUXDB=true npm run test:smoke"
echo "  npm run test:smoke:grafana"
echo ""
echo "Open dashboard: Grafana → Dashboards → K6 Test Results"
