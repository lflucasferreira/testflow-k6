# Browser — Login Page

**Source file:** [`login-page.js`](../../../../scenarios/browser/login-page.js)

---

## Objective

Uses the **k6 browser module** (Chromium) to load the login page, fill form fields via `data-testid`, submit, and measure page load time. Validates UI performance under minimal browser concurrency.

---

## Prerequisites

| Item | Detail |
|------|--------|
| **k6** | Native k6 v0.52+ with browser support (`k6 version` shows browser) |
| **Run** | `npm run test:browser:login` |
| **Not in CI report** | Requires native k6 — Docker fallback may not support browser |

---

## Executor difference

Unlike API scenarios, browser uses `shared-iterations`:

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

2 VUs share 4 total iterations — low concurrency appropriate for browser resource limits.

---

## Block by block

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

Selectors align with Playwright `getByTestId` strategy — see [threshold-strategy.md](../../../threshold-strategy.md).

Threshold: `browser_page_load: ['p(95)<5000']` plus smoke HTTP thresholds.

---

## Related

- Playwright login spec: `testflow-playwright/tests/auth/login.spec.ts`
- k6 browser docs: https://grafana.com/docs/k6/latest/using-k6-browser/
