/**
 * E2E de integração contra a API REAL (sem stubs). Executa somente com
 *   CYPRESS_ADMIN_CPF=... CYPRESS_ADMIN_SENHA=... npx cypress run --expose REAL_API=true
 * Pré-requisitos: `docker compose up` e um administrador de teste cadastrado.
 */
const habilitado = Cypress.expose('REAL_API') === true || Cypress.expose('REAL_API') === 'true'
const descrever = habilitado ? describe : describe.skip

descrever('Integração real (frontend → API → PostgreSQL)', () => {
  let cpf = ''
  let senha = ''
  before(() => {
    cy.env(['ADMIN_CPF', 'ADMIN_SENHA']).then((segredos) => {
      cpf = String(segredos.ADMIN_CPF)
      senha = String(segredos.ADMIN_SENHA)
    })
  })

  it('login real do administrador e listagem do estoque', () => {
    cy.visit('/')
    cy.get('#login-cpf').type(cpf)
    cy.get('#login-senha').type(`${senha}{enter}`, { log: false })
    cy.location('pathname').should('eq', '/dashboard')
    cy.visit('/admin/veiculos')
    cy.contains('h1', 'Estoque de Veículos').should('be.visible')
    cy.get('[role="alert"]').should('not.exist')
  })

  it('API: 401 sem token', () => {
    cy.request({ url: `${Cypress.expose('apiUrl')}/veiculos`, failOnStatusCode: false }).its('status').should('eq', 401)
  })

  it('[DEF-01] GET /veiculos?anoMin=2020 deveria responder 200 (hoje: 400)', () => {
    cy.request('POST', `${Cypress.expose('apiUrl')}/auth/login`, { cpf, senha }).then(({ body }) => {
      cy.request({
        url: `${Cypress.expose('apiUrl')}/veiculos?anoMin=2020`,
        headers: { Authorization: `Bearer ${body.accessToken}` },
        failOnStatusCode: false,
      }).its('status').should('eq', 200)
    })
  })
})

export {}
