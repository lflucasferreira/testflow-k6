# Spike — API Burst

**Source file:** [`api-spike.js`](../../../../scenarios/spike/api-spike.js)

---

## Objective

Validates **recovery under sudden traffic burst**: ramps from 5 to 100 VUs in 10 seconds, holds peak load, then ramps down. Detects failures during and after the spike.

---

## Profile stages (spike)

| Stage | Duration | Target VUs |
|-------|----------|------------|
| Warm-up | 30s | 5 |
| **Spike** | 10s | **100** |
| Hold | 1m | 100 |
| Recovery | 10s | 5 |
| Ramp-down | 30s | 0 |

---

## Block by block

### Block 1 — Custom failure metric

```javascript
const spikeFailures = new Rate('spike_failures');

export default function apiSpike() {
  const health = getHealth();
  const token = login();
  const users = getUsers(token);

  const failed = health.status !== 200 || users.status !== 200;
  spikeFailures.add(failed);

  sleep(0.1);  // minimal think time — maximize pressure
}
```

Threshold: `spike_failures: ['rate<0.10']` — allows up to 10% failure rate during burst (stress profile thresholds also apply).

### Block 2 — Thresholds

Uses `getThresholds('spike')` → stress-level SLOs: `http_req_failed < 5%`, `checks > 95%`.

---

## Run

```bash
npm run test:spike
K6_PROFILE=smoke npm run test:spike   # lighter — used in test:report
```
