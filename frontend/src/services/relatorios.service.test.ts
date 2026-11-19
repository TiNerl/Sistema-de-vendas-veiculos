import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@/services/api'
import {
  exportarRelatorioDesempenhoCsv,
  exportarRelatorioEstoqueCsv,
  exportarRelatorioFaturamentoCsv,
} from '@/services/relatorios.service'

vi.mock('@/services/api', () => ({
  api: {
    get: vi.fn(),
  },
}))

const obter = vi.mocked(api.get)

describe('exportação CSV dos relatórios', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    obter.mockResolvedValue({
      data: new Blob(['Ano,Mês\r\n2026,5']),
      headers: { 'content-disposition': 'attachment; filename="relatorio.csv"' },
    } as never)
  })

  it('usa GET, envia período e recebe o CSV de faturamento como Blob', async () => {
    const arquivo = await exportarRelatorioFaturamentoCsv({
      dataInicio: '2026-05-01',
      dataFim: '2026-05-31',
    })

    expect(obter).toHaveBeenCalledWith('/relatorios/faturamento/csv', {
      params: { dataInicio: '2026-05-01', dataFim: '2026-05-31' },
      responseType: 'blob',
    })
    expect(arquivo.nomeArquivo).toBe('relatorio.csv')
    expect(await arquivo.arquivo.text()).toBe('Ano,Mês\r\n2026,5')
  })

  it('exporta estoque sem filtros e usa nome padrão quando não há cabeçalho', async () => {
    obter.mockResolvedValueOnce({
      data: new Blob(['Status,Quantidade']),
      headers: {},
    } as never)

    const arquivo = await exportarRelatorioEstoqueCsv()

    expect(obter).toHaveBeenCalledWith('/relatorios/estoque/csv', {
      params: undefined,
      responseType: 'blob',
    })
    expect(arquivo.nomeArquivo).toBe('estoque.csv')
  })

  it('envia data e vendedor selecionado no desempenho e decodifica filename*', async () => {
    obter.mockResolvedValueOnce({
      data: new Blob(['Vendedor,Vendas']),
      headers: {
        'content-disposition':
          "attachment; filename=\"desempenho.csv\"; filename*=UTF-8''desempenho-vendedores.csv",
      },
    } as never)

    const arquivo = await exportarRelatorioDesempenhoCsv({
      dataInicio: '2026-05-01',
      dataFim: '2026-05-31',
      id_usuario: 2,
    })

    expect(obter).toHaveBeenCalledWith('/relatorios/desempenho-vendedores/csv', {
      params: { dataInicio: '2026-05-01', dataFim: '2026-05-31', id_usuario: 2 },
      responseType: 'blob',
    })
    expect(arquivo.nomeArquivo).toBe('desempenho-vendedores.csv')
  })

  it('rejeita uma resposta sem conteúdo para exportação', async () => {
    obter.mockResolvedValueOnce({ data: new Blob([]), headers: {} } as never)

    await expect(exportarRelatorioFaturamentoCsv()).rejects.toThrow(
      'O relatório não contém dados para exportação.',
    )
  })
})
