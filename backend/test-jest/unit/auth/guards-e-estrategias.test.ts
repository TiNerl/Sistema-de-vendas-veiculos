/**
 * RNF005 – Controle de acesso por perfil (inclusive por URL direta).
 * Unidades sob teste: RolesGuard, LocalStrategy e JwtStrategy.
 */
import { describe, expect, it } from '@jest/globals';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../../../src/modules/auth/guards/roles.guard';
import { LocalStrategy } from '../../../src/modules/auth/strategies/local.strategy';
import { JwtStrategy } from '../../../src/modules/auth/strategies/jwt.strategy';
import { AuthService } from '../../../src/modules/auth/auth.service';
import { mockFn } from '../../helpers/mocks';

function contextoCom(perfilUsuario?: string): ExecutionContext {
  return {
    getHandler: () => function handler() {},
    getClass: () => class Controlador {},
    switchToHttp: () => ({
      getRequest: () => (perfilUsuario ? { user: { perfil: perfilUsuario } } : {}),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  function guardExigindo(perfis: string[] | undefined) {
    const reflector = { getAllAndOverride: mockFn().mockReturnValue(perfis) };
    return new RolesGuard(reflector as unknown as Reflector);
  }

  it('libera a rota quando nenhum perfil é exigido', () => {
    expect(guardExigindo(undefined).canActivate(contextoCom())).toBe(true);
    expect(guardExigindo([]).canActivate(contextoCom())).toBe(true);
  });

  it.each([
    ['admin', ['admin'], true],
    ['vendedor', ['admin', 'vendedor'], true],
    ['vendedor', ['admin'], false],
    ['admin', ['vendedor'], false],
  ])('perfil "%s" em rota que exige %j → %s', (perfil, exigidos, esperado) => {
    expect(guardExigindo(exigidos).canActivate(contextoCom(perfil))).toBe(esperado);
  });

  it('nega acesso quando a requisição não possui usuário autenticado', () => {
    expect(guardExigindo(['admin']).canActivate(contextoCom(undefined))).toBe(false);
  });
});

describe('LocalStrategy', () => {
  it('lança 401 com mensagem genérica quando as credenciais são inválidas', async () => {
    const authService = { validarUsuario: mockFn().mockResolvedValue(null) };
    const estrategia = new LocalStrategy(authService as unknown as AuthService);

    await expect(estrategia.validate('52998224725', 'errada')).rejects.toThrow(
      new UnauthorizedException('Credenciais inválidas'),
    );
  });

  it('devolve o usuário validado para ser anexado à requisição', async () => {
    const usuario = { id_usuario: 1, perfil: 'admin' };
    const authService = { validarUsuario: mockFn().mockResolvedValue(usuario) };
    const estrategia = new LocalStrategy(authService as unknown as AuthService);

    await expect(estrategia.validate('11144477735', 'senha123')).resolves.toBe(usuario);
    expect(authService.validarUsuario).toHaveBeenCalledWith('11144477735', 'senha123');
  });
});

describe('JwtStrategy', () => {
  it('converte o payload do token no usuário da requisição', () => {
    const estrategia = new JwtStrategy();

    expect(
      estrategia.validate({ sub: 5, cpf: '52998224725', perfil: 'vendedor', nome: 'Ana' }),
    ).toEqual({ id: 5, cpf: '52998224725', perfil: 'vendedor', nome: 'Ana' });
  });

  it('recusa inicializar sem JWT_SECRET configurado (falha segura)', () => {
    const original = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;
    try {
      expect(() => new JwtStrategy()).toThrow('JWT_SECRET nao foi definido');
    } finally {
      process.env.JWT_SECRET = original;
    }
  });
});
