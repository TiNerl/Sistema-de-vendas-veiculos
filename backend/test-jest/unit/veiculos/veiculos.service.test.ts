/**
 * UC09 – Cadastrar veículo (RF-EST-01, RF-EST-04) | UC10 – Consultar estoque com filtros (RF-EST-06)
 * UC11 – Editar veículo (RF-EST-02) | UC12 – Alterar status do veículo (RF-EST-03, RF-USU-14)
 */
import { beforeEach, describe, expect, it } from '@jest/globals';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ILike, Not } from 'typeorm';
import { Veiculo } from '../../../src/modules/veiculos/veiculo.entity';
import { StatusVeiculo } from '../../../src/modules/veiculos/veiculo-status.enum';
import { VeiculosService } from '../../../src/modules/veiculos/veiculos.service';
import { criarRepositorioMock, type RepositorioMock } from '../../helpers/mocks';
import { dadosVeiculo, umVeiculo } from '../../helpers/fabricas';

describe('VeiculosService', () => {
  let repo: RepositorioMock;
  let service: VeiculosService;

  beforeEach(async () => {
    repo = criarRepositorioMock();
    const modulo = await Test.createTestingModule({
      providers: [VeiculosService, { provide: getRepositoryToken(Veiculo), useValue: repo }],
    }).compile();
    service = modulo.get(VeiculosService);
  });

  describe('cadastrar', () => {
    it('cria sempre com status "disponivel" e preço com 2 casas decimais', async () => {
      const criado = await service.cadastrar(dadosVeiculo({ preco: 89990.5 }));

      expect(criado).toMatchObject({ preco: '89990.50', status: StatusVeiculo.DISPONIVEL, placa: 'ABC1D23' });
      expect(repo.save).toHaveBeenCalledTimes(1);
    });

    it('verifica unicidade de placa, chassi e RENAVAM numa única consulta', async () => {
      const dto = dadosVeiculo();
      await service.cadastrar(dto);

      expect(repo.findOne).toHaveBeenCalledWith({
        where: [{ placa: dto.placa }, { chassi: dto.chassi }, { renavam: dto.renavam }],
      });
    });

    it('recusa identificador duplicado com 409 e não grava', async () => {
      repo.findOne.mockResolvedValue(umVeiculo());

      await expect(service.cadastrar(dadosVeiculo())).rejects.toThrow(
        new ConflictException('Placa, chassi ou RENAVAM já cadastrado'),
      );
      expect(repo.save).not.toHaveBeenCalled();
    });
  });

  describe('listar (filtros do estoque)', () => {
    it('sem filtros, não adiciona condições e ordena do mais recente para o mais antigo', async () => {
      repo.qb.getMany.mockResolvedValue([umVeiculo()]);

      await expect(service.listar({})).resolves.toHaveLength(1);
      expect(repo.createQueryBuilder).toHaveBeenCalledWith('veiculo');
      expect(repo.qb.andWhere).not.toHaveBeenCalled();
      expect(repo.qb.orderBy).toHaveBeenCalledWith('veiculo.id_veiculo', 'DESC');
    });

    it('combina todos os filtros suportados, com busca parcial e sem diferenciar maiúsculas em marca/modelo', async () => {
      await service.listar({
        marca: 'toyo',
        modelo: 'cor',
        precoMin: 50000,
        precoMax: 150000,
        ano: 2024,
        combustivel: 'flex',
        status: StatusVeiculo.DISPONIVEL,
      });

      expect(repo.qb.andWhere.mock.calls).toEqual([
        [{ marca: ILike('%toyo%') }],
        [{ modelo: ILike('%cor%') }],
        ['veiculo.preco >= :precoMin', { precoMin: 50000 }],
        ['veiculo.preco <= :precoMax', { precoMax: 150000 }],
        ['veiculo.ano = :ano', { ano: 2024 }],
        ['veiculo.combustivel = :combustivel', { combustivel: 'flex' }],
        ['veiculo.status = :status', { status: StatusVeiculo.DISPONIVEL }],
      ]);
    });

    it('aceita preço mínimo igual a zero (valor falsy não pode ser ignorado)', async () => {
      await service.listar({ precoMin: 0 });

      expect(repo.qb.andWhere).toHaveBeenCalledWith('veiculo.preco >= :precoMin', { precoMin: 0 });
    });

    it('rejeita faixa de preço invertida com 400 antes de consultar o banco', async () => {
      await expect(service.listar({ precoMin: 200000, precoMax: 100000 })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(repo.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('aceita faixa de preço com mínimo igual ao máximo', async () => {
      await expect(service.listar({ precoMin: 100000, precoMax: 100000 })).resolves.toEqual([]);
    });
  });

  describe('buscarPorId', () => {
    it('retorna o veículo', async () => {
      repo.findOne.mockResolvedValue(umVeiculo());
      await expect(service.buscarPorId(7)).resolves.toMatchObject({ id_veiculo: 7 });
      expect(repo.findOne).toHaveBeenCalledWith({ where: { id_veiculo: 7 } });
    });

    it('lança 404 quando não existe', async () => {
      await expect(service.buscarPorId(404)).rejects.toThrow(new NotFoundException('Veículo não encontrado'));
    });
  });

  describe('atualizar', () => {
    it('lança 404 quando o veículo não existe', async () => {
      await expect(service.atualizar(9, { cor: 'Azul' })).rejects.toBeInstanceOf(NotFoundException);
    });

    it('sem identificadores no corpo, não consulta duplicidade e preserva o preço', async () => {
      repo.findOneBy.mockResolvedValue(umVeiculo());

      const atualizado = await service.atualizar(7, { cor: 'Azul' });

      expect(repo.findOne).not.toHaveBeenCalled();
      expect(atualizado).toMatchObject({ cor: 'Azul', preco: '100000.00' });
    });

    it('verifica duplicidade apenas dos identificadores enviados, excluindo o próprio veículo', async () => {
      repo.findOneBy.mockResolvedValue(umVeiculo());

      await service.atualizar(7, { placa: 'XYZ9A88', preco: 95000 });

      expect(repo.findOne).toHaveBeenCalledWith({ where: [{ placa: 'XYZ9A88', id_veiculo: Not(7) }] });
      expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ placa: 'XYZ9A88', preco: '95000.00' }));
    });

    it('recusa placa/chassi/RENAVAM que pertença a outro veículo', async () => {
      repo.findOneBy.mockResolvedValue(umVeiculo());
      repo.findOne.mockResolvedValue(umVeiculo({ id_veiculo: 8 }));

      await expect(service.atualizar(7, { chassi: '9BWZZZ377VT004999' })).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(repo.save).not.toHaveBeenCalled();
    });
  });

  describe('atualizarStatus', () => {
    it('altera de disponível para em manutenção', async () => {
      repo.findOne.mockResolvedValue(umVeiculo());

      await expect(service.atualizarStatus(7, StatusVeiculo.EM_MANUTENCAO)).resolves.toMatchObject({
        status: StatusVeiculo.EM_MANUTENCAO,
      });
    });

    it('lança 404 para veículo inexistente', async () => {
      await expect(service.atualizarStatus(404, StatusVeiculo.DISPONIVEL)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    /**
     * DEF-03 — Estados de venda alterados manualmente.
     * Regra documentada (README, seção "Listagem do estoque"): a alteração manual só
     * pode alternar entre `disponivel` e `em_manutencao`; `reservado`/`vendido` são
     * controlados exclusivamente pelo fluxo de vendas.
     * Atual: qualquer status é aceito, o que permite "vender" um veículo sem venda.
     */
    it.failing('[DEF-03] recusa marcar manualmente um veículo como "vendido"', async () => {
      repo.findOne.mockResolvedValue(umVeiculo());

      await expect(service.atualizarStatus(7, StatusVeiculo.VENDIDO)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it.failing('[DEF-03] recusa tirar manualmente um veículo do estado "reservado"', async () => {
      repo.findOne.mockResolvedValue(umVeiculo({ status: StatusVeiculo.RESERVADO }));

      await expect(service.atualizarStatus(7, StatusVeiculo.DISPONIVEL)).rejects.toThrow();
    });
  });
});
