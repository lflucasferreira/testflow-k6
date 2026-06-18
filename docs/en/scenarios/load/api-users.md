# Load — Users List (Read-Heavy)

**Source file:** [`api-users.js`](../../../../scenarios/load/api-users.js)

---

## Objective

Read-heavy scenario: authenticated `GET /api/users` with token obtained once in the **setup** phase. Measures list latency under sustained load without repeating login on every iteration.

---

## Prerequisites

| Item | Detail |
|------|--------|
| **Run** | `npm run test:load:users` |
| **Custom metric** | `users_list_duration` — `p(95)<2000` |

---

## k6 setup phase

```javascript
export function setup() {
  return setupAuth();  // { token: string|null }
}

export default function usersLoad(data) {
  const res = getUsers(data.token);
  usersListDuration.add(res.timings.duration);
  sleep(0.5 + Math.random());
}
```

- **setup()** runs once per test run (not per VU) — obtains a bearer token.
- Each VU receives `data` and calls `getUsers(data.token)` with Authorization header.
- Randomized think time (`0.5–1.5 s`) simulates realistic read patterns.

---

## Block by block

### Block 1 — Profile and thresholds

Uses `getProfile(__ENV.K6_PROFILE || 'load')` and merges `users_list_duration` threshold.

### Block 2 — Authenticated GET

`getUsers(token)` in `lib/http.js` adds `Authorization: Bearer <token>` and runs three checks: status 200, non-empty users array, response &lt; 2 s.

---

## When to use

Use this scenario to stress the **read path** of the API after authentication — complementary to `api-auth.js` which stresses only login.
