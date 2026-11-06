import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import SolicitacoesDescontoView from '@/views/SolicitacoesDescontoView.vue'
import { aprovarVenda, listarVendas, rejeitarVenda } from '@/services/vendas.service'
import type { VendaRegistrada } from '@/services/vendas.service'
import { useAuthStore } from '@/stores/auth'

vi.mock('@/services/vendas.service', () => ({
  aprovarVenda: vi.fn(),
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
    vi.mocked(listarVendas).mockResolvedValue([vendaPendente])
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

  it('mantém Minhas Solicitações somente para acompanhamento das vendas do vendedor', async () => {
    vi.mocked(listarVendas).mockResolvedValue([
      vendaPendente,
      {
        ...vendaPendente,
        id_venda: 42,
        status: 'concluida',
        percentual_desconto: '5.00',
        usuario: { id_usuario: 3, nome: 'Outro vendedor' },
      },
      {
        ...vendaPendente,
        id_venda: 43,
        status: 'concluida',
        percentual_desconto: '15.00',
      },
    ])
    const wrapper = await montar('vendedor')

    expect(listarVendas).toHaveBeenCalledWith()
    expect(wrapper.text()).toContain('Minhas solicitações')
    expect(wrapper.text()).toContain('15.00%')
    expect(wrapper.text()).toContain('R$ 15.000,00')
    expect(wrapper.text()).toContain('04/11/2026')
    expect(wrapper.text()).toContain('Pendente')
    expect(wrapper.text()).toContain('Concluída')
    expect(wrapper.text()).not.toContain('#42')
    expect(wrapper.text()).not.toContain('Outro vendedor')
    expect(wrapper.find('form').exists()).toBe(false)
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('exibe ao administrador somente vendas pendentes para decisão', async () => {
    vi.mocked(listarVendas).mockResolvedValue([
      vendaPendente,
      { ...vendaPendente, id_venda: 42, status: 'concluida' },
      { ...vendaPendente, id_venda: 43, status: 'cancelada' },
    ])
    const wrapper = await montar('admin')

    expect(wrapper.text()).toContain('#41')
    expect(wrapper.text()).toContain('Vendedor A')
    expect(wrapper.text()).toContain('Ana Silva')
    expect(wrapper.text()).toContain('15.00%')
    expect(wrapper.text()).toContain('R$ 15.000,00')
    expect(wrapper.text()).not.toContain('#42')
    expect(wrapper.text()).not.toContain('#43')
    expect(wrapper.find('form').exists()).toBe(false)
    expect(wrapper.findAll('button').some((botao) => botao.text() === 'Aprovar')).toBe(true)
    expect(wrapper.findAll('button').some((botao) => botao.text() === 'Reprovar')).toBe(true)
  })

  it('aprova venda pendente e atualiza fila com resposta da API', async () => {
    vi.mocked(listarVendas)
      .mockResolvedValueOnce([vendaPendente])
      .mockResolvedValueOnce([])
    const wrapper = await montar('admin')
    await wrapper.findAll('button').find((botao) => botao.text() === 'Aprovar')?.trigger('click')
    await wrapper
      .findAll('[role="dialog"] button')
      .find((botao) => botao.text() === 'Confirmar aprovação')
      ?.trigger('click')
    await flushPromises()

    expect(aprovarVenda).toHaveBeenCalledWith(41)
    expect(wrapper.text()).toContain('Venda #41 aprovada com sucesso.')
    expect(wrapper.text()).toContain('Não há vendas aguardando aprovação.')
  })

  it('reprova venda pendente e informa erro quando a API rejeita a operação', async () => {
    vi.mocked(rejeitarVenda).mockRejectedValue(new Error('Falha ao reprovar'))
    const wrapper = await montar('admin')
    await wrapper.findAll('button').find((botao) => botao.text() === 'Reprovar')?.trigger('click')
    await wrapper
      .findAll('[role="dialog"] button')
      .find((botao) => botao.text() === 'Confirmar reprovação')
      ?.trigger('click')
    await flushPromises()

    expect(rejeitarVenda).toHaveBeenCalledWith(41)
    expect(wrapper.get('[role="alert"]').text()).toContain(
      'Não foi possível concluir a operação. Tente novamente.',
    )
  })

  it('reprova venda pendente e atualiza fila e acompanhamento com status da API', async () => {
    vi.mocked(listarVendas)
      .mockResolvedValueOnce([vendaPendente])
      .mockResolvedValueOnce([{ ...vendaPendente, status: 'cancelada' }])
    const wrapper = await montar('admin')
    await wrapper.findAll('button').find((botao) => botao.text() === 'Reprovar')?.trigger('click')
    await wrapper
      .findAll('[role="dialog"] button')
      .find((botao) => botao.text() === 'Confirmar reprovação')
      ?.trigger('click')
    await flushPromises()

    expect(rejeitarVenda).toHaveBeenCalledWith(41)
    expect(wrapper.text()).toContain('Venda #41 reprovada com sucesso.')
    expect(wrapper.text()).toContain('Não há vendas aguardando aprovação.')
  })
})
