/**
 * Browser — login page Core Web Vitals via k6 browser module.
 * Requires: k6 v0.52+ with browser support.
 * Run: npm run test:browser:login
 */
import { browser } from 'k6/browser';
import { sleep } from 'k6';
import { Trend } from 'k6/metrics';
import { BASE_URL, DEMO_EMAIL, DEMO_PASSWORD, TAGS } from '../../config/environments.js';
import { getThresholds } from '../../config/thresholds.js';
import { endpoints } from '../../lib/endpoints.js';
import { handleSummary } from '../../lib/summary.js';

export { handleSummary };

const lcp = new Trend('browser_lcp', true);
const pageLoad = new Trend('browser_page_load', true);

export const options = {
  scenarios: {
    browser_login: {
      executor: 'shared-iterations',
      vus: 2,
      iterations: 4,
      options: {
        browser: {
          type: 'chromium',
        },
      },
      tags: { test_type: TAGS.browser, suite: 'login-page' },
    },
  },
  thresholds: {
    ...getThresholds('smoke'),
    browser_page_load: ['p(95)<5000'],
  },
};

export default async function loginPageBrowser() {
  const page = await browser.newPage();

  try {
    const start = Date.now();
    await page.goto(`${BASE_URL}${endpoints.web.login}`, { waitUntil: 'networkidle' });
    pageLoad.add(Date.now() - start);

    await page.locator('[data-testid="login-email"]').fill(DEMO_EMAIL);
    await page.locator('[data-testid="login-password"]').fill(DEMO_PASSWORD);

    const apiToggle = page.locator('[data-testid="login-use-api"]');
    if (await apiToggle.isVisible()) {
      await apiToggle.click();
    }

    await page.locator('[data-testid="login-submit"]').click();
    await page.waitForTimeout(2000);

    sleep(1);
  } finally {
    await page.close();
  }
}
