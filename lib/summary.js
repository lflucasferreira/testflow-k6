/**
 * Standard handleSummary hook — console text + JSON export for CI artifacts.
 * @param {Record<string, unknown>} data
 * @returns {Record<string, string>}
 */
export function buildSummary(data) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const profile = __ENV.K6_PROFILE || 'smoke';
  const scenario = __ENV.K6_SCENARIO || 'unknown';

  const metrics = data.metrics || {};
  const lines = [
    `k6 summary — ${scenario} (${profile})`,
    `duration: ${data.state?.testRunDurationMs ?? 'n/a'} ms`,
    `http_req_failed: ${metrics.http_req_failed?.values?.rate ?? 'n/a'}`,
    `http_req_duration p95: ${metrics.http_req_duration?.values?.['p(95)'] ?? 'n/a'} ms`,
    `checks pass rate: ${metrics.checks?.values?.rate ?? 'n/a'}`,
  ];

  return {
    stdout: `${lines.join('\n')}\n`,
    [`results/summary-${scenario}-${profile}-${timestamp}.json`]: JSON.stringify(data, null, 2),
    'results/summary-latest.json': JSON.stringify(data, null, 2),
  };
}

export function handleSummary(data) {
  return buildSummary(data);
}
