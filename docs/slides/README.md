# testflow-k6 — Slides (Reveal.js)

Apresentação introdutória e avançada sobre Grafana k6 e o projeto **testflow-k6**.

## Run locally

Requires `npm install` at the repo root (Reveal.js and Highlight.js load from `node_modules`).

```bash
npm install
npm run slides:open     # serve repo root → http://localhost:3337/docs/slides/
```

> Always serve from the **repository root** (`npm run slides` / `npm run slides:open`).  
> `npx serve docs` alone breaks Reveal.js paths and vertical centering.

For a GitHub Pages-like build:

```bash
npm ci
npm run pages:build
npx serve site -p 3339
```

## Export PDF

Open with `?print-pdf` query, then print to PDF from the browser:

```
http://localhost:3337/docs/slides/?print-pdf
```

Or use `npm run slides:pdf` if decktape is configured.

## Structure

| File | Description |
|------|-------------|
| `index.html` | Main slide deck (PT-BR) |
| `css/theme-k6.css` | k6-branded theme (same layout as testflow-cypress) |
| `assets/k6-logo.svg` | Official Grafana k6 logo |
| `assets/playwright-logo.svg` | Playwright logo (ecosystem reference) |
| `assets/icons/` | Brand icons (macOS, Windows, Linux, Node, Docker, Grafana, InfluxDB, Git, etc.) via [Simple Icons](https://simpleicons.org/) |
| `css/icons.css` | Shared styles for tool/platform icons in guides and slides |
