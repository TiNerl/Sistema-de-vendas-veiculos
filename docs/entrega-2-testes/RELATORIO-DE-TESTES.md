# Relatório de Execução e Cobertura de Testes — Entrega 2

| Campo | Valor |
|---|---|
| **Projeto** | AutoSaller — Sistema de Gestão de Vendas de Automóveis |
| **Disciplina** | Engenharia de Software · Prazo: 15/11/2026 |
| **Branch / base** | `dev-alt-tests`, criada a partir de `dev` @ `64dd43d` (06/11/2026) |
| **Data da execução** | 07/11/2026 |
| **Ambiente** | Linux (Ubuntu 24, contêiner), Node.js 22.23.4, npm 10.9 |
| **Ferramentas** | Jest 30.5.2 + SWC 1.16 · Vue Test Utils 2.5 + jsdom · Supertest 7 · Cypress 16.2.1 |
| **Responsável pela execução** | _(preencher: nome do integrante)_ |

---

## 1. Resumo executivo

| Indicador | Backend (Jest) | Frontend (Jest) | Frontend E2E (Cypress) |
|---|---:|---:|---:|
| Suítes (arquivos) | 10 | 9 | 7 |
| Casos de teste | 184 | 123 | 36 (33 simulados + 3 reais) |
| Aprovados | 184 | 123 | _(preencher após execução local)_ |
| Reprovados | 0 | 0 | _(preencher)_ |
| **Taxa de sucesso** | **100%** | **100%** | _(preencher)_ |
| Testes que documentam defeitos (`it.failing`) | 11 | 1² | 2 |
| Tempo de execução | ≈ 3,1 s | ≈ 3,0 s | _(preencher)_ |
| Cobertura de statements | **97,79%** (400/409) | **94,11%** (1215/1291) | — |
| Cobertura de branches | **87,24%** (130/149) | **89,53%** (1087/1214) | — |
| Cobertura de funções | **90,10%** (82/91) | **89,56%** (266/297) | — |
| Cobertura de linhas | **97,77%** (395/404) | **95,65%** (1146/1198) | — |

² No frontend, o DEF-10 é documentado por um teste comum, que registra o comportamento atual; a falha correspondente ocorre na API.

**Conclusão.** As duas suítes Jest estão integralmente aprovadas e superam com folga a meta de 80% de cobertura de linhas. Ao mesmo tempo, os testes revelaram **10 defeitos**, dois deles de gravidade alta (exposição do hash de senha e filtro de ano quebrado). Cada defeito é reproduzido por um teste executável, de modo que a correção pode ser verificada automaticamente.

> **Sobre o Cypress.** Os 36 cenários E2E foram escritos e passam na checagem de tipos do TypeScript. Eles **não puderam ser executados no ambiente de elaboração**, porque o download do binário do Cypress foi bloqueado (`ENOTFOUND download.cypress.io`). Execute-os localmente (seção 7) e preencha as linhas marcadas acima e a tabela da seção 4.3.

## 2. Estratégia de testes

| Nível | O que valida | Ferramenta | Dependências externas |
|---|---|---|---|
| **Unitário — backend** | Regras de negócio dos serviços, guards, estratégias de autenticação, validações dos DTOs, matriz de permissões | Jest + SWC + `@nestjs/testing` | Nenhuma: TypeORM substituído por dublês |
| **API / componente HTTP — backend** | Aplicação Nest real, com Express, `ValidationPipe`, JWT assinado e guards, verificando códigos HTTP e contratos JSON | Jest + Supertest | Nenhuma: serviços simulados |
| **Unitário/componente — frontend** | Store Pinia, serviços HTTP, interceptor do axios, guards do router e telas Vue renderizadas em jsdom | Jest + Vue Test Utils | Nenhuma: serviços HTTP simulados |
| **End-to-end — frontend** | Fluxos completos no navegador: login, controle de acesso, estoque, cadastros e responsividade | Cypress | Vite em execução; API simulada por `cy.intercept` |
| **Integração real** | Navegador → API → PostgreSQL | Cypress (`99-integracao-real.cy.ts`) | `docker compose up` e usuário de teste |

