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

  beforeEach(async () => {
    vi.clearAllMocks();
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
      },
    });
  });

  it('lança 404 quando a venda não existe', async () => {
    mockVendaRepository.findOne.mockResolvedValue(null);

    await expect(service.buscarPorId(404)).rejects.toBeInstanceOf(NotFoundException);
  });
});