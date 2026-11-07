/**
 * UC01 – Autenticar usuário | RNF004 (hash de senha) | RF-USU-15 (bloqueio)
 * Unidade sob teste: AuthService (validação de credenciais e emissão do JWT).
 */
import { beforeEach, describe, expect, it } from '@jest/globals';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../../../src/modules/auth/auth.service';
import { UsuariosService } from '../../../src/modules/usuarios/usuarios.service';
import { mockFn, type FnMock } from '../../helpers/mocks';
import { umUsuario } from '../../helpers/fabricas';

jest.mock('bcrypt', () => ({ compare: jest.fn(), hash: jest.fn() }));
const bcryptMock = bcrypt as unknown as { compare: FnMock };

describe('AuthService', () => {
  const usuariosService = { buscarParaLogin: mockFn() };
  const jwtService = { sign: mockFn() };
  let service: AuthService;

  beforeEach(async () => {
    const modulo = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsuariosService, useValue: usuariosService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();
    service = modulo.get(AuthService);
  });

  describe('validarUsuario', () => {
    it('retorna null quando o CPF não pertence a nenhum usuário', async () => {
      usuariosService.buscarParaLogin.mockResolvedValue(null);

      await expect(service.validarUsuario('00000000000', 'qualquer')).resolves.toBeNull();
      expect(bcryptMock.compare).not.toHaveBeenCalled();
    });

    it('retorna null para usuário inativo, sem sequer comparar a senha (RF-USU-15)', async () => {
      usuariosService.buscarParaLogin.mockResolvedValue(umUsuario({ ativo: false }));

      await expect(service.validarUsuario('52998224725', 'senha123')).resolves.toBeNull();
      expect(bcryptMock.compare).not.toHaveBeenCalled();
    });

    it('retorna null quando a senha não confere com o hash armazenado', async () => {
      usuariosService.buscarParaLogin.mockResolvedValue(umUsuario());
      bcryptMock.compare.mockResolvedValue(false);

      await expect(service.validarUsuario('52998224725', 'errada')).resolves.toBeNull();
    });

    it('compara a senha com o hash (nunca texto puro) e remove a senha do retorno', async () => {
      const usuario = umUsuario();
      usuariosService.buscarParaLogin.mockResolvedValue(usuario);
      bcryptMock.compare.mockResolvedValue(true);

      const principal = await service.validarUsuario('52998224725', 'senha123');

      expect(bcryptMock.compare).toHaveBeenCalledWith('senha123', usuario.senha);
      expect(principal).not.toHaveProperty('senha');
      expect(principal).toMatchObject({ id_usuario: 2, perfil: 'vendedor', cpf: '52998224725' });
    });
  });

  describe('login', () => {
    it('assina um JWT com id, CPF, perfil e nome no payload', () => {
      jwtService.sign.mockReturnValue('token.jwt.assinado');
      const { senha: _s, ...usuario } = umUsuario();

      expect(service.login(usuario)).toEqual({ accessToken: 'token.jwt.assinado' });
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 2,
        cpf: '52998224725',
        perfil: 'vendedor',
        nome: 'Vendedora Teste',
      });
    });
  });
});
