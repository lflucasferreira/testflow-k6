#!/usr/bin/env node
/**
 * Generates monitoring/influxdb/k6-test-results-dashboard.json
 * for import into InfluxDB Cloud (Boards → Import Dashboard).
 *
 * Note: InfluxDB dashboard variables cannot reference other variables (no v.bucket
 * inside variable queries). Bucket is hardcoded; only testid is a dropdown.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, '../monitoring/influxdb/k6-test-results-dashboard.json');

/** Must match K6_INFLUXDB_BUCKET in .env */
const BUCKET = process.env.K6_INFLUXDB_BUCKET || 'k6';

const randId = () => crypto.randomBytes(8).toString('hex');

const ids = {
  label: randId(),
  cells: Array.from({ length: 7 }, randId),
  varTestid: randId(),
};

const builderConfig = {
  buckets: [],
  tags: [{ key: '_measurement', values: [], aggregateFunctionType: 'filter' }],
  functions: [{ name: 'mean' }],
  aggregateWindow: { period: 'auto', fillValues: false },
};

function fluxQuery(text) {
  return { text, editMode: 'advanced', name: '', builderConfig: { ...builderConfig } };
}

const xyColors = [
  { id: '4b85c645-37e8-484c-b8c1-b9c24ade5298', type: 'scale', hex: '#31C0F6', name: 'Nineteen Eighty Four', value: 0 },
  { id: 'd9cfed2d-ade2-4e11-828c-25e71804dec3', type: 'scale', hex: '#A500A5', name: 'Nineteen Eighty Four', value: 0 },
  { id: 'b966ce10-9565-4f39-8862-d6c1019e4bc9', type: 'scale', hex: '#FF7E27', name: 'Nineteen Eighty Four', value: 0 },
];

const xyAxes = {
  x: { bounds: ['', ''], label: '', prefix: '', suffix: '', base: '10', scale: 'linear' },
  y: { bounds: ['', ''], label: '', prefix: '', suffix: '', base: '10', scale: 'linear' },
};

function xyView(name, queries, ySuffix = '') {
  const axes = JSON.parse(JSON.stringify(xyAxes));
  axes.y.suffix = ySuffix;
  return {
    name,
    properties: {
      shape: 'chronograf-v2',
      axes,
      type: 'xy',
      legend: {},
      geom: 'line',
      colors: xyColors,
      queries: queries.map(fluxQuery),
      note: '',
      showNoteWhenEmpty: false,
      xColumn: '_time',
      generateXAxisTicks: [],
      xTotalTicks: 0,
      xTickStart: 0,
      xTickStep: 0,
      yColumn: '_value',
      generateYAxisTicks: [],
      yTotalTicks: 0,
      yTickStart: 0,
      yTickStep: 0,
      shadeBelow: false,
      position: 'overlaid',
      timeFormat: 'HH:mm',
      hoverDimension: 'auto',
      legendColorizeRows: true,
      legendOpacity: 1,
      legendOrientationThreshold: 100000000,
    },
  };
}

function singleStatView(name, flux, suffix = '', digits = 2) {
  return {
    name,
    properties: {
      shape: 'chronograf-v2',
      type: 'single-stat',
      queries: [fluxQuery(flux)],
      prefix: '',
      tickPrefix: '',
      suffix,
      tickSuffix: suffix,
      colors: [{ id: 'base', type: 'text', hex: '#00C9FF', name: 'laser', value: 0 }],
      decimalPlaces: { isEnforced: true, digits },
      note: '',
      showNoteWhenEmpty: false,
    },
  };
}

const fromBucket = `from(bucket: "${BUCKET}")`;
const testidFilter = '|> filter(fn: (r) => r["testid"] == v.testid)';

