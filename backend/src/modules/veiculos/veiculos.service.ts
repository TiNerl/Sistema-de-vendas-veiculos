import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, ILike, Not, Repository } from 'typeorm';
import { Venda } from '../vendas/venda.entity';
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
            const campoDuplicado = existente.placa === dto.placa
                ? 'placa'
                : existente.chassi === dto.chassi
                    ? 'chassi'
                    : existente.renavam === dto.renavam
                        ? 'RENAVAM'
                        : undefined;
            throw new ConflictException(
                campoDuplicado
                    ? `Já existe um veículo cadastrado com esta ${campoDuplicado}.`
                    : 'Placa, chassi ou RENAVAM já cadastrado',
            );
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
            anoMin,
            anoMax,
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

        if (
            anoMin !== undefined &&
            anoMax !== undefined &&
            anoMin > anoMax
        ) {
            throw new BadRequestException(
                'O ano inicial não pode ser maior que o ano final',
            );
        }

        const query = this.repository.createQueryBuilder('veiculo');

        if (marca) {
            query.andWhere({ marca: ILike(`%${marca.trim()}%`) });
        }

        if (modelo) {
            query.andWhere({ modelo: ILike(`%${modelo.trim()}%`) });
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

        if (anoMin !== undefined) {
            query.andWhere('veiculo.ano >= :anoMin', { anoMin });
        }

        if (anoMax !== undefined) {
            query.andWhere('veiculo.ano <= :anoMax', { anoMax });
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
                const campoDuplicado = existente.placa === dto.placa
                    ? 'placa'
                    : existente.chassi === dto.chassi
                        ? 'chassi'
                        : existente.renavam === dto.renavam
                            ? 'RENAVAM'
                            : undefined;
                throw new ConflictException(
                    campoDuplicado
                        ? `Já existe um veículo cadastrado com esta ${campoDuplicado}.`
                        : 'Placa, chassi ou RENAVAM já cadastrado',
                );
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
        return this.dataSource.transaction(async (manager) => {
            const veiculo = await manager.findOne(Veiculo, {
                where: { id_veiculo: id },
                lock: { mode: 'pessimistic_write' },
            });

            if (!veiculo) {
                throw new NotFoundException(`Veículo com ID ${id} não encontrado`);
            }

            if (veiculo.status === status) {
                return veiculo;
            }

            if (
                status !== StatusVeiculo.DISPONIVEL &&
                status !== StatusVeiculo.EM_MANUTENCAO
            ) {
                throw new BadRequestException(
                    'Os status reservado e vendido são controlados pelos processos de reserva e venda.',
                );
            }

            if (
                veiculo.status !== StatusVeiculo.DISPONIVEL &&
                veiculo.status !== StatusVeiculo.EM_MANUTENCAO
            ) {
                throw new ConflictException(
                    'Não é permitido alterar manualmente um veículo reservado ou vendido.',
                );
            }

            const vendaConcluida = await manager.findOne(Venda, {
                where: {
                    veiculo: { id_veiculo: id },
                    status: 'concluida',
                },
            });

            if (vendaConcluida) {
                throw new ConflictException(
                    'Não é permitido alterar o status de um veículo com venda concluída.',
                );
            }

            veiculo.status = status;
            return manager.save(Veiculo, veiculo);
        });
    }

    async excluir(id: number) {
        return this.dataSource.transaction(async (manager) => {
            const veiculo = await manager.findOne(Veiculo, {
                where: { id_veiculo: id },
                lock: { mode: 'pessimistic_write' },
            });

            if (!veiculo) {
                throw new NotFoundException(`Veículo com ID ${id} não encontrado`);
            }

            const venda = await manager.findOne(Venda, {
                where: { veiculo: { id_veiculo: id } },
            });

            if (venda) {
                throw new ConflictException(
                    'Não é permitido excluir um veículo que possui registro de venda.',
                );
            }

            await manager.remove(Veiculo, veiculo);
            return { id_veiculo: id };
        });
    }
}
