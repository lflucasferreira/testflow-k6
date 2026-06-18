# Grafana Cloud setup — testflow-k6

Step-by-step guide to stream k6 metrics to **InfluxDB Cloud**, visualize them in **Grafana Cloud**, and link the dashboard from **GitHub Pages** (`/grafana/`).

## Architecture

```text
k6 (testflow-k6)  →  InfluxDB Cloud (bucket: k6)  →  Grafana Cloud (dashboard)
                                                          ↓
                                              GitHub Pages /grafana/ (optional embed)
```

| Component | Role |
|-----------|------|
| **InfluxDB Cloud** | Stores time-series metrics from k6 runs |
| **Grafana Cloud** | Queries InfluxDB and renders dashboards |
| **GitHub Pages** | Static hub; `/grafana/` embeds or redirects to your public dashboard |

> GitHub Pages cannot run InfluxDB or Grafana. Only a **public Grafana Cloud URL** can be embedded.

---

## Local vs Cloud — how to choose

The project supports **both** destinations with the same k6 + `xk6-output-influxdb` binary:

| Target | InfluxDB | Grafana | When to use |
|--------|----------|---------|-------------|
| **local** | Docker (`influxdb:8086`) | Docker (`localhost:3000`) | Dev, offline, no cloud costs |
| **cloud** | InfluxDB Cloud (HTTPS) | Grafana Cloud | Share dashboards, persist metrics, GitHub Pages embed |

### Three ways to switch

**1. npm scripts (easiest)**

```bash
npm run grafana:up                    # required for local only
npm run test:smoke:influx:local       # → Docker InfluxDB + local Grafana
npm run test:smoke:influx:cloud       # → InfluxDB Cloud + Grafana Cloud
```

**2. `K6_INFLUXDB_TARGET` (one-shot)**

```bash
K6_INFLUXDB=true K6_INFLUXDB_TARGET=local  npm run test:smoke
K6_INFLUXDB=true K6_INFLUXDB_TARGET=cloud  npm run test:smoke
```

**3. `.env` (default behaviour)**

Set `K6_INFLUXDB_ADDR` — the script **auto-detects**:

| `K6_INFLUXDB_ADDR` | Mode |
|--------------------|------|
| `http://localhost:8086` or `http://influxdb:8086` | **local** |
| `https://….cloud2.influxdata.com` | **cloud** |

With `K6_INFLUXDB_TARGET=auto` (default), no extra flag is needed if `.env` already has the right URL.

### Recommended `.env` layout

Keep TestFlow credentials in `.env`. Optionally split InfluxDB Cloud secrets:

```bash
# .env — main config (cloud creds OK here too)
K6_INFLUXDB=true
K6_INFLUXDB_TARGET=auto

# .env.influx.cloud — optional, loaded only when TARGET=cloud
# copy from .env.influx.cloud.example
```

When `K6_INFLUXDB_TARGET=local`, local Docker defaults **override** cloud values in `.env` — you do not need to edit `.env` to switch back.

### Verify which target is active

At the start of each run, look for:

```text
InfluxDB target: local (Docker stack)
  addr:  http://influxdb:8086

InfluxDB target: cloud (https://….cloud2.influxdata.com)
  addr:  https://….cloud2.influxdata.com
```

---

## Part 1 — InfluxDB Cloud

