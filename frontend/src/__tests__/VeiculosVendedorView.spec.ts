import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import VeiculosVendedorView from '@/views/VeiculosVendedorView.vue'
import {
  atualizarMinimoEstoque,
  atualizarStatusVeiculo,
  listarVeiculos,
  obterResumoEstoque,
} from '@/services/veiculos.service'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'

vi.mock('@/services/veiculos.service', () => ({
  atualizarMinimoEstoque: vi.fn(),
  atualizarStatusVeiculo: vi.fn(),
  listarVeiculos: vi.fn(),
  obterResumoEstoque: vi.fn(),
}))

const veiculosDeTeste = [
  {
    id_veiculo: 1,
    marca: 'Toyota',
    modelo: 'Corolla',
    versao: 'XEi',
    ano: 2024,
    cor: 'Prata',
    quilometragem: 12000,
    combustivel: 'flex',
    cambio: 'automatico',
    placa: 'ABC1D23',
    chassi: '12345678901234567',
    renavam: '12345678901',
    preco: '145000.00',
    status: 'disponivel' as const,
  },
  {
    id_veiculo: 2,
    marca: 'Honda',
    modelo: 'Civic',
    versao: 'Touring',
    ano: 2023,
    cor: 'Preto',
    quilometragem: 18000,
    combustivel: 'flex',
    cambio: 'automatico',
    placa: 'DEF4G56',
    chassi: '76543210987654321',
    renavam: '10987654321',
    preco: '158000.00',
    status: 'reservado' as const,
  },
  {
    id_veiculo: 3,
    marca: 'Toyota',
    modelo: 'Hilux',
    versao: 'SRV 4x4',
    ano: 2021,
    cor: 'Branco',
    quilometragem: 45000,
    combustivel: 'diesel',
    cambio: 'automatico',
    placa: 'GHI7J89',
    chassi: '34567890123456789',
    renavam: '34567890123',
    preco: '265000.00',
    status: 'vendido' as const,
  },
  {
    id_veiculo: 4,
    marca: 'Fiat',
    modelo: 'Pulse',
    versao: 'Audace',
    ano: 2022,
    cor: 'Cinza',
    quilometragem: 25000,
    combustivel: 'etanol',
    cambio: 'automatico',
    placa: 'JKL0M12',
    chassi: '45678901234567890',
    renavam: '45678901234',
    preco: '98000.00',
    status: 'em_manutencao' as const,
  },
]

