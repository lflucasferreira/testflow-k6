/**
 * Service Level Objectives (SLOs) as k6 thresholds.
 * Aligned with functional test budgets in testflow-cypress/playwright.
 */

export const defaultThresholds = {
  http_req_failed: ['rate<0.01'],
  http_req_duration: ['p(95)<2000', 'p(99)<5000'],
  checks: ['rate>0.99'],
};

export const smokeThresholds = {
  http_req_failed: ['rate<0.005'],
  http_req_duration: ['p(95)<1500', 'avg<800'],
  'http_req_duration{endpoint:health}': ['p(95)<500'],
  'http_req_duration{endpoint:users}': ['p(95)<1500'],
  'http_req_duration{endpoint:auth_login}': ['p(95)<2000'],
  checks: ['rate>0.99'],
};

export const loadThresholds = {
  http_req_failed: ['rate<0.01'],
  http_req_duration: ['p(95)<2500', 'p(99)<6000'],
  'http_req_duration{endpoint:health}': ['p(95)<800'],
  'http_req_duration{endpoint:users}': ['p(95)<2000'],
  'http_req_duration{endpoint:auth_login}': ['p(95)<3000'],
  checks: ['rate>0.98'],
};

export const stressThresholds = {
  http_req_failed: ['rate<0.05'],
  http_req_duration: ['p(95)<5000'],
  checks: ['rate>0.95'],
};

export const soakThresholds = {
  http_req_failed: ['rate<0.005'],
  http_req_duration: ['p(95)<2500', 'avg<1200'],
  checks: ['rate>0.99'],
};

/**
 * @param {string} [profileName]
 * @returns {Record<string, string[]>}
 */
export function getThresholds(profileName) {
  const profile = profileName || __ENV.K6_PROFILE || 'smoke';

  switch (profile) {
    case 'load':
      return loadThresholds;
    case 'stress':
    case 'breakpoint':
    case 'spike':
      return stressThresholds;
    case 'soak':
      return soakThresholds;
    case 'smoke':
    case 'ci':
    default:
      return smokeThresholds;
  }
}
