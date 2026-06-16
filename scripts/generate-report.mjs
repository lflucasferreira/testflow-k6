#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const runId = process.argv[2];
if (!runId) {
  console.error('Usage: node scripts/generate-report.mjs <run-id>');
  process.exit(1);
}

const runsDir = path.join(process.cwd(), 'results', 'runs');
const files = fs.readdirSync(runsDir).filter((f) => f.startsWith(runId) && f.endsWith('.json'));

function metricValue(metrics, name, field) {
  const metric = metrics?.[name];
  if (!metric) return null;

  if (field in metric && metric[field] != null) {
    return metric[field];
  }

  if (metric.values?.[field] != null) {
    return metric.values[field];
  }

  return null;
}

function formatMs(value) {
  if (value == null || Number.isNaN(Number(value))) return 'n/a';
  return `${Number(value).toFixed(2)} ms`;
}

function formatRate(value) {
  if (value == null || Number.isNaN(Number(value))) return 'n/a';
  return `${(Number(value) * 100).toFixed(2)}%`;
}

const rows = files.map((file) => {
  const raw = JSON.parse(fs.readFileSync(path.join(runsDir, file), 'utf8'));
  const metrics = raw.metrics ?? {};
  const suite = file.replace(`${runId}-`, '').replace('.json', '');

  const durationMs =
    raw.state?.testRunDurationMs ??
    metricValue(metrics, 'iteration_duration', 'max') ??
    null;

  return {
    suite,
    durationMs,
    httpFailed: metricValue(metrics, 'http_req_failed', 'value'),
    p95: metricValue(metrics, 'http_req_duration', 'p(95)'),
    avg: metricValue(metrics, 'http_req_duration', 'avg'),
    checks: metricValue(metrics, 'checks', 'value'),
    iterations: metricValue(metrics, 'iterations', 'count'),
    vusMax: metricValue(metrics, 'vus_max', 'max'),
    httpCount: metricValue(metrics, 'http_reqs', 'count'),
  };
});

rows.sort((a, b) => a.suite.localeCompare(b.suite));

const allPassed = rows.every(
  (r) => (r.httpFailed ?? 1) === 0 && (r.checks ?? 0) >= 0.99,
);

const md = [
  '# testflow-k6 Performance Report',
  '',
  `**Run ID:** \`${runId}\`  `,
  `**Target:** \`${process.env.BASE_URL ?? 'http://localhost:5050'}\`  `,
  `**Profile:** \`${process.env.K6_PROFILE ?? 'smoke'}\`  `,
  `**Generated:** ${new Date().toISOString()}`,
  '',
  '## Summary',
  '',
  allPassed
    ? 'All scenarios **passed** thresholds and checks.'
    : 'Some scenarios **did not meet** all thresholds — review details below.',
  '',
  '| Scenario | Iterations | HTTP reqs | Max VUs | http failed | p95 latency | avg latency | checks |',
  '|----------|------------|-----------|---------|-------------|-------------|-------------|--------|',
  ...rows.map(
    (r) =>
      `| ${r.suite} | ${r.iterations ?? 'n/a'} | ${r.httpCount ?? 'n/a'} | ${r.vusMax ?? 'n/a'} | ${formatRate(r.httpFailed)} | ${formatMs(r.p95)} | ${formatMs(r.avg)} | ${formatRate(r.checks)} |`,
  ),
  '',
  '## SLO reference (smoke profile)',
  '',
  '| Endpoint | p95 target |',
  '|----------|------------|',
  '| `GET /health` | < 500 ms |',
  '| `GET /api/users` | < 1500 ms |',
  '| `POST /api/auth/login` | < 2000 ms |',
  '',
  '## Raw JSON',
  '',
  ...rows.map((r) => `- \`results/runs/${runId}-${r.suite}.json\``),
  '',
];

const reportPath = path.join(process.cwd(), 'results', 'REPORT.md');
fs.writeFileSync(reportPath, md.join('\n'));

const latestSummary = {
  runId,
  generatedAt: new Date().toISOString(),
  baseUrl: process.env.BASE_URL ?? 'http://localhost:5050',
  profile: process.env.K6_PROFILE ?? 'smoke',
  passed: allPassed,
  scenarios: rows,
};

fs.writeFileSync(
  path.join(process.cwd(), 'results', 'summary-latest.json'),
  JSON.stringify(latestSummary, null, 2),
);

console.log(`Generated ${reportPath}`);
