# Stress — Breakpoint da API

**Arquivo fonte:** [`api-breakpoint.js`](../../../../scenarios/stress/api-breakpoint.js)

---

## Objetivo

Sobe VUs além da carga normal para encontrar o **teto de capacidade** e ponto de degradação. Conta `degraded_responses` quando latência excede 3 s (health) ou 5 s (users).

---

## Perfis

| `K6_PROFILE` | Comportamento |
|--------------|---------------|
| `stress` (padrão) | 20→100 VUs em ~12 min |
| `breakpoint` | Ramp em degraus 10→125 VUs |

```javascript
const profileName = __ENV.K6_PROFILE === 'breakpoint' ? 'breakpoint' : 'stress';
const profile = getProfile(profileName);
```

---

## Passo a passo — bloco a bloco

### Contador de degradação

```javascript
const degradedResponses = new Counter('degraded_responses');

export default function stressBreakpoint() {
  const health = getHealth();
  if (health.timings.duration > 3000 || health.status !== 200) {
    degradedResponses.add(1);
  }

  const token = login();
  const users = getUsers(token);
  if (users.timings.duration > 5000 || users.status !== 200) {
    degradedResponses.add(1);
  }

  sleep(0.2);
}
```

`degraded_responses` é informativo (sem threshold rígido) — analise no Grafana ou export JSON para achar o número de VUs onde a degradação começa.

---

## Execução

```bash
npm run test:stress
K6_PROFILE=breakpoint npm run test:stress
```

Não incluído na suite de relatório CI (`ciReport: false` no catálogo) — muito longo para o pipeline smoke.
