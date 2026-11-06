import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Venda } from '../vendas/venda.entity';
import { RelatoriosService } from './relatorios.service';

describe('RelatoriosService', () => {
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