**Técnicas aplicadas**
- **Partição de equivalência e análise de valor-limite:** desconto de 9,99%, 10% e 15%; ano 1885, 1886 e o ano seguinte ao atual; preço 0 e 0,01; CPF com 10 e 11 dígitos; placa no padrão antigo e no Mercosul.
- **Tabelas de decisão:** perfil × rota (matriz RNF005); perfil × percentual de desconto → status da venda e do veículo.
- **Teste de transição de estados:** veículo (`disponivel`, `reservado`, `vendido`, `em_manutencao`) e venda (`pendente`, `concluida`, `cancelada`).
- **Teste de concorrência simulada:** `UPDATE ... WHERE status = 'disponivel'` com `affected = 0`, para provar a proteção contra venda dupla.
- **Teste de segurança:** token ausente, adulterado ou expirado; acesso por URL direta; *open redirect* no login; exposição de hash.
- **Testes como documentação de defeitos:** `it.failing`.

## 3. Cobertura de código detalhada

### 3.1 Backend

| Arquivo | Stmts % | Branch % | Funcs % | Lines % |
|---|---:|---:|---:|---:|
| `auth/auth.service.ts` | 100 | 100 | 100 | 100 |
| `auth/guards/roles.guard.ts` | 100 | 100 | 100 | 100 |
| `auth/strategies/jwt.strategy.ts` · `local.strategy.ts` | 100 | 100 | 100 | 100 |
| `auth/auth.controller.ts` | 100 | 100 | 100 | 100 |
| `usuarios/usuarios.service.ts` · `usuarios.controller.ts` | 100 | 100 | 100 | 100 |
| `clientes/clientes.service.ts` | 100 | 93,75 | 100 | 100 |
| `clientes/clientes.controller.ts` | 92,85 | 100 | 83,33 | 92,85 |
| `veiculos/veiculos.service.ts` | 100 | 97,29 | 100 | 100 |
| `veiculos/veiculos.controller.ts` | 100 | 100 | 100 | 100 |
| `veiculos/dto/criar-veiculo.dto.ts` | 100 | 50 | 100 | 100 |
| `veiculos/dto/atualizar-veiculo.dto.ts` | 50 | 8,33 | 16,66 | 50 |
| `veiculos/dto/filtrar-veiculos.dto.ts` · `atualizar-status-veiculo.dto.ts` | 100 | 100 | 100 | 100 |
| `vendas/vendas.service.ts` · `vendas.controller.ts` | 100 | 100 | 100 | 100 |
| `vendas/venda.entity.ts` | 62,5 | 100 | 0 | 62,5 |
| `relatorios/relatorios.service.ts` · `relatorios.controller.ts` | 100 | 100 | 100 | 100 |
| DTOs de clientes, usuários, vendas e relatórios | 100 | 100 | 100 | 100 |
| Entidades `usuario`, `cliente`, `veiculo` · `app.*` | 100 | 100 | 100 | 100 |
| **Total** | **97,79** | **87,24** | **90,10** | **97,77** |

Ficam fora da medição: `main.ts` (bootstrap) e `*.module.ts` (apenas composição de dependências).

**Leitura das lacunas**
- `atualizar-veiculo.dto.ts` e as branches de `criar-veiculo.dto.ts` correspondem às funções `@Transform(({ value }) => typeof value === 'string' ? … : value)`. O ramo "valor não-string" nunca é exercitado, e várias transformações do DTO de atualização não são exercitadas campo a campo. Isso não representa risco de regra de negócio; um teste adicional enviando números nesses campos fecharia a lacuna.
- `venda.entity.ts`: as funções-seta de `@ManyToOne(() => Cliente)` só são invocadas pelo TypeORM ao montar metadados com uma conexão real, que não existe nos testes unitários.
- `clientes.controller.ts`: o método `cadastrar` do controller não é exercitado diretamente; a regra correspondente é coberta no serviço.

