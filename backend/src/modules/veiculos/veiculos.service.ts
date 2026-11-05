import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Not, Repository } from 'typeorm';
import { Venda } from '../vendas/venda.entity';
import { ConfiguracaoEstoque } from './configuracao-estoque.entity';
import { CriarVeiculoDto } from './dto/criar-veiculo.dto';
import { Veiculo } from './veiculo.entity';
import { StatusVeiculo } from './veiculo-status.enum';
import { AtualizarVeiculoDto } from './dto/atualizar-veiculo.dto';
import { ListarVeiculosDto } from './dto/listar-veiculos.dto';

@Injectable()
export class VeiculosService {
    constructor(
        @InjectRepository(Veiculo)
        private readonly repository: Repository<Veiculo>,
        @InjectRepository(ConfiguracaoEstoque)
        private readonly configuracaoRepository: Repository<ConfiguracaoEstoque>,
        private readonly dataSource: DataSource,
    ) { }

    private readonly QUANTIDADE_MINIMA_PADRAO = 10;

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

    listar(filtros: ListarVeiculosDto = {}) {
        if (filtros.precoMin !== undefined && filtros.precoMax !== undefined && filtros.precoMin > filtros.precoMax) {
            throw new BadRequestException('O preço mínimo não pode ser maior que o preço máximo');
        }

        if (filtros.anoMin !== undefined && filtros.anoMax !== undefined && filtros.anoMin > filtros.anoMax) {
            throw new BadRequestException('O ano inicial não pode ser maior que o ano final');
        }

        const consulta = this.repository.createQueryBuilder('veiculo')
            .select([
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

        if (filtros.marca?.trim()) {
            consulta.andWhere('LOWER(veiculo.marca) = LOWER(:marca)', { marca: filtros.marca.trim() });
        }

        if (filtros.modelo?.trim()) {
            consulta.andWhere('veiculo.modelo ILIKE :modelo', { modelo: `%${filtros.modelo.trim()}%` });
        }

        if (filtros.precoMin !== undefined) {
            consulta.andWhere('veiculo.preco >= :precoMin', { precoMin: filtros.precoMin });
        }

        if (filtros.precoMax !== undefined) {
            consulta.andWhere('veiculo.preco <= :precoMax', { precoMax: filtros.precoMax });
        }

        if (filtros.anoMin !== undefined) {
            consulta.andWhere('veiculo.ano >= :anoMin', { anoMin: filtros.anoMin });
        }

        if (filtros.anoMax !== undefined) {
            consulta.andWhere('veiculo.ano <= :anoMax', { anoMax: filtros.anoMax });
        }

        if (filtros.combustivel) {
            consulta.andWhere('veiculo.combustivel = :combustivel', { combustivel: filtros.combustivel });
        }

        if (filtros.status) {
            consulta.andWhere('veiculo.status = :status', { status: filtros.status });
        }

        return consulta.orderBy('veiculo.id_veiculo', 'DESC').getMany();
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

    async obterResumoEstoque() {
        const [quantidadeDisponivel, configuracao] = await Promise.all([
            this.repository.count({ where: { status: StatusVeiculo.DISPONIVEL } }),
            this.configuracaoRepository.findOneBy({ id: 1 }),
        ]);
        const quantidadeMinima =
            configuracao?.quantidade_minima ?? this.QUANTIDADE_MINIMA_PADRAO;

        return {
            quantidadeDisponivel,
            quantidadeMinima,
            abaixoDoMinimo: quantidadeDisponivel < quantidadeMinima,
        };
    }

    async atualizarMinimoEstoque(quantidadeMinima: number) {
        await this.configuracaoRepository.upsert(
            { id: 1, quantidade_minima: quantidadeMinima },
            ['id'],
        );

        return this.obterResumoEstoque();
    }
}
