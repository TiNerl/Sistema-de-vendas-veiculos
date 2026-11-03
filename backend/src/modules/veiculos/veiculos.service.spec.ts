import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ILike, Repository } from 'typeorm';
import { AtualizarStatusVeiculoDto } from './dto/atualizar-status-veiculo.dto';
import { CriarVeiculoDto } from './dto/criar-veiculo.dto';
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

    const repository = {
        findOne: vi.fn(),
        findOneBy: vi.fn(),
        find: vi.fn(),
        createQueryBuilder: vi.fn(),
        create: vi.fn(),
        save: vi.fn(),
    };
    const queryBuilder = {
        andWhere: vi.fn(),
        orderBy: vi.fn(),
        getMany: vi.fn(),
    };
    let service: VeiculosService;

    beforeEach(async () => {
        vi.clearAllMocks();
        repository.findOne.mockResolvedValue(null);
        repository.create.mockImplementation((veiculo) => veiculo);
        repository.save.mockImplementation(async (veiculo) => veiculo);
        repository.createQueryBuilder.mockReturnValue(queryBuilder);
        queryBuilder.orderBy.mockReturnValue(queryBuilder);
        queryBuilder.getMany.mockResolvedValue([]);

        const module = await Test.createTestingModule({
            providers: [
                VeiculosService,
                {
                    provide: getRepositoryToken(Veiculo),
                    useValue: repository,
                },
            ],
        }).compile();

        service = module.get(VeiculosService);
    });

    it('filtra marca e modelo com os operadores ILike do TypeORM', async () => {
        await expect(service.listar({ marca: 'Toyota', modelo: 'Corolla' })).resolves.toEqual([]);

        expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(1, {
            marca: ILike('%Toyota%'),
        });
        expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(2, {
            modelo: ILike('%Corolla%'),
        });
    });

    it('cadastra o veículo com o preço armazenado em centavos decimais', async () => {
        await expect(service.cadastrar(dto)).resolves.toMatchObject({
            ...dto,
            preco: '145000.00',
            status: StatusVeiculo.DISPONIVEL,
        });
        expect(repository.findOne).toHaveBeenCalledWith({
            where: [{ placa: dto.placa }, { chassi: dto.chassi }, { renavam: dto.renavam }],
        });
        expect(repository.save).toHaveBeenCalledOnce();
    });

    it('rejeita uma placa, chassi ou RENAVAM já cadastrado', async () => {
        repository.findOne.mockResolvedValue({ id_veiculo: 1 });

        await expect(service.cadastrar(dto)).rejects.toBeInstanceOf(ConflictException);
        expect(repository.save).not.toHaveBeenCalled();
    });

    it('lista os veículos mais recentes primeiro', async () => {
        repository.find.mockResolvedValue([{ id_veiculo: 2 }, { id_veiculo: 1 }]);

        await expect(service.listar()).resolves.toEqual([
            { id_veiculo: 2 },
            { id_veiculo: 1 },
        ]);
        expect(repository.find).toHaveBeenCalledWith({ order: { id_veiculo: 'DESC' } });
    });

    it('consulta um veículo pelo id e retorna 404 quando não existe', async () => {
        repository.findOne.mockResolvedValueOnce({ id_veiculo: 1 });
        await expect(service.buscarPorId(1)).resolves.toEqual({ id_veiculo: 1 });

        repository.findOne.mockResolvedValueOnce(null);
        await expect(service.buscarPorId(99)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('atualiza o veículo mantendo seus identificadores únicos', async () => {
        const existente = { id_veiculo: 1, ...dto, preco: '100.00' };
        repository.findOne.mockResolvedValueOnce(existente).mockResolvedValueOnce(null);

        await expect(service.atualizar(1, { ...dto, preco: 150000 })).resolves.toMatchObject({
            ...dto,
            preco: '150000.00',
        });
        expect(repository.findOne).toHaveBeenLastCalledWith({
            where: [
                { placa: dto.placa, id_veiculo: expect.anything() },
                { chassi: dto.chassi, id_veiculo: expect.anything() },
                { renavam: dto.renavam, id_veiculo: expect.anything() },
            ],
        });
        expect(repository.save).toHaveBeenCalledOnce();
    });

    it('não atualiza quando os identificadores pertencem a outro veículo', async () => {
        repository.findOne
            .mockResolvedValueOnce({ id_veiculo: 1, ...dto })
            .mockResolvedValueOnce({ id_veiculo: 2 });

        await expect(service.atualizar(1, dto)).rejects.toBeInstanceOf(ConflictException);
        expect(repository.save).not.toHaveBeenCalled();
    });

    it('altera o status do veículo', async () => {
        const veiculo = { id_veiculo: 1, status: StatusVeiculo.DISPONIVEL };
        repository.findOne.mockResolvedValueOnce(veiculo);

        await expect(service.atualizarStatus(1, StatusVeiculo.RESERVADO)).resolves.toMatchObject({
            status: StatusVeiculo.RESERVADO,
        });
        expect(repository.save).toHaveBeenCalledWith(veiculo);
    });

    it('rejeita status de veículo inválido', async () => {
        for (const status of Object.values(StatusVeiculo)) {
            const dtoValido = plainToInstance(AtualizarStatusVeiculoDto, { status });
            await expect(validate(dtoValido)).resolves.toHaveLength(0);
        }

        const dtoInvalido = plainToInstance(AtualizarStatusVeiculoDto, { status: 'inativo' });
        await expect(validate(dtoInvalido)).resolves.toHaveLength(1);
    });

    it('normaliza placa e chassi e valida os dados obrigatórios', async () => {
        const entrada = plainToInstance(CriarVeiculoDto, {
            ...dto,
            placa: 'abc-1d23',
            chassi: dto.chassi.toLowerCase(),
        });

        await expect(validate(entrada)).resolves.toHaveLength(0);
        expect(entrada.placa).toBe('ABC1D23');
        expect(entrada.chassi).toBe(dto.chassi);

        const invalido = plainToInstance(CriarVeiculoDto, {
            ...dto,
            ano: 1800,
            quilometragem: -1,
            renavam: '123',
            preco: 0,
        });
        const erros = await validate(invalido);

        expect(erros.map((erro) => erro.property)).toEqual(
            expect.arrayContaining(['ano', 'quilometragem', 'renavam', 'preco']),
        );
    });
});
