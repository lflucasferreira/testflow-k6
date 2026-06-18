# Soak — Resistência da API

**Arquivo fonte:** [`api-endurance.js`](../../../../scenarios/soak/api-endurance.js)

---

## Objetivo

**Carga estável de longa duração** para detectar memory leaks, esgotamento de pool de conexões e drift de latência ao longo do tempo. Padrão: 15 VUs por 30 minutos em steady state.

---

## Perfil dinâmico

```javascript
function buildSoakProfile() {
  const minutes = Number(__ENV.K6_SOAK_MINUTES || 30);
  return {
    stages: [
      { duration: '2m', target: 15 },
      { duration: `${minutes}m`, target: 15 },
      { duration: '2m', target: 0 },
    ],
    gracefulRampDown: '1m',
  };
}
```

Reduza duração localmente: `K6_SOAK_MINUTES=5 npm run test:soak`

---

## Passo a passo — bloco a bloco

### Trend de latência soak

```javascript
const soakLatency = new Trend('soak_latency', true);

export default function apiEndurance() {
  const health = getHealth();
  soakLatency.add(health.timings.duration);

  const token = login();
  const users = getUsers(token);
  soakLatency.add(users.timings.duration);

  sleep(thinkTime(1, 4));
}
```

Compare p95 de `soak_latency` no início vs fim do steady state — drift ascendente sugere leaks ou esgotamento de recursos.

Thresholds: `getThresholds('soak')` — taxa de erro rigorosa (&lt; 0.5%), checks &gt; 99%.

---

## Execução

```bash
npm run test:soak
K6_SOAK_MINUTES=10 npm run test:soak
```
