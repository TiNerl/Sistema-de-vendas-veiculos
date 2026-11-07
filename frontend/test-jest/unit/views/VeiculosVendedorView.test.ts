/**
 * UC10 Consultar estoque com filtros · UC12 Alterar status do veículo.
 */
import { beforeEach, describe, expect, it } from '@jest/globals'
import { flushPromises } from '@vue/test-utils'
import VeiculosVendedorView from '@/views/VeiculosVendedorView.vue'
import { atualizarStatusVeiculo, listarVeiculos } from '@/services/veiculos.service'
import type { Veiculo } from '@/types/veiculo'
import { erroApi, montar } from '../../support/montar'

jest.mock('@/services/veiculos.service', () => ({ listarVeiculos: jest.fn(), atualizarStatusVeiculo: jest.fn() }))
const listarMock = listarVeiculos as jest.MockedFunction<typeof listarVeiculos>
const statusMock = atualizarStatusVeiculo as jest.MockedFunction<typeof atualizarStatusVeiculo>

const veiculo = (extra: Partial<Veiculo> = {}): Veiculo => ({
  id_veiculo: 7, marca: 'Toyota', modelo: 'Corolla', versao: 'XEi', ano: 2024, cor: 'Prata',
  quilometragem: 12000, combustivel: 'flex', cambio: 'automatico', placa: 'ABC1D23',
  chassi: '9BWZZZ377VT004251', renavam: '12345678901', preco: '145000.00', status: 'disponivel', ...extra,
})

const linhas = (w: Awaited<ReturnType<typeof montar>>['wrapper']) => w.findAll('tbody tr')

