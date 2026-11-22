import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ILike, Not } from 'typeorm';
import { CriarVeiculoDto } from './dto/criar-veiculo.dto';
import { FiltrarVeiculosDto } from './dto/filtrar-veiculos.dto';
import { Veiculo } from './veiculo.entity';
import { VeiculosService } from './veiculos.service';
import { StatusVeiculo } from './veiculo-status.enum';

describe('VeiculosService', () => {
    const dto: CriarVeiculoDto = {
        marca: 'Toyota',
        modelo: 'Corolla',
        versao: 'XEi',
        ano: 2024,
        cor: 'Prata',
        quilometragem: 12000,
        combustivel: 'flex',
        cambio: 'automatico',
        placa: 'ABC1D23',
        chassi: '9BWZZZ377VT004251',
        renavam: '12345678901',
        preco: 145000,
    };

    const queryBuilder = {
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn(),
    };
    const repository = {
        findOne: vi.fn(),
        findOneBy: vi.fn(),
        createQueryBuilder: vi.fn(() => queryBuilder),
        create: vi.fn((veiculo) => veiculo),
        save: vi.fn(),
    };
    const manager = {
        findOne: vi.fn(),
        save: vi.fn(),
    };
    const dataSource = {
        transaction: vi.fn(),
    };
    let service: VeiculosService;

    beforeEach(async () => {
        vi.clearAllMocks();
        repository.findOne.mockResolvedValue(null);
        repository.findOneBy.mockResolvedValue(null);
        repository.create.mockImplementation((veiculo) => veiculo);
        repository.save.mockImplementation(async (veiculo) => veiculo);
        repository.createQueryBuilder.mockReturnValue(queryBuilder);
        queryBuilder.getMany.mockResolvedValue([]);
        manager.findOne.mockResolvedValue(null);
        manager.save.mockImplementation(async (_entity, value) => value);
        dataSource.transaction.mockImplementation(
            async (operation: (transactionManager: typeof manager) => unknown) =>
                operation(manager),
        );

        const module = await Test.createTestingModule({
            providers: [
                VeiculosService,
                { provide: getRepositoryToken(Veiculo), useValue: repository },
                { provide: getDataSourceToken(), useValue: dataSource },
            ],
        }).compile();

        service = module.get(VeiculosService);
    });

    it('cadastra veículo disponível e formata o preço', async () => {
        await expect(service.cadastrar(dto)).resolves.toMatchObject({
            ...dto,
            preco: '145000.00',
            status: StatusVeiculo.DISPONIVEL,
        });
        expect(repository.save).toHaveBeenCalledOnce();
    });

    it('recusa placa, chassi ou RENAVAM duplicados', async () => {
        repository.findOne.mockResolvedValue({ ...dto, id_veiculo: 3 });

        await expect(service.cadastrar(dto)).rejects.toBeInstanceOf(ConflictException);
        expect(repository.save).not.toHaveBeenCalled();
    });

    it('aplica filtros combinados de marca, preço, ano, combustível e status', async () => {
        await service.filtrar({
            marca: ' Toyota ',
            modelo: 'Cor',
            precoMin: 100000,
            precoMax: 200000,
            anoMin: 2020,
            anoMax: 2025,
            combustivel: 'flex',
            status: StatusVeiculo.RESERVADO,
        });

        expect(queryBuilder.andWhere.mock.calls).toEqual([
            [{ marca: ILike('%Toyota%') }],
            [{ modelo: ILike('%Cor%') }],
            ['veiculo.preco >= :precoMin', { precoMin: 100000 }],
            ['veiculo.preco <= :precoMax', { precoMax: 200000 }],
            ['veiculo.ano >= :anoMin', { anoMin: 2020 }],
            ['veiculo.ano <= :anoMax', { anoMax: 2025 }],
            ['veiculo.combustivel = :combustivel', { combustivel: 'flex' }],
            ['veiculo.status = :status', { status: StatusVeiculo.RESERVADO }],
        ]);
        expect(queryBuilder.orderBy).toHaveBeenCalledWith('veiculo.id_veiculo', 'DESC');
    });

    it('rejeita faixas de preço e ano invertidas', async () => {
        await expect(
            service.filtrar({ precoMin: 200000, precoMax: 100000 }),
        ).rejects.toBeInstanceOf(BadRequestException);
        await expect(
            service.filtrar({ anoMin: 2025, anoMax: 2020 }),
        ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('valida os filtros recebidos pela API', async () => {
        const filtrosValidos = plainToInstance(FiltrarVeiculosDto, {
            precoMin: '100000',
            anoMax: '2025',
            combustivel: 'diesel',
            status: 'em_manutencao',
        });
        await expect(validate(filtrosValidos)).resolves.toHaveLength(0);

        const filtrosInvalidos = plainToInstance(FiltrarVeiculosDto, {
            precoMin: '-1',
            anoMin: '1800',
            status: 'inativo',
        });
        const erros = await validate(filtrosInvalidos);
        expect(erros.map((erro) => erro.property)).toEqual(
            expect.arrayContaining(['precoMin', 'anoMin', 'status']),
        );
    });

    it('busca veículo por ID e retorna 404 quando ausente', async () => {
        repository.findOne.mockResolvedValueOnce({ id_veiculo: 1 });
        await expect(service.buscarPorId(1)).resolves.toEqual({ id_veiculo: 1 });

        repository.findOne.mockResolvedValueOnce(null);
        await expect(service.buscarPorId(99)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('atualiza dados e valida identificadores únicos contra outros veículos', async () => {
        const veiculo = { id_veiculo: 1, ...dto, preco: '100.00' };
        repository.findOneBy.mockResolvedValue(veiculo);

        await expect(service.atualizar(1, { ...dto, preco: 150000 })).resolves.toMatchObject({
            ...dto,
            preco: '150000.00',
        });
        expect(repository.findOne).toHaveBeenCalledWith({
            where: [
                { placa: dto.placa, id_veiculo: Not(1) },
                { chassi: dto.chassi, id_veiculo: Not(1) },
                { renavam: dto.renavam, id_veiculo: Not(1) },
            ],
        });
    });

    it('altera status entre disponível e manutenção', async () => {
        const veiculo = { id_veiculo: 1, status: StatusVeiculo.DISPONIVEL };
        manager.findOne.mockImplementation(async (entity: unknown) =>
            entity === Veiculo ? veiculo : null,
        );

        await expect(
            service.atualizarStatus(1, StatusVeiculo.EM_MANUTENCAO),
        ).resolves.toMatchObject({ status: StatusVeiculo.EM_MANUTENCAO });
        expect(manager.save).toHaveBeenCalledWith(Veiculo, veiculo);
    });

});
