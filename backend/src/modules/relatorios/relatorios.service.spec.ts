import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Veiculo } from '../veiculos/veiculo.entity';
import { StatusVeiculo } from '../veiculos/veiculo-status.enum';
import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Venda } from '../vendas/venda.entity';
import { RelatoriosService } from './relatorios.service';

describe('RelatoriosService', () => {
  let service: RelatoriosService;
  const vendaRepository = {};
  const veiculoRepository = {
    createQueryBuilder: vi.fn(),
  };
  const queryBuilder = {
    select: vi.fn(),
    addSelect: vi.fn(),
    groupBy: vi.fn(),
    getRawMany: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    veiculoRepository.createQueryBuilder.mockReturnValue(queryBuilder);
    queryBuilder.select.mockReturnValue(queryBuilder);
    queryBuilder.addSelect.mockReturnValue(queryBuilder);
    queryBuilder.groupBy.mockReturnValue(queryBuilder);
    queryBuilder.getRawMany.mockResolvedValue([]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RelatoriosService,
        { provide: getRepositoryToken(Venda), useValue: vendaRepository },
        { provide: getRepositoryToken(Veiculo), useValue: veiculoRepository },
      ],
    }).compile();
    const queryBuilder = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        addSelect: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        addGroupBy: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        addOrderBy: vi.fn().mockReturnThis(),
        getRawMany: vi.fn(),
    };
    const vendaRepository = {
        createQueryBuilder: vi.fn(() => queryBuilder),
    };
    let service: RelatoriosService;

    beforeEach(async () => {
        vi.clearAllMocks();
        vendaRepository.createQueryBuilder.mockReturnValue(queryBuilder);
        queryBuilder.getRawMany.mockResolvedValue([
            { ano: '2026', mes: '1', quantidade_vendas: '3', faturamento_total: '100000.00' },
        ]);

        const module = await Test.createTestingModule({
            providers: [
                RelatoriosService,
                { provide: getRepositoryToken(Venda), useValue: vendaRepository },
            ],
        }).compile();

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('agrupa veículos por status e converte as somas para números', async () => {
    queryBuilder.getRawMany.mockResolvedValue([
      {
        status: StatusVeiculo.DISPONIVEL,
        quantidade_veiculos: '2',
        valor_total: '250000.50',
      },
      {
        status: StatusVeiculo.VENDIDO,
        quantidade_veiculos: '1',
        valor_total: '90000.00',
      },
    ]);

    await expect(service.gerarRelatorioEstoque()).resolves.toEqual([
      {
        status: StatusVeiculo.DISPONIVEL,
        quantidade_veiculos: 2,
        valor_total: 250000.5,
      },
      {
        status: StatusVeiculo.RESERVADO,
        quantidade_veiculos: 0,
        valor_total: 0,
      },
      {
        status: StatusVeiculo.VENDIDO,
        quantidade_veiculos: 1,
        valor_total: 90000,
      },
      {
        status: StatusVeiculo.EM_MANUTENCAO,
        quantidade_veiculos: 0,
        valor_total: 0,
      },
    ]);

    expect(veiculoRepository.createQueryBuilder).toHaveBeenCalledWith('veiculo');
    expect(queryBuilder.select).toHaveBeenCalledWith('veiculo.status', 'status');
    expect(queryBuilder.addSelect).toHaveBeenNthCalledWith(
      1,
      'COUNT(veiculo.id_veiculo)',
      'quantidade_veiculos',
    );
    expect(queryBuilder.addSelect).toHaveBeenNthCalledWith(
      2,
      'SUM(veiculo.preco)',
      'valor_total',
    );
    expect(queryBuilder.groupBy).toHaveBeenCalledWith('veiculo.status');
  });

  it('retorna todos os status com totais zerados quando não há veículos', async () => {
    await expect(service.gerarRelatorioEstoque()).resolves.toEqual(
      Object.values(StatusVeiculo).map((status) => ({
        status,
        quantidade_veiculos: 0,
        valor_total: 0,
      })),
    );
  });
        service = module.get(RelatoriosService);
    });

    it('agrega faturamento e aplica os filtros de período', async () => {
        const filtros = { dataInicio: '2026-01-01', dataFim: '2026-01-31' };

        await expect(service.gerarRelatorioFaturamento(filtros)).resolves.toEqual([
            { ano: '2026', mes: '1', quantidade_vendas: '3', faturamento_total: '100000.00' },
        ]);
        expect(vendaRepository.createQueryBuilder).toHaveBeenCalledWith('venda');
        expect(queryBuilder.where).toHaveBeenCalledWith(
            'venda.status = :status',
            { status: 'concluida' },
        );
        expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(1, 'venda.data_venda >= :dataInicio', {
            dataInicio: '2026-01-01',
        });
        expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(
            2,
            "venda.data_venda < (:dataFim::date + INTERVAL '1 day')",
            { dataFim: '2026-01-31' },
        );
        expect(queryBuilder.getRawMany).toHaveBeenCalledOnce();
    });

    it('rejects reversed date ranges before querying', async () => {
        await expect(
            service.gerarRelatorioFaturamento({
                dataInicio: '2026-02-01',
                dataFim: '2026-01-31',
            }),
        ).rejects.toBeInstanceOf(BadRequestException);
        expect(vendaRepository.createQueryBuilder).not.toHaveBeenCalled();
    });
});
