#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const outputDir = process.argv[2] || 'site/grafana';
const grafanaUrl = process.env.GRAFANA_DASHBOARD_URL?.trim() || '';
const embed = process.env.GRAFANA_EMBED !== 'false';

fs.mkdirSync(outputDir, { recursive: true });

const config = grafanaUrl
  ? {
      mode: 'grafana',
      url: grafanaUrl,
      embed,
      updatedAt: new Date().toISOString(),
    }
  : {
      mode: 'report',
      fallback: '../report/',
      pagesReport: 'https://lflucasferreira.github.io/testflow-k6/report/',
      autoRedirect: true,
      updatedAt: new Date().toISOString(),
    };

const target = path.join(outputDir, 'dashboard-url.json');
fs.writeFileSync(target, `${JSON.stringify(config, null, 2)}\n`);
console.log(`Wrote ${target} (mode=${config.mode})`);
