# Load — Lista de Usuários (Read-Heavy)

**Arquivo fonte:** [`api-users.js`](../../../../scenarios/load/api-users.js)

---

## Objetivo

Cenário read-heavy: `GET /api/users` autenticado com token obtido uma vez na fase **setup**. Mede latência da listagem sob carga sustentada sem repetir login a cada iteração.

---

## Pré-requisitos

| Item | Detalhe |
|------|---------|
| **Execução** | `npm run test:load:users` |
| **Métrica customizada** | `users_list_duration` — `p(95)<2000` |

---

## Fase setup do k6

```javascript
export function setup() {
  return setupAuth();  // { token: string|null }
}

export default function usersLoad(data) {
  const res = getUsers(data.token);
  usersListDuration.add(res.timings.duration);
  sleep(0.5 + Math.random());
}
```

- **setup()** executa uma vez por run (não por VU) — obtém bearer token.
- Cada VU recebe `data` e chama `getUsers(data.token)` com header Authorization.
- Think time randomizado (`0.5–1.5 s`) simula padrões de leitura realistas.

---

## Passo a passo — bloco a bloco

### Bloco 1 — Perfil e thresholds

Usa `getProfile(__ENV.K6_PROFILE || 'load')` e faz merge do threshold `users_list_duration`.

### Bloco 2 — GET autenticado

`getUsers(token)` em `lib/http.js` adiciona `Authorization: Bearer <token>` e executa três checks: status 200, array users não vazio, resposta &lt; 2 s.

---

## Quando usar

Use este cenário para estressar o **caminho de leitura** da API após autenticação — complementar ao `api-auth.js` que estressa apenas login.
