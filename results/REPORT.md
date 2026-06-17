# testflow-k6 Performance Report

**Run ID:** `2026-06-16T23-16-29Z`  
**Target:** `http://localhost:5050`  
**Profile:** `smoke`  
**Generated:** 2026-06-17T01:04:24.646Z

## Summary

All **7** scenarios **passed** thresholds and checks.

| Status | Scenario | Iterations | HTTP reqs | Max VUs | http failed | p95 latency | avg latency | checks |
|--------|----------|------------|-----------|---------|-------------|-------------|-------------|--------|
| PASS | authenticated-user | 32 | 128 | 2 | 0.00% | 18.04 ms | 7.04 ms | 100.00% |
| PASS | load-auth | 58 | 58 | 2 | 0.00% | 6.48 ms | 3.70 ms | 100.00% |
| PASS | load-users | 59 | 60 | 2 | 0.00% | 8.35 ms | 4.14 ms | 100.00% |
| PASS | login-flow | 45 | 135 | 2 | 0.00% | 8.02 ms | 4.13 ms | 100.00% |
| PASS | mixed-traffic | 46 | 92 | 2 | 0.00% | 8.34 ms | 3.93 ms | 100.00% |
| PASS | smoke | 30 | 90 | 2 | 0.00% | 8.08 ms | 3.82 ms | 100.00% |
| PASS | spike | 439 | 1317 | 2 | 0.00% | 24.77 ms | 8.50 ms | 100.00% |

## SLO reference (smoke profile)

| Endpoint | p95 target |
|----------|------------|
| `GET /health` | < 500 ms |
| `GET /api/users` | < 1500 ms |
| `POST /api/auth/login` | < 2000 ms |

## Raw JSON

- `results/runs/2026-06-16T23-16-29Z-authenticated-user.json`
- `results/runs/2026-06-16T23-16-29Z-load-auth.json`
- `results/runs/2026-06-16T23-16-29Z-load-users.json`
- `results/runs/2026-06-16T23-16-29Z-login-flow.json`
- `results/runs/2026-06-16T23-16-29Z-mixed-traffic.json`
- `results/runs/2026-06-16T23-16-29Z-smoke.json`
- `results/runs/2026-06-16T23-16-29Z-spike.json`
