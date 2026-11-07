/**
 * UC05 Cadastrar cliente · UC06 Consultar clientes · UC07 Editar · UC08 Inativar.
 */
import { afterEach, beforeEach, describe, expect, it } from '@jest/globals'
import { flushPromises } from '@vue/test-utils'
import ClientesView from '@/views/ClientesView.vue'
import CadastrarClienteView from '@/views/CadastrarClienteView.vue'
import {
  atualizarCliente, buscarCliente, cadastrarCliente, inativarCliente, listarClientes, type Cliente,
} from '@/services/clientes.service'
import { erroApi, montar } from '../../support/montar'

jest.mock('@/services/clientes.service', () => ({
  atualizarCliente: jest.fn(), buscarCliente: jest.fn(), cadastrarCliente: jest.fn(),
  inativarCliente: jest.fn(), listarClientes: jest.fn(),
}))
const m = {
  listar: listarClientes as jest.MockedFunction<typeof listarClientes>,
  buscar: buscarCliente as jest.MockedFunction<typeof buscarCliente>,
  cadastrar: cadastrarCliente as jest.MockedFunction<typeof cadastrarCliente>,
  atualizar: atualizarCliente as jest.MockedFunction<typeof atualizarCliente>,
  inativar: inativarCliente as jest.MockedFunction<typeof inativarCliente>,
}

const cliente = (extra: Partial<Cliente> = {}): Cliente => ({
  id_cliente: 10, nome: 'Maria da Silva', cpf: '39053344705', email: 'maria@exemplo.com',
  telefone: '84999990000', endereco: 'Rua das Flores, 100', cidade: 'Currais Novos', estado: 'RN',
  cep: '59380000', documento: 'RG1234567', ativo: true, data_criacao: '2026-11-01T10:00:00Z',
  atualizado_em: '2026-11-01T10:00:00Z', ...extra,
})

