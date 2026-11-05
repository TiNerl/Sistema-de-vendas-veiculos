import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import HistoricoVendasView from '@/views/HistoricoVendasView.vue'
import { listarClientes } from '@/services/clientes.service'
import { listarVendas } from '@/services/vendas.service'
import type { VendaRegistrada } from '@/services/vendas.service'
import { useAuthStore } from '@/stores/auth'

vi.mock('@/services/clientes.service', () => ({
  listarClientes: vi.fn(),
}))

vi.mock('@/services/vendas.service', () => ({
  listarVendas: vi.fn(),
}))

const vendasDeTeste: VendaRegistrada[] = [
  {
    id_venda: 1,
    valor_veiculo: '100000.00',
    percentual_desconto: '5.00',
    valor_desconto: '5000.00',
    valor_final: '95000.00',
    forma_pagamento: 'a_vista',
    percentual_comissao: '3.00',
    valor_comissao: '2850.00',
    status: 'concluida',
    data_venda: '2026-03-10T12:00:00.000Z',
    cliente: { id_cliente: 8, nome: 'Ana Silva' },
    veiculo: { id_veiculo: 3, marca: 'Honda', modelo: 'Civic', versao: 'EX', placa: 'ABC1234' },
    usuario: { id_usuario: 2, nome: 'Vendedor A' },
  },
  {
    id_venda: 2,
    valor_veiculo: '80000.00',
    percentual_desconto: '0.00',
    valor_desconto: '0.00',
    valor_final: '80000.00',
    forma_pagamento: null,
    percentual_comissao: null,
    valor_comissao: null,
    status: 'cancelada',
    data_venda: '2026-03-11T12:00:00.000Z',
    cliente: { id_cliente: 9, nome: 'Bruno Souza' },
    veiculo: { id_veiculo: 4, marca: 'Toyota', modelo: 'Corolla', versao: 'XEi', placa: 'DEF5678' },
    usuario: { id_usuario: 3, nome: 'Vendedor B' },
  },
]

const clientesDeTeste = [
  {
    id_cliente: 8,
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
]

describe('HistoricoVendasView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
    vi.mocked(listarClientes).mockResolvedValue(clientesDeTeste)
    vi.mocked(listarVendas).mockResolvedValue(vendasDeTeste)
  })

  async function montar(perfil: 'admin' | 'vendedor', clienteId?: string) {
    const pinia = createPinia()
    setActivePinia(pinia)
    const auth = useAuthStore()
    auth.usuario = {
      id: perfil === 'vendedor' ? 2 : 1,
      cpf: '00000000000',
      perfil,
    }

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/historico', component: HistoricoVendasView }],
    })
    await router.push({
      path: '/historico',
      query: clienteId ? { cliente_id: clienteId } : undefined,
    })

    const wrapper = mount(HistoricoVendasView, {
      global: { plugins: [pinia, router] },
    })
    await flushPromises()
    return wrapper
  }

  it('mostra ao vendedor somente as próprias vendas', async () => {
    const wrapper = await montar('vendedor')

    expect(listarVendas).toHaveBeenCalledWith({})
    expect(wrapper.text()).toContain('Ana Silva')
    expect(wrapper.text()).not.toContain('Bruno Souza')
    expect(wrapper.text()).not.toContain('Vendedor A')
    expect(wrapper.text()).toContain('95.000,00')
    expect(wrapper.text()).toContain('5.000,00')
    expect(wrapper.text()).toContain('3,00%')
    expect(wrapper.text()).toContain('2.850,00')
  })

  it('mostra o histórico completo e o vendedor para administradores', async () => {
    const wrapper = await montar('admin')

    expect(wrapper.text()).toContain('Ana Silva')
    expect(wrapper.text()).toContain('Bruno Souza')
    expect(wrapper.text()).toContain('Vendedor A')
    expect(wrapper.text()).toContain('Vendedor B')
    expect(wrapper.text()).toContain('Cancelada')
    expect(wrapper.text()).toContain('2.850,00')
    expect(wrapper.text()).toContain('3,00%')
    expect(wrapper.text()).toContain('Não informado')
    const linhas = wrapper.findAll('tbody tr')
    expect(linhas).toHaveLength(2)
    const segundaVenda = linhas[1]?.findAll('td')
    expect(segundaVenda?.[7]?.text()).toBe('Não informado')
    expect(segundaVenda?.[8]?.text()).toBe('Não informado')
  })

  it('exibe status cancelada da API sem oferecer cancelamento de vendas concluídas', async () => {
    const wrapper = await montar('admin')

    expect(wrapper.text()).toContain('Cancelada')
    expect(wrapper.text()).not.toContain('Cancelar venda')
    expect(wrapper.find('button[aria-label^="Cancelar venda"]').exists()).toBe(false)
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })

  it('aplica o filtro de cliente recebido na URL', async () => {
    await montar('admin', '8')

    expect(listarVendas).toHaveBeenCalledWith({ cliente_id: 8 })
  })

  it('envia filtros de período e cliente ao consultar', async () => {
    const wrapper = await montar('admin')
    await wrapper.get('#filtro-cliente').setValue('8')
    await wrapper.get('#filtro-data-inicio').setValue('2026-03-01')
    await wrapper.get('#filtro-data-fim').setValue('2026-03-31')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(listarVendas).toHaveBeenLastCalledWith({
      cliente_id: 8,
      dataInicio: '2026-03-01',
      dataFim: '2026-03-31',
    })
  })

  it('rejeita período invertido sem consultar a API', async () => {
    const wrapper = await montar('admin')
    vi.mocked(listarVendas).mockClear()
    await wrapper.get('#filtro-data-inicio').setValue('2026-03-31')
    await wrapper.get('#filtro-data-fim').setValue('2026-03-01')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.get('[role="alert"]').text()).toContain(
      'A data inicial não pode ser posterior à data final.',
    )
    expect(listarVendas).not.toHaveBeenCalled()
  })
})
