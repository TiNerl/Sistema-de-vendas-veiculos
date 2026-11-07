/**
 * UC13 – Registrar venda (RF-VEN-01..04, RF-USU-02) — inclui baixa automática de estoque
 *        e cálculo de comissão NA MESMA TRANSAÇÃO.
 * UC14 – Solicitar desconto especial (RF-VEN-05, RF-USU-06)
 * UC15 – Aprovar/Reprovar desconto (RF-USU-12)
 * UC16 – Consultar histórico de vendas (RF-VEN-06, RF-CLI-07)
 */
import { beforeEach, describe, expect, it } from '@jest/globals';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Cliente } from '../../../src/modules/clientes/cliente.entity';
import { Usuario } from '../../../src/modules/usuarios/usuario.entity';
import { Veiculo } from '../../../src/modules/veiculos/veiculo.entity';
import { StatusVeiculo } from '../../../src/modules/veiculos/veiculo-status.enum';
import { Venda } from '../../../src/modules/vendas/venda.entity';
import { VendasService } from '../../../src/modules/vendas/vendas.service';
import type { CadastrarVendaDto } from '../../../src/modules/vendas/dto/cadastrar-venda.dto';
import {
  criarDataSourceMock,
  criarRepositorioMock,
  type DataSourceMock,
  type RepositorioMock,
} from '../../helpers/mocks';
import { umAdministrador, umCliente, umUsuario, umVeiculo } from '../../helpers/fabricas';

