<div align="center">

# 🧪 AutoSaller — Suíte de Testes Automatizados (`dev-alt-tests`)

**Branch dedicada às entregas de Engenharia de Software:**
modelagem do sistema (Entrega 1) e testes automatizados com **Jest** e **Cypress** (Entrega 2).

</div>

> O README geral do projeto (escopo, cronograma, rubrica, fluxo de Git) foi preservado sem alterações em
> [`docs/README-projeto.md`](docs/README-projeto.md). **Ao mesclar esta branch em `dev`, restaure o README original**
> e mantenha este conteúdo em `docs/` (ou faça o merge sem este arquivo).

---

## Índice

1. [O que esta branch adiciona](#1-o-que-esta-branch-adiciona)
2. [Resultados atuais](#2-resultados-atuais)
3. [Como executar](#3-como-executar)
4. [Organização dos testes](#4-organização-dos-testes)
5. [Defeitos encontrados](#5-defeitos-encontrados)
6. [Decisões técnicas](#6-decisões-técnicas)
7. [Como manter a suíte](#7-como-manter-a-suíte)

---

## 1. O que esta branch adiciona

| Entrega | Conteúdo | Local |
|---|---|---|
| **Entrega 1** — Modelagem (10/11) | Casos de uso, arquitetura e estrutura de dados (DER, classes e dicionário), com diagramas em Mermaid | [`docs/entrega-1-modelagem/`](docs/entrega-1-modelagem/README.md) |
| **Entrega 2** — Backend | Jest + SWC: 184 testes unitários e de API HTTP | [`backend/test-jest/`](backend/test-jest) |
| **Entrega 2** — Frontend (unidade/componente) | Jest + jsdom + Vue Test Utils: 123 testes | [`frontend/test-jest/`](frontend/test-jest) |
| **Entrega 2** — Frontend (E2E) | Cypress 16: 33 cenários com API simulada + 3 de integração real (executados na máquina local) | [`frontend/cypress/`](frontend/cypress) |
| **Entrega 2** — Relatório | Cobertura, cenários, taxas de sucesso e defeitos | [`docs/entrega-2-testes/RELATORIO-DE-TESTES.md`](docs/entrega-2-testes/RELATORIO-DE-TESTES.md) |

O **código de produção não foi alterado**. As suítes de Vitest e Playwright que já existiam continuam no lugar e convivem com as novas:

| Ferramenta | Arquivos que executa | Configuração |
|---|---|---|
| Vitest (backend, existente) | `backend/src/**/*.spec.ts` | `backend/vitest.config.ts` |
| **Jest (backend, novo)** | `backend/test-jest/**/*.test.ts` | `backend/jest.config.cjs` |
| Vitest (frontend, existente) | `frontend/src/__tests__/*.spec.ts` | `frontend/vitest.config.ts` (agora ignora `test-jest/` e `cypress/`) |
| **Jest (frontend, novo)** | `frontend/test-jest/**/*.test.ts` | `frontend/jest.config.cjs` |
| Playwright (existente) | `frontend/e2e/*.spec.ts` | `frontend/playwright.config.ts` |
| **Cypress (novo)** | `frontend/cypress/e2e/*.cy.ts` | `frontend/cypress.config.ts` |

## 2. Resultados atuais

Resultados do Jest: medição de 07/11/2026, sobre o commit `64dd43d` da `dev`, com Node.js 22. Resultados do Cypress: execução descrita abaixo, com Node.js 24.15.0.

### 2.1 Resumo

| Suíte | Testes | Aprovados | Reprovados | Taxa de sucesso | Tempo |
|---|---:|---:|---:|---:|---:|
| Backend — Jest | 184 | 184 | 0 | **100%** | ≈ 3,1 s |
| Frontend — Jest | 123 | 123 | 0 | **100%** | ≈ 3,0 s |
| Frontend — Cypress (API simulada) | 33 | 31 | 2 | **93,9%** | ≈ 3 min |
| Frontend — Cypress (integração real, opcional) | 3 | 0 | 0 | — (3 pendentes) | < 1 s |

Na execução do Cypress 16.2.1 com Node.js 24.15.0 e Electron 146 (headless), os dois testes reprovados foram reportados durante a captura automática de tela (`cy.screenshot()` excedeu 30 s): o encerramento de sessão em `01-login.cy.ts` e o redirecionamento de visitante em `02-controle-de-acesso.cy.ts`. Os outros 31 cenários com API simulada passaram. Os 3 cenários de integração real ficaram pendentes porque a execução não foi iniciada com `REAL_API=true`. O Cypress também avisou que o Electron está depreciado como navegador de teste.

Dos testes Jest, 12 documentam defeitos conhecidos: 11 com `it.failing` e 1 de registro de comportamento (ver [seção 5](#5-defeitos-encontrados)). Eles aparecem como aprovados enquanto o defeito existir.

### 2.2 Cobertura de código (Jest)

| Suíte | Statements | Branches | Funções | Linhas |
|---|---:|---:|---:|---:|
| Backend | 97,79% (400/409) | 87,24% (130/149) | 90,10% (82/91) | 97,77% (395/404) |
| Frontend | 94,11% (1215/1291) | 89,53% (1087/1214) | 89,56% (266/297) | 95,65% (1146/1198) |

A meta mínima configurada no backend (`coverageThreshold`) é de 80% em statements, funções e linhas, e de 70% em branches.

### 2.3 Resultados do Cypress por arquivo

Resultado da execução de `npm run test:e2e:cypress`:

| Spec | Casos | Aprovados | Reprovados | Observação |
|---|---:|---:|---:|---|
| `01-login.cy.ts` | 7 | 6 | 1 | Falha ao capturar tela após o teste de encerramento de sessão |
| `02-controle-de-acesso.cy.ts` | 8 | 7 | 1 | Falha ao capturar tela após o teste de redirecionamento de visitante |
| `03-estoque.cy.ts` | 7 | 7 | 0 | |
| `04-cadastro-de-veiculo.cy.ts` | 4 | 4 | 0 | |
| `05-clientes.cy.ts` | 4 | 4 | 0 | |
| `06-responsividade.cy.ts` | 3 | 3 | 0 | |
| `99-integracao-real.cy.ts` | 3 | 0 | 0 | 3 pendentes; execução sem `REAL_API=true` |

**Total:** 36 testes contabilizados, 31 aprovados, 2 reprovados e 3 pendentes. Os testes reprovados excederam o tempo limite de 30 s em `cy.screenshot()`; nenhuma captura foi gerada.

### 2.4 Suítes que já existiam na `dev`

| Suíte | Resultado |
|---|---|
| Backend — Vitest | 17 aprovados · **9 reprovados** (DEF-08) |
| Frontend — Vitest | 23 aprovados · 0 reprovados |

Detalhamento por arquivo, cenários e rastreabilidade: [relatório de testes](docs/entrega-2-testes/RELATORIO-DE-TESTES.md).

## 3. Como executar

Os testes rodam **na sua máquina**, e não dentro dos contêineres. O Docker é usado apenas para subir a aplicação (frontend, backend e banco), que os testes E2E acessam pelo navegador.

> **Por que não rodar o Cypress dentro do contêiner do frontend?** A imagem do frontend usa Alpine Linux (`node:26-alpine`), que o Cypress não suporta: o erro `Your system is missing the dependency: Xvfb` é só o primeiro sintoma. Rodar o Cypress na máquina evita o problema sem alterar as imagens do projeto.

### Pré-requisitos

| Item | Versão | Como verificar |
|---|---|---|
| Node.js | `^22.18` ou `>=24.12` | `node -v` |
| npm | 10 ou superior | `npm -v` |
| Docker + Docker Compose | qualquer versão recente | `docker compose version` |
| Arquivo `.env` na raiz | copiado de `.env.example` | `JWT_SECRET` e `VITE_API_URL=http://localhost:3000` preenchidos |

Todos os comandos abaixo partem da **raiz do repositório**. Cada pacote (`backend/` e `frontend/`) tem seu próprio `package.json`, `node_modules` e `jest.config.cjs`, então os testes precisam ser executados **dentro da pasta correspondente**.

| O quê | Pasta | Comando |
|---|---|---|
| Subir a aplicação | raiz | `docker compose up -d` |
| Jest do backend | `backend/` | `npm run test:jest:cov` |
| Jest do frontend | `frontend/` | `npm run test:jest:cov` |
| Cypress | `frontend/` | `npm run test:e2e:cypress` |

### Passo 1 — Obter a branch

```bash
git fetch origin
git checkout dev-alt-tests
```

### Passo 2 — Instalar as dependências na máquina

```bash
cd backend
npm install
cd ../frontend
npm install
cd ..
```

O `node_modules` da sua máquina é independente do que existe dentro dos contêineres (o `docker-compose.yml` monta `/app/node_modules` como volume próprio), então os dois não conflitam.

> Use `npm install`, e não `npm ci`: o `package-lock.json` da `dev` estava fora de sincronia (DEF-08).

### Passo 3 — Testes unitários e de API do backend (Jest)

```bash
cd backend
npm run test:jest:cov
```

Resultado esperado no final da saída:

```
Test Suites: 10 passed, 10 total
Tests:       184 passed, 184 total
```

O relatório HTML de cobertura é gerado em `backend/coverage-jest/lcov-report/index.html`.

Esses testes **não precisam** do Docker nem do banco de dados.

Outros comandos úteis:

```bash
npm run test:jest                     # sem cobertura (mais rápido)
npm run test:jest:watch               # reexecuta a cada alteração
npx jest test-jest/unit/vendas        # apenas uma pasta
npx jest -t "desconto especial"       # apenas testes cujo nome contém o texto
```

### Passo 4 — Testes unitários e de componentes do frontend (Jest)

```bash
cd frontend
npm run test:jest:cov
```

Resultado esperado:

```
Test Suites: 9 passed, 9 total
Tests:       123 passed, 123 total
```

O relatório HTML é gerado em `frontend/coverage-jest/lcov-report/index.html`. Também não depende do Docker.

Para checar os tipos dos testes Jest e Cypress:

```bash
npm run typecheck:tests
```

### Passo 5 — Subir a aplicação

Necessário apenas para o Cypress.

```bash
# na raiz do repositório
docker compose up -d
docker compose ps        # frontend (5173), backend (3000) e postgres (5432) devem estar "running"
```

Abra `http://localhost:5173` no navegador para confirmar que a tela de login aparece.

> **Alternativa sem Docker:** para os testes com API simulada, basta o frontend. Rode `cd frontend && npm run dev` em um terminal separado e deixe-o aberto.

### Passo 6 — Testes E2E com Cypress

```bash
cd frontend
npx cypress install          # só na primeira vez: baixa o navegador do Cypress (~250 MB)
npx cypress verify           # opcional: confirma a instalação
npm run test:e2e:cypress     # execução headless; imprime a tabela final de resultados
```

Para acompanhar os testes visualmente, use o modo interativo:

```bash
npm run cypress:open         # escolha "E2E Testing" → navegador → clique no spec
```

Nesse modo padrão, a API é **simulada** com `cy.intercept`. O backend não precisa responder, e os dados vêm de `cypress/fixtures/`. Se algum teste falhar, o Cypress tenta salvar capturas em `frontend/cypress/screenshots/`; na execução registrada acima, a captura excedeu o tempo limite e nenhuma imagem foi gerada.

### Passo 7 (opcional) — Cypress contra a API real

Esse modo executa `99-integracao-real.cy.ts` com a aplicação completa e exige um **administrador de teste** cadastrado no banco.

**Linux, macOS e Git Bash:**

```bash
cd frontend
CYPRESS_ADMIN_CPF=11144477735 CYPRESS_ADMIN_SENHA='sua-senha' \
  npx cypress run --expose REAL_API=true
```

**Windows (PowerShell):**

```powershell
cd frontend
$env:CYPRESS_ADMIN_CPF="11144477735"; $env:CYPRESS_ADMIN_SENHA="sua-senha"
npx cypress run --expose REAL_API=true
```

**Windows (Prompt de Comando):**

```bat
cd frontend
set CYPRESS_ADMIN_CPF=11144477735
set CYPRESS_ADMIN_SENHA=sua-senha
npx cypress run --expose REAL_API=true
```

> Enquanto o DEF-01 não for corrigido, o teste `[DEF-01] GET /veiculos?anoMin=2020 deveria responder 200` **reprova** nesse modo. Isso é esperado e comprova o defeito.

### Tudo de uma vez

```bash
(cd backend && npm run test:jest:cov) && (cd frontend && npm run test:jest:cov && npm run test:e2e:cypress)
```

### Problemas comuns

| Sintoma | Causa | Solução |
|---|---|---|
| `No tests found` | Comando executado na raiz | Entre em `backend/` ou `frontend/` |
| `Your system is missing the dependency: Xvfb` | Cypress executado dentro do contêiner Alpine | Execute na máquina (passo 6) |
| `Cypress verification failed` / binário ausente | Binário não baixado | `npx cypress install` |
| `cy.visit() failed trying to load http://localhost:5173` | Frontend não está rodando | Passo 5, ou `npm run dev` em `frontend/` |
| Testes de login/estoque falham com requisições não interceptadas | `VITE_API_URL` diferente de `http://localhost:3000` | Ajuste o `.env`, ou rode com `--expose apiUrl=<sua URL>` |
| `npm ci` falha no backend | Lockfile dessincronizado (DEF-08) | Use `npm install` |
| `Error: listen EADDRINUSE :5173` ao rodar `npm run dev` | O contêiner do frontend já ocupa a porta | Use só um dos dois: Docker **ou** `npm run dev` |

## 4. Organização dos testes

```
backend/
├── jest.config.cjs
└── test-jest/
    ├── setup-env.ts                 # reflect-metadata + JWT_SECRET de teste
    ├── tsconfig.json                # checagem de tipos (tipos do Jest, não do Vitest)
    ├── helpers/
    │   ├── mocks.ts                 # dublês de Repository, QueryBuilder, EntityManager e DataSource
    │   └── fabricas.ts              # fábricas de dados válidos (usuário, cliente, veículo)
    ├── unit/
    │   ├── auth/                    # AuthService, RolesGuard, Local/JwtStrategy
    │   ├── usuarios/  clientes/  veiculos/  vendas/  relatorios/   # regras de negócio
    │   ├── controllers/             # matriz de permissões + delegação
    │   └── dto/                     # validações class-validator (RF-EST-04, RF-CLI-05)
    └── api/http.test.ts             # HTTP real: 401/403/400/404, contratos JSON

frontend/
├── jest.config.cjs
├── test-jest/
│   ├── support/
│   │   ├── transform-vue.cjs        # compila .vue com @vue/compiler-sfc + SWC (com cobertura)
│   │   ├── transform-ts.cjs         # SWC + import.meta.env → process.env
│   │   ├── montar.ts                # monta uma view com Pinia, Router e usuário logado
│   │   └── setup.ts
│   └── unit/
│       ├── stores/  services/  router/
│       └── views/                   # Login, Estoque, Cadastro de veículo, Clientes, Usuários, Layouts
├── cypress.config.ts
└── cypress/
    ├── support/commands.ts          # cy.entrarComo(perfil, rota)
    ├── fixtures/                    # veiculos.json, clientes.json
    └── e2e/
        ├── 01-login.cy.ts           # UC01, UC18
        ├── 02-controle-de-acesso.cy.ts   # RNF005
        ├── 03-estoque.cy.ts         # UC10, UC12
        ├── 04-cadastro-de-veiculo.cy.ts  # UC09, UC11
        ├── 05-clientes.cy.ts        # UC05, UC06, UC08
        ├── 06-responsividade.cy.ts  # RNF001
        └── 99-integracao-real.cy.ts # contra a API real (opcional)
```

**Convenção de nomes.** Cada arquivo começa com um comentário que indica os casos de uso e requisitos cobertos (ex.: `UC13 – Registrar venda (RF-VEN-01..04)`). Os títulos dos testes descrevem o comportamento esperado em português.

## 5. Defeitos encontrados

Os testes revelaram divergências entre o código e os requisitos. Cada uma está documentada por um teste executável marcado com **`it.failing`**. Esse teste **passa enquanto o defeito existir** e **falha quando ele for corrigido**, avisando a equipe para trocar `it.failing` por `it`. Assim, a suíte permanece verde e o defeito continua visível.

| ID | Gravidade | Defeito | Teste |
|---|---|---|---|
| DEF-07 | 🔴 Alta | O hash bcrypt da senha do vendedor é devolvido em `GET/POST /vendas` (coluna sem `select: false`) | `api/http.test.ts` |
| DEF-01 | 🔴 Alta | O filtro por ano do estoque quebra: o frontend envia `anoMin/anoMax`, o DTO só aceita `ano` → 400 | `dto/validacao-dtos.test.ts`, `api/http.test.ts`, Cypress 03 e 99 |
| DEF-02 | 🟠 Média | Desconto de exatamente 10% não exige aprovação (`> 10` no código; regra `≥ 10`) | `vendas/vendas.service.test.ts` |
| DEF-03 | 🟠 Média | `PATCH /veiculos/:id/status` aceita `vendido`/`reservado` manualmente | `veiculos/veiculos.service.test.ts` |
| DEF-04 | 🟠 Média | O vendedor consegue cadastrar e editar veículos e alterar o status (RF-USU-08/14) | `controllers/controllers.test.ts` |
| DEF-05 | 🟡 Baixa | CPF duplicado em usuário → 500 em vez de 409 | `usuarios/usuarios.service.test.ts` |
| DEF-06 | 🟡 Baixa | Editar cliente com CPF/e-mail de outro cliente → 500 em vez de 409 | `clientes/clientes.service.test.ts` |
| DEF-08 | 🟡 Baixa | A suíte Vitest da `dev` tem 9 falhas de 26 testes (regressão nos commits `6389d49`/`1d0323a`), e `npm ci` falha | — (ver relatório) |
| DEF-09 | 🟡 Baixa | A busca de clientes diferencia maiúsculas (`LIKE` em vez de `ILIKE`) | — (ver relatório) |
| DEF-10 | 🟡 Baixa | “Versão” é opcional no formulário e obrigatória na API | `views/CadastrarVeiculoView.test.ts` |

Descrição, impacto e correção sugerida de cada item: [relatório, seção 6](docs/entrega-2-testes/RELATORIO-DE-TESTES.md#6-defeitos-encontrados).

## 6. Decisões técnicas

| Decisão | Motivo |
|---|---|
| **SWC** como transpilador do Jest (`@swc/jest`) | O NestJS 12 é publicado só como ESM; o SWC transpila os pacotes `@nestjs/*`, suporta `emitDecoratorMetadata` (necessário à injeção de dependência) e é muito mais rápido que o `ts-jest` |
| Arquivos `*.test.ts` em pastas `test-jest/` | Separação total do Vitest (`*.spec.ts`); nenhuma ferramenta executa testes da outra |
| `import { describe, it, expect } from '@jest/globals'` | Evita conflito com os tipos globais do Vitest declarados no `tsconfig.json` do backend |
| `jest.mock` com o **`jest` global** | O SWC só eleva (*hoist*) `jest.mock` acima dos imports quando o identificador é o global |
| Transformador `.vue` próprio em vez do `@vue/vue3-jest` | Com TypeScript 6, o vue3-jest descarta os imports do template (`_openBlock is not defined`). O compilador oficial (`@vue/compiler-sfc`, modo `inlineTemplate`, o mesmo do build de produção) + SWC resolve o problema, e o `babel-plugin-istanbul` permite medir a cobertura |
| Cobertura de `.vue` medida sobre o código compilado | As linhas não cobertas reportadas para `.vue.ts` referem-se ao componente compilado (template + script), e não às linhas do arquivo `.vue` |
| Cypress com `cy.intercept` por padrão | Os E2E rodam em qualquer máquina, sem banco nem backend, e são determinísticos. O spec `99-integracao-real` valida a integração verdadeira quando o ambiente existe |
| Dublês de TypeORM em vez de banco em memória | Rapidez (~3 s por suíte) e foco na regra de negócio. A integração com PostgreSQL fica para o modo real do Cypress e para uma futura suíte com Testcontainers |

## 7. Como manter a suíte

- **Ao corrigir um DEF**, rode a suíte. O teste `it.failing` correspondente vai falhar; troque-o por `it` e atualize a tabela da seção 5.
- **Ao criar um endpoint**, acrescente uma linha à matriz de `controllers.test.ts`; o teste falha se o endpoint não tiver *guards*.
- **Ao criar uma tela**, use `montar(View, { caminho, perfil })` de `frontend/test-jest/support/montar.ts`.
- **Antes de abrir um PR**, rode `npm run test:jest:cov` nos dois pacotes. O backend tem limite mínimo de cobertura (`coverageThreshold`: 80% de statements e linhas, 70% de branches).
- **Autoria dos commits:** os commits desta branch foram criados com um autor genérico. Antes do push, rode `git rebase dev --exec "git commit --amend --no-edit --reset-author"` para que fiquem no nome de quem os envia.
