#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { SCENARIO_CATALOG, THRESHOLD_PROFILES } from './scenario-catalog.mjs';

const runId = process.argv[2];
if (!runId) {
  console.error('Usage: node scripts/generate-report.mjs <run-id>');
  process.exit(1);
}

const cwd = process.cwd();
const runsDir = path.join(cwd, 'results', 'runs');
const outputDir = process.env.REPORT_OUTPUT_DIR || path.join(cwd, 'results', 'report');
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

function collectChecks(group, acc = []) {
  if (!group) return acc;

  if (group.checks) {
    for (const [name, data] of Object.entries(group.checks)) {
      acc.push({
        name,
        passes: data.passes ?? 0,
        fails: data.fails ?? 0,
        ok: (data.fails ?? 0) === 0,
      });
    }
  }

  if (group.groups) {
    for (const child of Object.values(group.groups)) {
      collectChecks(child, acc);
    }
  }

  return acc;
}

function thresholdPassed(result) {
  if (typeof result === 'boolean') {
    // k6 --summary-export: false = threshold satisfied, true = breached
    return !result;
  }
  if (result && typeof result.ok === 'boolean') {
    return result.ok;
  }
  return true;
}

function collectThresholds(metrics) {
  const rows = [];

  for (const [metricName, metric] of Object.entries(metrics || {})) {
    if (!metric?.thresholds) continue;

    for (const [expression, result] of Object.entries(metric.thresholds)) {
      rows.push({
        metric: metricName,
        expression,
        ok: thresholdPassed(result),
      });
    }
  }

  rows.sort((a, b) => a.metric.localeCompare(b.metric));
  return rows;
}

function readExitCode(suite) {
  const exitPath = path.join(runsDir, `${runId}-${suite}.exit`);
  if (!fs.existsSync(exitPath)) {
    return { code: 0, exists: false };
  }
  return {
    code: Number(fs.readFileSync(exitPath, 'utf8').trim()) || 0,
    exists: true,
  };
}

