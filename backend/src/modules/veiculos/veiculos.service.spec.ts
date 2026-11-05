import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Repository } from 'typeorm';
import { ConfiguracaoEstoque } from './configuracao-estoque.entity';
import { AtualizarStatusVeiculoDto } from './dto/atualizar-status-veiculo.dto';
import { CriarVeiculoDto } from './dto/criar-veiculo.dto';
import { ListarVeiculosDto } from './dto/listar-veiculos.dto';
import { Veiculo } from './veiculo.entity';
import { VeiculosService } from './veiculos.service';
import { StatusVeiculo } from './veiculo-status.enum';

describe('VeiculosService', () => {
    const filtrosIndividuais: {
        nome: string;
        filtros: ListarVeiculosDto;
        condicao: string;
        parametros: Record<string, string | number>;
    }[] = [
        { nome: 'marca', filtros: { marca: 'Toyota' }, condicao: 'LOWER(veiculo.marca) = LOWER(:marca)', parametros: { marca: 'Toyota' } },
        { nome: 'modelo', filtros: { modelo: 'Cor' }, condicao: 'veiculo.modelo ILIKE :modelo', parametros: { modelo: '%Cor%' } },
        { nome: 'preço mínimo', filtros: { precoMin: 100000 }, condicao: 'veiculo.preco >= :precoMin', parametros: { precoMin: 100000 } },
        { nome: 'preço máximo', filtros: { precoMax: 200000 }, condicao: 'veiculo.preco <= :precoMax', parametros: { precoMax: 200000 } },
        { nome: 'ano inicial', filtros: { anoMin: 2020 }, condicao: 'veiculo.ano >= :anoMin', parametros: { anoMin: 2020 } },
        { nome: 'ano final', filtros: { anoMax: 2025 }, condicao: 'veiculo.ano <= :anoMax', parametros: { anoMax: 2025 } },
        { nome: 'combustível', filtros: { combustivel: 'diesel' }, condicao: 'veiculo.combustivel = :combustivel', parametros: { combustivel: 'diesel' } },
        { nome: 'status', filtros: { status: StatusVeiculo.VENDIDO }, condicao: 'veiculo.status = :status', parametros: { status: StatusVeiculo.VENDIDO } },
    ];

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

    const consulta = {
        select: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn(),
    };
    const repository = {
        findOne: vi.fn(),
        findOneBy: vi.fn(),
        count: vi.fn(),
        find: vi.fn(),
        create: vi.fn(),
        createQueryBuilder: vi.fn(() => consulta),
        save: vi.fn(),
    };
    const configuracaoRepository = {
        findOneBy: vi.fn(),
        upsert: vi.fn(),
    };
    const manager = {
        findOne: vi.fn(),
        save: vi.fn(),
    };
    const dataSource = {
        transaction: vi.fn((operation: (transactionManager: typeof manager) => Promise<unknown>) =>
            operation(manager),
        ),
    };
    let service: VeiculosService;

    beforeEach(async () => {
        vi.clearAllMocks();
        repository.findOne.mockResolvedValue(null);
        repository.findOneBy.mockResolvedValue(null);
        repository.count.mockResolvedValue(0);
        repository.create.mockImplementation((veiculo) => veiculo);
        repository.save.mockImplementation(async (veiculo) => veiculo);
        repository.createQueryBuilder.mockReturnValue(consulta);
        consulta.getMany.mockResolvedValue([{ id_veiculo: 2 }, { id_veiculo: 1 }]);
        configuracaoRepository.findOneBy.mockResolvedValue(null);
        configuracaoRepository.upsert.mockResolvedValue(undefined);
        manager.findOne.mockResolvedValue(null);
        manager.save.mockImplementation(async (_entity, veiculo) => veiculo);
        dataSource.transaction.mockImplementation((operation) => operation(manager));

        const module = await Test.createTestingModule({
            providers: [
                VeiculosService,
                {
                    provide: getRepositoryToken(Veiculo),
                    useValue: repository,
                },
                {
                    provide: getRepositoryToken(ConfiguracaoEstoque),
                    useValue: configuracaoRepository,
                },
                {
                    provide: getDataSourceToken(),
                    useValue: dataSource,
                },
            ],
        }).compile();

        service = module.get(VeiculosService);
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

    it('lista os veículos mais recentes primeiro sem expor campos desnecessários', async () => {
        await expect(service.listar()).resolves.toEqual([
            { id_veiculo: 2 },
            { id_veiculo: 1 },
        ]);
        expect(repository.createQueryBuilder).toHaveBeenCalledWith('veiculo');
        expect(consulta.select).toHaveBeenCalledWith([
            'veiculo.id_veiculo',
            'veiculo.marca',
            'veiculo.modelo',
            'veiculo.versao',
            'veiculo.ano',
            'veiculo.quilometragem',
            'veiculo.combustivel',
            'veiculo.preco',
            'veiculo.status',
        ]);
        expect(consulta.orderBy).toHaveBeenCalledWith('veiculo.id_veiculo', 'DESC');
    });

    it('combina todos os filtros na consulta do estoque', async () => {
        await service.listar({
            marca: ' Toyota ',
            modelo: 'Cor',
            precoMin: 100000,
            precoMax: 200000,
            anoMin: 2020,
            anoMax: 2025,
            combustivel: 'flex',
            status: StatusVeiculo.RESERVADO,
        });

        expect(consulta.andWhere.mock.calls).toEqual([
            ['LOWER(veiculo.marca) = LOWER(:marca)', { marca: 'Toyota' }],
            ['veiculo.modelo ILIKE :modelo', { modelo: '%Cor%' }],
            ['veiculo.preco >= :precoMin', { precoMin: 100000 }],
            ['veiculo.preco <= :precoMax', { precoMax: 200000 }],
            ['veiculo.ano >= :anoMin', { anoMin: 2020 }],
            ['veiculo.ano <= :anoMax', { anoMax: 2025 }],
            ['veiculo.combustivel = :combustivel', { combustivel: 'flex' }],
            ['veiculo.status = :status', { status: StatusVeiculo.RESERVADO }],
        ]);
    });

    it.each(filtrosIndividuais)('aplica somente o filtro de $nome', ({ filtros, condicao, parametros }) => {
        service.listar(filtros);

        expect(consulta.andWhere).toHaveBeenCalledOnce();
        expect(consulta.andWhere).toHaveBeenCalledWith(condicao, parametros);
    });

    it('rejeita intervalos de preço ou ano invertidos', () => {
        expect(() => service.listar({ precoMin: 200000, precoMax: 100000 }))
            .toThrow('O preço mínimo não pode ser maior que o preço máximo');
        expect(() => service.listar({ anoMin: 2025, anoMax: 2020 }))
            .toThrow('O ano inicial não pode ser maior que o ano final');
        expect(repository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('valida os filtros recebidos pela API', async () => {
        const filtrosValidos = plainToInstance(ListarVeiculosDto, {
            precoMin: '100000',
            anoMax: '2025',
            combustivel: 'diesel',
            status: 'em_manutencao',
        });
        await expect(validate(filtrosValidos)).resolves.toHaveLength(0);

        const filtrosInvalidos = plainToInstance(ListarVeiculosDto, {
            precoMin: '-1',
            anoMin: '1800',
            status: 'inativo',
        });
        const erros = await validate(filtrosInvalidos);
        expect(erros.map((erro) => erro.property)).toEqual(
            expect.arrayContaining(['precoMin', 'anoMin', 'status']),
        );
    });

    it('consulta um veículo pelo id e retorna 404 quando não existe', async () => {
        repository.findOne.mockResolvedValueOnce({ id_veiculo: 1 });
        await expect(service.buscarPorId(1)).resolves.toEqual({ id_veiculo: 1 });

        repository.findOne.mockResolvedValueOnce(null);
        await expect(service.buscarPorId(99)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('atualiza o veículo mantendo seus identificadores únicos', async () => {
        const existente = { id_veiculo: 1, ...dto, preco: '100.00' };
        repository.findOneBy.mockResolvedValueOnce(existente);
        repository.findOne.mockResolvedValueOnce(null);

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
            .mockResolvedValueOnce({ id_veiculo: 2 });
        repository.findOneBy.mockResolvedValueOnce({ id_veiculo: 1, ...dto });

        await expect(service.atualizar(1, dto)).rejects.toBeInstanceOf(ConflictException);
        expect(repository.save).not.toHaveBeenCalled();
    });

    it('permite alterar entre disponível e em manutenção e bloqueia estados controlados por processo', async () => {
        const veiculo = { id_veiculo: 1, status: StatusVeiculo.DISPONIVEL };
        manager.findOne.mockImplementation(async (entity: unknown) =>
            entity === Veiculo ? veiculo : null,
        );

        await expect(service.atualizarStatus(1, StatusVeiculo.EM_MANUTENCAO)).resolves.toMatchObject({
            status: StatusVeiculo.EM_MANUTENCAO,
        });
        expect(manager.findOne).toHaveBeenCalledWith(Veiculo, {
            where: { id_veiculo: 1 },
            lock: { mode: 'pessimistic_write' },
        });
        expect(manager.save).toHaveBeenCalledWith(Veiculo, veiculo);

        await expect(service.atualizarStatus(1, StatusVeiculo.DISPONIVEL)).resolves.toMatchObject({
            status: StatusVeiculo.DISPONIVEL,
        });

        for (const status of [StatusVeiculo.RESERVADO, StatusVeiculo.VENDIDO]) {
            await expect(service.atualizarStatus(1, status)).rejects.toBeInstanceOf(
                BadRequestException,
            );
        }
    });

    it('não permite liberar manualmente um veículo reservado ou vendido', async () => {
        for (const status of [StatusVeiculo.RESERVADO, StatusVeiculo.VENDIDO]) {
            manager.findOne.mockImplementation(async () => ({ id_veiculo: 1, status }));

            await expect(
                service.atualizarStatus(1, StatusVeiculo.DISPONIVEL),
            ).rejects.toBeInstanceOf(ConflictException);
        }

        expect(manager.save).not.toHaveBeenCalled();
    });

    it('não permite alterar um veículo com venda concluída', async () => {
        const veiculo = { id_veiculo: 1, status: StatusVeiculo.EM_MANUTENCAO };
        manager.findOne
            .mockResolvedValueOnce(veiculo)
            .mockResolvedValueOnce({ status: 'concluida' });

        await expect(
            service.atualizarStatus(1, StatusVeiculo.DISPONIVEL),
        ).rejects.toBeInstanceOf(ConflictException);
        expect(manager.save).not.toHaveBeenCalled();
    });

    it('retorna resumo contando apenas veículos disponíveis e usa mínimo padrão 10', async () => {
        repository.count.mockResolvedValue(7);

        await expect(service.obterResumoEstoque()).resolves.toEqual({
            quantidadeDisponivel: 7,
            quantidadeMinima: 10,
            abaixoDoMinimo: true,
        });
        expect(repository.count).toHaveBeenCalledWith({
            where: { status: StatusVeiculo.DISPONIVEL },
        });
    });

    it('salva a quantidade mínima e recalcula a situação do estoque', async () => {
        repository.count.mockResolvedValue(12);
        configuracaoRepository.findOneBy.mockResolvedValue({
            id: 1,
            quantidade_minima: 15,
        });

        await expect(service.atualizarMinimoEstoque(15)).resolves.toEqual({
            quantidadeDisponivel: 12,
            quantidadeMinima: 15,
            abaixoDoMinimo: true,
        });
        expect(configuracaoRepository.upsert).toHaveBeenCalledWith(
            { id: 1, quantidade_minima: 15 },
            ['id'],
        );
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
