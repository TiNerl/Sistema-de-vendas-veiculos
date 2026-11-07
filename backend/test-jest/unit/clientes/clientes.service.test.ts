/**
 * UC05 – Cadastrar cliente (RF-CLI-01, RF-CLI-05) | UC06 – Consultar clientes (RF-CLI-02)
 * UC07 – Editar cliente (RF-CLI-03) | UC08 – Inativar cliente (RF-CLI-04)
 */
import { beforeEach, describe, expect, it } from '@jest/globals';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Like } from 'typeorm';
import { Cliente } from '../../../src/modules/clientes/cliente.entity';
import { ClientesService } from '../../../src/modules/clientes/clientes.service';
import { criarRepositorioMock, type RepositorioMock } from '../../helpers/mocks';
import { dadosCliente, umCliente } from '../../helpers/fabricas';

describe('ClientesService', () => {
  let repo: RepositorioMock;
  let service: ClientesService;

  beforeEach(async () => {
    repo = criarRepositorioMock();
    const modulo = await Test.createTestingModule({
      providers: [ClientesService, { provide: getRepositoryToken(Cliente), useValue: repo }],
    }).compile();
    service = modulo.get(ClientesService);
  });

  describe('cadastrar', () => {
    it('procura duplicidade por CPF OU e-mail e cria o cliente sempre ativo', async () => {
      const dto = dadosCliente();

      const criado = await service.cadastrar(dto);

      expect(repo.findOne).toHaveBeenCalledWith({ where: [{ cpf: dto.cpf }, { email: dto.email }] });
      expect(repo.create).toHaveBeenCalledWith({ ...dto, ativo: true });
      expect(criado).toMatchObject({ nome: 'Maria da Silva', ativo: true });
    });

    it('recusa CPF já cadastrado com mensagem específica', async () => {
      repo.findOne.mockResolvedValue(umCliente());

      await expect(service.cadastrar(dadosCliente({ email: 'outro@exemplo.com' }))).rejects.toThrow(
        new ConflictException('Já existe um cliente cadastrado com este CPF'),
      );
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('recusa e-mail já cadastrado com mensagem específica', async () => {
      repo.findOne.mockResolvedValue(umCliente({ cpf: '11144477735' }));

      await expect(service.cadastrar(dadosCliente())).rejects.toThrow(
        new ConflictException('Já existe um cliente cadastrado com este e-mail'),
      );
      expect(repo.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll (consulta com busca)', () => {
    it.each([undefined, '', '   '])('sem termo de busca (%p) lista todos ordenados por nome', async (busca) => {
      await service.findAll(busca);

      expect(repo.find).toHaveBeenCalledWith({ order: { nome: 'ASC' } });
    });

    it('com termo, busca parcial em nome, CPF e e-mail', async () => {
      repo.find.mockResolvedValue([umCliente()]);

      await expect(service.findAll('Maria')).resolves.toHaveLength(1);
      expect(repo.find).toHaveBeenCalledWith({
        where: [{ nome: Like('%Maria%') }, { cpf: Like('%Maria%') }, { email: Like('%Maria%') }],
        order: { nome: 'ASC' },
      });
    });
  });

  describe('buscarPorId', () => {
    it('retorna o cliente encontrado', async () => {
      repo.findOneBy.mockResolvedValue(umCliente());
      await expect(service.buscarPorId(10)).resolves.toMatchObject({ id_cliente: 10 });
    });

    it('lança 404 com o ID na mensagem', async () => {
      await expect(service.buscarPorId(77)).rejects.toThrow('Cliente com ID 77 não encontrado');
    });
  });

  describe('atualizar', () => {
    it('aplica somente os campos enviados (PATCH parcial)', async () => {
      repo.findOneBy.mockResolvedValue(umCliente());

      const atualizado = await service.atualizar(10, { telefone: '84988887777' });

      expect(atualizado).toMatchObject({ telefone: '84988887777', nome: 'Maria da Silva' });
    });

    it('lança 404 para cliente inexistente', async () => {
      await expect(service.atualizar(77, { nome: 'X' })).rejects.toBeInstanceOf(NotFoundException);
    });

    /**
     * DEF-06 — Edição para CPF/e-mail de outro cliente.
     * Esperado: 409 Conflict (mesma regra do cadastro, RF-CLI-05).
     * Atual: não há verificação; o banco rejeita pela UNIQUE e a API responde 500.
     */
    it.failing('[DEF-06] recusa alterar o e-mail para um já usado por outro cliente', async () => {
      repo.findOneBy.mockResolvedValue(umCliente());
      repo.findOne.mockResolvedValue(umCliente({ id_cliente: 11, email: 'joao@exemplo.com' }));

      await expect(service.atualizar(10, { email: 'joao@exemplo.com' })).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('inativar', () => {
    it('faz inativação lógica (ativo = false), sem remover o registro', async () => {
      repo.findOneBy.mockResolvedValue(umCliente());

      await expect(service.inativar(10)).resolves.toMatchObject({ id_cliente: 10, ativo: false });
      expect(repo.save).toHaveBeenCalledTimes(1);
    });

    it('lança 404 para cliente inexistente', async () => {
      await expect(service.inativar(77)).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
