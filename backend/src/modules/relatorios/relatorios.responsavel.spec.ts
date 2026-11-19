import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Usuario } from '../usuarios/usuario.entity';
import { Venda } from '../vendas/venda.entity';
import { Veiculo } from '../veiculos/veiculo.entity';
import { RelatoriosService } from './relatorios.service';

describe('RelatoriosService — responsável pela venda', () => {
    let service: RelatoriosService;

    const queryBuilder = {
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        addSelect: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        addGroupBy: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        getRawMany: vi.fn(),
    };
    const usuarioRepository = {
        createQueryBuilder: vi.fn(() => queryBuilder),
    };

    beforeEach(async () => {
        vi.clearAllMocks();
        usuarioRepository.createQueryBuilder.mockReturnValue(queryBuilder);
        queryBuilder.getRawMany.mockResolvedValue([
            {
                id_usuario: '2',
                nome_usuario: 'Vendedora Responsável',
                quantidade_vendas: '1',
                faturamento_total: '10000.00',
                comissao_total: '300.00',
            },
        ]);

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RelatoriosService,
                { provide: getRepositoryToken(Venda), useValue: {} },
                { provide: getRepositoryToken(Veiculo), useValue: {} },
                { provide: getRepositoryToken(Usuario), useValue: usuarioRepository },
            ],
        }).compile();

        service = module.get<RelatoriosService>(RelatoriosService);
    });

    it('agrega no consolidado usando o vendedor responsável, não o registrador', async () => {
        await expect(
            service.gerarRelatorioDesempenhoVendedores({}, { id: 1, perfil: 'admin' }),
        ).resolves.toEqual([
            {
                id_usuario: '2',
                nome_usuario: 'Vendedora Responsável',
                quantidade_vendas: '1',
                faturamento_total: '10000.00',
                comissao_total: '300.00',
            },
        ]);

        expect(queryBuilder.leftJoin).toHaveBeenCalledWith(
            Venda,
            'venda',
            'venda.id_usuario = usuario.id_usuario AND venda.status = :status',
            { status: 'concluida' },
        );
        expect(queryBuilder.where).toHaveBeenCalledWith('usuario.perfil = :perfil', {
            perfil: 'vendedor',
        });
        expect(queryBuilder.andWhere).not.toHaveBeenCalledWith(
            'usuario.id_usuario = :id_usuario',
            { id_usuario: 1 },
        );
    });

    it('filtra o relatório individual pelo identificador do vendedor autenticado', async () => {
        await service.gerarRelatorioDesempenhoVendedores({}, { id: 2, perfil: 'vendedor' });

        expect(queryBuilder.andWhere).toHaveBeenCalledWith(
            'usuario.id_usuario = :id_usuario',
            { id_usuario: 2 },
        );
    });
});
