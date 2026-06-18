# Spike — Pico de Tráfego na API

**Arquivo fonte:** [`api-spike.js`](../../../../scenarios/spike/api-spike.js)

---

## Objetivo

Valida **recuperação sob pico súbito de tráfego**: sobe de 5 para 100 VUs em 10 segundos, mantém carga máxima e depois reduz. Detecta falhas durante e após o spike.

---

## Stages do perfil spike

| Stage | Duração | VUs alvo |
|-------|---------|----------|
| Aquecimento | 30s | 5 |
| **Spike** | 10s | **100** |
| Sustentação | 1m | 100 |
| Recuperação | 10s | 5 |
| Ramp-down | 30s | 0 |

---

## Passo a passo — bloco a bloco

### Bloco 1 — Métrica customizada de falha

```javascript
const spikeFailures = new Rate('spike_failures');

export default function apiSpike() {
  const health = getHealth();
  const token = login();
  const users = getUsers(token);

  const failed = health.status !== 200 || users.status !== 200;
  spikeFailures.add(failed);

  sleep(0.1);  // think time mínimo — maximiza pressão
}
```

Threshold: `spike_failures: ['rate<0.10']` — permite até 10% de falhas no burst (thresholds de stress também se aplicam).

### Bloco 2 — Thresholds

Usa `getThresholds('spike')` → SLOs nível stress: `http_req_failed < 5%`, `checks > 95%`.

---

## Execução

```bash
npm run test:spike
K6_PROFILE=smoke npm run test:spike   # mais leve — usado em test:report
```
