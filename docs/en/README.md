# TestFlow k6 — Training Documentation

Instructional material that explains **block by block** each scenario script in the project. Ideal for students learning Grafana k6, load testing, and SLO-driven performance automation.

Each document links to the corresponding script with a relative path.

**Language:** English · [Português](../pt/README.md)

---

## How to use this material

1. Read the doc for the scenario you will run or maintain.
2. Open the [script file](..) linked at the top of the document.
3. Follow the explanation section by section while reading the code.
4. Run the scenario locally:

```bash
npm run test:smoke                    # smoke gate
npm run test:load:auth              # load — auth throughput
npm run test:report                 # 7-scenario suite + HTML report
K6_PROFILE=load npm run test:spike  # spike with full profile
```

---

## Index by scenario

### Smoke

| Scenario | Documentation | Script |
|----------|---------------|--------|
| API health gate | [api-health.md](scenarios/smoke/api-health.md) | [`scenarios/smoke/api-health.js`](../../scenarios/smoke/api-health.js) |

### Load

| Scenario | Documentation | Script |
|----------|---------------|--------|
| Auth throughput | [api-auth.md](scenarios/load/api-auth.md) | [`scenarios/load/api-auth.js`](../../scenarios/load/api-auth.js) |
| Users list (read-heavy) | [api-users.md](scenarios/load/api-users.md) | [`scenarios/load/api-users.js`](../../scenarios/load/api-users.js) |
| Mixed traffic | [mixed-traffic.md](scenarios/load/mixed-traffic.md) | [`scenarios/load/mixed-traffic.js`](../../scenarios/load/mixed-traffic.js) |

### Stress, Spike & Soak

| Scenario | Documentation | Script |
|----------|---------------|--------|
| Spike burst | [api-spike.md](scenarios/spike/api-spike.md) | [`scenarios/spike/api-spike.js`](../../scenarios/spike/api-spike.js) |
| Stress / breakpoint | [api-breakpoint.md](scenarios/stress/api-breakpoint.md) | [`scenarios/stress/api-breakpoint.js`](../../scenarios/stress/api-breakpoint.js) |
| Soak endurance | [api-endurance.md](scenarios/soak/api-endurance.md) | [`scenarios/soak/api-endurance.js`](../../scenarios/soak/api-endurance.js) |

### User journeys

| Scenario | Documentation | Script |
|----------|---------------|--------|
| Login flow | [login-flow.md](journeys/login-flow.md) | [`journeys/login-flow.js`](../../journeys/login-flow.js) |
| Authenticated user | [authenticated-user.md](journeys/authenticated-user.md) | [`journeys/authenticated-user.js`](../../journeys/authenticated-user.js) |

### Browser

| Scenario | Documentation | Script |
|----------|---------------|--------|
| Login page (Chromium) | [login-page.md](browser/login-page.md) | [`scenarios/browser/login-page.js`](../../scenarios/browser/login-page.js) |

---

## Cross-cutting concepts

The docs cover, among other topics:

- **k6 options:** `scenarios`, `ramping-vus` executor, `stages`, `thresholds`, `tags`
- **Shared helpers:** `getHealth()`, `getUsers()`, `login()` in [`lib/`](../../lib/)
- **Profiles:** `getProfile()` and `K6_PROFILE` env var — [`config/profiles.js`](../../config/profiles.js)
- **SLO thresholds:** `getThresholds()` — [`config/thresholds.js`](../../config/thresholds.js) · see [`threshold-strategy.md`](../threshold-strategy.md)
- **Setup phase:** `export function setup()` for token reuse — [`lib/auth.js`](../../lib/auth.js)
- **User journeys:** `group()` for step timing in reports
- **Custom metrics:** `Trend`, `Rate`, `Counter` from `k6/metrics`
- **Reporting:** `handleSummary` export — [`lib/summary.js`](../../lib/summary.js)
- **CI:** smoke gate + GitHub Pages report — [`.github/workflows/k6.yml`](../../.github/workflows/k6.yml)

---

## Other materials in `docs/`

| Resource | Description |
|----------|-------------|
| [`slides/`](../slides/) | Introductory k6 presentation (Reveal.js) |
| [`guia-completo.html`](../guia-completo.html) | Step-by-step guide in Portuguese (single page) |
| [`complete-guide.html`](../complete-guide.html) | Step-by-step guide in English (single page) |
| [`threshold-strategy.md`](../threshold-strategy.md) | Checks, thresholds, per-endpoint tags |
| [`k6-technical-interview-questions.md`](../k6-technical-interview-questions.md) | Technical interview question bank (Portuguese) |
| [`grafana-cloud-setup.md`](../grafana-cloud-setup.md) | Grafana Cloud + InfluxDB streaming |
| [`influxdb-cloud-dashboard.md`](../influxdb-cloud-dashboard.md) | Native InfluxDB Boards via YAML template |

---

## Folder structure

```
docs/
├── README.md                          ← language selector
├── guia-completo.html                 ← complete guide (PT)
├── complete-guide.html                ← complete guide (EN)
├── threshold-strategy.md
├── k6-technical-interview-questions.md
├── en/
│   ├── README.md                      ← this index (English)
│   ├── scenarios/                     ← walkthroughs per script
│   ├── journeys/
│   └── browser/
├── pt/
│   ├── README.md                      ← índice (Português)
│   └── …
└── slides/                            ← Reveal.js presentation
```

Each `.md` in `docs/en/` mirrors the homonymous script under `scenarios/` or `journeys/`.
