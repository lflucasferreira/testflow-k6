# Browser — Página de Login

**Arquivo fonte:** [`login-page.js`](../../../../scenarios/browser/login-page.js)

---

## Objetivo

Usa o **módulo browser do k6** (Chromium) para carregar a página de login, preencher campos via `data-testid`, submeter e medir tempo de carregamento. Valida performance de UI sob concorrência mínima de browser.

---

## Pré-requisitos

| Item | Detalhe |
|------|---------|
| **k6** | k6 nativo v0.52+ com suporte browser (`k6 version` mostra browser) |
| **Execução** | `npm run test:browser:login` |
| **Fora do relatório CI** | Requer k6 nativo — fallback Docker pode não suportar browser |

---

## Diferença de executor

Diferente dos cenários API, browser usa `shared-iterations`:

```javascript
scenarios: {
  browser_login: {
    executor: 'shared-iterations',
    vus: 2,
    iterations: 4,
    options: { browser: { type: 'chromium' } },
  },
},
```

2 VUs compartilham 4 iterações totais — baixa concorrência adequada aos limites de recurso do browser.

---

## Passo a passo — bloco a bloco

```javascript
export default async function loginPageBrowser() {
  const page = await browser.newPage();

  try {
    const start = Date.now();
    await page.goto(`${BASE_URL}${endpoints.web.login}`, { waitUntil: 'networkidle' });
    pageLoad.add(Date.now() - start);

    await page.locator('[data-testid="login-email"]').fill(DEMO_EMAIL);
    await page.locator('[data-testid="login-password"]').fill(DEMO_PASSWORD);

    const apiToggle = page.locator('[data-testid="login-use-api"]');
    if (await apiToggle.isVisible()) {
      await apiToggle.click();
    }

    await page.locator('[data-testid="login-submit"]').click();
    await page.waitForTimeout(2000);
  } finally {
    await page.close();
  }
}
```

Seletores alinhados com estratégia Playwright `getByTestId` — veja [threshold-strategy.md](../../../threshold-strategy.md).

Threshold: `browser_page_load: ['p(95)<5000']` mais thresholds HTTP smoke.

---

## Relacionados

- Spec Playwright login: `testflow-playwright/tests/auth/login.spec.ts`
- Docs k6 browser: https://grafana.com/docs/k6/latest/using-k6-browser/
