import { ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Repository } from 'typeorm';
import { CriarVeiculoDto } from './dto/criar-veiculo.dto';
import { Veiculo } from './veiculo.entity';
import { VeiculosService } from './veiculos.service';

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
        create: vi.fn(),
        save: vi.fn(),
    };
    let service: VeiculosService;

    beforeEach(async () => {
        vi.clearAllMocks();
        repository.findOne.mockResolvedValue(null);
        repository.create.mockImplementation((veiculo) => veiculo);
        repository.save.mockImplementation(async (veiculo) => veiculo);

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

    it('cadastra o veículo com o preço armazenado em centavos decimais', async () => {
        await expect(service.cadastrar(dto)).resolves.toMatchObject({
            ...dto,
            preco: '145000.00',
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
