import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import SolicitacoesDescontoView from '@/views/SolicitacoesDescontoView.vue'
import { listarClientes } from '@/services/clientes.service'
import { listarVeiculos } from '@/services/veiculos.service'
import {
  aprovarVenda,
  cadastrarVenda,
  listarVendas,
  rejeitarVenda,
} from '@/services/vendas.service'
import type { VendaRegistrada } from '@/services/vendas.service'
import { useAuthStore } from '@/stores/auth'

vi.mock('@/services/clientes.service', () => ({
  listarClientes: vi.fn(),
}))

vi.mock('@/services/veiculos.service', () => ({
  listarVeiculos: vi.fn(),
}))

vi.mock('@/services/vendas.service', () => ({
  aprovarVenda: vi.fn(),
  cadastrarVenda: vi.fn(),
  listarVendas: vi.fn(),
  rejeitarVenda: vi.fn(),
}))

const vendaPendente: VendaRegistrada = {
  id_venda: 41,
  valor_veiculo: '100000.00',
  percentual_desconto: '15.00',
  valor_desconto: '15000.00',
  valor_final: '85000.00',
  forma_pagamento: 'a_vista',
  percentual_comissao: '3.00',
  valor_comissao: '2550.00',
  status: 'pendente',
  data_venda: '2026-11-04T12:00:00.000Z',
  cliente: { id_cliente: 7, nome: 'Ana Silva' },
  veiculo: { id_veiculo: 3, marca: 'Honda', modelo: 'Civic', versao: 'EX', placa: 'ABC1234' },
  usuario: { id_usuario: 2, nome: 'Vendedor A' },
}

describe('SolicitacoesDescontoView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
    vi.mocked(listarClientes).mockResolvedValue([
      {
        id_cliente: 7,
        nome: 'Ana Silva',
        cpf: '12345678901',
        email: 'ana@example.com',
        telefone: '11987654321',
        endereco: 'Rua A',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '01001000',
        documento: 'RG',
        ativo: true,
        data_criacao: '2026-01-01T12:00:00.000Z',
        atualizado_em: '2026-01-01T12:00:00.000Z',
      },
    ])
    vi.mocked(listarVeiculos).mockResolvedValue([
      {
        id_veiculo: 3,
        marca: 'Honda',
        modelo: 'Civic',
        versao: 'EX',
        ano: 2025,
        cor: 'Preto',
        quilometragem: 0,
        combustivel: 'Flex',
        cambio: 'Automático',
        placa: 'ABC1234',
        chassi: '123',
        renavam: '456',
        preco: '100000',
        status: 'disponivel',
      },
    ])
    vi.mocked(listarVendas).mockResolvedValue([])
    vi.mocked(cadastrarVenda).mockResolvedValue(vendaPendente)
    vi.mocked(aprovarVenda).mockResolvedValue({ ...vendaPendente, status: 'concluida' })
    vi.mocked(rejeitarVenda).mockResolvedValue({ ...vendaPendente, status: 'cancelada' })
  })

  async function montar(perfil: 'admin' | 'vendedor') {
    const pinia = createPinia()
    setActivePinia(pinia)
    useAuthStore().usuario = {
      id: perfil === 'vendedor' ? 2 : 1,
      cpf: '00000000000',
      perfil,
    }

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/descontos', component: SolicitacoesDescontoView }],
    })
    await router.push('/descontos')
    const wrapper = mount(SolicitacoesDescontoView, {
      global: { plugins: [pinia, router] },
    })
    await flushPromises()
    return wrapper
  }

  it('envia solicitação acima de 10% com o contrato da API e exibe o status retornado', async () => {
    vi.mocked(listarVendas)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([vendaPendente])
    const wrapper = await montar('vendedor')
    await wrapper.get('#desconto-cliente').setValue('7')
    await wrapper.get('#desconto-veiculo').setValue('3')
    await wrapper.get('#desconto-forma-pagamento').setValue('pix')
    await wrapper.get('#desconto-percentual').setValue('15')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(cadastrarVenda).toHaveBeenCalledWith({
      id_cliente: 7,
      id_veiculo: 3,
      forma_pagamento: 'pix',
      percentual_desconto: 15,
    })
    expect(wrapper.text()).toContain('Solicitação da venda #41 enviada para aprovação.')
    expect(wrapper.text()).toContain('pendente')
    expect(listarClientes).toHaveBeenCalledTimes(2)
    expect(listarVeiculos).toHaveBeenCalledTimes(2)
  })

  it('não envia desconto de exatamente 10%, pois o backend o conclui diretamente', async () => {
    const wrapper = await montar('vendedor')
    await wrapper.get('#desconto-cliente').setValue('7')
    await wrapper.get('#desconto-veiculo').setValue('3')
    await wrapper.get('#desconto-percentual').setValue('10')
    await flushPromises()

    expect(wrapper.get('#desconto-percentual').attributes('min')).toBe('10')
    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('exatamente 10% é registrado como venda concluída')
    expect(cadastrarVenda).not.toHaveBeenCalled()
  })

  it('lista apenas solicitações pendentes para o administrador', async () => {
    vi.mocked(listarVendas).mockResolvedValue([
      vendaPendente,
      { ...vendaPendente, id_venda: 42, status: 'concluida' },
    ])
    const wrapper = await montar('admin')

    expect(wrapper.text()).toContain('Fila de aprovação')
    expect(wrapper.text()).toContain('15.00%')
    expect(wrapper.text()).toContain('Vendedor A')
    expect(wrapper.text()).toContain('Ana Silva')
    expect(wrapper.text()).not.toContain('#42')
    expect(wrapper.findAll('button').some((botao) => botao.text() === 'Aprovar')).toBe(true)
    expect(listarClientes).not.toHaveBeenCalled()
    expect(listarVeiculos).not.toHaveBeenCalled()
  })

  it('aprova solicitação e atualiza a fila após a resposta da API', async () => {
    vi.mocked(listarVendas)
      .mockResolvedValueOnce([vendaPendente])
      .mockResolvedValueOnce([])
    const wrapper = await montar('admin')
    const botaoAprovar = wrapper.findAll('button').find((botao) => botao.text() === 'Aprovar')
    await botaoAprovar?.trigger('click')
    const confirmar = wrapper
      .findAll('[role="dialog"] button')
      .find((botao) => botao.text() === 'Confirmar aprovação')
    await confirmar?.trigger('click')
    await flushPromises()

    expect(aprovarVenda).toHaveBeenCalledWith(41)
    expect(wrapper.text()).toContain('Solicitação da venda #41 aprovada.')
    expect(wrapper.text()).toContain('Não há solicitações pendentes.')
  })

  it('reprova solicitação e informa erros retornados pela API', async () => {
    vi.mocked(listarVendas).mockResolvedValue([vendaPendente])
    vi.mocked(rejeitarVenda).mockRejectedValue(new Error('Falha ao reprovar'))
    const wrapper = await montar('admin')
    const botaoReprovar = wrapper.findAll('button').find((botao) => botao.text() === 'Reprovar')
    await botaoReprovar?.trigger('click')
    const confirmar = wrapper
      .findAll('[role="dialog"] button')
      .find((botao) => botao.text() === 'Confirmar reprovação')
    await confirmar?.trigger('click')
    await flushPromises()

    expect(rejeitarVenda).toHaveBeenCalledWith(41)
    expect(wrapper.get('[role="alert"]').text()).toContain(
      'Não foi possível concluir a operação. Tente novamente.',
    )
  })
})
