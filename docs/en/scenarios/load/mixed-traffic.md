# Load — Mixed Traffic

**Source file:** [`mixed-traffic.js`](../../../../scenarios/load/mixed-traffic.js)

---

## Objective

Simulates **realistic production traffic** with weighted random endpoint selection after login. Combines health checks, authenticated and anonymous user reads, and static HTML pages.

---

## Traffic distribution

| Weight | Action |
|--------|--------|
| 35% | `GET /health` |
| 30% | `GET /api/users` (authenticated) |
| 15% | Random static page (`login`, `dashboard`, `team`, `settings`, `activity`) |
| 20% | `GET /api/users` (anonymous) |

---

## Block by block

### Block 1 — Login then weighted pick

```javascript
export default function mixedTraffic() {
  const token = login();

  weightedPick([
    { weight: 35, fn: () => { /* getHealth */ } },
    { weight: 30, fn: () => { /* getUsers(token) */ } },
    { weight: 15, fn: () => { /* getStaticPage */ } },
    { weight: 20, fn: () => { /* getUsers(null) */ } },
  ]);

  sleep(thinkTime(0.5, 2));
}
```

`weightedPick()` in `lib/http.js` implements weighted random selection. `thinkTime()` returns a random pause between 0.5–2 s.

### Block 2 — Custom metric

`mixed_request_duration` Trend records timing per picked request — useful in Grafana for mixed-traffic analysis.

---

## Prerequisites

| Item | Detail |
|------|--------|
| **Run** | `npm run test:load:mixed` |
| **Grafana** | `npm run test:load:mixed:grafana` for live metrics |

---

## Related

- [`weightedPick()`](../../../../lib/http.js)
- [Threshold strategy](../../../threshold-strategy.md)