### 3.2 Frontend

| Arquivo | Stmts % | Branch % | Funcs % | Lines % |
|---|---:|---:|---:|---:|
| `services/*.ts` · `stores/auth.ts` · `types/veiculo.ts` | 100 | 100 | 100 | 100 |
| `router/index.ts` | 97,56 | 81,25 | 100 | 97,36 |
| `views/LoginView.vue` | 100 | 98,43 | 100 | 100 |
| `views/ListaUsuariosView.vue` | 100 | 98,30 | 100 | 100 |
| `views/CadastrarVeiculoView.vue` | 97,32 | 89,76 | 97,95 | 98,57 |
| `views/VeiculosVendedorView.vue` | 96,17 | 90,34 | 95,12 | 97,61 |
| `views/InativarUsuarioView.vue` | 94,11 | 92,42 | 84,21 | 95,06 |
| `views/CadastrarClienteView.vue` | 93,02 | 87,62 | 92,10 | 93,78 |
| `views/CadastrarUsuarioView.vue` | 91,86 | 93,42 | 86,66 | 98,64 |
| `views/ClientesView.vue` | 81,56 | 76,29 | 75,00 | 86,61 |
| `layouts/VendLayout.vue` | 93,02 | 100 | 78,57 | 92,68 |
| `layouts/AdminLayout.vue` | 83,63 | 94,73 | 60,86 | 82,69 |
| `views/DashboardView.vue` | 100 | 68,18 | 100 | 100 |
| `views/VendedorDashboardView.vue` · `ModuloVendedorView.vue` | 100 | 100 | 100 | 100 |
| **Total** | **94,11** | **89,53** | **89,56** | **95,65** |

> Para arquivos `.vue`, a cobertura é calculada sobre o componente **compilado** (script + função de render gerada a partir do template). Por isso o relatório HTML os lista como `*.vue.ts`, e os números de linha não cobertos referem-se ao código gerado. As lacunas restantes são majoritariamente manipuladores de clique de navegação (fechar menu móvel, links do layout) e o diálogo de histórico de clientes.

## 4. Cenários testados

### 4.1 Backend — 184 casos

