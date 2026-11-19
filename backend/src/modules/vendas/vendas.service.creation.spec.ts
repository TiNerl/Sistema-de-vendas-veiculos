import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Cliente } from '../clientes/cliente.entity';
import { Usuario } from '../usuarios/usuario.entity';
import { Veiculo } from '../veiculos/veiculo.entity';
import { Venda } from './venda.entity';
import { VendasService } from './vendas.service';

describe('VendasService — responsável e registrador', () => {
    let service: VendasService;

    const cliente = { id_cliente: 10, ativo: true };
    const veiculo = { id_veiculo: 20, preco: '10000.00', status: 'disponivel' };
    const admin = { id_usuario: 1, perfil: 'admin', ativo: true };
    const vendedor = { id_usuario: 2, perfil: 'vendedor', ativo: true };
    const consultaRegistrada = { id_venda: 30, usuario: vendedor, registrado_por: admin };

    const updateBuilder = {
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue({ affected: 1 }),
    };
    const manager = {
        findOneBy: vi.fn(),
        create: vi.fn((_entity: unknown, dados: Record<string, unknown>) => dados),
        save: vi.fn(async (_entity: unknown, dados: Record<string, unknown>) => ({
            ...dados,
            id_venda: 30,
        })),
        createQueryBuilder: vi.fn(() => updateBuilder),
        findOneOrFail: vi.fn().mockResolvedValue(consultaRegistrada),
    };
    const dataSource = {
        transaction: vi.fn((operacao: (manager: typeof manager) => Promise<unknown>) =>
            operacao(manager),
        ),
    };

    beforeEach(async () => {
        vi.clearAllMocks();
        veiculo.status = 'disponivel';
        manager.findOneBy.mockImplementation((entidade: unknown, filtro: { id_usuario?: number }) => {
            if (entidade === Cliente) return Promise.resolve(cliente);
            if (entidade === Veiculo) return Promise.resolve(veiculo);
            if (entidade === Usuario) {
                const usuarios = new Map([
                    [admin.id_usuario, admin],
                    [vendedor.id_usuario, vendedor],
                ]);
                return Promise.resolve(usuarios.get(filtro.id_usuario ?? -1) ?? null);
            }
            return Promise.resolve(null);
        });
        manager.findOneOrFail.mockResolvedValue(consultaRegistrada);
        updateBuilder.execute.mockResolvedValue({ affected: 1 });

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                VendasService,
                { provide: getRepositoryToken(Venda), useValue: {} },
                { provide: DataSource, useValue: dataSource },
            ],
        }).compile();

        service = module.get<VendasService>(VendasService);
    });

    it('atribui a venda ao vendedor selecionado e mantém o Admin como registrador', async () => {
        await service.cadastrarVenda(
            {
                id_cliente: 10,
                id_veiculo: 20,
                id_usuario_responsavel: vendedor.id_usuario,
                forma_pagamento: 'a_vista',
            },
            { id: admin.id_usuario, perfil: 'admin' },
        );

        expect(manager.create).toHaveBeenCalledWith(
            Venda,
            expect.objectContaining({ usuario: vendedor, registrado_por: admin }),
        );
        expect(manager.findOneBy).toHaveBeenCalledWith(Usuario, {
            id_usuario: vendedor.id_usuario,
            perfil: 'vendedor',
            ativo: true,
        });
    });

    it('usa o vendedor autenticado mesmo se a requisição tentar indicar outro usuário', async () => {
        manager.findOneBy.mockImplementation((entidade: unknown) => {
            if (entidade === Cliente) return Promise.resolve(cliente);
            if (entidade === Veiculo) return Promise.resolve(veiculo);
            if (entidade === Usuario) return Promise.resolve(vendedor);
            return Promise.resolve(null);
        });

        await service.cadastrarVenda(
            {
                id_cliente: 10,
                id_veiculo: 20,
                id_usuario_responsavel: admin.id_usuario,
                forma_pagamento: 'pix',
            },
            { id: vendedor.id_usuario, perfil: 'vendedor' },
        );

        expect(manager.create).toHaveBeenCalledWith(
            Venda,
            expect.objectContaining({ usuario: vendedor, registrado_por: vendedor }),
        );
        expect(manager.findOneBy).toHaveBeenCalledTimes(3);
    });

    it('exige um vendedor responsável para vendas registradas pelo Admin', async () => {
        await expect(
            service.cadastrarVenda(
                { id_cliente: 10, id_veiculo: 20, forma_pagamento: 'a_vista' },
                { id: admin.id_usuario, perfil: 'admin' },
            ),
        ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejeita responsáveis inexistentes, inativos ou que não sejam vendedores', async () => {
        manager.findOneBy.mockImplementation((entidade: unknown, filtro: { id_usuario?: number }) => {
            if (entidade === Cliente) return Promise.resolve(cliente);
            if (entidade === Veiculo) return Promise.resolve(veiculo);
            if (entidade === Usuario && filtro.id_usuario === admin.id_usuario) {
                return Promise.resolve(admin);
            }
            return Promise.resolve(null);
        });

        await expect(
            service.cadastrarVenda(
                {
                    id_cliente: 10,
                    id_veiculo: 20,
                    id_usuario_responsavel: 99,
                    forma_pagamento: 'a_vista',
                },
                { id: admin.id_usuario, perfil: 'admin' },
            ),
        ).rejects.toBeInstanceOf(BadRequestException);
        expect(manager.findOneBy).toHaveBeenCalledWith(Usuario, {
            id_usuario: 99,
            perfil: 'vendedor',
            ativo: true,
        });
    });
});
