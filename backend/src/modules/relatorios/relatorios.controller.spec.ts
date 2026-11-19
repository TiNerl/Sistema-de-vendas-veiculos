import {
  GUARDS_METADATA,
  HEADERS_METADATA,
  PATH_METADATA,
} from '@nestjs/common/constants';
import { Test, TestingModule } from '@nestjs/testing';
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
    gerarRelatorioFaturamento: vi.fn(),
    gerarRelatorioDesempenhoVendedores: vi.fn(),
    exportarRelatorioDesempenhoVendedoresCsv: vi.fn(),
  };
  const csvHandler = Object.getOwnPropertyDescriptor(
    RelatoriosController.prototype,
    'exportarRelatorioDesempenhoVendedoresCsv',
  )?.value;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RelatoriosController],
      providers: [{ provide: RelatoriosService, useValue: relatoriosService }],
    }).compile();

    controller = module.get(RelatoriosController);
  });

  it('encaminha a consulta do relatório de estoque ao serviço', async () => {
    const relatorio = [
      { status: 'disponivel', quantidade_veiculos: 1, valor_total: 100 },
    ];
    relatoriosService.gerarRelatorioEstoque.mockResolvedValue(relatorio);

    await expect(controller.gerarRelatorioEstoque()).resolves.toBe(relatorio);
    expect(relatoriosService.gerarRelatorioEstoque).toHaveBeenCalledOnce();
  });

  it('encaminha os filtros do relatório de faturamento ao serviço', async () => {
    const filtros = { dataInicio: '2026-01-01', dataFim: '2026-01-31' };
    relatoriosService.gerarRelatorioFaturamento.mockResolvedValue([]);

    await expect(
      controller.gerarRelatorioFaturamento(filtros),
    ).resolves.toEqual([]);
    expect(relatoriosService.gerarRelatorioFaturamento).toHaveBeenCalledWith(
      filtros,
    );
  });

  it('encaminha os filtros e usuário autenticado para a exportação', async () => {
    const filtros = { dataInicio: '2026-01-01', dataFim: '2026-01-31' };
    const usuario = { id: 12, perfil: 'vendedor' };
    const csv = '\uFEFFID do vendedor,Nome do vendedor\n12,Ana';
    relatoriosService.exportarRelatorioDesempenhoVendedoresCsv.mockResolvedValue(
      csv,
    );

    await expect(
      controller.exportarRelatorioDesempenhoVendedoresCsv(filtros, {
        user: usuario,
      }),
    ).resolves.toBe(csv);
    expect(
      relatoriosService.exportarRelatorioDesempenhoVendedoresCsv,
    ).toHaveBeenCalledWith(filtros, usuario);
  });

  it('protege a exportação com JWT e os perfis autorizados', () => {
    expect(Reflect.getMetadata(PATH_METADATA, csvHandler)).toBe(
      'desempenho-vendedores/csv',
    );
    expect(Reflect.getMetadata(GUARDS_METADATA, csvHandler)).toEqual([
      JwtAuthGuard,
      RolesGuard,
    ]);
    expect(Reflect.getMetadata(ROLES_KEY, csvHandler)).toEqual([
      'admin',
      'vendedor',
    ]);
  });

  it('configura a exportação como arquivo CSV UTF-8 para download', () => {
    expect(Reflect.getMetadata(HEADERS_METADATA, csvHandler)).toEqual(
      expect.arrayContaining([
        { name: 'Content-Type', value: 'text/csv; charset=utf-8' },
        {
          name: 'Content-Disposition',
          value: 'attachment; filename="desempenho-vendedores.csv"',
        },
      ]),
    );
  });

});