| Suíte | Casos | Cenários principais | UC / requisito |
|---|---:|---|---|
| `auth/auth.service.test.ts` | 5 | CPF inexistente; usuário inativo não autentica e a senha nem é comparada; senha incorreta; `bcrypt.compare` contra o hash; payload do JWT sem senha | UC01, RNF004, RF-USU-15 |
| `auth/guards-e-estrategias.test.ts` | 10 | `RolesGuard` com e sem perfis exigidos (tabela de decisão); requisição sem usuário; `LocalStrategy` → 401 genérico; `JwtStrategy` mapeia o payload; falha segura sem `JWT_SECRET` | RNF005 |
| `usuarios/usuarios.service.test.ts` | 9 | Listagem sem senha; 404; `select` explícito da senha no login; hash com custo 10; inativação exige id + CPF; 409 se já inativo; inativação lógica · **DEF-05** | UC02–UC04 |
| `clientes/clientes.service.test.ts` | 14 | Duplicidade por CPF ou e-mail, com mensagens específicas; criado como ativo; busca vazia ou com espaços; busca parcial em 3 campos; PATCH parcial; 404; inativação lógica · **DEF-06** | UC05–UC08 |
| `veiculos/veiculos.service.test.ts` | 18 | Status inicial `disponivel`; preço com 2 casas; unicidade em uma consulta; filtros combinados; `precoMin = 0` não é ignorado; faixa invertida → 400 antes do banco; edição verifica só os identificadores enviados e exclui o próprio veículo · **DEF-03** (2) | UC09–UC12 |
| `vendas/vendas.service.test.ts` | 30 | Pré-condições (usuário, cliente, cliente inativo, veículo, 3 status indisponíveis); transação única; cálculo de desconto e comissão (R$ 100.000 → comissão R$ 3.000; R$ 80.000 com 5% → R$ 76.000 e comissão R$ 2.280); `UPDATE` condicional; concorrência → 409; vendedor com 15% → pendente/reservado; admin com 15% → concluída; 9,99% → concluída; aprovar e rejeitar (404, transições, 2 conflitos concorrentes); histórico com joins, filtros e data final inclusiva · **DEF-02** | UC13–UC16, RF-VEN-01..05 |
| `relatorios/relatorios.service.test.ts` | 5 | Somente vendas concluídas; agregação por ano/mês; só data inicial; data final inclusiva; período invertido → 400 sem consultar o banco | UC17, RF-REL-01 |
| `controllers/controllers.test.ts` | 26 | Matriz com os 17 endpoints protegidos × perfis; login e perfil; delegação dos 7 controllers; vendedor da venda vem do JWT · **DEF-04** (3) | RNF005, RF-USU-* |
| `dto/validacao-dtos.test.ts` | 52 | Placa (antiga e Mercosul), chassi (17 caracteres, sem I/O), RENAVAM, ano 1885/futuro, quilometragem negativa, combustível e câmbio, preço 0 ou com 3 casas, campos só com espaços; rejeição de `status` e `id_usuario` no corpo; normalização (trim, maiúsculas, hífen); mensagens em português do cliente; perfil, senha e CPF do usuário; desconto > 100, negativo ou com 3 casas; datas ISO · **DEF-01** | RF-EST-04, RF-CLI-05 |
| `api/http.test.ts` | 15 | 401 sem token, com token adulterado e com token expirado; 200 com token válido; 403 para vendedor em `/usuarios` e `/vendas/:id/aprovar`; 201 com corpo normalizado; 400 com lista de mensagens; `ParseIntPipe`; conversão da query string; vendedor = `sub` do token; formato padrão de erro 404 · **DEF-01**, **DEF-07** | RNF004, RNF005, contratos REST |

### 4.2 Frontend (Jest) — 123 casos

| Suíte | Casos | Cenários principais | UC / requisito |
|---|---:|---|---|
| `stores/auth.store.test.ts` | 7 | Restaura a sessão do `sessionStorage`; login grava o token e carrega o perfil; 401 → mensagem específica e limpeza da sessão; 500 ou rede → mensagem genérica; perfil sem token; sair | UC01, UC18 |
| `services/services.test.ts` | 13 | Verbo, URL e corpo de cada endpoint; `?busca` só com termo; normalização de placa, chassi e preço; `mensagemErroApi` (texto, lista, ausente); utilitários de veículo | Contratos REST |
| `services/api.test.ts` | 3 | `baseURL` de `VITE_API_URL`; `Authorization: Bearer` quando há sessão; sem cabeçalho na tela de login | UC01 |
| `router/guards.test.ts` | 16 | Visitante → login com `redirect`; recarga com token busca o perfil; token expirado encerra a sessão; 5 redirecionamentos entre perfis; 4 acessos permitidos; autenticado no login vai ao painel; toda rota tem título | RNF005, UC01-FA1/FA2 |
| `views/LoginView.test.ts` | 14 | 4 CPFs inválidos (vazio, curto, repetido, dígito verificador errado); senha obrigatória; erro some ao digitar; CPF só com dígitos; destino por perfil; `redirect` interno; **bloqueio de open redirect** (`//…` e `https://…`); alerta acessível; mostrar senha; botão desabilitado contra duplo envio | UC01 |
| `views/VeiculosVendedorView.test.ts` | 13 | Formatação em R$, km e rótulos; mensagem pós-cadastro; filtros enviados só quando preenchidos; `anoMin/anoMax` (contrato do DEF-01); faixas de preço e ano invertidas; limpar filtros; erro + tentar novamente; vendedor sem botão de status; veículo vendido bloqueado; transição única + confirmação; cancelar; erro mantém o diálogo | UC10, UC12 |
| `views/CadastrarVeiculoView.test.ts` | 17 | Envio normalizado; retorno por perfil; 9 erros de formulário vazio; 6 regras de formato; 409 e lista de validação do backend; edição carrega, salva com PATCH, trata 404 e id inválido; cancelar · **DEF-10** | UC09, UC11 |
| `views/Clientes.test.ts` | 20 | Formatação de CPF e telefone; *debounce* de 300 ms; CPF mascarado enviado só com dígitos; inativo sem ação de inativar; inativação com confirmação e erro; edição por perfil; detalhes; tentar novamente; cadastro normalizado; 6 validações; 409; edição e 404 | UC05–UC08 |
| `views/Usuarios-e-layouts.test.ts` | 20 | Cadastro de usuário (perfil padrão e admin, 5 validações, erro da API); filtros da lista; inativação só com CPF redigitado e conferido; pré-seleção; logout nos dois layouts; menu móvel; painéis | UC02–UC04, UC18 |

