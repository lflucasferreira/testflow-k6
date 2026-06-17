#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

latest="$(ls -t results/report-*.html 2>/dev/null | head -1 || true)"

if [[ -n "$latest" ]]; then
  target="$latest"
elif [[ -f results/report.html ]]; then
  target="results/report.html"
else
  echo "No HTML report found. Run with dashboard first, e.g.: npm run test:smoke:ui" >&2
  exit 1
fi

if command -v open >/dev/null 2>&1; then
  open "$target"
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open "$target"
else
  echo "$target"
fi
