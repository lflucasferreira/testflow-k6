# Load — Throughput de Auth

**Arquivo fonte:** [`api-auth.js`](../../../../scenarios/load/api-auth.js)

---

## Objetivo

Teste de **throughput sustentado de login** — isola o gargalo do endpoint de autenticação. Cada VU faz POST repetido em `/api/auth/login` e registra métricas customizadas de duração e taxa de erro.

---

## Pré-requisitos

| Item | Detalhe |
|------|---------|
| **Execução** | `npm run test:load:auth` |
| **Perfil** | `load` por padrão; `K6_PROFILE=smoke` na suite de relatório |
| **Duração** | ~7 min (perfil load: 10→25 VUs) |

---

## Métricas customizadas

| Métrica | Tipo | Threshold |
|---------|------|-----------|
| `login_duration` | Trend | `p(95)<2000` |
| `login_errors` | Rate | `rate<0.01` |

---

## Passo a passo — bloco a bloco

### Bloco 1 — Declaração de métricas

```javascript
const loginDuration = new Trend('login_duration', true);
const loginErrors = new Rate('login_errors');
```

Trend registra amostras de tempo; Rate rastreia proporção de falhas por iteração.

### Bloco 2 — Merge de thresholds

```javascript
thresholds: {
  ...getThresholds('load'),
  login_duration: ['p(95)<2000'],
  login_errors: ['rate<0.01'],
},
```

SLOs load compartilhados mais gates específicos de auth.

### Bloco 3 — Função do VU

```javascript
export default function authLoad() {
  const res = http.post(`${BASE_URL}${endpoints.auth.login}`, payload, {
    tags: { endpoint: 'auth_login', name: 'POST /api/auth/login' },
  });

  const ok = check(res, {
    'login 200': (r) => r.status === 200,
    'login token present': (r) => typeof r.json('token') === 'string',
  });

  loginDuration.add(res.timings.duration);
  loginErrors.add(!ok);
  sleep(1);
}
```

Diferente do smoke, este cenário chama `http.post` diretamente (não o helper `login()`) para medir timing bruto e rastrear erros separadamente.

---

## Por que não reutilizar `login()`?

O helper `login()` em `lib/auth.js` já executa checks. Este cenário duplica o POST para anexar métricas customizadas (`login_duration`, `login_errors`) sem alterar o contrato do helper compartilhado.