const panelDefs = [
  {
    id: ids.cells[0],
    x: 0,
    y: 0,
    w: 2,
    h: 3,
    view: singleStatView(
      'Requests Made',
      `${fromBucket}
  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
  |> filter(fn: (r) => r["_measurement"] == "http_reqs")
  ${testidFilter}
  |> filter(fn: (r) => r["_field"] == "value")
  |> group(columns: ["_measurement"])
  |> sum()
  |> last()`,
    ),
  },
  {
    id: ids.cells[1],
    x: 2,
    y: 0,
    w: 2,
    h: 3,
    view: singleStatView(
      'HTTP Failures',
      `${fromBucket}
  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
  |> filter(fn: (r) => r["_measurement"] == "http_req_failed")
  ${testidFilter}
  |> filter(fn: (r) => r["_field"] == "value")
  |> group(columns: ["_measurement"])
  |> sum()
  |> last()`,
      '',
      0,
    ),
  },
  {
    id: ids.cells[2],
    x: 4,
    y: 0,
    w: 2,
    h: 3,
    view: singleStatView(
      'Peak RPS',
      `${fromBucket}
  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
  |> filter(fn: (r) => r["_measurement"] == "http_reqs")
  ${testidFilter}
  |> filter(fn: (r) => r["_field"] == "value")
  |> group()
  |> aggregateWindow(every: v.windowPeriod, fn: sum, createEmpty: false)
  |> max()
  |> last()`,
      ' req/s',
    ),
  },
  {
    id: ids.cells[3],
    x: 6,
    y: 0,
    w: 2,
    h: 3,
    view: singleStatView(
      'P95 Response Time',
      `${fromBucket}
  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
  |> filter(fn: (r) => r._measurement == "http_req_duration")
  ${testidFilter}
  |> filter(fn: (r) => r._field == "value")
  |> group()
  |> quantile(q: 0.95, method: "exact_mean")
  |> last()`,
      ' ms',
    ),
  },
  {
    id: ids.cells[4],
    x: 8,
    y: 0,
    w: 2,
    h: 3,
    view: singleStatView(
      'Data Received',
      `${fromBucket}
  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
  |> filter(fn: (r) => r._measurement == "data_received")
  ${testidFilter}
  |> filter(fn: (r) => r._field == "value")
  |> group()
  |> sum()
  |> last()`,
      ' B',
    ),
  },
  {
    id: ids.cells[5],
    x: 10,
    y: 0,
    w: 2,
    h: 3,
    view: singleStatView(
      'Data Sent',
      `${fromBucket}
  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
  |> filter(fn: (r) => r._measurement == "data_sent")
  ${testidFilter}
  |> filter(fn: (r) => r._field == "value")
  |> group()
  |> sum()
  |> last()`,
      ' B',
    ),
  },
  {
    id: ids.cells[6],
    x: 0,
    y: 3,
    w: 12,
    h: 5,
    view: xyView('VUs, Response Time & RPS', [
      `${fromBucket}
  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
  |> filter(fn: (r) => r._measurement == "http_req_duration")
  ${testidFilter}
  |> filter(fn: (r) => r._field == "value")
  |> filter(fn: (r) => r.status == "200")
  |> aggregateWindow(every: v.windowPeriod, fn: mean, createEmpty: false)
  |> yield(name: "avg_response_ms")`,
      `${fromBucket}
  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
  |> filter(fn: (r) => r["_measurement"] == "vus")
  |> yield(name: "active_vus")`,
      `${fromBucket}
  |> range(start: v.timeRangeStart, stop: v.timeRangeStop)
  |> filter(fn: (r) => r["_measurement"] == "http_reqs")
  ${testidFilter}
  |> filter(fn: (r) => r["_field"] == "value")
  |> group(columns: ["_measurement"])
  |> aggregateWindow(every: 1s, fn: sum, createEmpty: false)
  |> yield(name: "rps")`,
    ]),
  },
];

const cells = panelDefs.map(({ id, x, y, w, h }) => ({
  id,
  type: 'cell',
  attributes: { x, y, w, h },
  relationships: { view: { data: { type: 'view', id } } },
}));

const views = panelDefs.map(({ id, view }) => ({
  type: 'view',
  id,
  attributes: view,
}));

const dashboard = {
  meta: {
    version: '1',
    type: 'dashboard',
    name: 'K6 Test Results-Template',
    description: 'k6 load test metrics from xk6-output-influxdb (testflow-k6)',
  },
  content: {
    data: {
      type: 'dashboard',
      attributes: {
        name: 'K6 Test Results',
        description: `k6 metrics (bucket: ${BUCKET}) via xk6-output-influxdb`,
      },
      relationships: {
        label: { data: [{ type: 'label', id: ids.label }] },
        cell: { data: ids.cells.map((id) => ({ type: 'cell', id })) },
        variable: {
          data: [{ type: 'variable', id: ids.varTestid }],
        },
      },
    },
    included: [
      {
        type: 'label',
        id: ids.label,
        attributes: {
          name: 'k6',
          properties: { color: '#7a65f2', description: 'testflow-k6 performance tests' },
        },
      },
      ...cells,
      ...views,
      {
        id: ids.varTestid,
        type: 'variable',
        attributes: {
          name: 'testid',
          arguments: {
            type: 'query',
            values: {
              query: `import "influxdata/influxdb/schema"

schema.tagValues(bucket: "${BUCKET}", tag: "testid")`,
              language: 'flux',
            },
          },
          selected: ['smoke'],
        },
        relationships: { label: { data: [] } },
      },
    ],
  },
  labels: [],
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, `${JSON.stringify(dashboard, null, 2)}\n`);
console.log(`Wrote ${outPath} (bucket: ${BUCKET})`);
