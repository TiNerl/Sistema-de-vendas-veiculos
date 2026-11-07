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
| **Entrega 2** — Frontend (E2E) | Cypress 16: 33 cenários com API simulada + 3 de integração real | [`frontend/cypress/`](frontend/cypress) |
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

Medição de 07/11/2026, sobre o commit `64dd43d` da `dev`, com Node.js 22.

| Suíte | Testes | Sucesso | Statements | Branches | Funções | Linhas |
|---|---:|---:|---:|---:|---:|---:|
| Backend — Jest | 184 | **100%** | 97,79% | 87,24% | 90,10% | 97,77% |
| Frontend — Jest | 123 | **100%** | 94,11% | 89,53% | 89,56% | 95,65% |
| Frontend — Cypress | 33 (+3 reais) | não executado neste ambiente¹ | — | — | — | — |

¹ O binário do Cypress não pôde ser baixado no ambiente em que a suíte foi escrita. Os specs passam na checagem de tipos (`npm run typecheck:tests`), mas **precisam ser executados localmente**; os resultados entram no relatório (seção 5).

Detalhamento por arquivo, matriz de rastreabilidade e cenários: [relatório de testes](docs/entrega-2-testes/RELATORIO-DE-TESTES.md).

## 3. Como executar

### Pré-requisitos

- Node.js `^22.18` ou `>=24.12`, conforme o `engines` do frontend.
- Dependências instaladas em cada pacote:

```bash
cd backend  && npm install
cd ../frontend && npm install
```

> `npm ci` falha hoje no backend porque o `package-lock.json` da `dev` está fora de sincronia com o `package.json` (DEF-08). Esta branch já traz o lockfile regenerado.

### Backend (Jest)

```bash
cd backend
npm run test:jest          # executa os 184 testes
npm run test:jest:cov      # com cobertura → backend/coverage-jest/ (abra lcov-report/index.html)
npm run test:jest:watch    # modo observação, durante o desenvolvimento
npx jest test-jest/unit/vendas        # apenas uma pasta
npx jest -t "desconto especial"       # apenas testes cujo nome contém o texto
```

Os testes não usam banco de dados: repositórios e transações do TypeORM são substituídos por dublês. Os testes de API HTTP sobem uma aplicação Nest real em memória, com JWT de verdade.

### Frontend (Jest)

```bash
cd frontend
npm run test:jest          # executa os 123 testes
npm run test:jest:cov      # com cobertura → frontend/coverage-jest/
npm run typecheck:tests    # checagem de tipos dos testes Jest e Cypress
```

### Frontend E2E (Cypress)

**Modo padrão (API simulada).** Basta o frontend estar rodando; o backend é substituído por `cy.intercept`.

```bash
# terminal 1
cd frontend && npm run dev                # http://localhost:5173, com VITE_API_URL=http://localhost:3000

# terminal 2
cd frontend
npx cypress install                       # primeira vez: baixa o binário (~250 MB)
npm run test:e2e:cypress                  # modo headless (CI)
npm run cypress:open                      # modo interativo
```

**Modo integração real** (`99-integracao-real.cy.ts`). Exige a aplicação completa e um administrador de teste.

```bash
docker compose up -d
cd frontend
CYPRESS_ADMIN_CPF=11144477735 CYPRESS_ADMIN_SENHA='senha-de-teste' \
  npx cypress run --expose REAL_API=true
```

> No Cypress 16, valores públicos são lidos com `Cypress.expose()` (configurados em `expose` ou por `--expose`), e segredos com `cy.env()` (variáveis `CYPRESS_*`). Se a sua versão local for anterior à 16, troque `--expose` por `--env`.

### Tudo de uma vez

```bash
(cd backend && npm run test:jest:cov) && (cd frontend && npm run test:jest:cov)
```

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
