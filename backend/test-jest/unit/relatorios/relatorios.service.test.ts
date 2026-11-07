/**
 * UC17 – Emitir relatório de faturamento por período (RF-REL-01)
 */
import { beforeEach, describe, expect, it } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RelatoriosService } from '../../../src/modules/relatorios/relatorios.service';
import { Venda } from '../../../src/modules/vendas/venda.entity';
import { criarRepositorioMock, type RepositorioMock } from '../../helpers/mocks';

describe('RelatoriosService.gerarRelatorioFaturamento', () => {
  let repo: RepositorioMock;
  let service: RelatoriosService;

  beforeEach(async () => {
    repo = criarRepositorioMock();
    const modulo = await Test.createTestingModule({
      providers: [RelatoriosService, { provide: getRepositoryToken(Venda), useValue: repo }],
    }).compile();
    service = modulo.get(RelatoriosService);
  });

  it('considera apenas vendas CONCLUÍDAS (pendentes e canceladas não são faturamento)', async () => {
    await service.gerarRelatorioFaturamento({});

    expect(repo.qb.where).toHaveBeenCalledWith('venda.status = :status', { status: 'concluida' });
    expect(repo.qb.andWhere).not.toHaveBeenCalled();
  });

  it('agrega quantidade e soma do valor final por ano/mês, em ordem cronológica', async () => {
    const linhas = [
      { ano: '2026', mes: '10', quantidade_vendas: '4', faturamento_total: '412000.00' },
      { ano: '2026', mes: '11', quantidade_vendas: '2', faturamento_total: '190500.00' },
    ];
    repo.qb.getRawMany.mockResolvedValue(linhas);

    await expect(service.gerarRelatorioFaturamento({})).resolves.toEqual(linhas);
    expect(repo.qb.select).toHaveBeenCalledWith('EXTRACT(YEAR FROM venda.data_venda)', 'ano');
    expect(repo.qb.addSelect.mock.calls).toEqual([
      ['EXTRACT(MONTH FROM venda.data_venda)', 'mes'],
      ['COUNT(venda.id_venda)', 'quantidade_vendas'],
      ['SUM(venda.valor_final)', 'faturamento_total'],
    ]);
    expect(repo.qb.groupBy).toHaveBeenCalledWith('ano');
    expect(repo.qb.addGroupBy).toHaveBeenCalledWith('mes');
    expect(repo.qb.orderBy).toHaveBeenCalledWith('ano', 'ASC');
    expect(repo.qb.addOrderBy).toHaveBeenCalledWith('mes', 'ASC');
  });

  it('aplica só a data inicial quando a final não é informada', async () => {
    await service.gerarRelatorioFaturamento({ dataInicio: '2026-01-01' });

    expect(repo.qb.andWhere).toHaveBeenCalledTimes(1);
    expect(repo.qb.andWhere).toHaveBeenCalledWith('venda.data_venda >= :dataInicio', { dataInicio: '2026-01-01' });
  });

  it('a data final é inclusiva (menor que o dia seguinte)', async () => {
    await service.gerarRelatorioFaturamento({ dataFim: '2026-01-31' });

    expect(repo.qb.andWhere).toHaveBeenCalledWith("venda.data_venda < (:dataFim::date + INTERVAL '1 day')", {
      dataFim: '2026-01-31',
    });
  });

  it('rejeita período invertido com 400 sem consultar o banco', async () => {
    await expect(
      service.gerarRelatorioFaturamento({ dataInicio: '2026-03-01', dataFim: '2026-02-01' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.createQueryBuilder).not.toHaveBeenCalled();
  });
});
