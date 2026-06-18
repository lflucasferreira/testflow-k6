# Load — Auth Throughput

**Source file:** [`api-auth.js`](../../../../scenarios/load/api-auth.js)

---

## Objective

Sustained **login throughput** test — isolates the auth endpoint bottleneck. Each VU repeatedly POSTs to `/api/auth/login` and records custom metrics for login duration and error rate.

---

## Prerequisites

| Item | Detail |
|------|--------|
| **Run** | `npm run test:load:auth` |
| **Profile** | `load` by default; `K6_PROFILE=smoke` for report suite |
| **Duration** | ~7 min (load profile: 10→25 VUs) |

---

## Custom metrics

| Metric | Type | Threshold |
|--------|------|-----------|
| `login_duration` | Trend | `p(95)<2000` |
| `login_errors` | Rate | `rate<0.01` |

---

## Block by block

### Block 1 — Custom metrics declaration

```javascript
const loginDuration = new Trend('login_duration', true);
const loginErrors = new Rate('login_errors');
```

Trend records timing samples; Rate tracks failure proportion per iteration.

### Block 2 — Thresholds merge

```javascript
thresholds: {
  ...getThresholds('load'),
  login_duration: ['p(95)<2000'],
  login_errors: ['rate<0.01'],
},
```

Shared load SLOs plus scenario-specific auth gates.

### Block 3 — VU function

```javascript
export default function authLoad() {
  const res = http.post(`${BASE_URL}${endpoints.auth.login}`, payload, {
    tags: { endpoint: 'auth_login', name: 'POST /api/auth/login' },
  });

  const ok = check(res, {
    'login 200': (r) => r.status === 200,
    'login token present': (r) => typeof r.json('token') === 'string',
  });

  loginDuration.add(res.timings.duration);
  loginErrors.add(!ok);
  sleep(1);
}
```

Unlike smoke, this scenario calls `http.post` directly (not `login()` helper) to measure raw timing and track errors separately.

---

## Why not reuse `login()`?

The shared `login()` helper in `lib/auth.js` already runs checks. This scenario duplicates the POST to attach custom metrics (`login_duration`, `login_errors`) without modifying the shared helper's contract.
