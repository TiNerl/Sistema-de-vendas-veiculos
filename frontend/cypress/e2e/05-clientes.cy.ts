/**
 * E2E – UC05 Cadastrar cliente, UC06 Consultar, UC08 Inativar (perfil Vendedor).
 */
const api = () => Cypress.expose('apiUrl') as string

describe('Clientes (vendedor)', () => {
  beforeEach(() => {
    cy.intercept('GET', `${api()}/clientes*`, { fixture: 'clientes.json' }).as('listar')
  })

  it('lista e pesquisa clientes por CPF digitado com máscara', () => {
    cy.entrarComo('vendedor', '/vendedor/clientes')
    cy.wait('@listar')
    cy.get('tbody tr').should('have.length', 2).first().should('contain', '390.533.447-05')

    cy.get('#busca-clientes').type('390.533')
    cy.wait('@listar').its('request.query.busca').should('eq', '390533')
  })

  it('cadastra um cliente com dados normalizados', () => {
    cy.intercept('POST', `${api()}/clientes`, (req) => req.reply(201, { id_cliente: 12, ativo: true, ...req.body })).as('criar')
    cy.entrarComo('vendedor', '/vendedor/clientes/cadastrar')

    cy.get('#cliente-nome').type('Carla Souza')
    cy.get('#cliente-cpf').type('529.982.247-25')
    cy.get('#cliente-email').type('carla@exemplo.com')
    cy.get('#cliente-telefone').type('(84) 98888-7777')
    cy.get('#cliente-endereco').type('Rua Nova, 25')
    cy.get('#cliente-cidade').type('Caicó')
    cy.get('#cliente-estado').type('rn')
    cy.get('#cliente-cep').type('59300-000')
    cy.get('#cliente-documento').type('RG7654321')
    cy.get('form').submit()

    cy.wait('@criar').its('request.body').should('deep.equal', {
      nome: 'Carla Souza', cpf: '52998224725', email: 'carla@exemplo.com', telefone: '84988887777',
      endereco: 'Rua Nova, 25', cidade: 'Caicó', estado: 'RN', cep: '59300000', documento: 'RG7654321',
    })
    cy.contains('[role="status"]', 'Cliente cadastrado com sucesso.').should('be.visible')
  })

  it('exibe CPF duplicado retornado pela API', () => {
    cy.intercept('POST', `${api()}/clientes`, {
      statusCode: 409, body: { statusCode: 409, message: 'Já existe um cliente cadastrado com este CPF', error: 'Conflict' },
    })
    cy.entrarComo('vendedor', '/vendedor/clientes/cadastrar')
    cy.get('#cliente-nome').type('Maria da Silva')
    cy.get('#cliente-cpf').type('39053344705')
    cy.get('#cliente-email').type('outra@exemplo.com')
    cy.get('#cliente-telefone').type('84999990000')
    cy.get('#cliente-endereco').type('Rua das Flores, 100')
    cy.get('#cliente-cidade').type('Currais Novos')
    cy.get('#cliente-estado').type('RN')
    cy.get('#cliente-cep').type('59380000')
    cy.get('#cliente-documento').type('RG1234567')
    cy.get('form').submit()
    cy.get('[role="alert"]').should('contain', 'Já existe um cliente cadastrado com este CPF')
  })

  it('inativa um cliente após confirmação', () => {
    cy.intercept('PATCH', `${api()}/clientes/10/inativar`, { body: { id_cliente: 10, ativo: false } }).as('inativar')
    cy.entrarComo('vendedor', '/vendedor/clientes')
    cy.wait('@listar')
    cy.get('[aria-label="Inativar Maria da Silva"]').click()
    cy.get('[role="dialog"]').contains('button', 'Confirmar inativação').click()
    cy.wait('@inativar')
    cy.contains('[role="status"]', 'O histórico de compras foi preservado.').should('be.visible')
  })
})

export {}
