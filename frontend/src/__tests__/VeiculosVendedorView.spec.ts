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
]

describe('VeiculosVendedorView', () => {
  beforeEach(() => {
    vi.mocked(listarVeiculos).mockReset()
  })

  it('carrega veículos e aplica filtros combinados', async () => {
    vi.mocked(listarVeiculos).mockResolvedValue(veiculosDeTeste)

    const wrapper = mount(VeiculosVendedorView)
    await flushPromises()

    expect(wrapper.text()).toContain('Toyota')
    expect(wrapper.text()).toMatch(/R\$\s*145\.000,00/)
    expect(wrapper.findAll('tbody tr')).toHaveLength(3)

    await wrapper.get('#marca-veiculo').setValue('Toyota')
    await wrapper.get('#modelo-veiculo').setValue('Hilux')
    await wrapper.get('#filtro-status-veiculos').setValue('vendido')
    await wrapper.get('form').trigger('submit.prevent')

    expect(wrapper.findAll('tbody tr')).toHaveLength(1)
    expect(wrapper.text()).toContain('Hilux')
    expect(wrapper.text()).toContain('Vendido')
  })

  it('valida faixa de preço e limpa os filtros', async () => {
    vi.mocked(listarVeiculos).mockResolvedValue(veiculosDeTeste)

    const wrapper = mount(VeiculosVendedorView)
    await flushPromises()

    await wrapper.get('#preco-min').setValue('200000')
    await wrapper.get('#preco-max').setValue('150000')
    await wrapper.get('form').trigger('submit.prevent')

    expect(wrapper.text()).toContain('O preço mínimo não pode ser maior que o preço máximo.')

    await wrapper.get('button[type="button"]').trigger('click')
    expect((wrapper.get('#preco-min').element as HTMLInputElement).value).toBe('')
    expect((wrapper.get('#preco-max').element as HTMLInputElement).value).toBe('')
    expect(wrapper.findAll('tbody tr')).toHaveLength(3)
  })

  it('exibe mensagem quando não há resultados para os filtros', async () => {
    vi.mocked(listarVeiculos).mockResolvedValue(veiculosDeTeste)

    const wrapper = mount(VeiculosVendedorView)
    await flushPromises()

    await wrapper.get('#modelo-veiculo').setValue('SemResultado')
    await wrapper.get('form').trigger('submit.prevent')

    expect(wrapper.text()).toContain('Nenhum veículo corresponde aos filtros selecionados.')
  })
})