### 4.3 Frontend E2E (Cypress) — 36 casos

| Spec | Casos | Cenários | Resultado |
|---|---:|---|---|
| `01-login.cy.ts` | 7 | Formulário; validação sem chamada à API; login de admin (corpo e header Bearer conferidos, token na sessão); login de vendedor; 401; mostrar senha; logout + botão “voltar” do navegador | _(preencher)_ |
| `02-controle-de-acesso.cy.ts` | 8 | `redirect` e retorno após login; 5 rotas de admin digitadas por vendedor; admin em rota de vendedor; sessão expirada | _(preencher)_ |
| `03-estoque.cy.ts` | 7 | Listagem; query string dos filtros; faixa inválida; impacto do DEF-01 na tela; vendedor sem ação; admin altera status (corpo do PATCH); vendido bloqueado | _(preencher)_ |
| `04-cadastro-de-veiculo.cy.ts` | 4 | Cadastro com corpo normalizado; erros por campo; 409; edição a partir da listagem | _(preencher)_ |
| `05-clientes.cy.ts` | 4 | Busca por CPF mascarado; cadastro normalizado; CPF duplicado; inativação | _(preencher)_ |
| `06-responsividade.cy.ts` | 3 | 390, 820 e 1366 px sem rolagem horizontal (login e estoque) | _(preencher)_ |
| `99-integracao-real.cy.ts` | 3 | Login real e estoque; 401 sem token; DEF-01 na API real | _(pulado sem `REAL_API`)_ |

## 5. Rastreabilidade casos de uso × testes

| Caso de uso | Backend unit | Backend API | Frontend unit | Cypress |
|---|:---:|:---:|:---:|:---:|
| UC01 Autenticar | ✔ | ✔ | ✔ | ✔ |
| UC02 Cadastrar usuário | ✔ | — | ✔ | — |
| UC03 Inativar usuário | ✔ | — | ✔ | — |
| UC04 Consultar usuários | ✔ | ✔ | ✔ | ✔ (acesso) |
| UC05 Cadastrar cliente | ✔ | — | ✔ | ✔ |
| UC06 Consultar clientes | ✔ | — | ✔ | ✔ |
| UC07 Editar cliente | ✔ | — | ✔ | — |
| UC08 Inativar cliente | ✔ | — | ✔ | ✔ |
| UC09 Cadastrar veículo | ✔ | ✔ | ✔ | ✔ |
| UC10 Consultar estoque | ✔ | ✔ | ✔ | ✔ |
| UC11 Editar veículo | ✔ | — | ✔ | ✔ |
| UC12 Alterar status | ✔ | — | ✔ | ✔ |
| UC13 Registrar venda | ✔ | ✔ | — (sem tela) | — |
| UC14 Desconto especial | ✔ | — | — (sem tela) | — |
| UC15 Aprovar/reprovar | ✔ | ✔ (403) | — (sem tela) | — |
| UC16 Histórico de vendas | ✔ | ✔ | — (sem tela) | — |
| UC17 Faturamento | ✔ | — | — (sem tela) | — |
| UC18 Encerrar sessão | — | — | ✔ | ✔ |
| RNF001 Responsividade | — | — | — | ✔ |
| RNF004 Hash de senha | ✔ | ✔ (DEF-07) | — | — |
| RNF005 Acesso por perfil | ✔ | ✔ | ✔ | ✔ |