describe('VeiculosVendedorView', () => {
  let pinia: ReturnType<typeof createPinia>
  let router: ReturnType<typeof createRouter>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    useAuthStore().usuario = { id: 2, cpf: '10987654321', perfil: 'vendedor' }
    router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div />' } }],
    })
    vi.mocked(listarVeiculos).mockReset()
    vi.mocked(atualizarStatusVeiculo).mockReset()
    vi.mocked(atualizarMinimoEstoque).mockReset()
    vi.mocked(obterResumoEstoque).mockReset()
  })

  function montarView() {
    return mount(VeiculosVendedorView, {
      global: { plugins: [pinia, router] },
    })
  }

  it('carrega veículos e aplica filtros combinados', async () => {
    vi.mocked(listarVeiculos)
      .mockResolvedValueOnce(veiculosDeTeste)
      .mockResolvedValueOnce(veiculosDeTeste.filter((veiculo) => veiculo.modelo === 'Hilux'))

    const wrapper = montarView()
    await flushPromises()

    expect(wrapper.text()).toContain('Toyota')
    expect(wrapper.text()).toMatch(/R\$\s*145\.000,00/)
    expect(wrapper.findAll('tbody tr')).toHaveLength(4)
    expect(wrapper.text()).toContain('Disponível')
    expect(wrapper.text()).toContain('Reservado')
    expect(wrapper.text()).toContain('Vendido')
    expect(wrapper.text()).toContain('Em manutenção')

    await wrapper.get('#marca-veiculo').setValue('Toyota')
    await wrapper.get('#modelo-veiculo').setValue('Hilux')
    await wrapper.get('#preco-min').setValue('200000')
    await wrapper.get('#preco-max').setValue('300000')
    await wrapper.get('#ano-min').setValue('2020')
    await wrapper.get('#ano-max').setValue('2022')
    await wrapper.get('#combustivel-veiculo').setValue('diesel')
    await wrapper.get('#filtro-status-veiculos').setValue('vendido')
    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.findAll('tbody tr')).toHaveLength(1)
    expect(wrapper.text()).toContain('Hilux')
    expect(wrapper.text()).toContain('Vendido')
    expect(listarVeiculos).toHaveBeenLastCalledWith({
      marca: 'Toyota',
      modelo: 'Hilux',
      precoMin: 200000,
      precoMax: 300000,
      anoMin: 2020,
      anoMax: 2022,
      combustivel: 'diesel',
      status: 'vendido',
    })
  })

  it('valida faixa de preço e limpa os filtros', async () => {
    vi.mocked(listarVeiculos).mockResolvedValue(veiculosDeTeste)

    const wrapper = montarView()
    await flushPromises()

    await wrapper.get('#preco-min').setValue('200000')
    await wrapper.get('#preco-max').setValue('150000')
    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.text()).toContain('O preço mínimo não pode ser maior que o preço máximo.')

    vi.mocked(listarVeiculos).mockResolvedValueOnce(veiculosDeTeste)
    await wrapper.get('button[type="button"]').trigger('click')
    await flushPromises()
    expect((wrapper.get('#preco-min').element as HTMLInputElement).value).toBe('')
    expect((wrapper.get('#preco-max').element as HTMLInputElement).value).toBe('')
    expect(wrapper.findAll('tbody tr')).toHaveLength(4)
    expect(listarVeiculos).toHaveBeenLastCalledWith({})
  })

  it('exibe mensagem quando não há resultados para os filtros', async () => {
    vi.mocked(listarVeiculos)
      .mockResolvedValueOnce(veiculosDeTeste)
      .mockResolvedValueOnce([])

    const wrapper = montarView()
    await flushPromises()

    await wrapper.get('#modelo-veiculo').setValue('SemResultado')
    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.text()).toContain('Nenhum veículo corresponde aos filtros selecionados.')
  })

  it('confirma a alteração de status antes de enviar e atualiza a listagem', async () => {
    useAuthStore().usuario = { id: 1, cpf: '12345678901', perfil: 'admin' }
    vi.mocked(listarVeiculos)
      .mockResolvedValueOnce(veiculosDeTeste)
      .mockResolvedValueOnce([
        { ...veiculosDeTeste[0], status: 'em_manutencao' },
        ...veiculosDeTeste.slice(1),
      ])
    vi.mocked(obterResumoEstoque).mockResolvedValue({
      quantidadeDisponivel: 1,
      quantidadeMinima: 10,
      abaixoDoMinimo: true,
    })
    vi.mocked(atualizarStatusVeiculo).mockResolvedValue({
      ...veiculosDeTeste[0],
      status: 'em_manutencao',
    })

    const wrapper = montarView()
    await flushPromises()
    await wrapper.get('.status-change-button').trigger('click')

    expect(wrapper.text()).toContain('Disponível para Em manutenção')
    expect(atualizarStatusVeiculo).not.toHaveBeenCalled()
    await wrapper.get('[role="dialog"] button.secondary-button').trigger('click')
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    expect(atualizarStatusVeiculo).not.toHaveBeenCalled()

    await wrapper.get('.status-change-button').trigger('click')
    await wrapper.get('[role="dialog"] button.primary-button').trigger('click')
    await flushPromises()

    expect(atualizarStatusVeiculo).toHaveBeenCalledWith(1, 'em_manutencao')
    expect(wrapper.findAll('tbody tr')[0].text()).toContain('Em manutenção')
    expect(wrapper.text()).toContain('Status do veículo Toyota Corolla atualizado')
    expect(listarVeiculos).toHaveBeenLastCalledWith({})
  })

  it('não mostra controles administrativos para o vendedor', async () => {
    useAuthStore().usuario = { id: 2, cpf: '10987654321', perfil: 'vendedor' }
    vi.mocked(listarVeiculos).mockResolvedValue(veiculosDeTeste)

    const wrapper = montarView()
    await flushPromises()

    expect(wrapper.text()).not.toContain('Alterar status')
    expect(wrapper.text()).not.toContain('Quantidade mínima')
    expect(obterResumoEstoque).not.toHaveBeenCalled()
  })

  it('permite ao administrador configurar e ver o alerta do mínimo de estoque', async () => {
    useAuthStore().usuario = { id: 1, cpf: '12345678901', perfil: 'admin' }
    vi.mocked(listarVeiculos).mockResolvedValue(veiculosDeTeste)
    vi.mocked(obterResumoEstoque).mockResolvedValue({
      quantidadeDisponivel: 7,
      quantidadeMinima: 10,
      abaixoDoMinimo: true,
    })
    vi.mocked(atualizarMinimoEstoque).mockResolvedValue({
      quantidadeDisponivel: 7,
      quantidadeMinima: 5,
      abaixoDoMinimo: false,
    })

    const wrapper = montarView()
    await flushPromises()

    expect(wrapper.text()).toContain('Estoque baixo!')
    expect(wrapper.text()).toContain('apenas 7 veículos disponíveis')
    await wrapper.get('#minimo-estoque').setValue('5')
    await wrapper.get('.minimum-form').trigger('submit.prevent')
    await flushPromises()

    expect(atualizarMinimoEstoque).toHaveBeenCalledWith(5)
    expect(wrapper.text()).toContain('Estoque dentro do mínimo configurado.')
    expect(wrapper.text()).toContain('Quantidade mínima de estoque atualizada.')
  })
})
