# TestFlow k6 — Documentação de Treinamento

Material didático que explica **bloco a bloco** cada script de cenário do projeto. Ideal para novos alunos que estão aprendendo Grafana k6, testes de carga e automação orientada a SLO.

Cada documento aponta para o arquivo de script correspondente com um link relativo.

**Idioma:** Português · [English](../en/README.md)

---

## Como usar este material

1. Leia o doc do cenário que você vai executar ou manter.
2. Abra o [arquivo de script](..) linkado no topo do documento.
3. Siga a explicação seção por seção enquanto lê o código.
4. Execute o cenário localmente:

```bash
npm run test:smoke                    # gate smoke
npm run test:load:auth              # load — throughput de auth
npm run test:report                 # suite de 7 cenários + relatório HTML
K6_PROFILE=load npm run test:spike  # spike com perfil completo
```

---

## Índice por cenário

### Smoke

| Cenário | Documentação | Script |
|---------|--------------|--------|
| Gate de saúde da API | [api-health.md](scenarios/smoke/api-health.md) | [`scenarios/smoke/api-health.js`](../../scenarios/smoke/api-health.js) |

### Load

| Cenário | Documentação | Script |
|---------|--------------|--------|
| Throughput de auth | [api-auth.md](scenarios/load/api-auth.md) | [`scenarios/load/api-auth.js`](../../scenarios/load/api-auth.js) |
| Lista de usuários (read-heavy) | [api-users.md](scenarios/load/api-users.md) | [`scenarios/load/api-users.js`](../../scenarios/load/api-users.js) |
| Tráfego misto | [mixed-traffic.md](scenarios/load/mixed-traffic.md) | [`scenarios/load/mixed-traffic.js`](../../scenarios/load/mixed-traffic.js) |

### Stress, Spike & Soak

| Cenário | Documentação | Script |
|---------|--------------|--------|
| Pico de tráfego | [api-spike.md](scenarios/spike/api-spike.md) | [`scenarios/spike/api-spike.js`](../../scenarios/spike/api-spike.js) |
| Stress / breakpoint | [api-breakpoint.md](scenarios/stress/api-breakpoint.md) | [`scenarios/stress/api-breakpoint.js`](../../scenarios/stress/api-breakpoint.js) |
| Resistência (soak) | [api-endurance.md](scenarios/soak/api-endurance.md) | [`scenarios/soak/api-endurance.js`](../../scenarios/soak/api-endurance.js) |

### Jornadas de usuário

| Cenário | Documentação | Script |
|---------|--------------|--------|
| Fluxo de login | [login-flow.md](journeys/login-flow.md) | [`journeys/login-flow.js`](../../journeys/login-flow.js) |
| Usuário autenticado | [authenticated-user.md](journeys/authenticated-user.md) | [`journeys/authenticated-user.js`](../../journeys/authenticated-user.js) |

### Browser

| Cenário | Documentação | Script |
|---------|--------------|--------|
| Página de login (Chromium) | [login-page.md](browser/login-page.md) | [`scenarios/browser/login-page.js`](../../scenarios/browser/login-page.js) |

---

## Conceitos transversais

Os documentos cobrem, entre outros:

- **k6 options:** `scenarios`, executor `ramping-vus`, `stages`, `thresholds`, `tags`
- **Helpers compartilhados:** `getHealth()`, `getUsers()`, `login()` em [`lib/`](../../lib/)
- **Perfis:** `getProfile()` e variável `K6_PROFILE` — [`config/profiles.js`](../../config/profiles.js)
- **SLO thresholds:** `getThresholds()` — [`config/thresholds.js`](../../config/thresholds.js) · veja [`threshold-strategy.md`](../threshold-strategy.md)
- **Fase setup:** `export function setup()` para reuso de token — [`lib/auth.js`](../../lib/auth.js)
- **Jornadas:** `group()` para timing por etapa nos relatórios
- **Métricas customizadas:** `Trend`, `Rate`, `Counter` de `k6/metrics`
- **Relatórios:** export `handleSummary` — [`lib/summary.js`](../../lib/summary.js)
- **CI:** gate smoke + relatório GitHub Pages — [`.github/workflows/k6.yml`](../../.github/workflows/k6.yml)

---

## Outros materiais em `docs/`

| Recurso | Descrição |
|---------|-----------|
| [`slides/`](../slides/) | Apresentação introdutória k6 (Reveal.js) |
| [`guia-completo.html`](../guia-completo.html) | Guia passo a passo em português (página única) |
| [`complete-guide.html`](../complete-guide.html) | Step-by-step guide in English (single page) |
| [`threshold-strategy.md`](../threshold-strategy.md) | Checks, thresholds, tags por endpoint |
| [`k6-technical-interview-questions.md`](../k6-technical-interview-questions.md) | Banco de perguntas técnicas para entrevistas (Português) |
| [`grafana-cloud-setup.md`](../grafana-cloud-setup.md) | Grafana Cloud + streaming InfluxDB |
| [`influxdb-cloud-dashboard.md`](../influxdb-cloud-dashboard.md) | Dashboard nativo InfluxDB via template YAML |

---

## Estrutura de pastas

```
docs/
├── README.md                          ← seletor de idioma
├── guia-completo.html                 ← guia completo (PT)
├── complete-guide.html                ← complete guide (EN)
├── threshold-strategy.md
├── k6-technical-interview-questions.md
├── pt/
│   ├── README.md                      ← índice (Português)
│   ├── scenarios/                     ← walkthroughs por script
│   ├── journeys/
│   └── browser/
├── en/
│   ├── README.md                      ← index (English)
│   └── …
└── slides/                            ← apresentação Reveal.js
```

Cada `.md` em `docs/pt/` espelha o script homônimo em `scenarios/` ou `journeys/`.
