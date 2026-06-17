# testflow-k6 — Slides (Reveal.js)

Apresentação introdutória e avançada sobre Grafana k6 e o projeto **testflow-k6**.

## Run locally

```bash
npm install
npm run slides          # http://localhost:3337/docs/slides/
npm run slides:open     # serve + open browser
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
| `assets/k6-logo.svg` | k6 logo for title slide |