describe('VendasService', () => {
  let repo: RepositorioMock;
  let ds: DataSourceMock;
  let service: VendasService;

  /** Configura o EntityManager para devolver cada entidade solicitada no findOneBy. */
  function cenario(entidades: { usuario?: unknown; cliente?: unknown; veiculo?: unknown }) {
    ds.manager.findOneBy.mockImplementation(async (entidade: unknown) => {
      if (entidade === Usuario) return entidades.usuario ?? null;
      if (entidade === Cliente) return entidades.cliente ?? null;
      if (entidade === Veiculo) return entidades.veiculo ?? null;
      return null;
    });
    // Recarrega a venda salva com as relações (último passo do cadastro/aprovação).
    ds.manager.findOneOrFail.mockImplementation(async () => ds.manager.save.mock.results.at(-1)?.value);
  }

  const venda = (extra: Partial<CadastrarVendaDto> = {}): CadastrarVendaDto => ({
    id_cliente: 10,
    id_veiculo: 7,
    forma_pagamento: 'pix',
    ...extra,
  });

  /** Parâmetros passados ao `.set()` do UPDATE do veículo (baixa de estoque). */
  const statusGravadoNoVeiculo = () => ds.manager.qb.set.mock.calls.at(-1)?.[0];

  beforeEach(async () => {
    repo = criarRepositorioMock();
    ds = criarDataSourceMock();
    const modulo = await Test.createTestingModule({
      providers: [
        VendasService,
        { provide: getRepositoryToken(Venda), useValue: repo },
        { provide: DataSource, useValue: ds },
      ],
    }).compile();
    service = modulo.get(VendasService);
  });

  describe('cadastrarVenda — validações de pré-condição', () => {
    it('lança 404 se o usuário do token não existe mais', async () => {
      cenario({ cliente: umCliente(), veiculo: umVeiculo() });
      await expect(service.cadastrarVenda(venda(), 2)).rejects.toThrow(
        new NotFoundException('Usuário não encontrado'),
      );
    });

    it('lança 404 se o cliente não existe', async () => {
      cenario({ usuario: umUsuario(), veiculo: umVeiculo() });
      await expect(service.cadastrarVenda(venda(), 2)).rejects.toThrow('Cliente não encontrado');
    });

    it('lança 409 se o cliente está inativo (RF-CLI-04)', async () => {
      cenario({ usuario: umUsuario(), cliente: umCliente({ ativo: false }), veiculo: umVeiculo() });
      await expect(service.cadastrarVenda(venda(), 2)).rejects.toThrow(
        new ConflictException('Cliente não está ativo'),
      );
    });

    it('lança 404 se o veículo não está cadastrado', async () => {
      cenario({ usuario: umUsuario(), cliente: umCliente() });
      await expect(service.cadastrarVenda(venda(), 2)).rejects.toThrow('Veículo não cadastrado no estoque');
    });

    it.each([StatusVeiculo.VENDIDO, StatusVeiculo.RESERVADO, StatusVeiculo.EM_MANUTENCAO])(
      'lança 409 se o veículo está "%s" (só "disponivel" pode ser vendido – RF-VEN-01)',
      async (status) => {
        cenario({ usuario: umUsuario(), cliente: umCliente(), veiculo: umVeiculo({ status }) });

        await expect(service.cadastrarVenda(venda(), 2)).rejects.toThrow(
          'O veículo não está disponível em estoque',
        );
        expect(ds.manager.save).not.toHaveBeenCalled();
      },
    );
  });

  describe('cadastrarVenda — caminho feliz, valores e baixa de estoque', () => {
    it('executa tudo dentro de UMA transação de banco', async () => {
      cenario({ usuario: umUsuario(), cliente: umCliente(), veiculo: umVeiculo() });

      await service.cadastrarVenda(venda(), 2);

      expect(ds.transaction).toHaveBeenCalledTimes(1);
      expect(repo.save).not.toHaveBeenCalled(); // nada é gravado fora do manager transacional
    });

    it('sem desconto: venda concluída, comissão de 3% e veículo marcado como vendido', async () => {
      cenario({ usuario: umUsuario(), cliente: umCliente(), veiculo: umVeiculo({ preco: '100000.00' }) });

      await service.cadastrarVenda(venda(), 2);

      expect(ds.manager.create).toHaveBeenCalledWith(
        Venda,
        expect.objectContaining({
          valor_veiculo: '100000.00',
          percentual_desconto: '0.00',
          valor_desconto: '0.00',
          valor_final: '100000.00',
          percentual_comissao: '3.00',
          valor_comissao: '3000.00',
          forma_pagamento: 'pix',
          status: 'concluida',
        }),
      );
      expect(statusGravadoNoVeiculo()).toEqual({ status: StatusVeiculo.VENDIDO });
    });

    it('com desconto de 5%: comissão incide sobre o valor FINAL (RF-VEN-04)', async () => {
      cenario({ usuario: umUsuario(), cliente: umCliente(), veiculo: umVeiculo({ preco: '80000.00' }) });

      await service.cadastrarVenda(venda({ percentual_desconto: 5 }), 2);

      expect(ds.manager.create).toHaveBeenCalledWith(
        Venda,
        expect.objectContaining({
          valor_desconto: '4000.00',
          valor_final: '76000.00',
          valor_comissao: '2280.00',
          status: 'concluida',
        }),
      );
    });

    it('a baixa só atualiza o veículo se ele AINDA estiver disponível (proteção contra venda dupla)', async () => {
      cenario({ usuario: umUsuario(), cliente: umCliente(), veiculo: umVeiculo() });

      await service.cadastrarVenda(venda(), 2);

      expect(ds.manager.qb.update).toHaveBeenCalledWith(Veiculo);
      expect(ds.manager.qb.where).toHaveBeenCalledWith('id_veiculo = :id', { id: 7 });
      expect(ds.manager.qb.andWhere).toHaveBeenCalledWith('status = :status', {
        status: StatusVeiculo.DISPONIVEL,
      });
    });

    it('lança 409 se outra transação vendeu o veículo no meio do processo (affected = 0)', async () => {
      cenario({ usuario: umUsuario(), cliente: umCliente(), veiculo: umVeiculo() });
      ds.manager.qb.execute.mockResolvedValue({ affected: 0 });

      await expect(service.cadastrarVenda(venda(), 2)).rejects.toThrow(
        'O veículo não está mais disponível para venda',
      );
    });

    it('devolve a venda recarregada com cliente, veículo e vendedor', async () => {
      cenario({ usuario: umUsuario(), cliente: umCliente(), veiculo: umVeiculo() });

      await service.cadastrarVenda(venda(), 2);

      expect(ds.manager.findOneOrFail).toHaveBeenCalledWith(Venda, {
        where: { id_venda: 100 },
        relations: { cliente: true, veiculo: true, usuario: true },
      });
    });
  });

  describe('cadastrarVenda — desconto especial (RF-VEN-05 / RF-USU-06 / RF-USU-12)', () => {
    it('vendedor com 15% de desconto: venda "pendente" e veículo "reservado" aguardando o administrador', async () => {
      cenario({ usuario: umUsuario(), cliente: umCliente(), veiculo: umVeiculo() });

      await service.cadastrarVenda(venda({ percentual_desconto: 15 }), 2);

      expect(ds.manager.create).toHaveBeenCalledWith(
        Venda,
        expect.objectContaining({ status: 'pendente', valor_final: '85000.00' }),
      );
      expect(statusGravadoNoVeiculo()).toEqual({ status: StatusVeiculo.RESERVADO });
    });

    it('administrador com 15% de desconto: venda concluída direto (não precisa aprovar a si mesmo)', async () => {
      cenario({ usuario: umAdministrador(), cliente: umCliente(), veiculo: umVeiculo() });

      await service.cadastrarVenda(venda({ percentual_desconto: 15 }), 1);

      expect(ds.manager.create).toHaveBeenCalledWith(Venda, expect.objectContaining({ status: 'concluida' }));
      expect(statusGravadoNoVeiculo()).toEqual({ status: StatusVeiculo.VENDIDO });
    });

    it('vendedor com 9,99% de desconto: não exige aprovação', async () => {
      cenario({ usuario: umUsuario(), cliente: umCliente(), veiculo: umVeiculo() });

      await service.cadastrarVenda(venda({ percentual_desconto: 9.99 }), 2);

      expect(ds.manager.create).toHaveBeenCalledWith(Venda, expect.objectContaining({ status: 'concluida' }));
    });

    /**
     * DEF-02 — Valor-limite do desconto especial.
     * Regra (RF-VEN-05, RF-USU-06 e "Decisões registradas" do README): exige aprovação
     * a partir de 10% (≥ 10%). O README pede explicitamente "testar o limite em exatamente 10%".
     * Atual: o serviço usa `percentualDesconto > 10`; 10% exatos são concluídos sem aprovação.
     */
    it.failing('[DEF-02] vendedor com EXATAMENTE 10% de desconto deve gerar venda pendente', async () => {
      cenario({ usuario: umUsuario(), cliente: umCliente(), veiculo: umVeiculo() });

      await service.cadastrarVenda(venda({ percentual_desconto: 10 }), 2);

      expect(ds.manager.create).toHaveBeenCalledWith(Venda, expect.objectContaining({ status: 'pendente' }));
    });
  });

  describe.each([
    ['aprovar', 'concluida', StatusVeiculo.VENDIDO] as const,
    ['rejeitar', 'cancelada', StatusVeiculo.DISPONIVEL] as const,
  ])('%s venda pendente', (acao, statusVendaFinal, statusVeiculoFinal) => {
    const pendente = () => ({ id_venda: 55, status: 'pendente', veiculo: umVeiculo({ status: StatusVeiculo.RESERVADO }) });

    it('lança 404 quando não há venda PENDENTE com esse ID', async () => {
      ds.manager.findOne.mockResolvedValue(null);

      await expect(service[acao](55)).rejects.toThrow(new NotFoundException('Venda pendente não encontrada'));
      expect(ds.manager.findOne).toHaveBeenCalledWith(
        Venda,
        expect.objectContaining({ where: { id_venda: 55, status: 'pendente' } }),
      );
    });

    it(`muda a venda para "${statusVendaFinal}" e o veículo de "reservado" para "${statusVeiculoFinal}"`, async () => {
      ds.manager.findOne.mockResolvedValue(pendente());
      ds.manager.findOneOrFail.mockResolvedValue({ id_venda: 55, status: statusVendaFinal });

      await expect(service[acao](55)).resolves.toMatchObject({ status: statusVendaFinal });
      expect(ds.manager.qb.set.mock.calls).toEqual([[{ status: statusVendaFinal }], [{ status: statusVeiculoFinal }]]);
      expect(ds.manager.qb.andWhere).toHaveBeenCalledWith('status = :status', { status: 'pendente' });
      expect(ds.manager.qb.andWhere).toHaveBeenCalledWith('status = :status', { status: StatusVeiculo.RESERVADO });
    });

    it('lança 409 se a venda deixou de estar pendente (decisão concorrente)', async () => {
      ds.manager.findOne.mockResolvedValue(pendente());
      ds.manager.qb.execute.mockResolvedValueOnce({ affected: 0 });

      await expect(service[acao](55)).rejects.toThrow('A venda não está mais pendente de aprovação');
    });

    it('lança 409 (e a transação é desfeita) se o veículo não está mais reservado', async () => {
      ds.manager.findOne.mockResolvedValue(pendente());
      ds.manager.qb.execute.mockResolvedValueOnce({ affected: 1 }).mockResolvedValueOnce({ affected: 0 });

      await expect(service[acao](55)).rejects.toThrow(new ConflictException('O veículo não está mais reservado'));
    });
  });

  describe('buscarTodas (histórico de vendas)', () => {
    it('sem filtros: junta cliente, veículo e vendedor e ordena por data decrescente', async () => {
      await service.buscarTodas({});

      expect(repo.qb.leftJoinAndSelect.mock.calls).toEqual([
        ['venda.cliente', 'cliente'],
        ['venda.veiculo', 'veiculo'],
        ['venda.usuario', 'usuario'],
      ]);
      expect(repo.qb.andWhere).not.toHaveBeenCalled();
      expect(repo.qb.orderBy).toHaveBeenCalledWith('venda.data_venda', 'DESC');
    });

    it('filtra por cliente e período, incluindo o dia final inteiro (até 23:59:59.999 UTC)', async () => {
      await service.buscarTodas({ cliente_id: 10, dataInicio: '2026-11-01', dataFim: '2026-11-30' });

      expect(repo.qb.andWhere).toHaveBeenCalledWith('cliente.id_cliente = :cliente_id', { cliente_id: 10 });
      expect(repo.qb.andWhere).toHaveBeenCalledWith('venda.data_venda >= :inicio', {
        inicio: new Date('2026-11-01T00:00:00.000Z'),
      });
      expect(repo.qb.andWhere).toHaveBeenCalledWith('venda.data_venda <= :fim', {
        fim: new Date('2026-11-30T23:59:59.999Z'),
      });
    });

    it('rejeita período invertido com 400', async () => {
      await expect(service.buscarTodas({ dataInicio: '2026-12-01', dataFim: '2026-11-01' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('buscarPorId', () => {
    it('lança 404 quando a venda não existe', async () => {
      await expect(service.buscarPorId(1)).rejects.toThrow(new NotFoundException('Venda não encontrada'));
    });

    it('retorna a venda com relações', async () => {
      repo.findOne.mockResolvedValue({ id_venda: 1 });
      await expect(service.buscarPorId(1)).resolves.toEqual({ id_venda: 1 });
    });
  });
});
