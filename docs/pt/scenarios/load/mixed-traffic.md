# Load — Tráfego Misto

**Arquivo fonte:** [`mixed-traffic.js`](../../../../scenarios/load/mixed-traffic.js)

---

## Objetivo

Simula **tráfego de produção realista** com seleção aleatória ponderada de endpoints após login. Combina health checks, leituras de usuários autenticadas e anônimas, e páginas HTML estáticas.

---

## Distribuição de tráfego

| Peso | Ação |
|------|------|
| 35% | `GET /health` |
| 30% | `GET /api/users` (autenticado) |
| 15% | Página estática aleatória (`login`, `dashboard`, `team`, `settings`, `activity`) |
| 20% | `GET /api/users` (anônimo) |

---

## Passo a passo — bloco a bloco

### Bloco 1 — Login e escolha ponderada

```javascript
export default function mixedTraffic() {
  const token = login();

  weightedPick([
    { weight: 35, fn: () => { /* getHealth */ } },
    { weight: 30, fn: () => { /* getUsers(token) */ } },
    { weight: 15, fn: () => { /* getStaticPage */ } },
    { weight: 20, fn: () => { /* getUsers(null) */ } },
  ]);

  sleep(thinkTime(0.5, 2));
}
```

`weightedPick()` em `lib/http.js` implementa seleção aleatória ponderada. `thinkTime()` retorna pausa aleatória entre 0.5–2 s.

### Bloco 2 — Métrica customizada

Trend `mixed_request_duration` registra timing por request escolhido — útil no Grafana para análise de tráfego misto.

---

## Pré-requisitos

| Item | Detalhe |
|------|---------|
| **Execução** | `npm run test:load:mixed` |
| **Grafana** | `npm run test:load:mixed:grafana` para métricas ao vivo |

---

## Relacionados

- [`weightedPick()`](../../../../lib/http.js)
- [Estratégia de thresholds](../../../threshold-strategy.md)
