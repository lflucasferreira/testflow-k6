# Soak — API Endurance

**Source file:** [`api-endurance.js`](../../../../scenarios/soak/api-endurance.js)

---

## Objective

**Long-running steady load** to detect memory leaks, connection pool exhaustion, and latency drift over time. Default: 15 VUs for 30 minutes steady state.

---

## Dynamic profile

```javascript
function buildSoakProfile() {
  const minutes = Number(__ENV.K6_SOAK_MINUTES || 30);
  return {
    stages: [
      { duration: '2m', target: 15 },
      { duration: `${minutes}m`, target: 15 },
      { duration: '2m', target: 0 },
    ],
    gracefulRampDown: '1m',
  };
}
```

Reduce duration locally: `K6_SOAK_MINUTES=5 npm run test:soak`

---

## Block by block

### Soak latency trend

```javascript
const soakLatency = new Trend('soak_latency', true);

export default function apiEndurance() {
  const health = getHealth();
  soakLatency.add(health.timings.duration);

  const token = login();
  const users = getUsers(token);
  soakLatency.add(users.timings.duration);

  sleep(thinkTime(1, 4));
}
```

Compare `soak_latency` p95 at start vs end of steady state — upward drift suggests leaks or resource exhaustion.

Thresholds: `getThresholds('soak')` — strict error rate (&lt; 0.5%), checks &gt; 99%.

---

## Run

```bash
npm run test:soak
K6_SOAK_MINUTES=10 npm run test:soak
```