Os casos de uso de vendas e relatórios ainda não têm tela (`ModuloVendedorView` exibe “Em breve”). Os testes de frontend e E2E desses fluxos devem acompanhar a fatia 4.

## 6. Defeitos encontrados

Todos os defeitos têm teste executável, exceto DEF-08 e DEF-09, que foram constatados por inspeção ou execução. Os testes `it.failing` **passam enquanto o defeito existe**; quando a correção é feita, eles falham e sinalizam que devem ser convertidos em `it`.

| ID | Gravidade | Descrição | Evidência | Correção sugerida |
|---|---|---|---|---|
| **DEF-07** | 🔴 Alta | `GET /vendas`, `GET /vendas/:id` e `POST /vendas` devolvem `usuario.senha` (hash bcrypt) a qualquer usuário autenticado. Viola RNF004 e RNF006. | `api/http.test.ts › [DEF-07]`: `options.select` da coluna é `undefined` | `@Column({ type: 'varchar', length: 255, select: false }) senha`. O `buscarParaLogin` já seleciona a senha explicitamente. |
| **DEF-01** | 🔴 Alta | O filtro por ano do estoque nunca funciona: a tela e o README usam `anoMin`/`anoMax`; o DTO só tem `ano`, e o `forbidNonWhitelisted` responde 400. Regressão do commit `1d0323a`. | `dto › [DEF-01]`; `api › [DEF-01]`: *expected 200, got 400* | Restaurar `anoMin`/`anoMax` no DTO e no serviço (`veiculo.ano >= :anoMin` / `<= :anoMax`) e validar `anoMin ≤ anoMax`. |
| **DEF-02** | 🟠 Média | Desconto de exatamente 10% concluído sem aprovação. Regra: ≥ 10% (RF-VEN-05; decisão registrada no README). | `vendas › [DEF-02]`: status recebido `concluida` | Trocar `percentualDesconto > 10` por `>= 10`. |
| **DEF-03** | 🟠 Média | `PATCH /veiculos/:id/status` aceita `vendido` e `reservado` e altera veículos reservados, o que permite “vender” sem venda. | `veiculos › [DEF-03]` (2 testes) | Permitir apenas `disponivel ↔ em_manutencao`; recusar com 400/409 quando o veículo tem venda pendente ou concluída. |
| **DEF-04** | 🟠 Média | `POST /veiculos`, `PATCH /veiculos/:id` e `PATCH /veiculos/:id/status` aceitam o perfil `vendedor`. RF-USU-08 e RF-USU-14 atribuem essas ações ao Administrador. | `controllers › [DEF-04]` (3 testes) | `@Roles('admin')` nesses três handlers e remoção das rotas `vendedor/veiculos/cadastrar` e `editar` no router. |
| **DEF-05** | 🟡 Baixa | `POST /usuarios` com CPF existente → 500 (violação de UNIQUE). | `usuarios › [DEF-05]` | Verificar com `findOneBy({ cpf })` antes de criar e lançar `ConflictException`. |
| **DEF-06** | 🟡 Baixa | `PATCH /clientes/:id` com CPF/e-mail de outro cliente → 500. | `clientes › [DEF-06]` | Mesma verificação do cadastro, com `id_cliente: Not(id)`. |
| **DEF-08** | 🟡 Baixa | A suíte Vitest da `dev` está vermelha: **9 de 26 testes falham** (`veiculos.service.spec` e `veiculos.controller.spec` chamam `filtrar()`, `excluir()` e `anoMin`, removidos em `6389d49`/`1d0323a`). Além disso, `npm ci` falha (lockfile dessincronizado). | Execução de `npx vitest run` no backend | Restaurar as funções ou atualizar os specs; rodar `npm install` e commitar o lockfile; adicionar CI que rode os testes a cada PR. |
| **DEF-09** | 🟡 Baixa | A busca de clientes diferencia maiúsculas (`Like`), enquanto a de veículos não (`ILike`). | Inspeção de `clientes.service.ts` (o teste fixa o uso atual de `Like`) | Usar `ILike`. |
| **DEF-10** | 🟡 Baixa | “Versão” é opcional no formulário, mas obrigatória na API → 400 com mensagem em inglês. | `CadastrarVeiculoView › [DEF-10]` | Tornar o campo obrigatório na tela ou opcional no DTO e na entidade (`nullable`). |

