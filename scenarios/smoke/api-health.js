/**
 * Smoke — minimal load to validate SLOs and availability.
 * Run: npm run test:smoke
 */
import { sleep } from 'k6';
import { getProfile } from '../../config/profiles.js';
import { getThresholds } from '../../config/thresholds.js';
import { TAGS } from '../../config/environments.js';
import { login } from '../../lib/auth.js';
import { getHealth, getUsers } from '../../lib/http.js';
import { handleSummary } from '../../lib/summary.js';

export { handleSummary };

const profile = getProfile('smoke');

export const options = {
  scenarios: {
    smoke_api: {
      executor: 'ramping-vus',
      ...profile,
      tags: { test_type: TAGS.smoke, suite: 'api-health' },
    },
  },
  thresholds: getThresholds('smoke'),
};

export default function smokeApiHealth() {
  getHealth();
  sleep(0.5);

  getUsers();
  sleep(0.5);

  login();
  sleep(1);
}
