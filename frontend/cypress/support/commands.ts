/// <reference types="cypress" />
/**
 * Comandos customizados.
 *
 * `cy.api(caminho)` monta a URL da API (Cypress.expose('apiUrl')), evitando que um
 * intercept de `/veiculos` capture também a página `/admin/veiculos` do frontend.
 *
 * `cy.entrarComo(perfil)` abre a aplicação já autenticada: grava um token falso no
 * sessionStorage antes do carregamento e simula `GET /auth/perfil`. É assim que o
 * router reconstrói a sessão ao recarregar a página (UC01).
 */
type Perfil = 'admin' | 'vendedor'

export const USUARIOS: Record<Perfil, { id: number; cpf: string; perfil: Perfil; nome: string }> = {
  admin: { id: 1, cpf: '11144477735', perfil: 'admin', nome: 'Admin Teste' },
  vendedor: { id: 2, cpf: '52998224725', perfil: 'vendedor', nome: 'Vendedora Teste' },
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      api(caminho: string): Chainable<string>
      entrarComo(perfil: Perfil, caminho: string): Chainable<void>
    }
  }
}

Cypress.Commands.add('api', (caminho: string) => {
  return cy.wrap(`${Cypress.expose('apiUrl')}${caminho}`, { log: false })
})

Cypress.Commands.add('entrarComo', (perfil: Perfil, caminho: string) => {
  cy.intercept('GET', `${Cypress.expose('apiUrl')}/auth/perfil`, { body: USUARIOS[perfil] }).as('perfil')
  cy.visit(caminho, {
    onBeforeLoad(win) {
      win.sessionStorage.setItem('accessToken', `token-e2e-${perfil}`)
    },
  })
  cy.wait('@perfil')
})

export {}
