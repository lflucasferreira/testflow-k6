# testflow-k6

k6 performance and load testing suite for [TestFlow](https://github.com/qaschoolbr/testflow) — complements functional automation in `testflow-cypress`, `testflow-playwright`, and `testflow-pytest`.

## Description

This project validates **Service Level Objectives (SLOs)** for TestFlow under different load patterns:

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
├── results/          # JSON summaries (gitignored)
├── docker-compose.yml
└── .github/workflows/k6.yml
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
sudo gpg -k
sudo gpg --no-default-keyring \
  --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
  --keyserver hkp://keyserver.ubuntu.com:80 \
  --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" \
  | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
k6 version
```

### Windows (winget)

```powershell
winget install k6 --source winget
k6 version
```

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

JSON summaries export to `results/summary-latest.json`.

```bash
npm run test:ci

# Full suite report (smoke profile, generates results/REPORT.md)
npm run test:report
```

## SLO Thresholds

Aligned with functional test budgets in sibling projects:

| Endpoint | Smoke p95 | Load p95 |
|----------|-----------|----------|
| `GET /health` | < 500 ms | < 800 ms |
| `GET /api/users` | < 1500 ms | < 2000 ms |
| `POST /api/auth/login` | < 2000 ms | < 3000 ms |

Tune in `config/thresholds.js` and `config/profiles.js`.

## CI/CD

Workflow: `.github/workflows/k6.yml`

| Job | Trigger | What it runs |
|-----|---------|--------------|
| `smoke` | push / PR | Light load against `qaschool/testflow:latest` |
| `load-manual` | workflow_dispatch | User-selected profile (load/stress/spike) |

Set repository secret `DEMO_PASSWORD` for CI (same as Cypress/Playwright).

## Technologies Used

- [Grafana k6](https://k6.io/) — load testing
- [k6 browser module](https://grafana.com/docs/k6/latest/using-k6-browser/) — optional UI perf
- Docker — TestFlow sandbox + k6 runner
- GitHub Actions — CI smoke gate + manual load runs

## Contribution Guidelines

1. Add endpoints to `lib/endpoints.js` — single source of truth.
2. Reuse helpers in `lib/http.js` and `lib/auth.js` — avoid duplicated checks.
3. Define SLOs in `config/thresholds.js` before adding scenarios.
4. Keep smoke CI-friendly (≤ 1 min, ≤ 5 VUs).
5. Tag scenarios with `test_type` for filtering in k6 Cloud / Grafana.

## License

Same as TestFlow / parent automation projects.
