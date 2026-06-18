# Smoke — Gate de Saúde da API

**Arquivo fonte:** [`api-health.js`](../../../../scenarios/smoke/api-health.js)

---

## Objetivo

Este cenário **smoke** valida que o TestFlow está disponível sob carga mínima. Cada iteração do usuário virtual (VU) exercita três endpoints críticos:

1. **Health check** — `GET /health` responde rapidamente com 200.
2. **Lista de usuários** — `GET /api/users` retorna array `users[]` não vazio.
3. **Autenticação** — `POST /api/auth/login` retorna bearer token.

Projetado para ser **rápido** (~35 s com perfil smoke, 2 VUs) — usado como gate de CI e primeiro cenário em `npm run test:report`.

---

## Pré-requisitos

| Item | Detalhe |
|------|---------|
| **TestFlow** | Rodando em `http://localhost:5050` (ou `BASE_URL` no `.env`) |
| **k6** | v1.0+ local, ou fallback Docker via `scripts/run-k6.sh` |
| **Credenciais** | `DEMO_EMAIL` e `DEMO_PASSWORD` (padrões em `.env.example`) |
| **Execução** | `npm run test:smoke` |

---

## Tags e perfil

| Tag | Onde | Significado |
|-----|------|-------------|
| `test_type: smoke` | `options.scenarios.smoke_api.tags` | Gate smoke / disponibilidade |
| `suite: api-health` | Mesmo | Agrupamento no relatório |
| `endpoint: health/users/auth_login` | Helpers HTTP | Filtro de thresholds por endpoint |

Perfil: **smoke** (2 VUs, ~35 s). Com `CI=true`, `getProfile('smoke')` retorna automaticamente o perfil **ci** mais leve.

---

## Conceitos do k6

| Conceito | Uso neste arquivo |
|----------|-------------------|
| [`getProfile()`](../../../../config/profiles.js) | Carrega configuração de stages smoke/ci |
| [`getThresholds('smoke')`](../../../../config/thresholds.js) | Gates SLO — latência p95, taxa de erro, checks |
| [`getHealth()`](../../../../lib/http.js) | Helper compartilhado com checks embutidos |
| [`getUsers()`](../../../../lib/http.js) | Lista de usuários anônima |
| [`login()`](../../../../lib/auth.js) | POST login + validação de token |
| [`handleSummary`](../../../../lib/summary.js) | Export de relatório JSON/HTML |
| `sleep()` | Think time entre requisições |

---

## Passo a passo — bloco a bloco

### Bloco 1 — Imports e exports

```javascript
import { sleep } from 'k6';
import { getProfile } from '../../config/profiles.js';
import { getThresholds } from '../../config/thresholds.js';
// ...
export { handleSummary };
```

- **Dado:** o script importa config, helpers e handler de summary.
- **Quando:** `handleSummary` é re-exportado para o k6 chamar ao final da execução.
- **Então:** summaries JSON vão para `results/` para o gerador de relatório HTML.

---

### Bloco 2 — Options e thresholds

```javascript
const profile = getProfile('smoke');

export const options = {
  scenarios: {
    smoke_api: {
      executor: 'ramping-vus',
      ...profile,
      tags: { test_type: TAGS.smoke, suite: 'api-health' },
    },
  },
  thresholds: getThresholds('smoke'),
};
```

- **Dado:** perfil smoke define stages de ramp-up/down.
- **Quando:** thresholds são aplicados globalmente ao cenário.
- **Então:** a execução **falha** se p95, taxa de erro ou checks violarem SLOs.

Thresholds smoke incluem p95 por endpoint: health &lt; 500 ms, users &lt; 1500 ms, login &lt; 2000 ms.

---

### Bloco 3 — Função default (iteração do VU)

```javascript
export default function smokeApiHealth() {
  getHealth();
  sleep(0.5);

  getUsers();
  sleep(0.5);

  login();
  sleep(1);
}
```

- **Dado:** cada VU executa esta função em loop até os stages terminarem.
- **Quando:** helpers fazem chamadas HTTP com `check()` embutidos.
- **Então:** correção funcional é validada em cada request; métricas agregadas alimentam thresholds.

**Fluxo por iteração:** health → pausa → users → pausa → login → pausa.

---

## Resultado esperado

| Métrica | SLO smoke |
|---------|-----------|
| `http_req_failed` | &lt; 0.5% |
| `checks` | &gt; 99% |
| `http_req_duration` p95 | &lt; 1500 ms |

Exit code `0` = todos os thresholds passaram. Diferente de zero = investigar checks ou latência no relatório HTML.

---

## Docs relacionados

- [Estratégia de thresholds](../../../threshold-strategy.md)
- [Load — throughput de auth](../load/api-auth.md)
- [Guia completo](../../../guia-completo.html)
