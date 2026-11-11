import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { VeiculosController } from './veiculos.controller';

describe('VeiculosController access', () => {
    const reflector = {
        getAllAndOverride: vi.fn(),
    };
    let guard: RolesGuard;

    beforeEach(async () => {
        vi.clearAllMocks();
        const module = await Test.createTestingModule({
            providers: [
                RolesGuard,
                { provide: Reflector, useValue: reflector },
            ],
        }).compile();

        guard = module.get(RolesGuard);
    });

    it('requires JWT and permits admin and vendedor to list vehicles', () => {
        const filtrar = VeiculosController.prototype.filtrar;

        expect(Reflect.getMetadata(GUARDS_METADATA, filtrar)).toEqual([
            JwtAuthGuard,
            RolesGuard,
        ]);
        expect(Reflect.getMetadata(ROLES_KEY, filtrar)).toEqual(['admin', 'vendedor']);
    });

    it('restricts status changes to admins', () => {
        const handler = VeiculosController.prototype.atualizarStatus;

        expect(Reflect.getMetadata(GUARDS_METADATA, handler)).toEqual([
            JwtAuthGuard,
            RolesGuard,
        ]);
        expect(Reflect.getMetadata(ROLES_KEY, handler)).toEqual(['admin']);
    });

    it.each(['admin', 'vendedor'])('allows the %s profile to list vehicles', (perfil) => {
        reflector.getAllAndOverride.mockReturnValue(['admin', 'vendedor']);
        const contexto = new ExecutionContextHost(
            [{ user: { perfil } }],
            VeiculosController,
            VeiculosController.prototype.filtrar,
        );

        expect(guard.canActivate(contexto)).toBe(true);
    });

    it('denies users without a permitted profile', () => {
        reflector.getAllAndOverride.mockReturnValue(['admin', 'vendedor']);
        const contexto = new ExecutionContextHost(
            [{ user: { perfil: 'outro' } }],
            VeiculosController,
            VeiculosController.prototype.filtrar,
        );

        expect(guard.canActivate(contexto)).toBe(false);
    });
});
