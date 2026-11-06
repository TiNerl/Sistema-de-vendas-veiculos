import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import CadastrarVendaView from '@/views/CadastrarVendaView.vue'
import { listarClientes } from '@/services/clientes.service'
import { listarVeiculos } from '@/services/veiculos.service'
import { cadastrarVenda } from '@/services/vendas.service'
import { useAuthStore } from '@/stores/auth'

vi.mock('@/services/clientes.service', () => ({
  listarClientes: vi.fn(),
}))

vi.mock('@/services/veiculos.service', () => ({
  listarVeiculos: vi.fn(),
}))

vi.mock('@/services/vendas.service', () => ({
  cadastrarVenda: vi.fn(),
}))

describe('CadastrarVendaView', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    vi.clearAllMocks()
    pinia = createPinia()
    setActivePinia(pinia)
    useAuthStore().usuario = { id: 2, cpf: '00000000000', perfil: 'vendedor' }

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
    vi.mocked(cadastrarVenda).mockResolvedValue({
      id_venda: 41,
      valor_veiculo: '100000.00',
      percentual_desconto: '10.00',
      valor_desconto: '10000.00',
      valor_final: '90000.00',
      forma_pagamento: 'a_vista',
      percentual_comissao: '3.00',
      valor_comissao: '2700.00',
      status: 'concluida',
      data_venda: '2026-11-04T12:00:00.000Z',
    })
  })

  it.each([
    {
      percentual: 0,
      status: 'concluida' as const,
      mensagem: 'Venda #41 registrada com sucesso.',
      tipoSucesso: 'registrada',
    },
    {
      percentual: 5,
      status: 'concluida' as const,
      mensagem: 'Venda #41 registrada com sucesso.',
      tipoSucesso: 'registrada',
    },
    {
      percentual: 10,
      status: 'concluida' as const,
      mensagem: 'Venda #41 registrada com sucesso.',
      tipoSucesso: 'registrada',
    },
    {
      percentual: 15,
      status: 'pendente' as const,
      mensagem: 'Solicitação de desconto da venda #41 enviada para aprovação.',
      tipoSucesso: 'enviada para aprovação',
    },
  ])(
    'registra a venda com desconto de $percentual% e respeita o status retornado pela API',
    async ({ percentual, status, mensagem, tipoSucesso }) => {
      vi.mocked(cadastrarVenda).mockResolvedValue({
        id_venda: 41,
        valor_veiculo: '100000.00',
        percentual_desconto: String(percentual),
        valor_desconto: String(percentual * 1000),
        valor_final: String(100000 - percentual * 1000),
        forma_pagamento: 'a_vista',
        percentual_comissao: '3.00',
        valor_comissao: '2700.00',
        status,
        data_venda: '2026-11-04T12:00:00.000Z',
      })

      const router = createRouter({
        history: createMemoryHistory(),
        routes: [
          { path: '/vendedor/vendas', component: CadastrarVendaView },
          { path: '/vendedor', component: { template: '<div />' } },
        ],
      })
      await router.push('/vendedor/vendas')

      const wrapper = mount(CadastrarVendaView, {
        global: { plugins: [pinia, router] },
      })
      await flushPromises()

      await wrapper.get('#cliente-venda').setValue('7')
      await wrapper.get('#veiculo-venda').setValue('3')
      await wrapper.get('#desconto-venda').setValue(String(percentual))
      await wrapper.get('form').trigger('submit')
      await flushPromises()

      expect(cadastrarVenda).toHaveBeenCalledOnce()
      expect(cadastrarVenda).toHaveBeenCalledWith({
        id_cliente: 7,
        id_veiculo: 3,
        forma_pagamento: 'a_vista',
        percentual_desconto: percentual,
      })
      expect(wrapper.text()).toContain(mensagem)
      expect(wrapper.text()).toContain(tipoSucesso)
    },
  )
})
