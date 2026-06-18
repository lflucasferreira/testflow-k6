# Journey — Login Flow

**Source file:** [`login-flow.js`](../../../../journeys/login-flow.js)

---

## Objective

HTTP-only **user journey** simulating login without the browser module: load login page → API login → navigate to dashboard. Uses `group()` for per-step timing in k6 reports.

---

## Flow

| Group | Step |
|-------|------|
| `01_load_login_page` | `GET /web/login.html` |
| `02_api_login` | `POST /api/auth/login` |
| `03_post_login_navigation` | `GET /web/dashboard.html` |

---

## Block by block

### Block 1 — Journey duration metric

```javascript
const loginFlowDuration = new Trend('login_flow_duration', true);

export default function loginFlow() {
  const start = Date.now();
  // ... groups ...
  loginFlowDuration.add(Date.now() - start);
}
```

Threshold: `login_flow_duration: ['p(95)<4000']` — end-to-end journey under 4 s at p95.

### Block 2 — Groups

```javascript
group('01_load_login_page', () => {
  getStaticPage(endpoints.web.login);
  sleep(0.5);
});

group('02_api_login', () => {
  const res = http.post(/* ... */);
  check(res, { 'login succeeds': ..., 'token returned': ... });
});

group('03_post_login_navigation', () => {
  getStaticPage(endpoints.web.dashboard);
});
```

Groups appear as nested metrics in k6 output and Grafana — useful for pinpointing slow steps.

---

## Run

```bash
npm run test:journey:login
```

Included in `npm run test:report` (7-scenario CI suite).
