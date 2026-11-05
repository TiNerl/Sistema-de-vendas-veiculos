import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import VeiculosVendedorView from '@/views/VeiculosVendedorView.vue'
import { listarVeiculos } from '@/services/veiculos.service'

vi.mock('@/services/veiculos.service', () => ({
  listarVeiculos: vi.fn(),
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
  beforeEach(() => {
    vi.mocked(listarVeiculos).mockReset()
  })

  it('carrega veículos e aplica filtros combinados', async () => {
    vi.mocked(listarVeiculos)
      .mockResolvedValueOnce(veiculosDeTeste)
      .mockResolvedValueOnce(veiculosDeTeste.filter((veiculo) => veiculo.modelo === 'Hilux'))

    const wrapper = mount(VeiculosVendedorView)
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

    const wrapper = mount(VeiculosVendedorView)
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

    const wrapper = mount(VeiculosVendedorView)
    await flushPromises()

    await wrapper.get('#modelo-veiculo').setValue('SemResultado')
    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.text()).toContain('Nenhum veículo corresponde aos filtros selecionados.')
  })
})
