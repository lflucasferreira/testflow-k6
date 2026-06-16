/**
 * Soak — long-running steady load to detect memory leaks and drift.
 * Run: npm run test:soak  (default 30m steady state — reduce via K6_SOAK_MINUTES for local)
 */
import { sleep } from 'k6';
import { Trend } from 'k6/metrics';
import { TAGS } from '../../config/environments.js';
import { getThresholds } from '../../config/thresholds.js';
import { login } from '../../lib/auth.js';
import { getHealth, getUsers, thinkTime } from '../../lib/http.js';
import { handleSummary } from '../../lib/summary.js';

export { handleSummary };

const soakLatency = new Trend('soak_latency', true);

function buildSoakProfile() {
  const minutes = Number(__ENV.K6_SOAK_MINUTES || 30);
  const rampUp = '2m';
  const rampDown = '2m';
  const steady = `${minutes}m`;

  return {
    stages: [
      { duration: rampUp, target: 15 },
      { duration: steady, target: 15 },
      { duration: rampDown, target: 0 },
    ],
    gracefulRampDown: '1m',
  };
}

export const options = {
  scenarios: {
    soak: {
      executor: 'ramping-vus',
      ...buildSoakProfile(),
      tags: { test_type: TAGS.soak, suite: 'api-endurance' },
    },
  },
  thresholds: getThresholds('soak'),
};

export default function apiEndurance() {
  const health = getHealth();
  soakLatency.add(health.timings.duration);

  const token = login();
  const users = getUsers(token);
  soakLatency.add(users.timings.duration);

  sleep(thinkTime(1, 4));
}