describe('VeiculosVendedorView', () => {
  beforeEach(() => {
    listarMock.mockResolvedValue([
      veiculo(),
      veiculo({ id_veiculo: 8, marca: 'Fiat', modelo: 'Argo', status: 'em_manutencao', combustivel: 'eletrico' }),
      veiculo({ id_veiculo: 9, marca: 'VW', modelo: 'Polo', status: 'vendido' }),
    ])
  })

  it('carrega o estoque ao abrir e formata preço (R$), quilometragem e rótulos', async () => {
    const { wrapper } = await montar(VeiculosVendedorView, { caminho: '/admin/veiculos', perfil: 'admin' })

    expect(listarMock).toHaveBeenCalledWith({})
    expect(linhas(wrapper)).toHaveLength(3)
    const primeira = linhas(wrapper)[0]!.text()
    expect(primeira).toContain('Toyota Corolla')
    expect(primeira).toMatch(/R\$\s?145\.000,00/)
    expect(primeira).toContain('12.000 km')
    expect(linhas(wrapper)[1]!.text()).toContain('Elétrico')
    expect(linhas(wrapper)[1]!.text()).toContain('Em manutenção')
  })

  it('exibe a confirmação vinda do cadastro (?veiculoSalvo=cadastrado)', async () => {
    const { wrapper } = await montar(VeiculosVendedorView, {
      caminho: '/admin/veiculos?veiculoSalvo=cadastrado', padrao: '/admin/veiculos', perfil: 'admin',
    })
    expect(wrapper.text()).toContain('Veículo cadastrado com sucesso.')
  })

  it('envia apenas os filtros preenchidos, com números e textos aparados', async () => {
    const { wrapper } = await montar(VeiculosVendedorView, { caminho: '/vendedor/veiculos', perfil: 'vendedor' })

    await wrapper.get('#marca-veiculo').setValue('  Toyota ')
    await wrapper.get('#preco-max').setValue('150000')
    await wrapper.get('#combustivel-veiculo').setValue('flex')
    await wrapper.get('#filtro-status-veiculos').setValue('disponivel')
    await wrapper.get('form.filters').trigger('submit')
    await flushPromises()

    expect(listarMock).toHaveBeenLastCalledWith({
      marca: 'Toyota', precoMax: 150000, combustivel: 'flex', status: 'disponivel',
    })
  })

  /**
   * Contrato do frontend (e do README): faixa de ano como anoMin/anoMax.
   * O backend ainda não aceita esses parâmetros → DEF-01 (coberto na suíte do backend).
   */
  it('envia a faixa de ano como anoMin/anoMax [contrato afetado pelo DEF-01]', async () => {
    const { wrapper } = await montar(VeiculosVendedorView, { caminho: '/vendedor/veiculos', perfil: 'vendedor' })
    await wrapper.get('#ano-min').setValue('2020')
    await wrapper.get('#ano-max').setValue('2025')
    await wrapper.get('form.filters').trigger('submit')
    await flushPromises()
    expect(listarMock).toHaveBeenLastCalledWith({ anoMin: 2020, anoMax: 2025 })
  })

  it.each([
    ['preço', '#preco-min', '#preco-max', '200000', '100000', 'O preço mínimo não pode ser maior que o preço máximo.'],
    ['ano', '#ano-min', '#ano-max', '2025', '2020', 'O ano inicial não pode ser maior que o ano final.'],
  ])('valida faixa de %s invertida sem consultar a API', async (_c, min, max, vMin, vMax, mensagem) => {
    const { wrapper } = await montar(VeiculosVendedorView, { caminho: '/admin/veiculos', perfil: 'admin' })
    listarMock.mockClear()

    await wrapper.get(min).setValue(vMin)
    await wrapper.get(max).setValue(vMax)
    await wrapper.get('form.filters').trigger('submit')

    expect(wrapper.get('.form-message--error').text()).toBe(mensagem)
    expect(listarMock).not.toHaveBeenCalled()
  })

  it('limpar filtros recarrega o estoque completo', async () => {
    const { wrapper } = await montar(VeiculosVendedorView, { caminho: '/admin/veiculos', perfil: 'admin' })
    await wrapper.get('#marca-veiculo').setValue('Fiat')
    await wrapper.findAll('button').find((b) => b.text() === 'Limpar filtros')!.trigger('click')
    await flushPromises()
    expect((wrapper.get('#marca-veiculo').element as HTMLInputElement).value).toBe('')
    expect(listarMock).toHaveBeenLastCalledWith({})
  })

  it('mostra a mensagem do backend e permite tentar novamente quando a consulta falha', async () => {
    listarMock.mockRejectedValueOnce(erroApi(400, 'O preço mínimo não pode ser maior que o preço máximo'))
    const { wrapper } = await montar(VeiculosVendedorView, { caminho: '/admin/veiculos', perfil: 'admin' })

    expect(wrapper.get('[role="alert"]').text()).toContain('O preço mínimo não pode ser maior')
    await wrapper.get('button.inline-retry').trigger('click')
    await flushPromises()
    expect(linhas(wrapper)).toHaveLength(3)
  })

  describe('alteração de status (UC12)', () => {
    it('vendedor NÃO vê o botão "Alterar status" (somente consulta)', async () => {
      const { wrapper } = await montar(VeiculosVendedorView, { caminho: '/vendedor/veiculos', perfil: 'vendedor' })
      expect(wrapper.findAll('button.status-change-button')).toHaveLength(0)
    })

    it('administrador só pode alterar veículos disponíveis ou em manutenção (vendido fica bloqueado)', async () => {
      const { wrapper } = await montar(VeiculosVendedorView, { caminho: '/admin/veiculos', perfil: 'admin' })
      expect(linhas(wrapper)[0]!.find('button.status-change-button').exists()).toBe(true)
      expect(linhas(wrapper)[1]!.find('button.status-change-button').exists()).toBe(true)
      expect(linhas(wrapper)[2]!.find('button.status-change-button').exists()).toBe(false)
    })

    it('oferece apenas a transição permitida e confirma antes de gravar', async () => {
      statusMock.mockResolvedValue(veiculo({ status: 'em_manutencao' }))
      const { wrapper } = await montar(VeiculosVendedorView, { caminho: '/admin/veiculos', perfil: 'admin' })

      await linhas(wrapper)[0]!.get('button.status-change-button').trigger('click')
      const opcoes = wrapper.findAll('#novo-status-veiculo option').map((o) => o.attributes('value'))
      expect(opcoes).toEqual(['em_manutencao'])
      expect(wrapper.get('[role="dialog"]').text()).toContain('Tem certeza')

      await wrapper.findAll('[role="dialog"] button').find((b) => b.text() === 'Confirmar')!.trigger('click')
      await flushPromises()

      expect(statusMock).toHaveBeenCalledWith(7, 'em_manutencao')
      expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
      expect(wrapper.text()).toContain('Status do veículo Toyota Corolla atualizado para Em manutenção.')
    })

    it('cancelar fecha o diálogo sem chamar a API', async () => {
      const { wrapper } = await montar(VeiculosVendedorView, { caminho: '/admin/veiculos', perfil: 'admin' })
      await linhas(wrapper)[1]!.get('button.status-change-button').trigger('click')
      expect(wrapper.findAll('#novo-status-veiculo option').map((o) => o.attributes('value'))).toEqual(['disponivel'])
      await wrapper.findAll('[role="dialog"] button').find((b) => b.text() === 'Cancelar')!.trigger('click')
      expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
      expect(statusMock).not.toHaveBeenCalled()
    })

    it('mantém o diálogo aberto e mostra o erro se a API recusar', async () => {
      statusMock.mockRejectedValue(erroApi(409, 'Veículo com venda concluída'))
      const { wrapper } = await montar(VeiculosVendedorView, { caminho: '/admin/veiculos', perfil: 'admin' })
      await linhas(wrapper)[0]!.get('button.status-change-button').trigger('click')
      await wrapper.findAll('[role="dialog"] button').find((b) => b.text() === 'Confirmar')!.trigger('click')
      await flushPromises()
      expect(wrapper.get('.status-error').text()).toBe('Veículo com venda concluída')
      expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
    })
  })
})
