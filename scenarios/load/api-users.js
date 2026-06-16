/**
 * Load — read-heavy users list with optional auth token reuse per VU.
 * Run: npm run test:load:users
 */
import { sleep } from 'k6';
import { Trend } from 'k6/metrics';
import { TAGS } from '../../config/environments.js';
import { getProfile } from '../../config/profiles.js';
import { getThresholds } from '../../config/thresholds.js';
import { setupAuth } from '../../lib/auth.js';
import { getUsers } from '../../lib/http.js';
import { handleSummary } from '../../lib/summary.js';

export { handleSummary };

const usersListDuration = new Trend('users_list_duration', true);

const profile = getProfile(__ENV.K6_PROFILE || 'load');

export const options = {
  scenarios: {
    users_load: {
      executor: 'ramping-vus',
      ...profile,
      tags: { test_type: TAGS.load, suite: 'api-users' },
    },
  },
  thresholds: {
    ...getThresholds('load'),
    users_list_duration: ['p(95)<2000'],
  },
};

export function setup() {
  return setupAuth();
}

export default function usersLoad(data) {
  const res = getUsers(data.token);
  usersListDuration.add(res.timings.duration);
  sleep(0.5 + Math.random());
}
