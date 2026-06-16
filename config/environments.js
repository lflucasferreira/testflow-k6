/**
 * Environment and runtime configuration for k6 scripts.
 * Mirrors BASE_URL / credentials from testflow-cypress and testflow-playwright.
 */

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:5050';

export const DEMO_EMAIL = __ENV.DEMO_EMAIL || 'demo@automation.io';
export const DEMO_PASSWORD = __ENV.DEMO_PASSWORD || 'Demo123!';

export const SERVICE_CLIENT_ID = __ENV.SERVICE_CLIENT_ID || 'testflow-client';
export const SERVICE_CLIENT_SECRET = __ENV.SERVICE_CLIENT_SECRET || 'testflow-secret';

export const PROFILE = __ENV.K6_PROFILE || 'smoke';

export const TAGS = {
  smoke: 'smoke',
  load: 'load',
  stress: 'stress',
  spike: 'spike',
  soak: 'soak',
  breakpoint: 'breakpoint',
  api: 'api',
  browser: 'browser',
  journey: 'journey',
};
