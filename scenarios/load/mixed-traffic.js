/**
 * Load — realistic mixed traffic (health, users, auth, static pages).
 * Run: npm run test:load:mixed
 */
import { sleep } from 'k6';
import { Trend } from 'k6/metrics';
import { TAGS } from '../../config/environments.js';
import { getProfile } from '../../config/profiles.js';
import { getThresholds } from '../../config/thresholds.js';
import { login } from '../../lib/auth.js';
import { staticPages } from '../../lib/endpoints.js';
import {
  getHealth,
  getUsers,
  getStaticPage,
  weightedPick,
  thinkTime,
} from '../../lib/http.js';
import { handleSummary } from '../../lib/summary.js';

export { handleSummary };

const mixedDuration = new Trend('mixed_request_duration', true);

const profile = getProfile(__ENV.K6_PROFILE || 'load');

export const options = {
  scenarios: {
    mixed_traffic: {
      executor: 'ramping-vus',
      ...profile,
      tags: { test_type: TAGS.load, suite: 'mixed-traffic' },
    },
  },
  thresholds: getThresholds('load'),
};

export default function mixedTraffic() {
  const token = login();

  weightedPick([
    {
      weight: 35,
      fn: () => {
        const res = getHealth();
        mixedDuration.add(res.timings.duration);
      },
    },
    {
      weight: 30,
      fn: () => {
        const res = getUsers(token);
        mixedDuration.add(res.timings.duration);
      },
    },
    {
      weight: 15,
      fn: () => {
        const page = staticPages[Math.floor(Math.random() * staticPages.length)];
        const res = getStaticPage(page);
        mixedDuration.add(res.timings.duration);
      },
    },
    {
      weight: 20,
      fn: () => {
        const res = getUsers(null);
        mixedDuration.add(res.timings.duration);
      },
    },
  ]);

  sleep(thinkTime(0.5, 2));
}
