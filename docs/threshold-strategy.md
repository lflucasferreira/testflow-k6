# Threshold Strategy — testflow-k6

This project validates **Service Level Objectives (SLOs)** using k6 **checks** (functional assertions) and **thresholds** (performance gates). A run fails if either breaches limits.

## Checks vs thresholds

| Mechanism | Purpose | Example |
|-----------|---------|---------|
| **`check()`** | Functional correctness per request | `health status 200`, `login has token` |
| **`thresholds`** | Aggregate SLO over the whole run | `http_req_duration: p(95)<1500`, `checks: rate>0.99` |

Checks live in [`lib/http.js`](../../lib/http.js) and [`lib/auth.js`](../../lib/auth.js). Thresholds are centralized in [`config/thresholds.js`](../../config/thresholds.js) and applied per scenario via `getThresholds(profile)`.

## Per-endpoint tags

HTTP requests are tagged for filtered thresholds:

```js
http.get(url, {
  tags: { endpoint: 'health', name: 'GET /health' },
})
```

Thresholds can target tags:

```js
'http_req_duration{endpoint:health}': ['p(95)<500'],
'http_req_duration{endpoint:users}': ['p(95)<1500'],
'http_req_duration{endpoint:auth_login}': ['p(95)<2000'],
```

Always set `endpoint` tags when adding new HTTP calls — otherwise per-endpoint SLOs will not apply.

## Profile alignment

| Profile | When used | http_req_failed | checks | Typical scenario |
|---------|-----------|-----------------|--------|------------------|
| **smoke** | CI gate, `test:report` | &lt; 0.5% | &gt; 99% | `api-health.js` |
| **load** | Sustained traffic | &lt; 1% | &gt; 98% | `api-auth.js`, journeys |
| **stress / spike** | Capacity / burst | &lt; 5% | &gt; 95% | `api-spike.js`, `api-breakpoint.js` |
| **soak** | Endurance | &lt; 0.5% | &gt; 99% | `api-endurance.js` |

`getProfile()` in [`config/profiles.js`](../../config/profiles.js) selects VU stages. When `CI=true` and profile is `smoke`, a lighter **ci** profile is used automatically.

## Custom metrics

Scenarios may add scenario-specific thresholds on top of the shared profile:

| Metric | Scenario | Threshold |
|--------|----------|-----------|
| `login_duration` | `api-auth.js` | `p(95)<2000` |
| `login_errors` | `api-auth.js` | `rate<0.01` |
| `users_list_duration` | `api-users.js` | `p(95)<2000` |
| `login_flow_duration` | `login-flow.js` | `p(95)<4000` |
| `spike_failures` | `api-spike.js` | `rate<0.10` |
| `browser_page_load` | `login-page.js` | `p(95)<5000` |

Define custom metrics with `Trend`, `Rate`, or `Counter` from `k6/metrics`.

## Alignment with functional suites

SLO budgets mirror functional test timeouts in `testflow-cypress` and `testflow-playwright`:

| Endpoint | Smoke p95 | Load p95 |
|----------|-----------|----------|
| `GET /health` | &lt; 500 ms | &lt; 800 ms |
| `GET /api/users` | &lt; 1500 ms | &lt; 2000 ms |
| `POST /api/auth/login` | &lt; 2000 ms | &lt; 3000 ms |

Tune values in `config/thresholds.js` before loosening scenario-specific custom thresholds.

## Adding a new scenario

1. Add endpoints to [`lib/endpoints.js`](../../lib/endpoints.js).
2. Reuse helpers from `lib/http.js` / `lib/auth.js` — do not duplicate checks.
3. Pick a profile (`smoke`, `load`, `stress`, `spike`, `soak`) and call `getThresholds(profile)`.
4. Tag every `http.*` call with `endpoint` for per-route SLOs.
5. Register metadata in [`scripts/scenario-catalog.mjs`](../../scripts/scenario-catalog.mjs) for reports and docs.
6. Add a walkthrough under `docs/en/` and `docs/pt/`.

## Browser scenario

The browser module (`scenarios/browser/login-page.js`) uses `data-testid` selectors aligned with E2E suites:

```js
await page.locator('[data-testid="login-email"]').fill(DEMO_EMAIL)
```

Browser thresholds extend smoke profile with `browser_page_load` — native k6 with browser support is required.
