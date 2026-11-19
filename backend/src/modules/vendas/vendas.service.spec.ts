import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { VendasService } from './vendas.service';
import { Venda } from './venda.entity';
import { vi, describe, beforeEach, it, expect } from 'vitest';

describe('VendasService', () => {
  let service: VendasService;

  const mockVendaRepository = {
    createQueryBuilder: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
    find: vi.fn(),
    findOne: vi.fn(),
  };

  const mockDataSource = {
    transaction: vi.fn(),
  };
  const queryBuilder = {
    leftJoinAndSelect: vi.fn().mockReturnThis(),
    andWhere: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    getMany: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    mockVendaRepository.createQueryBuilder.mockReturnValue(queryBuilder);
    queryBuilder.getMany.mockResolvedValue([]);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VendasService,
        {
          provide: getRepositoryToken(Venda),
          useValue: mockVendaRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<VendasService>(VendasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('retorna a venda pelo ID com seus relacionamentos', async () => {
    const venda = { id_venda: 42 };
    mockVendaRepository.findOne.mockResolvedValue(venda);

    await expect(service.buscarPorId(42)).resolves.toBe(venda);
    expect(mockVendaRepository.findOne).toHaveBeenCalledWith({
      where: { id_venda: 42 },
      relations: {
        cliente: true,
        veiculo: true,
        usuario: true,
        registrado_por: true,
      },
    });
  });

  it('lança 404 quando a venda não existe', async () => {
    mockVendaRepository.findOne.mockResolvedValue(null);

    await expect(service.buscarPorId(404)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('limita a listagem de vendas ao vendedor autenticado', async () => {
    await service.buscarTodas({}, { id: 2, perfil: 'vendedor' });

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'usuario.id_usuario = :usuarioId',
      { usuarioId: 2 },
    );
  });

  it('limita a busca individual de vendas ao vendedor autenticado', async () => {
    mockVendaRepository.findOne.mockResolvedValue(null);

    await expect(
      service.buscarPorId(42, { id: 2, perfil: 'vendedor' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(mockVendaRepository.findOne).toHaveBeenCalledWith({
      where: { id_venda: 42, usuario: { id_usuario: 2 } },
      relations: {
        cliente: true,
        veiculo: true,
        usuario: true,
        registrado_por: true,
      },
    });
  });
});