### Situação das suítes pré-existentes

| Suíte | Resultado em `dev` @ `64dd43d` |
|---|---|
| Backend — Vitest (`*.spec.ts`) | 17 aprovados · **9 reprovados** · 26 no total (DEF-08) |
| Frontend — Vitest (`src/__tests__`) | 23 aprovados · 0 reprovados (continua 23/23 nesta branch) |
| Frontend — Playwright (`e2e/vue.spec.ts`) | Não executado neste relatório |

## 7. Instruções de execução

```bash
# 1. Dependências (uma vez)
cd backend  && npm install
cd ../frontend && npm install && npx cypress install

# 2. Backend – testes + cobertura
cd backend
npm run test:jest:cov
#   Relatório HTML: backend/coverage-jest/lcov-report/index.html
#   Resumo JSON:    backend/coverage-jest/coverage-summary.json

# 3. Frontend – testes + cobertura
cd ../frontend
npm run test:jest:cov
#   Relatório HTML: frontend/coverage-jest/lcov-report/index.html

# 4. Frontend – E2E (API simulada)
npm run dev                        # em outro terminal
npm run test:e2e:cypress           # resultados no terminal; prints de falhas em cypress/screenshots

# 5. (Opcional) E2E contra a API real
docker compose up -d               # na raiz do repositório
CYPRESS_ADMIN_CPF=<cpf> CYPRESS_ADMIN_SENHA=<senha> npx cypress run --expose REAL_API=true
```

**Como interpretar a saída do Jest:** `Tests: 184 passed, 184 total` indica sucesso total. Testes marcados `[DEF-xx]` aparecem como aprovados porque são `it.failing`. Se algum deles começar a **reprovar**, isso significa que o defeito foi corrigido; troque `it.failing` por `it`.

**Para gerar os números deste relatório em formato de máquina:**

```bash
npx jest --coverage --json --outputFile=resultado-jest.json
```

## 8. Limitações e próximos passos

1. **Executar o Cypress localmente** e preencher as seções 1 e 4.3.
2. **Testes de integração com PostgreSQL real** (ex.: Testcontainers) para validar constraints UNIQUE, FKs e o comportamento transacional verdadeiro, que hoje só é verificado com dublês. Eles também confirmariam DEF-05 e DEF-06 contra o banco.
3. **CI no GitHub Actions** (`.github/workflows/` já existe vazio): rodar `test:jest:cov` nos dois pacotes a cada PR, publicar o `lcov` e bloquear o merge abaixo do limite de cobertura (rubrica: “Testes, CI, contêineres e execução reproduzível”).
4. **Fatias 4 a 6:** escrever testes de tela e E2E para venda, aprovação de desconto e relatórios assim que as telas existirem.
5. **Desempenho (RNF003):** medir `GET /veiculos` e `GET /relatorios/faturamento` com massa de dados (ex.: 10 mil vendas), com meta de ≤ 2 s.
