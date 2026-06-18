# testflow-k6

k6 performance and load testing suite for [TestFlow](https://github.com/qaschoolbr/testflow) — complements functional automation in `testflow-cypress`, `testflow-playwright`, and `testflow-pytest`.

**Live hub (GitHub Pages):** https://lflucasferreira.github.io/testflow-k6/  
**Performance report:** https://lflucasferreira.github.io/testflow-k6/report/

## Description

This project validates **Service Level Objectives (SLOs)** for TestFlow under different load patterns. Every scenario applies k6 **checks** (functional assertions) and **thresholds** (SLO gates) — a run fails if either breaches limits.

| Test type | Scenario | Purpose |
|-----------|----------|---------|
| **Smoke** | `scenarios/smoke/api-health.js` | Minimal VUs — gate availability and baseline latency |
| **Load** | `scenarios/load/*.js` | Expected production traffic (auth, users, mixed) |
| **Stress** | `scenarios/stress/api-breakpoint.js` | Ramp beyond normal load to find degradation |
| **Spike** | `scenarios/spike/api-spike.js` | Sudden burst — validate recovery |
| **Soak** | `scenarios/soak/api-endurance.js` | Long steady load — detect drift/leaks |
| **Journey** | `journeys/*.js` | Multi-step user flows (login → browse) |
| **Browser** | `scenarios/browser/login-page.js` | k6 browser — login page under load |

Endpoints mirror functional API tests: `/health`, `/api/auth/login`, `/api/users`, static `/web/*.html`.

## Test coverage — what is applied

### Shared HTTP checks (`lib/http.js`)

Every helper that hits the API or static pages runs k6 `check()` assertions:

| Helper | Checks applied |
|--------|----------------|
| `getHealth()` | status 200; response time &lt; 1 s |
| `getUsers(token?)` | status 200; body has non-empty `users[]`; response &lt; 2 s |
| `getStaticPage(path)` | status 200; `Content-Type` includes `text/html` |
| `login()` (`lib/auth.js`) | status 200; JSON `token` is a string |

### Scenario catalog

| Scenario | Script | npm script | Profile | What runs each iteration |
|----------|--------|------------|---------|--------------------------|
| **smoke** | `scenarios/smoke/api-health.js` | `test:smoke` | smoke | `GET /health` → `GET /api/users` → `POST /api/auth/login` |
| **load-auth** | `scenarios/load/api-auth.js` | `test:load:auth` | load | `POST /api/auth/login` + token checks; custom `login_duration`, `login_errors` |
| **load-users** | `scenarios/load/api-users.js` | `test:load:users` | load | `setup()`: login once → `GET /api/users` (Bearer token) |
| **mixed-traffic** | `scenarios/load/mixed-traffic.js` | `test:load:mixed` | load | Login → weighted traffic: 35% health, 30% users (auth), 15% static pages, 20% users (anon) |
| **login-flow** | `journeys/login-flow.js` | `test:journey:login` | load | Group 01: `GET /web/login.html` → Group 02: API login → Group 03: `GET /web/dashboard.html` |
| **authenticated-user** | `journeys/authenticated-user.js` | `test:journey:auth` | load | Login → `GET /api/users` → dashboard → team pages |
| **spike** | `scenarios/spike/api-spike.js` | `test:spike` | spike | Health + login + users under burst (5→100 VUs); `spike_failures` custom metric |
| **stress** | `scenarios/stress/api-breakpoint.js` | `test:stress` | stress | Ramp to 100 VUs; counts `degraded_responses` when latency &gt; 3 s / 5 s |
| **soak** | `scenarios/soak/api-endurance.js` | `test:soak` | soak | 15 VUs steady for `K6_SOAK_MINUTES` (default 30 min) |
| **browser** | `scenarios/browser/login-page.js` | `test:browser:login` | smoke + browser | Chromium: fill `data-testid` login form, submit, measure `browser_page_load` |

Static pages used in mixed/journey scenarios: `login.html`, `dashboard.html`, `team.html`, `settings.html`, `activity.html`.

### Load profiles (`config/profiles.js`)

| Profile | Stages (summary) | Typical use |
|---------|------------------|-------------|
| **smoke** | 2 VUs · ~35 s | Local gate, `test:report` suite |
| **ci** | 3→5 VUs · ~55 s | GitHub Actions when `CI=true` |
| **load** | 10→25 VUs · 7 min | Sustained production-like traffic |
| **stress** | 20→100 VUs · 12 min | Find breaking point |
| **spike** | 5→100 VUs burst · ~2.5 min | Sudden traffic surge |
| **soak** | 15 VUs · 30+ min steady | Endurance / leak detection |
| **breakpoint** | stepped 10→125 VUs | Extended capacity ramp |

### SLO thresholds (`config/thresholds.js`)

| Profile | http_req_failed | http_req_duration | Per-endpoint p95 | checks |
|---------|-----------------|-------------------|------------------|--------|
| **smoke** | &lt; 0.5% | p95 &lt; 1500 ms, avg &lt; 800 ms | health 500 ms · users 1500 ms · login 2000 ms | &gt; 99% |
| **load** | &lt; 1% | p95 &lt; 2500 ms, p99 &lt; 6000 ms | health 800 ms · users 2000 ms · login 3000 ms | &gt; 98% |
| **stress / spike** | &lt; 5% | p95 &lt; 5000 ms | — | &gt; 95% |
| **soak** | &lt; 0.5% | p95 &lt; 2500 ms, avg &lt; 1200 ms | — | &gt; 99% |

Scenario-specific custom thresholds: `login_duration`, `login_errors`, `login_flow_duration`, `spike_failures`, `browser_page_load`, etc.

### CI report suite (`npm run test:report`)

Runs **7 scenarios** with `K6_PROFILE=smoke` (fast, ~4 min total):

1. smoke · 2. load-auth · 3. load-users · 4. mixed-traffic · 5. login-flow · 6. authenticated-user · 7. spike

Generates:

- `results/REPORT.md` — Markdown summary
- `results/report/index.html` — HTML dashboard with **PASS/FAIL**, charts (ramp-up, latency percentiles, throughput), checks, and thresholds — published at https://lflucasferreira.github.io/testflow-k6/report/
- `results/summary-latest.json` — machine-readable summary
- `results/runs/<run-id>-*.json` — raw k6 exports

On every push to `main`, the HTML report is published to **GitHub Pages** (job `publish-pages` in `.github/workflows/k6.yml`).

```bash
npm run test:report    # run suite + generate HTML
npm run report:open    # open results/report/index.html locally
```

## Folder Structure

```
testflow-k6/
├── config/           # Environments, load profiles, SLO thresholds
├── lib/              # Auth, HTTP helpers, endpoints, summary export
├── scenarios/
│   ├── smoke/        # CI gate — low VUs
│   ├── load/         # Sustained traffic
│   ├── stress/       # Capacity / breakpoint
│   ├── spike/        # Burst traffic
│   ├── soak/         # Endurance
│   └── browser/      # k6 browser module
├── journeys/         # Multi-step user flows
├── docs/             # GitHub Pages hub (index.html, slides/)
│   ├── index.html    # Landing — links to report & slides
│   └── slides/       # Reveal.js training deck
├── results/          # REPORT.md, JSON summaries, HTML report (partially tracked)
├── monitoring/       # Grafana + InfluxDB provisioning (profile: monitoring)
│   ├── grafana/      # Datasource + k6 dashboard JSON (Grafana import)
│   └── influxdb/     # k6 dashboard YAML (influx apply) + JSON (UI import)
├── docker/
│   └── k6-influx.Dockerfile  # xk6 + influxdb output extension
├── docker-compose.yml
└── .github/workflows/
    └── k6.yml        # CI smoke gate, manual load, GitHub Pages report
```

## Prerequisites

- Node.js 20+ (npm scripts)
- TestFlow on port `5050` (Docker: `qaschool/testflow:latest`)
- **k6** v1.0+ (recommended) **or** Docker (fallback via `scripts/run-k6.sh`)

## Install k6

Native k6 is faster to run locally and required for **browser** scenarios (`test:browser:login`).  
If k6 is not installed, npm scripts still work — they fall back to the `grafana/k6` Docker image.

### macOS (Homebrew)

```bash
brew install k6
k6 version
```

### Linux (Debian/Ubuntu)

```bash
curl -fsSL https://dl.k6.io/key.gpg | sudo gpg --dearmor -o /usr/share/keyrings/k6-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" \
  | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
k6 version
```

### Linux (Fedora/CentOS)

```bash
sudo dnf install https://dl.k6.io/rpm/repo.rpm
sudo dnf install k6
k6 version
```

### Windows (winget)

```powershell
winget install k6 --source winget
k6 version
```

### Windows (Chocolatey)

```powershell
choco install k6
k6 version
```

Alternatively, download the MSI or standalone binary from [k6 GitHub Releases](https://github.com/grafana/k6/releases).

### Verify installation

```bash
k6 version
# k6 v1.x.x (...)
```

After installing, `npm run test:*` uses the local binary automatically (no Docker pull on each run).

> **Corporate proxy (Zscaler / SSL):** if `brew install k6` or apt fails with certificate errors, use the Docker fallback (`npm run test:smoke`) or configure `NODE_EXTRA_CA_CERTS` / system CA — same approach as `testflow-playwright`.

## Setup

```bash
npm install
cp .env.example .env   # optional — adjust BASE_URL / credentials
```

## How to Run

### Start TestFlow

```bash
docker run --rm -p 5050:5050 qaschool/testflow:latest
```

Or via compose (includes k6 runner service):

```bash
npm run docker:up
```

### Local k6 runs

Scripts use `scripts/run-k6.sh`: local `k6` when available, otherwise Docker.

```bash
# Smoke
npm run test:smoke

# Load profiles
npm run test:load:auth
npm run test:load:users
npm run test:load:mixed

# Stress / spike / soak
npm run test:stress
npm run test:spike
npm run test:soak

# User journeys
npm run test:journey:auth
npm run test:journey:login

# Browser (requires k6 with browser support)
npm run test:browser:login
```

### HTML report in the browser (k6 Web Dashboard)

Enable the [official k6 web dashboard](https://grafana.com/docs/k6/latest/results-output/web-dashboard/) to watch metrics live and export a self-contained HTML report when the test finishes.

```bash
# Smoke with live dashboard + auto-open HTML report (macOS: `open`)
npm run test:smoke:ui

# Other scenarios with UI
npm run test:load:auth:ui
npm run test:load:mixed:ui

# Any test — set K6_DASHBOARD=true
K6_DASHBOARD=true K6_SCENARIO=spike npm run test:spike

# Re-open the latest HTML report
npm run report:open
```

| Variable | Default | Description |
|----------|---------|-------------|
| `K6_DASHBOARD` | — | Set to `true` to enable web dashboard + HTML export |
| `K6_DASHBOARD_OPEN` | `true` | Open HTML report in browser after test (disabled in CI) |
| `K6_WEB_DASHBOARD_EXPORT` | `results/report-<scenario>.html` | Output HTML path |
| `K6_WEB_DASHBOARD_PORT` | `5665` | Live dashboard port |

During the run, open **http://localhost:5665** for real-time graphs. When the test ends, the HTML file opens automatically (or run `npm run report:open`).

### Real-time Grafana + InfluxDB (local)

Stream live metrics (VUs, req/s, latency) to **Grafana** via **InfluxDB v2** — same pattern as [this k6 + Grafana guide](https://medium.com/@indraaristya/real-time-report-of-k6-performance-test-feb1ed6ef374), using the official [xk6-output-influxdb](https://github.com/grafana/xk6-output-influxdb) extension.

**Requires Docker.** Not used in CI smoke gate or GitHub Pages (local/manual load only).

```bash
# 1. Start TestFlow + InfluxDB + Grafana (builds k6-influx image on first run)
npm run grafana:up

# 2. Run smoke with live metrics → open Grafana (default http://localhost:3000)
npm run test:smoke:grafana

# Load test with real-time dashboard
npm run test:load:mixed:grafana

# Stop stack
npm run grafana:down
```

| Service | URL | Notes |
|---------|-----|-------|
| Grafana | http://localhost:3000 | Dashboard: [K6 Test Results](http://localhost:3000/d/4sk8QaJVx/k6-test-results) — set `GRAFANA_PORT` if 3000 is busy |
| InfluxDB | http://localhost:8086 | org `testflow`, bucket `k6` |
| TestFlow | http://localhost:5050 | Same sandbox as other suites |

Set `K6_INFLUXDB=true` on any `npm run test:*` script, or use the `:grafana` shortcuts above.

| Variable | Default | Description |
|----------|---------|-------------|
| `K6_INFLUXDB` | — | Set to `true` to stream metrics to InfluxDB |
| `K6_INFLUXDB_ORGANIZATION` | `testflow` | InfluxDB org |
| `K6_INFLUXDB_BUCKET` | `k6` | InfluxDB bucket |
| `K6_INFLUXDB_TOKEN` | `testflow-k6-dev-token` | Admin token (local dev only) |
| `K6_INFLUXDB_ADDR` | `http://localhost:8086` | InfluxDB HTTP API |
| `GRAFANA_PORT` | `3000` | Host port for Grafana UI |

If TestFlow is already running on port 5050 (e.g. `testflow-dev`), `grafana:up` skips starting a duplicate container.

### Docker k6 runs

```bash
npm run docker:smoke
K6_PROFILE=load npm run docker:load
K6_PROFILE=stress npm run docker:stress
```

### Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BASE_URL` | `http://localhost:5050` | TestFlow base URL |
| `DEMO_EMAIL` | `demo@automation.io` | Login email (TestFlow sandbox) |
| `DEMO_PASSWORD` | `Demo123!` | Login password |
| `K6_PROFILE` | `smoke` | Profile: smoke, load, stress, spike, soak, breakpoint |
| `K6_SOAK_MINUTES` | `30` | Soak steady-state duration |
| `CI` | — | When `true`, smoke uses lighter CI profile |

Copy `.env.example` to `.env` for local overrides.

## How to Test

Performance tests **are** the test suite. Success criteria:

- k6 exits with code `0` (all thresholds passed)
- `checks` rate ≥ 99% (smoke/load) or ≥ 95% (stress)
- `http_req_failed` rate below SLO per profile

```bash
npm run test:ci          # single smoke (CI parity)
npm run test:report      # 7-scenario suite + HTML report
npm run report:open      # open HTML in browser
```

JSON summary: `results/summary-latest.json` · HTML: [results/report/index.html](results/report/index.html) · [published report](https://lflucasferreira.github.io/testflow-k6/report/)

## SLO Thresholds

Aligned with functional test budgets in sibling projects:

| Endpoint | Smoke p95 | Load p95 |
|----------|-----------|----------|
| `GET /health` | < 500 ms | < 800 ms |
| `GET /api/users` | < 1500 ms | < 2000 ms |
| `POST /api/auth/login` | < 2000 ms | < 3000 ms |

Tune in `config/thresholds.js` and `config/profiles.js`.

## CI/CD

Workflows:

| Job | Trigger | What it runs |
|-----|---------|--------------|
| `test` | push / PR | Single smoke scenario — fast CI gate (~1 min) |
| `load-manual` | workflow_dispatch | User-selected profile (load / stress / spike) |
| `publish-pages` | push to `main` | Full 7-scenario report → **GitHub Pages HTML** |

Set repository secret `DEMO_PASSWORD` for CI (same as Cypress/Playwright).

### GitHub Pages

The site is a **hub + CI-generated report**, not static files on `main` alone:

| URL | Content |
|-----|---------|
| `/` | [Landing page](https://lflucasferreira.github.io/testflow-k6/) — `docs/index.html` |
| `/report/` | [Performance dashboard](https://lflucasferreira.github.io/testflow-k6/report/) — generated after k6 runs in CI |
| `/grafana/` | [Grafana entry point](https://lflucasferreira.github.io/testflow-k6/grafana/) — redirects to CI report or embeds Grafana Cloud |
| `/slides/` | [Reveal.js training deck](https://lflucasferreira.github.io/testflow-k6/slides/) |

### Grafana on GitHub Pages

**GitHub Pages is static** — InfluxDB and Grafana **do not run in CI** or on Pages. The `publish-pages` job in `k6.yml` does **not** start Docker Grafana; it generates the HTML performance report and publishes static files.

What you get on Pages today:

| Entry | URL | What it shows |
|-------|-----|---------------|
| Landing card **Grafana Dashboard** | `/grafana/` | Redirects to `/report/` (CI charts for 7 scenarios) |
| **Performance Report** | `/report/` | PASS/FAIL, ramp-up, latency, checks — updated every push |

**Optional — embed real Grafana (Grafana Cloud):** full guide → **[docs/grafana-cloud-setup.md](docs/grafana-cloud-setup.md)**

1. Create a [Grafana Cloud](https://grafana.com/products/cloud/) stack (free tier).
2. Stream k6 metrics to **InfluxDB Cloud** (same `xk6-output-influxdb` output; use cloud URL + token).
3. Import `monitoring/grafana/dashboards/xk6-output-influxdb-dashboard.json` and map the **InfluxDB** datasource on import.
4. **Optional — InfluxDB native dashboard:** full guide → **[docs/influxdb-cloud-dashboard.md](docs/influxdb-cloud-dashboard.md)** (`npm run influx:template:apply`).
5. In the repo → **Settings → Secrets and variables → Actions → Variables**, add:
   - `GRAFANA_DASHBOARD_URL` — public dashboard URL (e.g. `https://yourstack.grafana.net/d/4sk8QaJVx/k6-test-results`)
   - `GRAFANA_EMBED` — `true` (iframe on `/grafana/`) or `false` (redirect only)
6. Push to `main` — `/grafana/` will embed or link to your Grafana Cloud dashboard.

Without `GRAFANA_DASHBOARD_URL`, `/grafana/` explains the limitation and redirects to the CI HTML report.

**Local live stack** (Docker InfluxDB + Grafana): see [Real-time Grafana + InfluxDB (local)](#real-time-grafana--influxdb-local) — not available on Pages.

1. Open the repo on GitHub → **Settings** → **Pages**
2. Under **Build and deployment**, set **Source** to **GitHub Actions** (not “Deploy from branch”)
3. Add secret **`DEMO_PASSWORD`** under **Settings → Secrets and variables → Actions** (value: `Demo123!` or your TestFlow password)
4. Push to `main` — workflow **k6 Performance** runs `publish-pages` automatically
5. First run may ask to create the **`github-pages`** environment — approve it when prompted

**Verify:**

- **Actions** tab → **k6 Performance** → green check on job `publish-pages`
- Open https://lflucasferreira.github.io/testflow-k6/ — hub with cards
- Click **Grafana Dashboard** → `/grafana/` → CI report (or Grafana Cloud if configured)
- Click **Performance Report** → `/report/` with PASS/FAIL per scenario

**Local preview (hub only):**

```bash
npx serve docs -p 3338
# http://localhost:3338/
```

**Local preview (hub + report):**

```bash
npm run test:report
mkdir -p docs/report && cp -R results/report/* docs/report/
npx serve docs -p 3338
```

## Technologies Used

- [Grafana k6](https://k6.io/) — load testing
- [k6 browser module](https://grafana.com/docs/k6/latest/using-k6-browser/) — optional UI perf
- Docker — TestFlow sandbox + k6 runner
- GitHub Actions — CI smoke gate + manual load runs
- [Reveal.js](https://revealjs.com/) — training slides (`docs/slides/`)

## Slides & training

```bash
npm install
npm run slides        # http://localhost:3337/docs/slides/
npm run slides:open   # serve + open browser
```

Deck covers: k6 basics, installation, test types, thresholds, testflow-k6 structure, reports, CI, and advanced topics.

## Contribution Guidelines

1. Add endpoints to `lib/endpoints.js` — single source of truth.
2. Reuse helpers in `lib/http.js` and `lib/auth.js` — avoid duplicated checks.
3. Define SLOs in `config/thresholds.js` before adding scenarios.
4. Keep smoke CI-friendly (≤ 1 min, ≤ 5 VUs).
5. Tag scenarios with `test_type` for filtering in k6 Cloud / Grafana.

## License

Same as TestFlow / parent automation projects.
