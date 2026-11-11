import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RelatoriosController } from './relatorios.controller';
import { RelatoriosService } from './relatorios.service';

describe('RelatoriosController', () => {
  let controller: RelatoriosController;
  const relatoriosService = {
    gerarRelatorioEstoque: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RelatoriosController],
      providers: [{ provide: RelatoriosService, useValue: relatoriosService }],
    }).compile();
    const relatoriosService = {
        gerarRelatorioFaturamento: vi.fn(),
    };
    let controller: RelatoriosController;

    beforeEach(async () => {
        vi.clearAllMocks();
        const module = await Test.createTestingModule({
            controllers: [RelatoriosController],
            providers: [{ provide: RelatoriosService, useValue: relatoriosService }],
        }).compile();

        controller = module.get(RelatoriosController);
    });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('encaminha a consulta do relatório de estoque ao serviço', async () => {
    const relatorio = [{ status: 'disponivel', quantidade_veiculos: 1, valor_total: 100 }];
    relatoriosService.gerarRelatorioEstoque.mockResolvedValue(relatorio);

    await expect(controller.gerarRelatorioEstoque()).resolves.toBe(relatorio);
    expect(relatoriosService.gerarRelatorioEstoque).toHaveBeenCalledOnce();
  });
    it('requires JWT and restricts report access to known roles', () => {
        const handler = RelatoriosController.prototype.gerarRelatorioFaturamento;

        expect(Reflect.getMetadata(GUARDS_METADATA, handler)).toEqual([
            JwtAuthGuard,
            RolesGuard,
        ]);
        expect(Reflect.getMetadata(ROLES_KEY, handler)).toEqual(['admin', 'vendedor']);
    });

    it('passes report filters to the service', async () => {
        const filtros = { dataInicio: '2026-01-01', dataFim: '2026-01-31' };
        relatoriosService.gerarRelatorioFaturamento.mockResolvedValue([]);

        await expect(controller.gerarRelatorioFaturamento(filtros)).resolves.toEqual([]);
        expect(relatoriosService.gerarRelatorioFaturamento).toHaveBeenCalledWith(filtros);
    });
});
