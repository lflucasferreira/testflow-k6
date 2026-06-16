/**
 * Load profiles — executor stages per test type.
 * Tune VU counts for local Docker; CI uses smoke only.
 */

export const profiles = {
  smoke: {
    stages: [
      { duration: '10s', target: 2 },
      { duration: '20s', target: 2 },
      { duration: '5s', target: 0 },
    ],
    gracefulRampDown: '5s',
  },

  load: {
    stages: [
      { duration: '1m', target: 10 },
      { duration: '3m', target: 25 },
      { duration: '2m', target: 25 },
      { duration: '1m', target: 0 },
    ],
    gracefulRampDown: '30s',
  },

  stress: {
    stages: [
      { duration: '2m', target: 20 },
      { duration: '3m', target: 50 },
      { duration: '3m', target: 80 },
      { duration: '2m', target: 100 },
      { duration: '2m', target: 0 },
    ],
    gracefulRampDown: '1m',
  },

  spike: {
    stages: [
      { duration: '30s', target: 5 },
      { duration: '10s', target: 100 },
      { duration: '1m', target: 100 },
      { duration: '10s', target: 5 },
      { duration: '30s', target: 0 },
    ],
    gracefulRampDown: '20s',
  },

  soak: {
    stages: [
      { duration: '2m', target: 15 },
      { duration: '30m', target: 15 },
      { duration: '2m', target: 0 },
    ],
    gracefulRampDown: '1m',
  },

  breakpoint: {
    stages: [
      { duration: '2m', target: 10 },
      { duration: '2m', target: 25 },
      { duration: '2m', target: 50 },
      { duration: '2m', target: 75 },
      { duration: '2m', target: 100 },
      { duration: '2m', target: 125 },
      { duration: '2m', target: 0 },
    ],
    gracefulRampDown: '1m',
  },

  ci: {
    stages: [
      { duration: '15s', target: 3 },
      { duration: '30s', target: 5 },
      { duration: '10s', target: 0 },
    ],
    gracefulRampDown: '5s',
  },
};

/**
 * @param {string} [name]
 * @returns {{ stages: Array<{duration: string, target: number}>, gracefulRampDown: string }}
 */
export function getProfile(name) {
  const key = name || __ENV.K6_PROFILE || 'smoke';
  if (__ENV.CI === 'true' && key === 'smoke') {
    return profiles.ci;
  }
  return profiles[key] || profiles.smoke;
}
