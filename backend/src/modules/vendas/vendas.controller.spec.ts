import { Test, TestingModule } from '@nestjs/testing';
import { VendasController } from './vendas.controller';
import { VendasService } from './vendas.service';
import { vi, describe, beforeEach, it, expect } from 'vitest';

describe('VendasController', () => {
  let controller: VendasController;

  const mockVendasService = {
    cadastrarVenda: vi.fn(),
    buscarTodas: vi.fn(),
    buscarPorId: vi.fn(),
  };
  const vendedor = { id: 2, perfil: 'vendedor' as const };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VendasController],
      providers: [
        {
          provide: VendasService,
          useValue: mockVendasService,
        },
      ],
    }).compile();

    controller = module.get<VendasController>(VendasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('consulta uma venda pelo ID', async () => {
    const venda = { id_venda: 42 };
    mockVendasService.buscarPorId.mockResolvedValue(venda);

    await expect(controller.buscarPorId(42, { user: vendedor })).resolves.toBe(venda);
    expect(mockVendasService.buscarPorId).toHaveBeenCalledWith(42, vendedor);
  });

  it('encaminha o perfil autenticado e o responsável informado ao registrar venda', async () => {
    const dto = {
      id_cliente: 10,
      id_veiculo: 20,
      id_usuario_responsavel: 3,
      forma_pagamento: 'a_vista' as const,
    };
    const venda = { id_venda: 42 };
    const administrador = { id: 1, perfil: 'admin' as const };
    mockVendasService.cadastrarVenda.mockResolvedValue(venda);

    await expect(controller.cadastrar(dto, { user: administrador })).resolves.toBe(venda);
    expect(mockVendasService.cadastrarVenda).toHaveBeenCalledWith(dto, administrador);
  });

  it('encaminha o usuário autenticado ao consultar a lista de vendas', async () => {
    mockVendasService.buscarTodas.mockResolvedValue([]);

    await expect(controller.findAll({}, { user: vendedor })).resolves.toEqual([]);
    expect(mockVendasService.buscarTodas).toHaveBeenCalledWith({}, vendedor);
  });
});