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
  };

  const mockDataSource = {
    transaction: vi.fn(),
  };

  beforeEach(async () => {
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
});