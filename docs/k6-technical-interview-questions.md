# k6 — Perguntas Técnicas para Entrevistas

> Banco de perguntas para entrevistas com recrutadores técnicos, QA leads, SDETs e engenheiros de software.  
> Cobertura baseada no conteúdo dos slides (`docs/slides/index.html`), na suíte **testflow-k6** e em tópicos frequentes em empresas brasileiras e internacionais.  
> **Legenda:** `[SLIDE]` = abordado na apresentação · `[PROJETO]` = presente na suíte TestFlow · `[EXTRA]` = comum em entrevistas, fora dos slides/projeto.

---

## Índice

1. [Conceitos Fundamentais](#1-conceitos-fundamentais)
2. [Arquitetura e Motor do k6](#2-arquitetura-e-motor-do-k6)
3. [Instalação e Configuração](#3-instalação-e-configuração)
4. [Estrutura de Projeto](#4-estrutura-de-projeto)
5. [Scripts, VUs e Iterações](#5-scripts-vus-e-iterações)
6. [Executors e Load Profiles](#6-executors-e-load-profiles)
7. [Checks e Thresholds (SLOs)](#7-checks-e-thresholds-slos)
8. [HTTP, Auth e Helpers](#8-http-auth-e-helpers)
9. [Métricas Customizadas](#9-métricas-customizadas)
10. [Tipos de Teste (Smoke, Load, Stress, Spike, Soak)](#10-tipos-de-teste)
11. [Jornadas e group()](#11-jornadas-e-group)
12. [Módulo Browser](#12-módulo-browser)
13. [Relatórios e Observabilidade](#13-relatórios-e-observabilidade)
14. [Grafana, InfluxDB e Cloud](#14-grafana-influxdb-e-cloud)
15. [CI/CD e GitHub Actions](#15-cicd-e-github-actions)
16. [Comparações k6 vs JMeter vs Gatling](#16-comparações)
17. [Debugging e Análise de Resultados](#17-debugging-e-análise-de-resultados)
18. [Boas Práticas e Anti-patterns](#18-boas-práticas-e-anti-patterns)
19. [Cenários Comportamentais](#19-cenários-comportamentais)
20. [Perguntas de Screening](#20-perguntas-de-screening)

---

## 1. Conceitos Fundamentais

| # | Pergunta | Tag |
|---|----------|-----|
| 1.1 | O que é o Grafana k6 e quem o mantém? | `[SLIDE]` |
| 1.2 | Para que tipos de teste o k6 foi projetado? | `[SLIDE]` |
| 1.3 | Por que o k6 usa JavaScript para scripts mas Go no motor? | `[EXTRA]` |
| 1.4 | Qual a diferença entre teste de carga, stress, spike e soak? | `[SLIDE]` `[PROJETO]` |
| 1.5 | O k6 substitui testes funcionais E2E? Por quê? | `[SLIDE]` |
| 1.6 | O que é um Virtual User (VU) no k6? | `[SLIDE]` |
| 1.7 | Qual a diferença entre iteração e requisição HTTP? | `[EXTRA]` |
| 1.8 | O k6 suporta WebSockets, gRPC e browser? | `[SLIDE]` `[PROJETO]` |
| 1.9 | O que são SLOs no contexto de performance testing? | `[SLIDE]` `[PROJETO]` |
| 1.10 | Como o k6 complementa Cypress e Playwright no TestFlow? | `[PROJETO]` |

---

## 2. Arquitetura e Motor do k6

| # | Pergunta | Tag |
|---|----------|-----|
| 2.1 | Explique a arquitetura: script JS, runtime Go, VU goroutines. | `[EXTRA]` |
| 2.2 | Por que o k6 é mais eficiente em recursos que JMeter? | `[EXTRA]` |
| 2.3 | O que acontece quando um VU completa a função default? | `[SLIDE]` |
| 2.4 | Como funciona o `init` context vs VU context no k6? | `[EXTRA]` |
| 2.5 | O k6 suporta módulos ES (`import/export`)? | `[PROJETO]` |
| 2.6 | O que é `handleSummary` e quando é chamado? | `[PROJETO]` |
| 2.7 | Como o k6 lida com concorrência entre VUs? | `[EXTRA]` |

---

## 3. Instalação e Configuração

| # | Pergunta | Tag |
|---|----------|-----|
| 3.1 | Como instalar k6 no macOS, Linux e Windows? | `[SLIDE]` `[PROJETO]` |
| 3.2 | Qual a diferença entre k6 nativo e imagem Docker `grafana/k6`? | `[PROJETO]` |
| 3.3 | O que é `scripts/run-k6.sh` no testflow-k6? | `[PROJETO]` |
| 3.4 | Quais variáveis de ambiente o projeto usa (`BASE_URL`, `K6_PROFILE`)? | `[PROJETO]` |
| 3.5 | Como configurar credenciais sem hardcode no repositório? | `[PROJETO]` |
| 3.6 | O k6 browser requer instalação adicional? | `[PROJETO]` |

---

## 4. Estrutura de Projeto

| # | Pergunta | Tag |
|---|----------|-----|
| 4.1 | Explique a pasta `config/` (profiles, thresholds, environments). | `[PROJETO]` |
| 4.2 | Por que endpoints estão centralizados em `lib/endpoints.js`? | `[PROJETO]` |
| 4.3 | Qual o papel de `lib/http.js` e `lib/auth.js`? | `[PROJETO]` |
| 4.4 | Diferença entre `scenarios/` e `journeys/`? | `[PROJETO]` |
| 4.5 | O que é `scripts/scenario-catalog.mjs`? | `[PROJETO]` |

---

## 5. Scripts, VUs e Iterações

| # | Pergunta | Tag |
|---|----------|-----|
| 5.1 | O que exporta um script k6 (`options`, `default function`, `setup`)? | `[SLIDE]` |
| 5.2 | O que faz `export const options`? | `[SLIDE]` |
| 5.3 | Para que serve `sleep()` em testes de carga? | `[SLIDE]` `[PROJETO]` |
| 5.4 | O que é think time e como simular no testflow-k6? | `[PROJETO]` |
| 5.5 | Como passar dados entre setup e VUs? | `[PROJETO]` |

---

## 6. Executors e Load Profiles

| # | Pergunta | Tag |
|---|----------|-----|
| 6.1 | O que é o executor `ramping-vus`? | `[SLIDE]` `[PROJETO]` |
| 6.2 | Explique `stages: [{ duration, target }]`. | `[SLIDE]` `[PROJETO]` |
| 6.3 | O que é `gracefulRampDown`? | `[EXTRA]` |
| 6.4 | Como o perfil `ci` difere do `smoke` no projeto? | `[PROJETO]` |
| 6.5 | O que faz `K6_PROFILE=breakpoint` no stress test? | `[PROJETO]` |
| 6.6 | Como reduzir duração do soak localmente? | `[PROJETO]` |
| 6.7 | Diferença entre `ramping-vus` e `shared-iterations`? | `[PROJETO]` |

---

## 7. Checks e Thresholds (SLOs)

| # | Pergunta | Tag |
|---|----------|-----|
| 7.1 | Diferença entre `check()` e `thresholds`? | `[SLIDE]` `[PROJETO]` |
| 7.2 | O que acontece quando um threshold falha? | `[SLIDE]` |
| 7.3 | Como filtrar thresholds por tag (`endpoint:health`)? | `[PROJETO]` |
| 7.4 | Explique `http_req_duration: ['p(95)<1500']`. | `[SLIDE]` |
| 7.5 | O que significa `checks: ['rate>0.99']`? | `[PROJETO]` |
| 7.6 | Por que checks estão nos helpers e não nos cenários? | `[PROJETO]` |
| 7.7 | Como alinhar SLOs com testes funcionais? | `[PROJETO]` |

---

## 8. HTTP, Auth e Helpers

| # | Pergunta | Tag |
|---|----------|-----|
| 8.1 | Como o k6 faz requisições HTTP (`k6/http`)? | `[SLIDE]` |
| 8.2 | Para que servem tags em `http.get/post`? | `[PROJETO]` |
| 8.3 | Como funciona `login()` e retorno do token? | `[PROJETO]` |
| 8.4 | O que faz `setupAuth()` na fase setup? | `[PROJETO]` |
| 8.5 | Como testar endpoints estáticos (`/web/*.html`)? | `[PROJETO]` |
| 8.6 | O que é `weightedPick()` no mixed-traffic? | `[PROJETO]` |

---

## 9. Métricas Customizadas

| # | Pergunta | Tag |
|---|----------|-----|
| 9.1 | Diferença entre Trend, Rate e Counter? | `[SLIDE]` `[PROJETO]` |
| 9.2 | Como adicionar threshold em métrica customizada? | `[PROJETO]` |
| 9.3 | Exemplos no projeto: `login_duration`, `spike_failures`. | `[PROJETO]` |
| 9.4 | Métricas built-in mais importantes do k6? | `[SLIDE]` |

---

## 10. Tipos de Teste

| # | Pergunta | Tag |
|---|----------|-----|
| 10.1 | Quando usar smoke vs load vs stress? | `[SLIDE]` `[PROJETO]` |
| 10.2 | O que valida um teste spike? | `[PROJETO]` |
| 10.3 | Objetivo do soak/endurance test? | `[PROJETO]` |
| 10.4 | O que é um breakpoint test? | `[PROJETO]` |
| 10.5 | Por que smoke roda no CI e stress não? | `[PROJETO]` |

---

## 11. Jornadas e group()

| # | Pergunta | Tag |
|---|----------|-----|
| 11.1 | Para que serve `group()` no k6? | `[PROJETO]` |
| 11.2 | Como medir duração end-to-end de uma jornada? | `[PROJETO]` |
| 11.3 | Diferença entre journey HTTP e cenário browser? | `[PROJETO]` |

---

## 12. Módulo Browser

| # | Pergunta | Tag |
|---|----------|-----|
| 12.1 | O que é o k6 browser module? | `[SLIDE]` `[PROJETO]` |
| 12.2 | Por que browser usa poucos VUs? | `[PROJETO]` |
| 12.3 | Como selecionar elementos com `data-testid`? | `[PROJETO]` |
| 12.4 | Limitações do browser module vs Playwright? | `[EXTRA]` |

---

## 13. Relatórios e Observabilidade

| # | Pergunta | Tag |
|---|----------|-----|
| 13.1 | O que gera `npm run test:report`? | `[PROJETO]` |
| 13.2 | Como funciona o k6 web dashboard (`K6_DASHBOARD=true`)? | `[PROJETO]` |
| 13.3 | O que é publicado no GitHub Pages? | `[PROJETO]` |
| 13.4 | Diferença entre REPORT.md e report/index.html? | `[PROJETO]` |

---

## 14. Grafana, InfluxDB e Cloud

| # | Pergunta | Tag |
|---|----------|-----|
| 14.1 | Como streamar métricas para InfluxDB local? | `[PROJETO]` |
| 14.2 | O que é xk6-output-influxdb? | `[PROJETO]` |
| 14.3 | Por que Grafana não roda no GitHub Pages? | `[PROJETO]` |
| 14.4 | Como embedar Grafana Cloud no site estático? | `[PROJETO]` |

---

## 15. CI/CD e GitHub Actions

| # | Pergunta | Tag |
|---|----------|-----|
| 15.1 | O que roda no workflow `k6.yml`? | `[PROJETO]` |
| 15.2 | O que roda no workflow `pages.yml`? | `[PROJETO]` |
| 15.3 | Como usar `workflow_dispatch` para load manual? | `[PROJETO]` |
| 15.4 | Qual secret é necessário no CI? | `[PROJETO]` |

---

## 16. Comparações

| # | Pergunta | Tag |
|---|----------|-----|
| 16.1 | k6 vs JMeter — prós e contras? | `[EXTRA]` |
| 16.2 | k6 vs Gatling? | `[EXTRA]` |
| 16.3 | k6 vs Locust? | `[EXTRA]` |
| 16.4 | Quando escolher k6 Cloud vs self-hosted? | `[EXTRA]` |

---

## 17. Debugging e Análise de Resultados

| # | Pergunta | Tag |
|---|----------|-----|
| 17.1 | Como interpretar p50, p95, p99? | `[SLIDE]` |
| 17.2 | O que indica `http_req_failed` alto? | `[SLIDE]` |
| 17.3 | Como identificar gargalo entre auth e users? | `[PROJETO]` |
| 17.4 | O que analisar em `degraded_responses` no stress? | `[PROJETO]` |

---

## 18. Boas Práticas e Anti-patterns

| # | Pergunta | Tag |
|---|----------|-----|
| 18.1 | Por que centralizar checks em helpers? | `[PROJETO]` |
| 18.2 | Anti-pattern: duplicar URLs hardcoded nos cenários. | `[PROJETO]` |
| 18.3 | Como manter smoke CI-friendly (&lt; 1 min)? | `[PROJETO]` |
| 18.4 | Deve-se logar tokens ou senhas no k6? | `[EXTRA]` |
| 18.5 | Como evitar que load test destrua ambiente compartilhado? | `[EXTRA]` |

---

## 19. Cenários Comportamentais

| # | Pergunta | Tag |
|---|----------|-----|
| 19.1 | O smoke passa localmente mas falha no CI — o que investigar? | `[PROJETO]` |
| 19.2 | Latência sobe linearmente com VUs — qual próximo passo? | `[EXTRA]` |
| 19.3 | Como propor SLOs para um endpoint novo? | `[PROJETO]` |
| 19.4 | Product pede 10.000 VUs — como responder realisticamente? | `[EXTRA]` |

---

## 20. Perguntas de Screening

| # | Pergunta | Tag |
|---|----------|-----|
| 20.1 | Você já rodou testes de carga em produção ou staging? | `[EXTRA]` |
| 20.2 | Qual ferramenta de performance você conhece além do k6? | `[EXTRA]` |
| 20.3 | Como você explicaria threshold para um stakeholder não técnico? | `[EXTRA]` |
| 20.4 | Qual métrica você priorizaria: p95, throughput ou error rate? | `[EXTRA]` |
| 20.5 | Performance testing entra em qual fase do pipeline CI? | `[PROJETO]` |

---

## Respostas de referência (amostra)

<details>
<summary>1.4 — Diferença entre load, stress, spike e soak</summary>

- **Load:** tráfego esperado em produção — valida SLOs sob carga normal.
- **Stress:** além da carga normal — encontra ponto de degradação.
- **Spike:** pico súbito — valida recuperação após burst.
- **Soak:** carga estável longa — detecta memory leaks e drift de latência.

No testflow-k6: `api-health` (smoke), `api-auth` (load), `api-breakpoint` (stress), `api-spike` (spike), `api-endurance` (soak).

</details>

<details>
<summary>7.1 — check() vs thresholds</summary>

- **`check()`:** asserção funcional por requisição (status 200, token presente). Falha individual não encerra o teste imediatamente.
- **`thresholds`:** gate agregado no fim — ex.: 99% dos checks passaram, p95 &lt; 1500 ms. Se violar, exit code ≠ 0.

</details>

<details>
<summary>6.1 — ramping-vus</summary>

Executor que ajusta o número de VUs ao longo do tempo conforme `stages`. Cada VU executa a função default em loop. Usado em todos os cenários API do testflow-k6.

</details>

---

*Última atualização: junho 2026 · testflow-k6*
