# Jornada — Usuário Autenticado

**Arquivo fonte:** [`authenticated-user.js`](../../../../journeys/authenticated-user.js)

---

## Objetivo

Simula uma **sessão autenticada**: login → buscar usuários → navegar dashboard e team. Quatro etapas `group()` espelham um caminho típico de usuário após sign-in.

---

## Fluxo

| Grupo | Etapa |
|-------|-------|
| `01_login` | `login()` → bearer token |
| `02_fetch_users` | `GET /api/users` (autenticado) |
| `03_browse_dashboard` | `GET /web/dashboard.html` |
| `04_browse_team` | `GET /web/team.html` |

---

## Passo a passo — bloco a bloco

```javascript
export default function authenticatedUserJourney() {
  const start = Date.now();
  let token = null;

  group('01_login', () => {
    token = login();
    sleep(0.3);
  });

  group('02_fetch_users', () => {
    getUsers(token);
    sleep(0.5);
  });

  group('03_browse_dashboard', () => {
    getStaticPage(endpoints.web.dashboard);
    sleep(0.5);
  });

  group('04_browse_team', () => {
    getStaticPage(endpoints.web.team);
    sleep(0.5);
  });

  journeyDuration.add(Date.now() - start);
}
```

Métrica customizada `journey_duration` rastreia tempo total wall-clock por iteração. Usa thresholds load via `getThresholds('load')`.

---

## Execução

```bash
npm run test:journey:auth
```

Complementa testes de páginas autenticadas do Playwright/Cypress com validação de performance sob carga.
