import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, ILike, Not, Repository } from 'typeorm';
import { CriarVeiculoDto } from './dto/criar-veiculo.dto';
import { Veiculo } from './veiculo.entity';
import { StatusVeiculo } from './veiculo-status.enum';
import { AtualizarVeiculoDto } from './dto/atualizar-veiculo.dto';
import { FiltrarVeiculosDto } from './dto/filtrar-veiculos.dto';

@Injectable()
export class VeiculosService {
    constructor(
        @InjectRepository(Veiculo)
        private readonly repository: Repository<Veiculo>,
        private readonly dataSource: DataSource,
    ) { }

    async cadastrar(dto: CriarVeiculoDto) {
        const existente = await this.repository.findOne({
            where: [
                { placa: dto.placa },
                { chassi: dto.chassi },
                { renavam: dto.renavam },
            ],
        });

        if (existente) {
            throw new ConflictException('Placa, chassi ou RENAVAM já cadastrado');
        }

        const veiculo = this.repository.create({
            ...dto,
            preco: dto.preco.toFixed(2),
            status: StatusVeiculo.DISPONIVEL,
        });

        return this.repository.save(veiculo);
    }


    async filtrar(dto: FiltrarVeiculosDto) {
        const {
            marca,
            modelo,
            precoMin,
            precoMax,
            ano,
            anoMin,
            anoMax,
            anoInicio,
            anoFim,
            combustivel,
            status,
        } = dto;

        if (
            precoMin !== undefined &&
            precoMax !== undefined &&
            precoMin > precoMax
        ) {
            throw new BadRequestException(
                'O preço mínimo não pode ser maior que o preço máximo',
            );
        }

        const anoInicial = anoInicio ?? anoMin;
        const anoFinal = anoFim ?? anoMax;

        if (
            anoInicial !== undefined &&
            anoFinal !== undefined &&
            anoInicial > anoFinal
        ) {
            throw new BadRequestException(
                'O ano inicial não pode ser maior que o ano final',
            );
        }
        const query = this.repository.createQueryBuilder('veiculo');

        const marcaNormalizada = marca?.trim();
        const modeloNormalizado = modelo?.trim();

        if (marcaNormalizada) {
            query.andWhere({ marca: ILike(`%${marcaNormalizada}%`) });
        }

        if (modeloNormalizado) {
            query.andWhere({ modelo: ILike(`%${modeloNormalizado}%`) });
        }

        if (precoMin !== undefined) {
            query.andWhere('veiculo.preco >= :precoMin', {
                precoMin,
            });
        }

        if (precoMax !== undefined) {
            query.andWhere('veiculo.preco <= :precoMax', {
                precoMax,
            });
        }

        if (ano !== undefined) {
            query.andWhere('veiculo.ano = :ano', { ano });
        }

        if (anoInicial !== undefined) {
            query.andWhere('veiculo.ano >= :anoMin', {
                anoMin: anoInicial,
            });
        }

        if (anoFinal !== undefined) {
            query.andWhere('veiculo.ano <= :anoMax', {
                anoMax: anoFinal,
            });
        }

        if (combustivel) {
            query.andWhere('veiculo.combustivel = :combustivel', {
                combustivel,
            });
        }

        if (status) {
            query.andWhere('veiculo.status = :status', { status });
        }


        return query
            .orderBy('veiculo.id_veiculo', 'DESC')
            .getMany();
    }


    async buscarPorId(id: number) {
        const veiculo = await this.repository.findOne({ where: { id_veiculo: id } });

        if (!veiculo) {
            throw new NotFoundException('Veículo não encontrado');
        }

        return veiculo;
    }

    async atualizar(id: number, dto: AtualizarVeiculoDto) {
        const veiculo = await this.repository.findOneBy({
            id_veiculo: id,
        });

        if (!veiculo) {
            throw new NotFoundException(
                `Veículo com ID ${id} não encontrado`,
            );
        }
        if (veiculo.status === StatusVeiculo.VENDIDO) {
            throw new ConflictException(
                'Veículos vendidos não podem ser editados',
            );
        }

        const condicoes = [
            ...(dto.placa !== undefined ? [{ placa: dto.placa }] : []),
            ...(dto.chassi !== undefined ? [{ chassi: dto.chassi }] : []),
            ...(dto.renavam !== undefined ? [{ renavam: dto.renavam }] : []),
        ].map(condicao => ({ ...condicao, id_veiculo: Not(id) }));

        if (condicoes.length > 0) {
            const existente = await this.repository.findOne({
                where: condicoes,
            });

            if (existente) {
                throw new ConflictException('Placa, chassi ou RENAVAM já cadastrado');
            }
        }

        Object.assign(veiculo, {
            ...dto,
            ...(dto.preco !== undefined && {
                preco: dto.preco.toFixed(2),
            }),
        });

        return this.repository.save(veiculo);
    }

    async atualizarStatus(id: number, status: StatusVeiculo) {
        if (status !== StatusVeiculo.EM_MANUTENCAO) {
            throw new BadRequestException(
                'O status só pode ser alterado manualmente para em_manutencao',
            );
        }

        return this.dataSource.transaction(async (manager) => {
            const veiculo = await manager.findOne(Veiculo, {
                where: { id_veiculo: id },
            });

            if (!veiculo) {
                throw new NotFoundException('Veículo não encontrado');
            }
            if (veiculo.status === StatusVeiculo.VENDIDO) {
                throw new ConflictException(
                    'Veículos vendidos não podem ser editados',
                );
            }
            veiculo.status = status;
            return manager.save(Veiculo, veiculo);
        });
    }
}