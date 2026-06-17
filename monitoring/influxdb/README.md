# InfluxDB Cloud — K6 Test Results dashboard

Artifacts to visualize k6 metrics in **InfluxDB Cloud Boards** (native UI).

## Files

| File | Purpose |
|------|---------|
| **`k6-test-results-template.yml`** | Stack template for **`influx apply`** (recommended, tested) |
| `k6-test-results-dashboard.json` | UI import only (**Boards → Import Dashboard**) |

## Quick start

```bash
# 1. Metrics to Cloud (from repo root, .env configured)
npm run test:smoke:influx:cloud

# 2. Install dashboard
npm run influx:template:apply

# 3. Open InfluxDB Cloud → Boards → K6 Test Results → testid=smoke
```

Full guide: **[docs/influxdb-cloud-dashboard.md](../../docs/influxdb-cloud-dashboard.md)**

## Regenerate JSON (UI import)

```bash
npm run influx:dashboard:generate
```

Source: `scripts/generate-influx-dashboard.mjs`
