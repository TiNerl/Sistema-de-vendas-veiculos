import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CadastrarVendaView from '@/views/CadastrarVendaView.vue'

const mocks = vi.hoisted(() => ({
  auth: {
    usuario: null as null | { perfil: 'admin' | 'vendedor'; nome: string; cpf: string },
  },
  listarClientes: vi.fn(),
  listarVeiculos: vi.fn(),
  listarUsuarios: vi.fn(),
  cadastrarVenda: vi.fn(),
}))

vi.mock('@/stores/auth', () => ({ useAuthStore: () => mocks.auth }))
vi.mock('@/services/clientes.service', () => ({ listarClientes: mocks.listarClientes }))
vi.mock('@/services/veiculos.service', () => ({ listarVeiculos: mocks.listarVeiculos }))
vi.mock('@/services/usuarios.service', () => ({ listarUsuarios: mocks.listarUsuarios }))
vi.mock('@/services/vendas.service', () => ({ cadastrarVenda: mocks.cadastrarVenda }))

const RouterLinkStub = {
  props: ['to'],
  template: '<a :href="to"><slot /></a>',
}

async function montarFormulario() {
  const wrapper = mount(CadastrarVendaView, {
    global: { stubs: { RouterLink: RouterLinkStub } },
  })
  await flushPromises()
  return wrapper
}

describe('CadastrarVendaView', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mocks.auth.usuario = { perfil: 'admin', nome: 'Admin', cpf: '111' }
    mocks.listarClientes.mockResolvedValue([
      { id_cliente: 10, nome: 'Cliente Ativo', cpf: '222', ativo: true },
    ])
    mocks.listarVeiculos.mockResolvedValue([
      {
        id_veiculo: 20,
        marca: 'Marca',
        modelo: 'Modelo',
        versao: 'Versão',
        placa: 'ABC1234',
        preco: '10000',
        status: 'disponivel',
      },
    ])
    mocks.listarUsuarios.mockResolvedValue([
      { id_usuario: 2, nome: 'Vendedora Ativa', perfil: 'vendedor', ativo: true },
      { id_usuario: 3, nome: 'Vendedor Inativo', perfil: 'vendedor', ativo: false },
      { id_usuario: 4, nome: 'Outro Admin', perfil: 'admin', ativo: true },
    ])
    mocks.cadastrarVenda.mockResolvedValue({
      id_venda: 30,
      valor_final: '10000',
      status: 'concluida',
    })
  })

  it('permite ao Admin selecionar um vendedor ativo e envia o identificador selecionado', async () => {
    const wrapper = await montarFormulario()

    expect(wrapper.find('#vendedor-responsavel').exists()).toBe(true)
    expect(wrapper.get('#vendedor-responsavel').text()).toContain('Vendedora Ativa')
    expect(wrapper.get('#vendedor-responsavel').text()).not.toContain('Vendedor Inativo')
    expect(wrapper.get('#vendedor-responsavel').text()).not.toContain('Outro Admin')

    await wrapper.get('#cliente-venda').setValue('10')
    await wrapper.get('#veiculo-venda').setValue('20')
    await wrapper.get('#vendedor-responsavel').setValue('2')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(mocks.cadastrarVenda).toHaveBeenCalledWith(
      expect.objectContaining({ id_usuario_responsavel: 2 }),
    )
  })

  it('não mostra a seleção nem carrega usuários para o vendedor', async () => {
    mocks.auth.usuario = { perfil: 'vendedor', nome: 'Vendedor Logado', cpf: '333' }
    const wrapper = await montarFormulario()

    expect(wrapper.find('#vendedor-responsavel').exists()).toBe(false)
    expect(mocks.listarUsuarios).not.toHaveBeenCalled()

    await wrapper.get('#cliente-venda').setValue('10')
    await wrapper.get('#veiculo-venda').setValue('20')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(mocks.cadastrarVenda).toHaveBeenCalledOnce()
    const chamada = mocks.cadastrarVenda.mock.calls.at(0)
    if (!chamada) throw new Error('A venda do vendedor não foi enviada')
    expect(chamada[0]).not.toHaveProperty('id_usuario_responsavel')
  })

  it('não envia a venda do Admin sem vendedor responsável', async () => {
    const wrapper = await montarFormulario()

    await wrapper.get('#cliente-venda').setValue('10')
    await wrapper.get('#veiculo-venda').setValue('20')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.get('[role="alert"]').text()).toContain('Selecione um vendedor responsável')
    expect(mocks.cadastrarVenda).not.toHaveBeenCalled()
  })

  it('atualiza o resumo financeiro com o veículo e o desconto existentes', async () => {
    const wrapper = await montarFormulario()

    await wrapper.get('#veiculo-venda').setValue('20')
    await wrapper.get('#desconto-venda').setValue(10)

    const resumo = wrapper.get('.sale-summary')
    expect(resumo.text()).toContain('R$ 10.000,00')
    expect(resumo.text()).toContain('R$ 1.000,00')
    expect(resumo.text()).toContain('R$ 9.000,00')
  })
})
