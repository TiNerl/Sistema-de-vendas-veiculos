/**
 * UC02 – Cadastrar usuário (RF-USU-09) | UC03 – Inativar usuário (RF-USU-15)
 * UC04 – Listar/consultar usuários | RNF004 – senha nunca trafega nem é exposta.
 *
 * Observação: `jest.mock` usa o objeto global `jest` (e não o importado de
 * @jest/globals) para que o SWC eleve (hoist) a chamada acima dos imports.
 */
import { beforeEach, describe, expect, it } from '@jest/globals';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Usuario } from '../../../src/modules/usuarios/usuario.entity';
import { UsuariosService } from '../../../src/modules/usuarios/usuarios.service';
import { criarRepositorioMock, type FnMock, type RepositorioMock } from '../../helpers/mocks';
import { umAdministrador, umUsuario } from '../../helpers/fabricas';

jest.mock('bcrypt', () => ({ hash: jest.fn(), compare: jest.fn() }));
const bcryptMock = bcrypt as unknown as { hash: FnMock };

describe('UsuariosService', () => {
  let repo: RepositorioMock;
  let service: UsuariosService;

  beforeEach(async () => {
    repo = criarRepositorioMock();
    bcryptMock.hash.mockResolvedValue('$2b$10$hashGerado');
    const modulo = await Test.createTestingModule({
      providers: [UsuariosService, { provide: getRepositoryToken(Usuario), useValue: repo }],
    }).compile();
    service = modulo.get(UsuariosService);
  });

  describe('listar', () => {
    it('lista usuários ordenados por id e sem o campo senha', async () => {
      repo.find.mockResolvedValue([umAdministrador(), umUsuario()]);

      const lista = await service.listar();

      expect(repo.find).toHaveBeenCalledWith({ order: { id_usuario: 'ASC' } });
      expect(lista).toHaveLength(2);
      lista.forEach((u) => expect(u).not.toHaveProperty('senha'));
    });
  });

  describe('buscarPorId', () => {
    it('retorna o usuário sem senha', async () => {
      repo.findOneBy.mockResolvedValue(umUsuario());

      const usuario = await service.buscarPorId(2);

      expect(repo.findOneBy).toHaveBeenCalledWith({ id_usuario: 2 });
      expect(usuario).not.toHaveProperty('senha');
      expect(usuario.nome).toBe('Vendedora Teste');
    });

    it('lança 404 quando o usuário não existe', async () => {
      await expect(service.buscarPorId(999)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('buscarParaLogin', () => {
    it('seleciona explicitamente a senha (necessária apenas para o bcrypt.compare)', async () => {
      await service.buscarParaLogin('52998224725');

      expect(repo.findOne).toHaveBeenCalledWith({
        where: { cpf: '52998224725' },
        select: expect.objectContaining({ senha: true, perfil: true, ativo: true }),
      });
    });
  });

  describe('cadastrar', () => {
    const dto = { nome: 'Novo Vendedor', cpf: '52998224725', senha: 'segredo1', perfil: 'vendedor' as const };

    it('grava o hash bcrypt (custo 10), cria ativo e não devolve a senha', async () => {
      repo.save.mockImplementation(async (u: unknown) => ({ id_usuario: 3, ...(u as object) }));

      const criado = await service.cadastrar(dto);

      expect(bcryptMock.hash).toHaveBeenCalledWith('segredo1', 10);
      expect(repo.create).toHaveBeenCalledWith({
        nome: 'Novo Vendedor',
        cpf: '52998224725',
        senha: '$2b$10$hashGerado',
        perfil: 'vendedor',
        ativo: true,
      });
      expect(criado).toEqual(expect.objectContaining({ id_usuario: 3, ativo: true }));
      expect(criado).not.toHaveProperty('senha');
    });

    /**
     * DEF-05 — CPF duplicado em usuários.
     * Esperado: 409 Conflict com mensagem amigável (como já ocorre em Clientes e Veículos).
     * Atual: o serviço não verifica duplicidade; a violação da constraint UNIQUE
     * chega ao cliente como 500 Internal Server Error.
     * `it.failing` passa enquanto o defeito existir; ao corrigir, troque por `it`.
     */
    it.failing('[DEF-05] recusa CPF já cadastrado com 409 Conflict', async () => {
      repo.findOne.mockResolvedValue(umUsuario());
      repo.findOneBy.mockResolvedValue(umUsuario());

      await expect(service.cadastrar(dto)).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('inativar', () => {
    it('exige que id e CPF correspondam ao mesmo usuário', async () => {
      await expect(service.inativar({ cpf: '00000000000' }, 2)).rejects.toBeInstanceOf(NotFoundException);
      expect(repo.findOneBy).toHaveBeenCalledWith({ cpf: '00000000000', id_usuario: 2 });
    });

    it('lança 409 quando o usuário já está inativo', async () => {
      repo.findOneBy.mockResolvedValue(umUsuario({ ativo: false }));

      await expect(service.inativar({ cpf: '52998224725' }, 2)).rejects.toBeInstanceOf(ConflictException);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('inativa logicamente (sem excluir), preservando o histórico de vendas', async () => {
      repo.findOneBy.mockResolvedValue(umUsuario());

      const resultado = await service.inativar({ cpf: '52998224725' }, 2);

      expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ id_usuario: 2, ativo: false }));
      expect(resultado.ativo).toBe(false);
      expect(resultado).not.toHaveProperty('senha');
    });
  });
});
