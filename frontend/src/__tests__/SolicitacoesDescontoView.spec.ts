import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import SolicitacoesDescontoView from '@/views/SolicitacoesDescontoView.vue'
import { listarClientes } from '@/services/clientes.service'
import { listarVeiculos } from '@/services/veiculos.service'
import { useAuthStore } from '@/stores/auth'

vi.mock('@/services/clientes.service', () => ({
  listarClientes: vi.fn(),
}))

vi.mock('@/services/veiculos.service', () => ({
  listarVeiculos: vi.fn(),
}))

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

  it('permite ao vendedor montar o cálculo de uma solicitação de 10% ou mais', async () => {
    const wrapper = await montar('vendedor')
    await wrapper.get('#desconto-cliente').setValue('7')
    await wrapper.get('#desconto-veiculo').setValue('3')
    await wrapper.get('#desconto-percentual').setValue('10')
    await flushPromises()

    expect(wrapper.text()).toContain('10%')
    expect(wrapper.text()).toContain('R$ 10.000,00')
    expect(wrapper.text()).toContain('Rascunho — não enviado')
    expect(wrapper.get('button[type="button"]').attributes('disabled')).toBeDefined()
    expect(listarClientes).toHaveBeenCalledOnce()
    expect(listarVeiculos).toHaveBeenCalledOnce()
  })

  it('exige ao menos 10% e mantém o envio desabilitado sem endpoint', async () => {
    const wrapper = await montar('vendedor')
    await wrapper.get('#desconto-cliente').setValue('7')
    await wrapper.get('#desconto-veiculo').setValue('3')
    await wrapper.get('#desconto-percentual').setValue('9.99')
    await flushPromises()

    expect(wrapper.get('#desconto-percentual').attributes('min')).toBe('10')
    expect(wrapper.get('button[type="button"]').attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('não envia, salva nem aprova pedidos')
  })

  it('exibe ao administrador a fila e ações de decisão desabilitadas', async () => {
    const wrapper = await montar('admin')

    expect(wrapper.text()).toContain('Fila de aprovação')
    expect(wrapper.text()).toContain('Percentual')
    expect(wrapper.text()).toContain('Valor')
    expect(wrapper.text()).toContain('Situação')
    const textoAcoes = wrapper.findAll('button[disabled]').map((botao) => botao.text()).join(' ')
    expect(textoAcoes).toContain('Aprovar solicitação')
    expect(textoAcoes).toContain('Reprovar solicitação')
    expect(listarClientes).not.toHaveBeenCalled()
    expect(listarVeiculos).not.toHaveBeenCalled()
  })
})
