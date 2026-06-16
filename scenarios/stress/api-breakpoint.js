/**
 * Stress / Breakpoint — ramp until degradation to find capacity ceiling.
 * Run: npm run test:stress  (K6_PROFILE=breakpoint for extended ramp)
 */
import { sleep } from 'k6';
import { Counter } from 'k6/metrics';
import { TAGS } from '../../config/environments.js';
import { getProfile } from '../../config/profiles.js';
import { getThresholds } from '../../config/thresholds.js';
import { login } from '../../lib/auth.js';
import { getHealth, getUsers } from '../../lib/http.js';
import { handleSummary } from '../../lib/summary.js';

export { handleSummary };

const degradedResponses = new Counter('degraded_responses');

const profileName = __ENV.K6_PROFILE === 'breakpoint' ? 'breakpoint' : 'stress';
const profile = getProfile(profileName);

export const options = {
  scenarios: {
    stress_ramp: {
      executor: 'ramping-vus',
      ...profile,
      tags: { test_type: TAGS.stress, suite: 'api-breakpoint' },
    },
  },
  thresholds: getThresholds(profileName),
};

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
