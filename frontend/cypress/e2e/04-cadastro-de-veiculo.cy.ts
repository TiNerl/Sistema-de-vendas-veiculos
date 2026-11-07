/**
 * E2E – UC09 Cadastrar veículo e UC11 Editar veículo.
 */
const api = () => Cypress.expose('apiUrl') as string

function preencherFormulario() {
  cy.get('#veiculo-marca').type('Honda')
  cy.get('#veiculo-modelo').type('Civic')
  cy.get('#veiculo-versao').type('Touring')
  cy.get('#veiculo-ano').clear().type('2023')
  cy.get('#veiculo-cor').type('Preto')
  cy.get('#veiculo-quilometragem').type('15000')
  cy.get('#veiculo-combustivel').select('flex')
  cy.get('#veiculo-cambio').select('cvt')
  cy.get('#veiculo-placa').type('hon-2c34')
  cy.get('#veiculo-chassi').type('93hfc2630pz000001')
  cy.get('#veiculo-renavam').type('55566677788')
  cy.get('#veiculo-preco').type('159900')
}

describe('Cadastro e edição de veículo', () => {
  beforeEach(() => {
    cy.intercept('GET', `${api()}/veiculos`, { fixture: 'veiculos.json' }).as('listar')
  })

  it('cadastra com dados normalizados e volta à listagem com mensagem de sucesso', () => {
    cy.intercept('POST', `${api()}/veiculos`, (req) => req.reply(201, { id_veiculo: 20, ...req.body, status: 'disponivel' })).as('criar')
    cy.entrarComo('admin', '/admin/veiculos/cadastrar')
    preencherFormulario()
    cy.contains('button', 'Cadastrar veículo').click()

    cy.wait('@criar').its('request.body').should('include', {
      placa: 'HON2C34', chassi: '93HFC2630PZ000001', renavam: '55566677788', preco: 159900, ano: 2023,
    })
    cy.location('pathname').should('eq', '/admin/veiculos')
    cy.contains('Veículo cadastrado com sucesso.').should('be.visible')
  })

  it('mostra os erros de validação junto aos campos', () => {
    cy.entrarComo('admin', '/admin/veiculos/cadastrar')
    cy.get('#veiculo-placa').type('123')
    cy.get('#veiculo-renavam').type('12')
    cy.get('form').submit()
    cy.get('#veiculo-placa-erro').should('have.text', 'Informe uma placa válida.')
    cy.get('#veiculo-renavam-erro').should('have.text', 'Informe um RENAVAM válido.')
    cy.get('#veiculo-marca-erro').should('have.text', 'A marca é obrigatória.')
  })

  it('exibe o conflito retornado pela API (placa/chassi/RENAVAM duplicado)', () => {
    cy.intercept('POST', `${api()}/veiculos`, {
      statusCode: 409, body: { statusCode: 409, message: 'Placa, chassi ou RENAVAM já cadastrado', error: 'Conflict' },
    })
    cy.entrarComo('admin', '/admin/veiculos/cadastrar')
    preencherFormulario()
    cy.get('form').submit()
    cy.get('[role="alert"]').should('have.text', 'Placa, chassi ou RENAVAM já cadastrado')
    cy.location('pathname').should('eq', '/admin/veiculos/cadastrar')
  })

  it('edita um veículo existente (PATCH) a partir da listagem', () => {
    cy.fixture('veiculos.json').then((veiculos) => {
      cy.intercept('GET', `${api()}/veiculos/7`, { body: veiculos[0] })
    })
    cy.intercept('PATCH', `${api()}/veiculos/7`, (req) => req.reply({ ...req.body, id_veiculo: 7 })).as('editar')
    cy.entrarComo('admin', '/admin/veiculos')
    cy.wait('@listar')
    cy.get('tbody tr').first().contains('Editar').click()

    cy.location('pathname').should('eq', '/admin/veiculos/7/editar')
    cy.get('#veiculo-marca').should('have.value', 'Toyota')
    cy.get('#veiculo-cor').clear().type('Azul')
    cy.get('form').submit()
    cy.wait('@editar').its('request.body.cor').should('eq', 'Azul')
    cy.contains('Veículo atualizado com sucesso.').should('be.visible')
  })
})

export {}
