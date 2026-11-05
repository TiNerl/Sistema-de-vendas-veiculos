import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { VeiculosController } from './veiculos.controller';

describe('VeiculosController list endpoint access', () => {
    const reflector = {
        getAllAndOverride: vi.fn().mockReturnValue(['admin', 'vendedor']),
    };
    let guard: RolesGuard;
    let perfil: string | undefined;

    beforeEach(async () => {
        perfil = undefined;
        vi.clearAllMocks();
        reflector.getAllAndOverride.mockReturnValue(['admin', 'vendedor']);

        const module = await Test.createTestingModule({
            providers: [
                RolesGuard,
                { provide: Reflector, useValue: reflector },
            ],
        }).compile();

        guard = module.get(RolesGuard);
    });

    it('requires JWT and explicitly permits only admin and vendedor roles', () => {
        const listar = VeiculosController.prototype.listar;

        expect(Reflect.getMetadata(GUARDS_METADATA, listar)).toEqual([
            JwtAuthGuard,
            RolesGuard,
        ]);
        expect(Reflect.getMetadata(ROLES_KEY, listar)).toEqual(['admin', 'vendedor']);
    });

    it.each(['admin', 'vendedor'])('permite o perfil %s', (perfilPermitido) => {
        perfil = perfilPermitido;
        const contexto = new ExecutionContextHost(
            [{ user: { perfil } }],
            VeiculosController,
            VeiculosController.prototype.listar,
        );

        expect(guard.canActivate(contexto)).toBe(true);
    });

    it('nega perfil sem permissão e requisição sem usuário autenticado', () => {
        perfil = 'outro';
        let contexto = new ExecutionContextHost(
            [{ user: { perfil } }],
            VeiculosController,
            VeiculosController.prototype.listar,
        );
        expect(guard.canActivate(contexto)).toBe(false);

        perfil = undefined;
        contexto = new ExecutionContextHost(
            [{ user: undefined }],
            VeiculosController,
            VeiculosController.prototype.listar,
        );
        expect(guard.canActivate(contexto)).toBe(false);
    });
});
