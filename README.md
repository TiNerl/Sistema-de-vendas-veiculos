<div aling="center">
    
# AutoSaller 

AutoSaller é um sistema de venda de veículos no geral, projetado pensando no contato entre 
| cliente -> vendedor | respeitando a hierarquia corporativa.    

## Sobre:

O **AutoSaller** é um projeto de sistema didatico feito para a disciplina de Seminários do Projeto Integrador do curso de Tecnologia de Sistemas para Internet (Matriz 2019) do Instituto Federal do Rio Grande do Norte (IFRN).

---

## PoC, MVP e Product:
- PoC (Prova de Conceito): “Isso é possível?” Orienta a propria equipe sobre a viabilidade das ideias, o projeto de baixa fidelidade é descartado no final.
- MVP (Produto Mínimo Viável): “Isso resolve o problema de alguém?” Foca na compreensão intensiva do Usuário real (possíveis clientes), esse estudo gera a Base do produto.
- Product (Produto em operação): “Isso se sustenta e escala?” Foco na compreensão, estudo de complexidade e expansão em relação ao uso diversos usuários (massa de clientes) simultâneamente, a longo prazo a consequência esperada é a evolução do sistema.

## Âncoras da disciplina do Projeto Integrador:

- Bancos de Dados Modelo relacional normalizado -> pelo menos uma consulta não trivial (junção, agregação, subconsulta) · integridade garantida no banco, não só na tela · script de criação e de carga versionado 

- Sistemas Corporativos Separação em camadas -> persistência via ORM ou camada de acesso a dados · autenticação com perfis distintos de usuário · pelo menos um relatório ou visão consolidada 

- Processo de Desenvolvimento Backlog escrito e priorizado -> controle de versão com histórico real · algum nível de teste · sistema implantado e acessível por URL

## Requisitos da disciplina de Projeto integrador:

A disciplina espera que os alunos dominem o uso das três âncores enquanto enfentam uma entrega real de um sistema completo ponta-a-ponta (que inicia e termina em um ciclo completo) utilizando os conhecimentos adquiridos nas disciplinas anteriores.

Exemplo: Usuário abre a URL -> Faz login com perfil -> Preenche e envia -> regra de negócio válida -> Grava no banco -> Vê oos resultados. (qualquer elo dessa corrente faltando significa reprovação)

Tudo isso rodando em um servidor acessível, no ambiete de produção simulando a máquina do cliente.

## Erros comuns: 

- Dividir por camada: Um faz o front, outro o back, outro o banco. Ninguém integra até a última semana — e aí nada encaixa
- Sumir e reaparecer no fim: O histórico do Git mostra tudo. Commit em massa na véspera é evidência, não trabalho

## Escopo mínimo esperado para as disciplinas do projeto integrador

- Um domínio de problema real e delimitado, com usuário identificável 
- Uma consulta ou relatório que agregue dados de mais de uma tabela 
- Cadastro e autenticação, com pelo menos dois perfis de acesso diferentes 
- Pelo menos 3 entidades relacionadas no banco, com integridade referencial Um fluxo principal completo (o “caminho feliz”) funcionando sem erros 
- Operações de criar, listar, editar e remover sobre as entidades centrais Validação de dados e tratamento de erro visível para o usuário 
- Repositório Git com histórico distribuído entre os integrantes 
- Sistema implantado e acessível por URL, com dados de exemplo carregados 
- Relatório técnico em normas da ABNT

## Foco no desenvolvimento em fatias verticais 
CERTO — por fatias que atravessam tudo 

    Fatia 1: login funciona de verdade 
    Fatia 2: cadastrar e listar um item 
    Fatia 3: editar, remover, validar 
    Fatia 4: relatório consolidado 
    
    Cada fatia já sobe para o ar

## Diferenças entre o Orientador e o Coordenador
PROFESSOR COORDENADOR -> Um por turma, designado pelo curso • Articula as disciplinas âncoras entre si • Conduz os encontros do Seminário • Define e aplica os marcos avaliativos • Compõe a banca final 

PROFESSOR ORIENTADOR -> Um por grupo, entre os professores do curso • Acompanha o seu projeto especificamente • Aponta dificuldades e sugere caminhos • Orienta bibliografia e escrita técnica • Deve ser procurado toda semana, não no fim

## Os 15 encontros em quatro blocos 
Cada bloco termina em um marco com nota. Não dá para empurrar nada para o fim. ENCONTROS 1–4 Concepção Grupos, tema, escopo, requisitos, modelo de dados e orientador definido. M1 ENCONTROS 5–8 Esqueleto Arquitetura, ambiente, versionamento e o primeiro fluxo atravessando o sistema. M2 ENCONTROS 9–12 Construção Autenticação, CRUDs, regras de negócio, consultas, testes e homologação. M3 ENCONTROS 13–15 Entrega Implantação, relatório técnico, ensaio e defesa perante a banca. M4

## Os quatro marcos com nota 

Espaçados de propósito. A ideia é que ninguém descubra em novembro que o projeto não existe. M1 Proposta do Projeto Encontro 4  ·  1º bimestre · peso 40% Documento + pitch de 5 min: problema, escopo mínimo, equipe, orientador aceito, backlog inicial, modelo de dados preliminar e cronograma. M2 PoC ponta a ponta Encontro 8  ·  1º bimestre · peso 60% Demonstração ao vivo de um fluxo completo: tela → regra → banco → resposta. Repositório com histórico distribuído entre os integrantes. M3 MVP em homologação Encontro 12  ·  2º bimestre · peso 40% Sistema acessível por URL, com autenticação, dois perfis, CRUDs centrais, consulta consolidada e dados de exemplo. Relatório parcial. M4 Entrega final e banca Encontro 15  ·  2º bimestre · peso 60% Sistema publicado, relatório técnico em ABNT, apresentação e arguição individual perante a banca das disciplinas vinculadas
---

## Rubrica do projeto final da disciplina de Sistemas Corporativos (50 pontos)

| Critério | Pontos |
|---|---:|
| Domínio, requisitos e valor corporativo | 8 |
| Arquitetura, modularidade e decisões registradas | 10 |
| Segurança, dados, transações e auditoria | 8 |
| Integração, resiliência e observabilidade | 8 |
| Testes, CI, contêineres e execução reproduzível | 6 |
| Documentação, demonstração e defesa | 10 |

## Regras gerais disciplina de Sistemas Corporativos

O trabalho em equipe, todos devem dominar o conjunto da solução;
a defesa individual pode ajustar a nota. Código ou texto de 
terceiros devem ser identificados e referenciados. Entregas devem 
incluir instruções reproduzíveis e histórico de versão.

---
# Referências
