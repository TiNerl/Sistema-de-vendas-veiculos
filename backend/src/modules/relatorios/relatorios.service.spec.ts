import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Veiculo } from '../veiculos/veiculo.entity';
import { StatusVeiculo } from '../veiculos/veiculo-status.enum';
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

    service = module.get<RelatoriosService>(RelatoriosService);
  });

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
});