1. Open [InfluxDB Cloud](https://cloud2.influxdata.com) (same account as Grafana works).
2. Create a **Free** account / organization if prompted.
3. Collect these values (Settings / Load Data):

| Setting | Where | Example |
|---------|-------|---------|
| **Cluster URL** | Settings → Cluster URL | `https://us-east-1-1.aws.cloud2.influxdata.com` |
| **Organization** | Settings → Organization | `my-org` |
| **Bucket** | Load Data → Buckets → **Create** | `k6` |
| **API token** | Load Data → API Tokens → **Generate** | Read/Write on bucket `k6` |

Copy the token immediately — it is shown only once.

---

## Part 2 — Grafana Cloud (first login)

On the welcome screen (**How do you want to get started?**):

- Click **Skip setup →** — manual setup matches the testflow-k6 stack best.
- Do **not** pick “Monitor website uptime” (Synthetic Monitoring ≠ k6 load tests from this repo).

Your stack URL looks like: `https://<stack>.grafana.net`

---

## Part 3 — Add InfluxDB as a data source

1. In Grafana Cloud: **Connections** → **Data sources** → **Add data source**.
2. Search **InfluxDB** → select it.
3. Configure:

| Field | Value |
|-------|-------|
| **Name** | `InfluxDB` (or any name you prefer) |
| **Query Language** | **Flux** |
| **URL** | Your InfluxDB Cloud cluster URL (HTTPS) |
| **Organization** | Your InfluxDB org name |
| **Token** | API token from Part 1 |
| **Default bucket** | `k6` |

4. Click **Save & test** — expect **“Data source is working”**.
5. Optional but helpful: open the data source again → **Set as default**.

---

## Part 4 — Import the k6 dashboard

### Why “select InfluxDB datasource” did not appear

The upstream dashboard JSON shipped with `"datasource": null` on every panel. Grafana only shows the **Import → select datasource** dropdown when the JSON declares an input, e.g.:

```json
"__inputs": [{ "name": "DS_INFLUXDB", "type": "datasource", "pluginId": "influxdb" }]
```

This repo now includes that block in:

`monitoring/grafana/dashboards/xk6-output-influxdb-dashboard.json`

**If you imported before this fix**, panels may show *No data* or a broken datasource — see [Fix an already-imported dashboard](#fix-an-already-imported-dashboard) below.

### Import (correct flow)

1. **Dashboards** → **New** → **Import**.
2. **Upload JSON file** → select `monitoring/grafana/dashboards/xk6-output-influxdb-dashboard.json` from this repo.
3. You should now see:

   **InfluxDB** → dropdown → pick the connection you created in Part 3.

4. Click **Import** → dashboard **K6 Test Results** opens.

---

## InfluxDB Cloud dashboard (native UI)

Visualize k6 metrics in **InfluxDB Cloud Boards** without Grafana.

**Full guide (tested with `influx apply`):** **[docs/influxdb-cloud-dashboard.md](influxdb-cloud-dashboard.md)**

Quick start:

```bash
npm run test:smoke:influx:cloud    # send metrics (tag testid=smoke)
npm run influx:template:validate   # optional
npm run influx:template:apply        # install dashboard
```

Use **`k6-test-results-template.yml`** with `influx apply` — **not** the JSON file (Chronograf format is UI-only).

| File | Use with |
|------|----------|
| `monitoring/influxdb/k6-test-results-template.yml` | `influx apply` / `npm run influx:template:apply` |
| `monitoring/influxdb/k6-test-results-dashboard.json` | UI → **Import Dashboard** only |

---

## Fix an already-imported dashboard

If you imported earlier and panels are empty / red:

### Option A — Re-import (recommended)

1. Delete the broken **K6 Test Results** dashboard (or rename it).
2. Re-import using the **updated** JSON from this repo (Part 4).
3. Map **InfluxDB** in the import dropdown.

### Option B — Set default datasource

1. **Connections** → **Data sources** → open your InfluxDB → **Set as default**.
2. Open **K6 Test Results** → top-right **Dashboard settings** (gear).
3. Tab **Variables** → open **testid** → **Data source** → select **InfluxDB** → **Apply**.
4. Save dashboard. Open each panel → **Edit** → **Query** → confirm **InfluxDB** is selected (only if panels still fail).

### Option C — Single panel check

1. Edit any panel → **Query** tab.
2. **Data source** dropdown (top of query editor) → choose your InfluxDB connection.
3. **Run queries** → if data appears after a k6 run, repeat for other panels or re-import instead.

---

## Part 5 — Send metrics from testflow-k6

### Environment variables

Add to `.env` (never commit tokens):

```bash
K6_INFLUXDB=true
K6_INFLUXDB_ADDR=https://YOUR-CLUSTER.cloud2.influxdata.com
K6_INFLUXDB_ORGANIZATION=your-org
K6_INFLUXDB_BUCKET=k6
K6_INFLUXDB_TOKEN=your-influxdb-api-token
K6_INFLUXDB_INSECURE=true
```

See `.env.example` for local Docker defaults vs cloud.

### Build k6 with InfluxDB output (first time)

```bash
npm run grafana:build
```

### Run smoke test with `testid` tag

The dashboard filters by tag **`testid`**. Always pass a unique value per run:

```bash
K6_INFLUXDB=true bash scripts/run-k6.sh run \
  --tag testid=smoke \
  scenarios/smoke/api-health.js
```

Or use the npm shortcut (add the tag manually until a dedicated script exists):

```bash
K6_INFLUXDB=true K6_SCENARIO=smoke bash scripts/run-k6.sh run \
  --tag testid=smoke \
  scenarios/smoke/api-health.js
```

### Verify in Grafana

1. Open **K6 Test Results**.
2. Time range: **Last 15 minutes**.
3. Variable **testid** → select `smoke`.
4. You should see VUs, requests, latency, etc.

If **testid** is empty, no k6 run has written metrics yet, or the tag was omitted.

---

## Part 6 — Public dashboard → GitHub Pages

1. Open **K6 Test Results** in Grafana Cloud.
2. **Share** (top bar) → **Public dashboard** → **Generate public URL**.
3. Copy the URL (e.g. `https://<stack>.grafana.net/public-dashboards/...`).

In GitHub repo **Settings → Secrets and variables → Actions → Variables**:

| Variable | Value |
|----------|-------|
| `GRAFANA_DASHBOARD_URL` | Public dashboard URL |
| `GRAFANA_EMBED` | `true` (iframe on `/grafana/`) or `false` (redirect) |

Push to `main` — job **publish-pages** in workflow **k6 Performance** runs automatically.  
Landing card **Grafana Dashboard** → `https://<user>.github.io/testflow-k6/grafana/`

Without `GRAFANA_DASHBOARD_URL`, `/grafana/` redirects to the CI HTML report at `/report/`.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| No datasource dropdown on import | Old JSON without `__inputs` | Re-import updated JSON from this repo |
| Panels show “No data” | Datasource not mapped | [Fix an already-imported dashboard](#fix-an-already-imported-dashboard) |
| **testid** variable empty | No metrics in bucket yet | Run k6 with `--tag testid=...` |
| **testid** empty after run | Wrong bucket/org/token in `.env` | Check InfluxDB Cloud Data Explorer |
| InfluxDB dashboard empty (Grafana OK) | Wrong `testid`, time range, or used JSON with `influx apply` | Use **`k6-test-results-template.yml`** + `npm run influx:template:apply`; select **`testid=smoke`** |
| `unauthorized: unauthorized access` + output shows `http://influxdb:8086` | Script pointed at local Docker InfluxDB with a Cloud token | Use updated `run-k6.sh`; confirm log shows your `https://…cloud2.influxdata.com` URL |
| `x509: certificate signed by unknown authority` | Docker k6-influx cannot verify TLS (common on macOS / corporate proxy) | Set `K6_INFLUXDB_INSECURE=true` in `.env` |
| Save & test fails | Wrong URL or token | Regenerate token; use HTTPS cluster URL |
| Public embed blocked | Dashboard not public | Enable Public dashboard in Share menu |

---

## Local Docker stack (optional)

For development without cloud:

```bash
npm run grafana:up
npm run test:smoke:grafana
# http://localhost:3000/d/4sk8QaJVx/k6-test-results
```

Uses Docker InfluxDB + Grafana from `docker-compose.yml` — separate from Grafana Cloud.

---

## Related links

- [README — Grafana on GitHub Pages](../README.md#grafana-on-github-pages)
- [xk6-output-influxdb](https://github.com/grafana/xk6-output-influxdb)
- [k6 InfluxDB output docs](https://grafana.com/docs/k6/latest/results-output/real-time/influxdb/)
