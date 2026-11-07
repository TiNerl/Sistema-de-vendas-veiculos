# Entrega 1 — Modelagem e Arquitetura do Sistema

**Projeto:** AutoSaller — Sistema de Gestão de Vendas de Automóveis
**Disciplina:** Engenharia de Software · **Prazo:** 10/11/2026
**Base da modelagem:** código da branch `dev` no commit `64dd43d` (06/11/2026), BRD/Planejamento do Projeto Integrador I e DER publicado em `docs/`.

## Documentos

| # | Documento | Conteúdo |
|---|---|---|
| 1 | [Casos de Uso](01-casos-de-uso.md) | Diagrama (Mermaid), atores, 22 casos de uso e especificação completa (pré-condições, fluxos principal e alternativos, pós-condições, regras) |
| 2 | [Arquitetura do Sistema](02-arquitetura.md) | Diagrama de blocos, implantação (Docker), sequência de login e de venda, protocolos, responsabilidades das camadas, catálogo de endpoints |
| 3 | [Estrutura de Dados](03-estrutura-de-dados.md) | DER (Mermaid), diagrama de classes, dicionário de dados com tipos, PK/FK, restrições e cardinalidades |

## Convenções usadas

Esta modelagem descreve **o sistema como ele está implementado** e, separadamente, **o que ainda está planejado**. A distinção é importante para a banca: um diagrama que mostra funcionalidades inexistentes como prontas não sobrevive à demonstração.

| Selo | Significado |
|---|---|
| ✅ **Implementado** | Existe no backend e no frontend, com fluxo ponta a ponta |
| 🟡 **Parcial** | Existe apenas no backend (API) ou apresenta defeito conhecido |
| ⚪ **Planejado** | Consta no BRD/cronograma, ainda sem código |

Os defeitos citados (DEF-01 a DEF-10) estão descritos e comprovados por testes automatizados na Entrega 2 ([relatório de testes](../entrega-2-testes/RELATORIO-DE-TESTES.md)).

## Rastreabilidade resumida

| Caso de uso | Requisitos | Módulo backend | Tela (frontend) | Status |
|---|---|---|---|---|
| UC01 Autenticar usuário | RNF004, RNF005 | `auth` | `LoginView` | ✅ |
| UC02 Cadastrar usuário | RF-USU-09 | `usuarios` | `CadastrarUsuarioView` | ✅ |
| UC03 Inativar usuário | RF-USU-15 | `usuarios` | `InativarUsuarioView` | ✅ |
| UC04 Consultar usuários | RF-USU-09 | `usuarios` | `ListaUsuariosView` | ✅ |
| UC05 Cadastrar cliente | RF-CLI-01, 05, RF-USU-01 | `clientes` | `CadastrarClienteView` | ✅ |
| UC06 Consultar clientes | RF-CLI-02, 11 | `clientes` | `ClientesView` | ✅ |
| UC07 Editar cliente | RF-CLI-03, 05 | `clientes` | `CadastrarClienteView` | 🟡 DEF-06 |
| UC08 Inativar cliente | RF-CLI-04 | `clientes` | `ClientesView` | ✅ |
| UC09 Cadastrar veículo | RF-EST-01, 04, RF-USU-08 | `veiculos` | `CadastrarVeiculoView` | 🟡 DEF-04 |
| UC10 Consultar estoque | RF-EST-02, 06, RF-USU-04 | `veiculos` | `VeiculosVendedorView` | 🟡 DEF-01 |
| UC11 Editar veículo | RF-EST-02, 04 | `veiculos` | `CadastrarVeiculoView` | 🟡 DEF-04 |
| UC12 Alterar status do veículo | RF-EST-03, RF-USU-14 | `veiculos` | `VeiculosVendedorView` | 🟡 DEF-03/04 |
| UC13 Registrar venda | RF-VEN-01..04, RF-USU-02 | `vendas` | — | 🟡 só API |
| UC14 Solicitar desconto especial | RF-VEN-05, RF-USU-06 | `vendas` | — | 🟡 só API, DEF-02 |
| UC15 Aprovar/reprovar desconto | RF-USU-12 | `vendas` | — | 🟡 só API |
| UC16 Consultar histórico de vendas | RF-VEN-06, RF-CLI-07 | `vendas` | — | 🟡 só API |
| UC17 Emitir relatório de faturamento | RF-REL-01 | `relatorios` | — | 🟡 só API |
| UC18 Encerrar sessão | RNF005 | — (stateless) | layouts | ✅ |
| UC19 Gerenciar test drive | RF-CLI-08, 09, RF-USU-05 | — | — | ⚪ |
| UC20 Cancelar venda | RF-VEN-07 | — | — | ⚪ |
| UC21 Consultar log de auditoria | RF-USU-16, RNF007 | — | — | ⚪ |
| UC22 Relatórios de estoque, desempenho e exportação | RF-REL-02..05, RF-USU-03, 07, 10 | — | — | ⚪ |