describe('ClientesView (consulta e inativação)', () => {
  beforeEach(() => {
    m.listar.mockResolvedValue([cliente(), cliente({ id_cliente: 11, nome: 'João Inativo', ativo: false })])
    m.inativar.mockResolvedValue(undefined)
  })
  afterEach(() => {
    jest.useRealTimers()
  })

  it('lista clientes com CPF e telefone formatados', async () => {
    const { wrapper } = await montar(ClientesView, { caminho: '/admin/clientes', perfil: 'admin' })
    expect(m.listar).toHaveBeenCalledWith(undefined)
    const texto = wrapper.get('tbody tr').text()
    expect(texto).toContain('390.533.447-05')
    expect(texto).toContain('(84) 99999-0000')
  })

  it('busca com debounce de 300 ms e envia CPF digitado com máscara apenas como dígitos', async () => {
    jest.useFakeTimers()
    const { wrapper } = await montar(ClientesView, { caminho: '/admin/clientes', perfil: 'admin' })
    m.listar.mockClear()

    await wrapper.get('#busca-clientes').setValue('390.533')
    jest.advanceTimersByTime(299)
    expect(m.listar).not.toHaveBeenCalled()
    jest.advanceTimersByTime(1)
    expect(m.listar).toHaveBeenCalledWith('390533')
  })

  it('termo textual é enviado aparado (sem remover letras)', async () => {
    jest.useFakeTimers()
    const { wrapper } = await montar(ClientesView, { caminho: '/admin/clientes', perfil: 'admin' })
    await wrapper.get('#busca-clientes').setValue('  Maria ')
    jest.advanceTimersByTime(300)
    expect(m.listar).toHaveBeenLastCalledWith('Maria')
  })

  it('cliente inativo não exibe a ação "Inativar"', async () => {
    const { wrapper } = await montar(ClientesView, { caminho: '/admin/clientes', perfil: 'admin' })
    expect(wrapper.find('[aria-label="Inativar Maria da Silva"]').exists()).toBe(true)
    expect(wrapper.find('[aria-label="Inativar João Inativo"]').exists()).toBe(false)
  })

  it('inativa após confirmação e informa que o histórico foi preservado', async () => {
    const { wrapper } = await montar(ClientesView, { caminho: '/vendedor/clientes', perfil: 'vendedor' })

    await wrapper.get('[aria-label="Inativar Maria da Silva"]').trigger('click')
    expect(wrapper.get('[role="dialog"]').text()).toContain('Maria da Silva')
    await wrapper.findAll('button').find((b) => b.text() === 'Confirmar inativação')!.trigger('click')
    await flushPromises()

    expect(m.inativar).toHaveBeenCalledWith(10)
    expect(wrapper.get('[role="status"]').text()).toContain('O histórico de compras foi preservado.')
  })

  it('mantém o diálogo e mostra erro se a inativação falhar', async () => {
    m.inativar.mockRejectedValue(erroApi(404, 'Cliente com ID 10 não encontrado'))
    const { wrapper } = await montar(ClientesView, { caminho: '/admin/clientes', perfil: 'admin' })
    await wrapper.get('[aria-label="Inativar Maria da Silva"]').trigger('click')
    await wrapper.findAll('button').find((b) => b.text() === 'Confirmar inativação')!.trigger('click')
    await flushPromises()
    expect(wrapper.get('[role="dialog"] [role="alert"]').text()).toBe('Cliente com ID 10 não encontrado')
  })

  it.each([
    ['admin', '/admin/clientes/10/editar'],
    ['vendedor', '/vendedor/clientes/10/editar'],
  ] as const)('editar leva o %s para %s', async (perfil, destino) => {
    const { wrapper, router } = await montar(ClientesView, { caminho: `/${perfil === 'admin' ? 'admin' : 'vendedor'}/clientes`, perfil })
    await wrapper.get('[aria-label="Editar Maria da Silva"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe(destino)
  })

  it('abre os detalhes do cliente', async () => {
    const { wrapper } = await montar(ClientesView, { caminho: '/admin/clientes', perfil: 'admin' })
    await wrapper.get('[aria-label="Ver detalhes de Maria da Silva"]').trigger('click')
    expect(wrapper.get('#cliente-detalhes-titulo').text()).toBe('Maria da Silva')
    await wrapper.get('[aria-label="Fechar detalhes"]').trigger('click')
    expect(wrapper.find('#cliente-detalhes-titulo').exists()).toBe(false)
  })

  it('exibe erro de carregamento e permite tentar novamente', async () => {
    m.listar.mockRejectedValueOnce(new Error('rede'))
    const { wrapper } = await montar(ClientesView, { caminho: '/admin/clientes', perfil: 'admin' })
    expect(wrapper.get('[role="alert"]').text()).toContain('Não foi possível carregar os clientes.')
    await wrapper.get('button.inline-retry').trigger('click')
    await flushPromises()
    expect(wrapper.findAll('tbody tr').length).toBeGreaterThan(0)
  })
})

describe('CadastrarClienteView (cadastro e edição)', () => {
  type W = Awaited<ReturnType<typeof montar>>['wrapper']
  async function preencher(w: W, extra: Record<string, string> = {}) {
    const campos: Record<string, string> = {
      nome: ' Maria da Silva ', cpf: '390.533.447-05', email: 'maria@exemplo.com', telefone: '(84) 99999-0000',
      endereco: 'Rua das Flores, 100', cidade: 'Currais Novos', estado: 'rn', cep: '59380-000',
      documento: 'RG1234567', ...extra,
    }
    for (const [c, v] of Object.entries(campos)) await w.get(`#cliente-${c}`).setValue(v)
  }
  const enviar = async (w: W) => { await w.get('form').trigger('submit'); await flushPromises() }

  beforeEach(() => {
    m.cadastrar.mockResolvedValue(cliente())
    m.atualizar.mockResolvedValue(cliente())
    m.buscar.mockResolvedValue(cliente())
  })

  it('envia dados normalizados (só dígitos em CPF/telefone/CEP, UF maiúscula)', async () => {
    const { wrapper } = await montar(CadastrarClienteView, { caminho: '/vendedor/clientes/cadastrar', perfil: 'vendedor' })
    await preencher(wrapper)
    await enviar(wrapper)

    expect(m.cadastrar).toHaveBeenCalledWith({
      nome: 'Maria da Silva', cpf: '39053344705', email: 'maria@exemplo.com', telefone: '84999990000',
      endereco: 'Rua das Flores, 100', cidade: 'Currais Novos', estado: 'RN', cep: '59380000', documento: 'RG1234567',
    })
    expect(wrapper.get('[role="status"]').text()).toContain('Cliente cadastrado com sucesso.')
    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeDefined()
  })

  it.each([
    ['cpf', '123', 'O CPF deve conter exatamente 11 dígitos.'],
    ['email', 'maria@', 'Informe um e-mail válido com até 150 caracteres.'],
    ['telefone', '8499', 'O telefone deve conter de 10 a 15 dígitos.'],
    ['estado', 'R', 'Informe a sigla do estado com 2 caracteres.'],
    ['cep', '5938', 'O CEP deve conter exatamente 8 dígitos.'],
    ['nome', 'Al', 'Informe de 3 a 100 caracteres.'],
  ])('valida %s = "%s"', async (campo, valor, mensagem) => {
    const { wrapper } = await montar(CadastrarClienteView, { caminho: '/admin/clientes/cadastrar', perfil: 'admin' })
    await preencher(wrapper, { [campo]: valor })
    await enviar(wrapper)
    expect(wrapper.get(`#cliente-${campo}-erro`).text()).toBe(mensagem)
    expect(m.cadastrar).not.toHaveBeenCalled()
  })

  it('exibe o conflito do backend (CPF duplicado)', async () => {
    m.cadastrar.mockRejectedValue(erroApi(409, 'Já existe um cliente cadastrado com este CPF'))
    const { wrapper } = await montar(CadastrarClienteView, { caminho: '/admin/clientes/cadastrar', perfil: 'admin' })
    await preencher(wrapper)
    await enviar(wrapper)
    expect(wrapper.get('[role="alert"]').text()).toContain('Já existe um cliente cadastrado com este CPF')
  })

  it('edição: carrega o cliente, salva com PATCH e confirma', async () => {
    const { wrapper } = await montar(CadastrarClienteView, {
      caminho: '/admin/clientes/10/editar', padrao: '/admin/clientes/:id/editar', perfil: 'admin',
    })
    expect(m.buscar).toHaveBeenCalledWith(10)
    expect((wrapper.get('#cliente-nome').element as HTMLInputElement).value).toBe('Maria da Silva')

    await wrapper.get('#cliente-cidade').setValue('Natal')
    await enviar(wrapper)

    expect(m.atualizar).toHaveBeenCalledWith(10, expect.objectContaining({ cidade: 'Natal' }))
    expect(wrapper.get('[role="status"]').text()).toContain('Alterações salvas com sucesso.')
  })

  it('edição de cliente inexistente mostra "Cliente não encontrado."', async () => {
    m.buscar.mockRejectedValue(erroApi(404, 'qualquer'))
    const { wrapper } = await montar(CadastrarClienteView, {
      caminho: '/admin/clientes/99/editar', padrao: '/admin/clientes/:id/editar', perfil: 'admin',
    })
    expect(wrapper.get('[role="alert"]').text()).toContain('Cliente não encontrado.')
  })
})
