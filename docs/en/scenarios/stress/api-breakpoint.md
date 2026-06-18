# Stress — API Breakpoint

**Source file:** [`api-breakpoint.js`](../../../../scenarios/stress/api-breakpoint.js)

---

## Objective

Ramps VUs beyond normal load to find the **capacity ceiling** and degradation point. Counts `degraded_responses` when latency exceeds 3 s (health) or 5 s (users).

---

## Profiles

| `K6_PROFILE` | Behavior |
|--------------|----------|
| `stress` (default) | 20→100 VUs over ~12 min |
| `breakpoint` | Stepped ramp 10→125 VUs |

```javascript
const profileName = __ENV.K6_PROFILE === 'breakpoint' ? 'breakpoint' : 'stress';
const profile = getProfile(profileName);
```

---

## Block by block

### Degradation counter

```javascript
const degradedResponses = new Counter('degraded_responses');

export default function stressBreakpoint() {
  const health = getHealth();
  if (health.timings.duration > 3000 || health.status !== 200) {
    degradedResponses.add(1);
  }

  const token = login();
  const users = getUsers(token);
  if (users.timings.duration > 5000 || users.status !== 200) {
    degradedResponses.add(1);
  }

  sleep(0.2);
}
```

`degraded_responses` is informational (no hard threshold) — analyze in Grafana or raw JSON export to find the VU count where degradation starts.

---

## Run

```bash
npm run test:stress
K6_PROFILE=breakpoint npm run test:stress
```

Not included in CI report suite (`ciReport: false` in scenario catalog) — too long for smoke report pipeline.
