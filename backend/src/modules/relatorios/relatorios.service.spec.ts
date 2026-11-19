import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Usuario } from '../usuarios/usuario.entity';
import { Veiculo } from '../veiculos/veiculo.entity';
import { StatusVeiculo } from '../veiculos/veiculo-status.enum';
import { Venda } from '../vendas/venda.entity';
import { RelatoriosService } from './relatorios.service';

describe('RelatoriosService', () => {
  let service: RelatoriosService;
  const queryBuilder = {
    leftJoin: vi.fn(),
    where: vi.fn(),
    andWhere: vi.fn(),
    select: vi.fn(),
    addSelect: vi.fn(),
    groupBy: vi.fn(),
    addGroupBy: vi.fn(),
    orderBy: vi.fn(),
    addOrderBy: vi.fn(),
    getRawMany: vi.fn(),
  };
  const vendaRepository = { createQueryBuilder: vi.fn() };
  const veiculoRepository = { createQueryBuilder: vi.fn() };
  const usuarioRepository = { createQueryBuilder: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    for (const repository of [
      vendaRepository,
      veiculoRepository,
      usuarioRepository,
    ]) {
      repository.createQueryBuilder.mockReturnValue(queryBuilder);
    }
    for (const method of [
      'leftJoin',
      'where',
      'andWhere',
      'select',
      'addSelect',
      'groupBy',
      'addGroupBy',
      'orderBy',
      'addOrderBy',
    ] as const) {
      queryBuilder[method].mockReturnValue(queryBuilder);
    }
    queryBuilder.getRawMany.mockResolvedValue([]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RelatoriosService,
        { provide: getRepositoryToken(Venda), useValue: vendaRepository },
        { provide: getRepositoryToken(Veiculo), useValue: veiculoRepository },
        { provide: getRepositoryToken(Usuario), useValue: usuarioRepository },
      ],
    }).compile();

    service = module.get(RelatoriosService);
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
    expect(veiculoRepository.createQueryBuilder).toHaveBeenCalledWith(
      'veiculo',
    );
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

  it('agrega faturamento e aplica os filtros de período', async () => {
    queryBuilder.getRawMany.mockResolvedValue([
      {
        ano: '2026',
        mes: '1',
        quantidade_vendas: '3',
        faturamento_total: '100000.00',
      },
    ]);
    const filtros = { dataInicio: '2026-01-01', dataFim: '2026-01-31' };

    await expect(service.gerarRelatorioFaturamento(filtros)).resolves.toEqual([
      {
        ano: '2026',
        mes: '1',
        quantidade_vendas: '3',
        faturamento_total: '100000.00',
      },
    ]);
    expect(vendaRepository.createQueryBuilder).toHaveBeenCalledWith('venda');
    expect(queryBuilder.where).toHaveBeenCalledWith('venda.status = :status', {
      status: 'concluida',
    });
    expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(
      1,
      'venda.data_venda >= :dataInicio',
      { dataInicio: '2026-01-01' },
    );
    expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(
      2,
      "venda.data_venda < (:dataFim::date + INTERVAL '1 day')",
      { dataFim: '2026-01-31' },
    );
  });

  it('rejeita intervalo de faturamento invertido antes de consultar', async () => {
    await expect(
      service.gerarRelatorioFaturamento({
        dataInicio: '2026-02-01',
        dataFim: '2026-01-31',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(vendaRepository.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('gera CSV reutilizando o relatório JSON, com cabeçalhos legíveis e BOM UTF-8', async () => {
    const relatorio = [
      {
        id_usuario: 12,
        nome_usuario: 'João, Silva',
        quantidade_vendas: '2',
        faturamento_total: '125000.00',
        comissao_total: '2500.00',
      },
    ];
    const gerarRelatorio = vi
      .spyOn(service, 'gerarRelatorioDesempenhoVendedores')
      .mockResolvedValue(relatorio);
    const filtros = { dataInicio: '2026-01-01' };
    const usuario = { id: 12, perfil: 'vendedor' };

    const csv = await service.exportarRelatorioDesempenhoVendedoresCsv(
      filtros,
      usuario,
    );

    expect(gerarRelatorio).toHaveBeenCalledWith(filtros, usuario);
    expect(csv).toBe(
      '\uFEFFID do vendedor,Nome do vendedor,Quantidade de vendas,Faturamento total,Comissão total\n' +
        '12,"João, Silva",2,125000.00,2500.00\n',
    );
  });

  it('retorna apenas o cabeçalho quando não há registros', async () => {
    vi.spyOn(service, 'gerarRelatorioDesempenhoVendedores').mockResolvedValue(
      [],
    );

    await expect(
      service.exportarRelatorioDesempenhoVendedoresCsv(
        {},
        { id: 1, perfil: 'admin' },
      ),
    ).resolves.toBe(
      '\uFEFFID do vendedor,Nome do vendedor,Quantidade de vendas,Faturamento total,Comissão total\n',
    );
  });

  it('mantém o vendedor restrito aos próprios dados e aplica o período', async () => {
    const filtro = {
      id_usuario: 99,
      dataInicio: '2026-01-01',
      dataFim: '2026-01-31',
    };
    await service.gerarRelatorioDesempenhoVendedores(filtro, {
      id: 12,
      perfil: 'vendedor',
    });

    expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(
      1,
      'usuario.id_usuario = :id_usuario',
      { id_usuario: 12 },
    );
    expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(
      2,
      'venda.data_venda >= :dataInicio',
      { dataInicio: '2026-01-01' },
    );
    expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(
      3,
      "venda.data_venda < (:dataFim::date + INTERVAL '1 day')",
      { dataFim: '2026-01-31' },
    );
  });

  it('permite que um administrador filtre o relatório por vendedor', async () => {
    await service.gerarRelatorioDesempenhoVendedores(
      { id_usuario: 99 },
      { id: 1, perfil: 'admin' },
    );

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'usuario.id_usuario = :id_usuario',
      { id_usuario: 99 },
    );
  });

  it('rejeita intervalo de desempenho invertido antes de consultar', async () => {
    await expect(
      service.gerarRelatorioDesempenhoVendedores(
        { dataInicio: '2026-02-01', dataFim: '2026-01-31' },
        { id: 1, perfil: 'admin' },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(usuarioRepository.createQueryBuilder).not.toHaveBeenCalled();
  });
});
