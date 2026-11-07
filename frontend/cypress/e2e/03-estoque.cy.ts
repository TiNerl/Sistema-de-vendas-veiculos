/**
 * E2E – UC10 Consultar estoque com filtros e UC12 Alterar status do veículo.
 */
const api = () => Cypress.expose('apiUrl') as string

describe('Estoque de veículos', () => {
  beforeEach(() => {
    cy.intercept('GET', `${api()}/veiculos*`, { fixture: 'veiculos.json' }).as('listar')
  })

  it('lista os veículos com preço em reais e status legível', () => {
    cy.entrarComo('vendedor', '/vendedor/veiculos')
    cy.wait('@listar')
    cy.get('tbody tr').should('have.length', 3)
    cy.get('tbody tr').first().should('contain', 'Toyota Corolla').and('contain', 'R$').and('contain', 'Disponível')
    cy.get('tbody tr').eq(1).should('contain', 'Em manutenção')
  })

  it('aplica filtros combinados e envia apenas os campos preenchidos', () => {
    cy.entrarComo('vendedor', '/vendedor/veiculos')
    cy.wait('@listar')
    cy.get('#marca-veiculo').type('Toyota')
    cy.get('#preco-max').type('150000')
    cy.get('#filtro-status-veiculos').select('disponivel')
    cy.contains('button', 'Aplicar filtros').click()

    cy.wait('@listar').its('request.query').should('deep.equal', {
      marca: 'Toyota', precoMax: '150000', status: 'disponivel',
    })
  })

  it('bloqueia faixa de preço invertida antes de consultar a API', () => {
    cy.entrarComo('vendedor', '/vendedor/veiculos')
    cy.wait('@listar')
    cy.get('#preco-min').type('200000')
    cy.get('#preco-max').type('100000')
    cy.contains('button', 'Aplicar filtros').click()
    cy.get('.form-message--error').should('have.text', 'O preço mínimo não pode ser maior que o preço máximo.')
  })

  /**
   * DEF-01: com a API real, este filtro recebe 400 ("property anoMin should not exist").
   * Aqui simulamos exatamente essa resposta para registrar o impacto na tela.
   */
  it('[DEF-01] filtro por ano: a resposta 400 da API real é exibida ao usuário', () => {
    cy.entrarComo('vendedor', '/vendedor/veiculos')
    cy.wait('@listar')
    cy.intercept('GET', `${api()}/veiculos?*anoMin=*`, {
      statusCode: 400, body: { statusCode: 400, message: ['property anoMin should not exist'], error: 'Bad Request' },
    }).as('filtroAno')
    cy.get('#ano-min').type('2020')
    cy.contains('button', 'Aplicar filtros').click()
    cy.wait('@filtroAno')
    cy.get('[role="alert"]').should('be.visible')
  })

  it('vendedor não vê a ação "Alterar status"', () => {
    cy.entrarComo('vendedor', '/vendedor/veiculos')
    cy.wait('@listar')
    cy.contains('button', 'Alterar status').should('not.exist')
  })

  it('administrador coloca um veículo em manutenção após confirmar', () => {
    cy.intercept('PATCH', `${api()}/veiculos/7/status`, { body: { id_veiculo: 7, status: 'em_manutencao' } }).as('status')
    cy.entrarComo('admin', '/admin/veiculos')
    cy.wait('@listar')

    cy.get('tbody tr').first().contains('button', 'Alterar status').click()
    cy.get('[role="dialog"]').should('contain', 'Toyota Corolla')
    cy.get('#novo-status-veiculo option').should('have.length', 1).and('have.value', 'em_manutencao')
    cy.get('[role="dialog"]').contains('button', 'Confirmar').click()

    cy.wait('@status').its('request.body').should('deep.equal', { status: 'em_manutencao' })
    cy.get('[role="dialog"]').should('not.exist')
    cy.contains('[role="status"]', 'atualizado para Em manutenção').should('be.visible')
  })

  it('veículo vendido não oferece alteração de status', () => {
    cy.entrarComo('admin', '/admin/veiculos')
    cy.wait('@listar')
    cy.get('tbody tr').eq(2).should('contain', 'Vendido').find('button').should('not.exist')
  })
})

export {}
