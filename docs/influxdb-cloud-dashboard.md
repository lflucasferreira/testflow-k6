# InfluxDB Cloud dashboard — testflow-k6

Guide to install the **K6 Test Results** dashboard in **InfluxDB Cloud** (native Boards UI) and stream k6 metrics from testflow-k6.

> **Tested path:** `influx apply` with `k6-test-results-template.yml` (InfluxDB CLI stack template).

---

## Architecture

```text
k6 (testflow-k6)  →  InfluxDB Cloud (bucket: k6)  →  Boards dashboard "K6 Test Results"
                    ↘  Grafana Cloud (optional, same bucket)
```

Both Grafana and InfluxDB native UI read the **same metrics** written by `xk6-output-influxdb`.

---

## Prerequisites

| Requirement | Notes |
|-------------|--------|
| [InfluxDB Cloud](https://cloud2.influxdata.com) account | Free tier is enough |
| Bucket **`k6`** | **Load Data → Buckets → Create** — the template does **not** create the bucket |
| API token | **Write** permission on bucket `k6` for k6 runs; **Read** for viewing dashboards |
| [InfluxDB CLI](https://docs.influxdata.com/influxdb/v2/tools/influx-cli/) | `brew install influxdb-cli` (macOS) |
| `.env` configured for Cloud | See [Environment](#environment) |

---

## Two dashboard files (do not mix them up)

| File | Format | Use with |
|------|--------|----------|
| `monitoring/influxdb/k6-test-results-template.yml` | InfluxDB stack template (`apiVersion: influxdata.com/v2alpha1`) | **`influx apply`** (recommended) |
| `monitoring/influxdb/k6-test-results-dashboard.json` | Chronograf / UI export (`meta` + `content`) | UI → **Boards → Import Dashboard** only |

Using the **JSON** file with `influx apply` fails with:

```text
json: cannot unmarshal object into Go value of type []api.TemplateEntry
```

---

## Step 1 — Configure `.env`

Copy from `.env.example` and set Cloud values (never commit tokens):

```bash
K6_INFLUXDB=true
K6_INFLUXDB_ADDR=https://us-east-1-1.aws.cloud2.influxdata.com   # your cluster URL
K6_INFLUXDB_ORGANIZATION=your-org-id-or-name
K6_INFLUXDB_BUCKET=k6
K6_INFLUXDB_TOKEN=your-influxdb-api-token
K6_INFLUXDB_INSECURE=true   # required when k6 runs in Docker → Cloud (TLS x509)
```

Find values in InfluxDB Cloud → **Settings** (Cluster URL, Organization) and **Load Data → API Tokens**.

---

## Step 2 — Send metrics from k6

Build the k6 image with InfluxDB output (first time):

```bash
npm run grafana:build
```

Run smoke test to InfluxDB Cloud (includes `--tag testid=smoke`):

```bash
npm run test:smoke:influx:cloud
```

Confirm the log shows your HTTPS cluster URL and **no** `unauthorized` or `x509` errors.

**Always pass a `testid` tag** — the dashboard filters by it:

```bash
K6_INFLUXDB=true K6_INFLUXDB_TARGET=cloud bash scripts/run-k6.sh run \
  --tag testid=my-run-id \
  scenarios/smoke/api-health.js
```

---

## Step 3 — Install the dashboard (CLI, recommended)

### Validate the template

```bash
npm run influx:template:validate
```

Or manually:

```bash
influx template validate \
  -f monitoring/influxdb/k6-test-results-template.yml \
  --host "$K6_INFLUXDB_ADDR" \
  --org "$K6_INFLUXDB_ORGANIZATION" \
  --token "$K6_INFLUXDB_TOKEN" \
  --skip-verify
```

### Apply the template

```bash
npm run influx:template:apply
```

Or manually:

```bash
influx apply \
  -f monitoring/influxdb/k6-test-results-template.yml \
  --host "$K6_INFLUXDB_ADDR" \
  --org "$K6_INFLUXDB_ORGANIZATION" \
  --token "$K6_INFLUXDB_TOKEN" \
  --skip-verify \
  --force yes
```

The template installs:

- Label **`k6`**
- Dashboard variable **`testid`**
- Dashboard **`K6 Test Results`** (6 single-stat panels + 1 time-series chart)

---

## Step 4 — View metrics

1. Open [InfluxDB Cloud](https://cloud2.influxdata.com) → **Boards**.
2. Open **K6 Test Results**.
3. Set **time range** → **Past 1 hour** (or when you ran k6).
4. Select **`testid`** → e.g. **`smoke`**.

### Panels

| Panel | Metric |
|-------|--------|
| Requests Made | Total `http_reqs` |
| HTTP Failures | Total `http_req_failed` |
| Peak RPS | Max requests/s |
| P95 Response Time | Latency P95 |
| Data Received / Sent | Bytes transferred |
| VUs, Response Time & RPS | Time-series chart |

---

## Alternative — UI import (JSON)

If you prefer the web UI instead of the CLI:

1. **Boards** → **Create Dashboard** → **Import Dashboard**.
2. Upload `monitoring/influxdb/k6-test-results-dashboard.json`.
3. Click **Import JSON as Dashboard**.

Regenerate the JSON after editing Flux in `scripts/generate-influx-dashboard.mjs`:

```bash
npm run influx:dashboard:generate
```

> The JSON import path had issues with the `testid` variable in some InfluxDB Cloud versions. Prefer **`influx apply`** with the YAML template.

---

## Sanity check — Data Explorer

If panels are empty but Grafana shows data:

```flux
from(bucket: "k6")
  |> range(start: -1h)
  |> filter(fn: (r) => r._measurement == "http_reqs")
  |> filter(fn: (r) => r._field == "value")
  |> filter(fn: (r) => r.testid == "smoke")
  |> limit(n: 5)
```

If this returns rows, data exists — fix **time range** or **`testid`** on the dashboard.

List available test runs:

```flux
import "influxdata/influxdb/schema"

schema.tagValues(bucket: "k6", tag: "testid")
```

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `cannot unmarshal object into Go value of type []api.TemplateEntry` | Used **JSON** with `influx apply` | Use **`k6-test-results-template.yml`** |
| `undefined identifier v` in variable query | Variable query references `v.bucket` | Use YAML template (hardcodes bucket `"k6"` in variable query) |
| `x509: certificate signed by unknown authority` | Docker k6 → Cloud TLS | `K6_INFLUXDB_INSECURE=true` in `.env` |
| `unauthorized` + `http://influxdb:8086` in log | Pointing at local Docker InfluxDB | Use `K6_INFLUXDB_TARGET=cloud` and HTTPS addr in `.env` |
| Panels empty, Grafana OK | Wrong `testid` or time range | Select `testid=smoke`, **Past 1 hour** |
| `testid` dropdown empty | No k6 runs yet | Run `npm run test:smoke:influx:cloud` first |

---

## npm scripts

| Script | Action |
|--------|--------|
| `npm run test:smoke:influx:cloud` | Send smoke metrics to InfluxDB Cloud |
| `npm run influx:template:validate` | Validate YAML template against Cloud |
| `npm run influx:template:apply` | Install dashboard via `influx apply` |
| `npm run influx:dashboard:generate` | Regenerate UI JSON from generator script |

---

## Related docs

- [Grafana Cloud setup](grafana-cloud-setup.md) — Grafana dashboard + GitHub Pages embed
- [README — Real-time monitoring](../README.md#real-time-grafana--influxdb-local)
