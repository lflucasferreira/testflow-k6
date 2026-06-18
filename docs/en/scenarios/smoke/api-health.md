# Smoke — API Health Gate

**Source file:** [`api-health.js`](../../../../scenarios/smoke/api-health.js)

---

## Objective

This **smoke** scenario validates that TestFlow is available under minimal load. Each virtual user (VU) iteration exercises three critical endpoints:

1. **Health check** — `GET /health` responds quickly with 200.
2. **Users list** — `GET /api/users` returns a non-empty `users[]` array.
3. **Authentication** — `POST /api/auth/login` returns a bearer token.

Designed to be **fast** (~35 s with smoke profile, 2 VUs) — used as the CI gate and first scenario in `npm run test:report`.

---

## Prerequisites

| Item | Detail |
|------|--------|
| **TestFlow** | Running at `http://localhost:5050` (or `BASE_URL` in `.env`) |
| **k6** | v1.0+ locally, or Docker fallback via `scripts/run-k6.sh` |
| **Credentials** | `DEMO_EMAIL` and `DEMO_PASSWORD` (defaults in `.env.example`) |
| **Run** | `npm run test:smoke` |

---

## Tags and profile

| Tag | Where | Meaning |
|-----|-------|---------|
| `test_type: smoke` | `options.scenarios.smoke_api.tags` | Smoke / availability gate |
| `suite: api-health` | Same | Report grouping |
| `endpoint: health/users/auth_login` | HTTP helpers | Per-endpoint threshold filtering |

Profile: **smoke** (2 VUs, ~35 s). When `CI=true`, `getProfile('smoke')` returns the lighter **ci** profile automatically.

---

## k6 concepts

| Concept | Usage in this file |
|---------|-------------------|
| [`getProfile()`](../../../../config/profiles.js) | Loads smoke/ci stage configuration |
| [`getThresholds('smoke')`](../../../../config/thresholds.js) | SLO gates — p95 latency, error rate, checks |
| [`getHealth()`](../../../../lib/http.js) | Shared helper with built-in checks |
| [`getUsers()`](../../../../lib/http.js) | Anonymous users list |
| [`login()`](../../../../lib/auth.js) | POST login + token validation |
| [`handleSummary`](../../../../lib/summary.js) | JSON/HTML report export |
| `sleep()` | Think time between requests |

---

## Block by block

### Block 1 — Imports and exports

```javascript
import { sleep } from 'k6';
import { getProfile } from '../../config/profiles.js';
import { getThresholds } from '../../config/thresholds.js';
// ...
export { handleSummary };
```

- **Given:** the script imports config, helpers, and summary handler.
- **When:** `handleSummary` is re-exported so k6 calls it after the run.
- **Then:** JSON summaries land in `results/` for the HTML report generator.

---

### Block 2 — Options and thresholds

```javascript
const profile = getProfile('smoke');

export const options = {
  scenarios: {
    smoke_api: {
      executor: 'ramping-vus',
      ...profile,
      tags: { test_type: TAGS.smoke, suite: 'api-health' },
    },
  },
  thresholds: getThresholds('smoke'),
};
```

- **Given:** smoke profile defines ramp-up/down stages.
- **When:** thresholds are applied globally for the scenario.
- **Then:** the run **fails** if p95 latency, error rate, or check rate breach SLOs.

Smoke thresholds include per-endpoint p95: health &lt; 500 ms, users &lt; 1500 ms, login &lt; 2000 ms.

---

### Block 3 — Default function (VU iteration)

```javascript
export default function smokeApiHealth() {
  getHealth();
  sleep(0.5);

  getUsers();
  sleep(0.5);

  login();
  sleep(1);
}
```

- **Given:** each VU runs this function in a loop until stages complete.
- **When:** helpers execute HTTP calls with embedded `check()` assertions.
- **Then:** functional correctness is validated on every request; aggregate metrics feed thresholds.

**Flow per iteration:** health → pause → users → pause → login → pause.

---

## Expected outcome

| Metric | Smoke SLO |
|--------|-----------|
| `http_req_failed` | &lt; 0.5% |
| `checks` | &gt; 99% |
| `http_req_duration` p95 | &lt; 1500 ms |

Exit code `0` = all thresholds passed. Non-zero = investigate failing checks or latency in the HTML report.

---

## Related docs

- [Threshold strategy](../../../threshold-strategy.md)
- [Load — auth throughput](../load/api-auth.md)
- [Complete guide](../../../complete-guide.html)
