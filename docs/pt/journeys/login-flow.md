# Jornada — Fluxo de Login

**Arquivo fonte:** [`login-flow.js`](../../../../journeys/login-flow.js)

---

## Objetivo

**Jornada de usuário** apenas HTTP simulando login sem o módulo browser: carregar página de login → login via API → navegar ao dashboard. Usa `group()` para timing por etapa nos relatórios k6.

---

## Fluxo

| Grupo | Etapa |
|-------|-------|
| `01_load_login_page` | `GET /web/login.html` |
| `02_api_login` | `POST /api/auth/login` |
| `03_post_login_navigation` | `GET /web/dashboard.html` |

---

## Passo a passo — bloco a bloco

### Bloco 1 — Métrica de duração da jornada

```javascript
const loginFlowDuration = new Trend('login_flow_duration', true);

export default function loginFlow() {
  const start = Date.now();
  // ... groups ...
  loginFlowDuration.add(Date.now() - start);
}
```

Threshold: `login_flow_duration: ['p(95)<4000']` — jornada end-to-end abaixo de 4 s no p95.

### Bloco 2 — Groups

```javascript
group('01_load_login_page', () => {
  getStaticPage(endpoints.web.login);
  sleep(0.5);
});

group('02_api_login', () => {
  const res = http.post(/* ... */);
  check(res, { 'login succeeds': ..., 'token returned': ... });
});

group('03_post_login_navigation', () => {
  getStaticPage(endpoints.web.dashboard);
});
```

Groups aparecem como métricas aninhadas no output k6 e Grafana — útil para identificar etapas lentas.

---

## Execução

```bash
npm run test:journey:login
```

Incluído em `npm run test:report` (suite CI de 7 cenários).
