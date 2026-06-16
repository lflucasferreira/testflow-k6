/**
 * Spike — sudden burst of traffic to validate recovery.
 * Run: npm run test:spike
 */
import { sleep } from 'k6';
import { Rate } from 'k6/metrics';
import { TAGS } from '../../config/environments.js';
import { getProfile } from '../../config/profiles.js';
import { getThresholds } from '../../config/thresholds.js';
import { login } from '../../lib/auth.js';
import { getHealth, getUsers } from '../../lib/http.js';
import { handleSummary } from '../../lib/summary.js';

export { handleSummary };

const spikeFailures = new Rate('spike_failures');

const profile = getProfile(__ENV.K6_PROFILE || 'spike');

export const options = {
  scenarios: {
    spike: {
      executor: 'ramping-vus',
      ...profile,
      tags: { test_type: TAGS.spike, suite: 'api-spike' },
    },
  },
  thresholds: {
    ...getThresholds('spike'),
    spike_failures: ['rate<0.10'],
  },
};

export default function apiSpike() {
  const health = getHealth();
  const token = login();
  const users = getUsers(token);

  const failed = health.status !== 200 || users.status !== 200;
  spikeFailures.add(failed);

  sleep(0.1);
}
