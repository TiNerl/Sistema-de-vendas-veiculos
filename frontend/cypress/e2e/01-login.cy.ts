/**
 * E2E – UC01 Autenticar usuário e UC18 Encerrar sessão.
 */
import { USUARIOS } from '../support/commands'

const api = () => Cypress.expose('apiUrl') as string

describe('UC01 – Login', () => {
  beforeEach(() => cy.visit('/'))

  it('exibe o formulário de acesso', () => {
    cy.contains('h1', 'Acesse sua conta').should('be.visible')
    cy.get('#login-cpf').should('have.attr', 'placeholder', '000.000.000-00')
    cy.get('#login-senha').should('have.attr', 'type', 'password')
  })

  it('valida CPF e senha no navegador, sem chamar a API', () => {
    cy.intercept('POST', `${api()}/auth/login`, cy.spy().as('login'))
    cy.get('#login-cpf').type('123.456.789-00')
    cy.contains('button', 'Entrar').click()
    cy.get('#login-cpf-erro').should('have.text', 'Informe um CPF válido.')
    cy.get('#login-senha-erro').should('have.text', 'Informe sua senha.')
    cy.get('@login').should('not.have.been.called')
  })

  it('administrador entra e é levado ao painel /dashboard', () => {
    cy.intercept('POST', `${api()}/auth/login`, { statusCode: 201, body: { accessToken: 'jwt-admin' } }).as('login')
    cy.intercept('GET', `${api()}/auth/perfil`, { body: USUARIOS.admin }).as('perfil')

    cy.get('#login-cpf').type('111.444.777-35')
    cy.get('#login-senha').type('segredo1')
    cy.contains('button', 'Entrar').click()

    cy.wait('@login').its('request.body').should('deep.equal', { cpf: '11144477735', senha: 'segredo1' })
    cy.wait('@perfil').its('request.headers.authorization').should('eq', 'Bearer jwt-admin')
    cy.location('pathname').should('eq', '/dashboard')
    cy.window().its('sessionStorage').invoke('getItem', 'accessToken').should('eq', 'jwt-admin')
  })

  it('vendedor entra e é levado à área /vendedor', () => {
    cy.intercept('POST', `${api()}/auth/login`, { statusCode: 201, body: { accessToken: 'jwt-vend' } })
    cy.intercept('GET', `${api()}/auth/perfil`, { body: USUARIOS.vendedor })
    cy.get('#login-cpf').type('52998224725')
    cy.get('#login-senha').type('segredo1{enter}')
    cy.location('pathname').should('eq', '/vendedor')
  })

  it('credenciais inválidas: mensagem genérica e permanece no login', () => {
    cy.intercept('POST', `${api()}/auth/login`, {
      statusCode: 401, body: { statusCode: 401, message: 'Credenciais inválidas', error: 'Unauthorized' },
    })
    cy.get('#login-cpf').type('11144477735')
    cy.get('#login-senha').type('errada{enter}')
    cy.get('[role="alert"]').should('contain', 'CPF ou senha inválidos')
    cy.location('pathname').should('eq', '/')
  })

  it('mostrar/ocultar senha', () => {
    cy.get('#login-senha').type('segredo1')
    cy.get('button[aria-label="Mostrar senha"]').click()
    cy.get('#login-senha').should('have.attr', 'type', 'text')
    cy.get('button[aria-label="Ocultar senha"]').should('have.attr', 'aria-pressed', 'true')
  })
})

describe('UC18 – Encerrar sessão', () => {
  it('"Sair" remove o token e volta ao login; voltar no histórico não reabre a área protegida', () => {
    cy.entrarComo('admin', '/dashboard')
    cy.contains('button', 'Sair').click()
    cy.location('pathname').should('eq', '/')
    cy.window().its('sessionStorage').invoke('getItem', 'accessToken').should('be.null')
    cy.go('back')
    cy.location('pathname').should('eq', '/')
  })
})

export {}