function scenarioPassed({ exitCode, exitFileExists, thresholds, httpFailed, checks }) {
  if (exitFileExists) {
    return exitCode === 0;
  }

  if (thresholds.some((t) => !t.ok)) return false;
  if ((httpFailed ?? 1) > 0.01) return false;
  if ((checks ?? 0) < 0.98) return false;
  return true;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const rows = files.map((file) => {
  const suite = file.replace(`${runId}-`, '').replace('.json', '');
  const { code: exitCode, exists: exitFileExists } = readExitCode(suite);
  const meta = SCENARIO_CATALOG[suite] ?? {};
  let raw = null;
  let metrics = {};
  let checks = [];
  let thresholds = [];

  if (fs.existsSync(path.join(runsDir, file))) {
    raw = JSON.parse(fs.readFileSync(path.join(runsDir, file), 'utf8'));
    metrics = raw.metrics ?? {};
    checks = collectChecks(raw.root_group);
    thresholds = collectThresholds(metrics);
  }

  const httpFailed = metricValue(metrics, 'http_req_failed', 'value');
  const checksRate = metricValue(metrics, 'checks', 'value');

  const passed = scenarioPassed({
    exitCode,
    exitFileExists,
    thresholds,
    httpFailed,
    checks: checksRate,
  });

  return {
    suite,
    passed,
    exitCode,
    meta,
    durationMs: raw?.state?.testRunDurationMs ?? null,
    httpFailed,
    p95: metricValue(metrics, 'http_req_duration', 'p(95)'),
    avg: metricValue(metrics, 'http_req_duration', 'avg'),
    checks: checksRate,
    iterations: metricValue(metrics, 'iterations', 'count'),
    vusMax: metricValue(metrics, 'vus_max', 'max'),
    httpCount: metricValue(metrics, 'http_reqs', 'count'),
    checksDetail: checks,
    thresholds,
    missing: !raw,
  };
});

rows.sort((a, b) => a.suite.localeCompare(b.suite));

const passedCount = rows.filter((r) => r.passed).length;
const failedCount = rows.length - passedCount;
const allPassed = failedCount === 0;

const baseUrl = process.env.BASE_URL ?? 'http://localhost:5050';
const profile = process.env.K6_PROFILE ?? 'smoke';
const generatedAt = new Date().toISOString();
const commitSha = process.env.GITHUB_SHA?.slice(0, 7) ?? 'local';
const workflowRun = process.env.GITHUB_RUN_ID ?? 'local';

const md = [
  '# testflow-k6 Performance Report',
  '',
  `**Run ID:** \`${runId}\`  `,
  `**Target:** \`${baseUrl}\`  `,
  `**Profile:** \`${profile}\`  `,
  `**Generated:** ${generatedAt}`,
  '',
  '## Summary',
  '',
  allPassed
    ? `All **${rows.length}** scenarios **passed** thresholds and checks.`
    : `**${passedCount} passed**, **${failedCount} failed** — review details below.`,
  '',
  '| Status | Scenario | Iterations | HTTP reqs | Max VUs | http failed | p95 latency | avg latency | checks |',
  '|--------|----------|------------|-----------|---------|-------------|-------------|-------------|--------|',
  ...rows.map(
    (r) =>
      `| ${r.passed ? 'PASS' : 'FAIL'} | ${r.suite} | ${r.iterations ?? 'n/a'} | ${r.httpCount ?? 'n/a'} | ${r.vusMax ?? 'n/a'} | ${formatRate(r.httpFailed)} | ${formatMs(r.p95)} | ${formatMs(r.avg)} | ${formatRate(r.checks)} |`,
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

fs.writeFileSync(path.join(cwd, 'results', 'REPORT.md'), md.join('\n'));

const latestSummary = {
  runId,
  generatedAt,
  baseUrl,
  profile,
  passed: allPassed,
  passedCount,
  failedCount,
  totalScenarios: rows.length,
  commitSha,
  workflowRun,
  scenarios: rows.map(({ suite, passed, iterations, httpCount, vusMax, httpFailed, p95, avg, checks }) => ({
    suite,
    passed,
    iterations,
    httpCount,
    vusMax,
    httpFailed,
    p95,
    avg,
    checks,
  })),
};

fs.writeFileSync(
  path.join(cwd, 'results', 'summary-latest.json'),
  JSON.stringify(latestSummary, null, 2),
);

const html = buildHtml({
  runId,
  baseUrl,
  profile,
  generatedAt,
  commitSha,
  workflowRun,
  rows,
  passedCount,
  failedCount,
  allPassed,
});

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(path.join(outputDir, 'index.html'), html);
fs.writeFileSync(path.join(outputDir, '.nojekyll'), '');

console.log(`Generated results/REPORT.md`);
console.log(`Generated ${path.join(outputDir, 'index.html')}`);

function buildHtml(ctx) {
  const scenarioCards = ctx.rows
    .map((row) => {
      const meta = row.meta;
      const statusClass = row.passed ? 'pass' : 'fail';
      const statusLabel = row.passed ? 'PASS' : 'FAIL';

      const checksHtml = row.checksDetail.length
        ? `<ul class="check-list">${row.checksDetail
            .map(
              (c) =>
                `<li class="${c.ok ? 'ok' : 'bad'}"><span>${escapeHtml(c.name)}</span><em>${c.passes} pass / ${c.fails} fail</em></li>`,
            )
            .join('')}</ul>`
        : '<p class="muted">No check data (run may have aborted).</p>';

      const thresholdsHtml = row.thresholds.length
        ? `<ul class="threshold-list">${row.thresholds
            .map(
              (t) =>
                `<li class="${t.ok ? 'ok' : 'bad'}"><code>${escapeHtml(t.metric)}</code> ${escapeHtml(t.expression)}</li>`,
            )
            .join('')}</ul>`
        : '<p class="muted">No threshold data.</p>';

      return `
        <article class="scenario ${statusClass}" id="${escapeHtml(row.suite)}">
          <header>
            <span class="badge ${statusClass}">${statusLabel}</span>
            <h3>${escapeHtml(row.suite)}</h3>
            <span class="tag">${escapeHtml(meta.type ?? 'Scenario')}</span>
          </header>
          <p class="desc">${escapeHtml(meta.description ?? '')}</p>
          <p class="flow"><strong>Flow:</strong> ${escapeHtml(meta.flow ?? '')}</p>
          <div class="metrics">
            <div><span>Iterations</span><strong>${row.iterations ?? 'n/a'}</strong></div>
            <div><span>HTTP reqs</span><strong>${row.httpCount ?? 'n/a'}</strong></div>
            <div><span>Max VUs</span><strong>${row.vusMax ?? 'n/a'}</strong></div>
            <div><span>p95</span><strong>${formatMs(row.p95)}</strong></div>
            <div><span>avg</span><strong>${formatMs(row.avg)}</strong></div>
            <div><span>http failed</span><strong>${formatRate(row.httpFailed)}</strong></div>
            <div><span>checks</span><strong>${formatRate(row.checks)}</strong></div>
            <div><span>exit code</span><strong>${row.exitCode}</strong></div>
          </div>
          <details>
            <summary>Checks (${row.checksDetail.filter((c) => c.ok).length}/${row.checksDetail.length} ok)</summary>
            ${checksHtml}
          </details>
          <details>
            <summary>Thresholds (${row.thresholds.filter((t) => t.ok).length}/${row.thresholds.length} ok)</summary>
            ${thresholdsHtml}
          </details>
          <p class="script"><code>${escapeHtml(meta.script ?? '')}</code> · <code>npm run ${escapeHtml(meta.npmScript ?? '')}</code></p>
        </article>`;
    })
    .join('\n');

  const thresholdRef = Object.entries(THRESHOLD_PROFILES)
    .map(
      ([name, rules]) =>
        `<section class="ref-block"><h4>${escapeHtml(name)}</h4><ul>${Object.entries(rules)
          .map(([k, v]) => `<li><code>${escapeHtml(k)}</code> — ${escapeHtml(v)}</li>`)
          .join('')}</ul></section>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>testflow-k6 Performance Report</title>
  <style>
    :root {
      --bg: #0f1419;
      --surface: #1a2332;
      --border: #2d3a4d;
      --text: #e8edf4;
      --muted: #8b9cb0;
      --accent: #7d64ff;
      --pass: #3dd68c;
      --fail: #ff6b6b;
      --warn: #ffc857;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.5;
    }
    .hero {
      padding: 2.5rem 1.5rem 2rem;
      background: linear-gradient(135deg, #1a1033 0%, #0f1419 60%);
      border-bottom: 1px solid var(--border);
    }
    .hero h1 { margin: 0 0 0.25rem; font-size: 1.75rem; }
    .hero p { margin: 0.2rem 0; color: var(--muted); font-size: 0.95rem; }
    .summary {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border);
    }
    .stat {
      flex: 1 1 140px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 1rem 1.1rem;
    }
    .stat span { display: block; color: var(--muted); font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.04em; }
    .stat strong { font-size: 1.6rem; }
    .stat.pass strong { color: var(--pass); }
    .stat.fail strong { color: var(--fail); }
    .stat.total strong { color: var(--accent); }
    main { padding: 1.5rem; max-width: 1100px; margin: 0 auto; }
    h2 { font-size: 1.2rem; margin: 0 0 1rem; color: var(--accent); }
    .scenario {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.1rem 1.2rem;
      margin-bottom: 1rem;
      border-left: 4px solid var(--border);
    }
    .scenario.pass { border-left-color: var(--pass); }
    .scenario.fail { border-left-color: var(--fail); }
    .scenario header { display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; margin-bottom: 0.5rem; }
    .scenario h3 { margin: 0; font-size: 1.05rem; }
    .badge {
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      letter-spacing: 0.05em;
    }
    .badge.pass { background: rgba(61,214,140,0.15); color: var(--pass); }
    .badge.fail { background: rgba(255,107,107,0.15); color: var(--fail); }
    .tag {
      font-size: 0.72rem;
      color: var(--muted);
      border: 1px solid var(--border);
      border-radius: 999px;
      padding: 0.1rem 0.5rem;
    }
    .desc, .flow { font-size: 0.9rem; color: var(--muted); margin: 0.35rem 0; }
    .flow strong { color: var(--text); }
    .metrics {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
      gap: 0.5rem;
      margin: 0.75rem 0;
    }
    .metrics div {
      background: var(--bg);
      border-radius: 8px;
      padding: 0.5rem 0.65rem;
      font-size: 0.82rem;
    }
    .metrics span { display: block; color: var(--muted); font-size: 0.72rem; }
    details { margin: 0.5rem 0; font-size: 0.85rem; }
    summary { cursor: pointer; color: var(--accent); }
    .check-list, .threshold-list { list-style: none; padding: 0; margin: 0.5rem 0 0; }
    .check-list li, .threshold-list li {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.25rem 0;
      border-bottom: 1px solid var(--border);
    }
    .check-list li.ok, .threshold-list li.ok { color: var(--pass); }
    .check-list li.bad, .threshold-list li.bad { color: var(--fail); }
    .check-list em { font-style: normal; color: var(--muted); font-size: 0.8rem; }
    .script { font-size: 0.78rem; color: var(--muted); margin: 0.5rem 0 0; }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 0.85em; }
    .refs { display: grid; gap: 0.75rem; margin-top: 2rem; }
    .ref-block {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 0.9rem 1rem;
    }
    .ref-block h4 { margin: 0 0 0.5rem; color: var(--accent); text-transform: capitalize; }
    .ref-block ul { margin: 0; padding-left: 1.1rem; color: var(--muted); font-size: 0.85rem; }
    .muted { color: var(--muted); font-size: 0.85rem; }
    footer {
      text-align: center;
      padding: 2rem 1rem;
      color: var(--muted);
      font-size: 0.8rem;
      border-top: 1px solid var(--border);
      margin-top: 2rem;
    }
  </style>
</head>
<body>
  <header class="hero">
    <h1>testflow-k6 Performance Report</h1>
    <p>Run <code>${escapeHtml(ctx.runId)}</code> · Profile <code>${escapeHtml(ctx.profile)}</code> · Target <code>${escapeHtml(ctx.baseUrl)}</code></p>
    <p>Generated ${escapeHtml(ctx.generatedAt)} · Commit <code>${escapeHtml(ctx.commitSha)}</code> · Workflow <code>${escapeHtml(ctx.workflowRun)}</code></p>
  </header>

  <section class="summary">
    <div class="stat total"><span>Scenarios</span><strong>${ctx.rows.length}</strong></div>
    <div class="stat pass"><span>Passed</span><strong>${ctx.passedCount}</strong></div>
    <div class="stat fail"><span>Failed</span><strong>${ctx.failedCount}</strong></div>
    <div class="stat"><span>Overall</span><strong style="color:${ctx.allPassed ? 'var(--pass)' : 'var(--fail)'}">${ctx.allPassed ? 'PASS' : 'FAIL'}</strong></div>
  </section>

  <main>
    <h2>Scenarios</h2>
    ${scenarioCards}

    <h2>Threshold profiles (reference)</h2>
    <div class="refs">${thresholdRef}</div>
  </main>

  <footer>
    Grafana k6 · TestFlow sandbox · Auto-generated by testflow-k6 CI
  </footer>
</body>
</html>`;
}
