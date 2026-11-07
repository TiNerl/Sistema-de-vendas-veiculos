/**
 * E2E – RNF001 Interface responsiva: sem rolagem horizontal em celular, tablet e desktop.
 */
const telas: [string, number, number][] = [
  ['celular', 390, 844],
  ['tablet', 820, 1180],
  ['notebook', 1366, 768],
]

const semRolagemHorizontal = () =>
  cy.document().should((doc) => {
    expect(doc.documentElement.scrollWidth, 'largura do documento').to.be.at.most(doc.documentElement.clientWidth)
  })

describe('Responsividade (RNF001)', () => {
  telas.forEach(([nome, largura, altura]) => {
    it(`login e estoque cabem na tela do ${nome} (${largura}px)`, () => {
      cy.viewport(largura, altura)
      cy.visit('/')
      cy.contains('button', 'Entrar').should('be.visible')
      semRolagemHorizontal()

      cy.intercept('GET', `${Cypress.expose('apiUrl')}/veiculos*`, { fixture: 'veiculos.json' })
      cy.entrarComo('vendedor', '/vendedor/veiculos')
      cy.get('tbody tr').should('have.length', 3)
      semRolagemHorizontal()
    })
  })
})

export {}
