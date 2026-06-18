# Journey — Authenticated User

**Source file:** [`authenticated-user.js`](../../../../journeys/authenticated-user.js)

---

## Objective

Simulates an **authenticated session**: login → fetch users → browse dashboard and team pages. Four `group()` steps mirror a typical user path after sign-in.

---

## Flow

| Group | Step |
|-------|------|
| `01_login` | `login()` → bearer token |
| `02_fetch_users` | `GET /api/users` (authenticated) |
| `03_browse_dashboard` | `GET /web/dashboard.html` |
| `04_browse_team` | `GET /web/team.html` |

---

## Block by block

```javascript
export default function authenticatedUserJourney() {
  const start = Date.now();
  let token = null;

  group('01_login', () => {
    token = login();
    sleep(0.3);
  });

  group('02_fetch_users', () => {
    getUsers(token);
    sleep(0.5);
  });

  group('03_browse_dashboard', () => {
    getStaticPage(endpoints.web.dashboard);
    sleep(0.5);
  });

  group('04_browse_team', () => {
    getStaticPage(endpoints.web.team);
    sleep(0.5);
  });

  journeyDuration.add(Date.now() - start);
}
```

Custom metric `journey_duration` tracks total wall-clock time per iteration. Uses load thresholds via `getThresholds('load')`.

---

## Run

```bash
npm run test:journey:auth
```

Complements Playwright/Cypress authenticated page tests with performance validation under load.
