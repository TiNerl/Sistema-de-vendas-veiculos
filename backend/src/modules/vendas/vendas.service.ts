import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Venda } from './venda.entity';
import { Cliente } from '../clientes/cliente.entity';
import { Usuario } from '../usuarios/usuario.entity';
import { Veiculo } from '../veiculos/veiculo.entity';
import { CadastrarVendaDto } from './dto/cadastrar-venda.dto';
import { FiltrarVendasDto } from './dto/filtrar-vendas.dto';
import { StatusVeiculo } from '../veiculos/veiculo-status.enum';
import type { StatusVenda } from './venda.entity';

@Injectable()
export class VendasService {
    constructor(
        @InjectRepository(Venda) private readonly repository: Repository<Venda>,
        private readonly dataSource: DataSource
    ) { }

    private readonly PERCENTUAL_COMISSAO = 3;

    async cadastrarVenda(dto: CadastrarVendaDto, id_usuario: number) {
        return this.dataSource.transaction(async (manager) => {
            const cliente = await manager.findOneBy(Cliente, {
                id_cliente: dto.id_cliente,
            });

            const veiculo = await manager.findOneBy(Veiculo, {
                id_veiculo: dto.id_veiculo,
            });

            const usuario = await manager.findOneBy(Usuario, {
                id_usuario: id_usuario,
            });

            if (!usuario) {
                throw new NotFoundException('Usuário não encontrado');
            }

            if (!cliente) {
                throw new NotFoundException('Cliente não encontrado');
            }

            if (!cliente.ativo) {
                throw new ConflictException('Cliente não está ativo');
            }

            if (!veiculo) {
                throw new NotFoundException('Veículo não cadastrado no estoque');
            }

            if (veiculo.status !== StatusVeiculo.DISPONIVEL) {
                throw new ConflictException('O veículo não está disponível em estoque');
            }

            const percentualDesconto = dto.percentual_desconto ?? 0;

            const precisaAprovacao = usuario.perfil === 'vendedor' && percentualDesconto > 10;

            const statusVenda: StatusVenda = precisaAprovacao ? 'pendente' : 'concluida';
            const statusVeiculo: StatusVeiculo = precisaAprovacao ? StatusVeiculo.RESERVADO : StatusVeiculo.VENDIDO;

            const valorDesconto = (percentualDesconto / 100) * Number(veiculo.preco);
            const valorFinal = Number(veiculo.preco) - valorDesconto;
            const valorComissao = (this.PERCENTUAL_COMISSAO / 100) * valorFinal;

            const venda = manager.create(Venda, {
                usuario: usuario,
                cliente: cliente,
                veiculo: veiculo,
                valor_veiculo: veiculo.preco,
                percentual_desconto: percentualDesconto.toFixed(2),
                valor_desconto: valorDesconto.toFixed(2),
                valor_final: valorFinal.toFixed(2),
                forma_pagamento: dto.forma_pagamento,
                percentual_comissao: this.PERCENTUAL_COMISSAO.toFixed(2),
                valor_comissao: valorComissao.toFixed(2),
                status: statusVenda
            });

            const vendaSalva = await manager.save(Venda, venda);

            const resultado = await manager
                .createQueryBuilder()
                .update(Veiculo)
                .set({ status: statusVeiculo })
                .where('id_veiculo = :id', {
                    id: veiculo.id_veiculo,
                })
                .andWhere('status = :status', {
                    status: StatusVeiculo.DISPONIVEL,
                })
                .execute();

            if (resultado.affected !== 1) {
                throw new ConflictException('O veículo não está mais disponível para venda');
            }

            veiculo.status = statusVeiculo;
            vendaSalva.veiculo.status = statusVeiculo;

            return manager.findOneOrFail(Venda, {
                where: { id_venda: vendaSalva.id_venda },
                relations: {
                    cliente: true,
                    veiculo: true,
                    usuario: true,
                },
            });
        });
    }

    async buscarTodas(
        dto: FiltrarVendasDto,
        usuario?: { id: number; perfil: string },
    ): Promise<Venda[]> {
        const { cliente_id, dataInicio, dataFim } = dto;

        // Regra de Negócio: Data inicial não pode ser posterior à data final
        if (dataInicio && dataFim && new Date(dataInicio) > new Date(dataFim)) {
            throw new BadRequestException('A data inicial não pode ser posterior à data final');
        }

        const query = this.repository.createQueryBuilder('venda')
            .leftJoinAndSelect('venda.cliente', 'cliente')
            .leftJoinAndSelect('venda.veiculo', 'veiculo')
            .leftJoinAndSelect('venda.usuario', 'usuario');

        if (usuario?.perfil === 'vendedor') {
            query.andWhere('usuario.id_usuario = :usuarioId', {
                usuarioId: usuario.id,
            });
        }

        if (cliente_id !== undefined) {
            query.andWhere('cliente.id_cliente = :cliente_id', { cliente_id });
        }

        if (dataInicio) {
            const inicio = new Date(dataInicio);
            query.andWhere('venda.data_venda >= :inicio', { inicio });
        }

        if (dataFim) {
            const fim = new Date(dataFim);
            fim.setUTCHours(23, 59, 59, 999);
            query.andWhere('venda.data_venda <= :fim', { fim });
        }

        return await query.orderBy('venda.data_venda', 'DESC').getMany();
    }

    async buscarPorId(
        id: number,
        usuario?: { id: number; perfil: string },
    ): Promise<Venda> {
        const where = usuario?.perfil === 'vendedor'
            ? { id_venda: id, usuario: { id_usuario: usuario.id } }
            : { id_venda: id };

        const venda = await this.repository.findOne({
            where,
            relations: {
                cliente: true,
                veiculo: true,
                usuario: true,
            },
        });

        if (!venda) {
            throw new NotFoundException('Venda não encontrada');
        }

        return venda;
    }

    async aprovar(id: number) {
        return this.dataSource.transaction(async (manager) => {
            const venda = await manager.findOne(Venda, {
                where: {
                    id_venda: id,
                    status: 'pendente',
                },
                relations: {
                    cliente: true,
                    veiculo: true,
                    usuario: true,
                },
            });

            if (!venda) {
                throw new NotFoundException('Venda pendente não encontrada')
            }

            const resultadoVenda = await manager
                .createQueryBuilder()
                .update(Venda)
                .set({ status: 'concluida' })
                .where('id_venda = :id', {
                    id: venda.id_venda,
                })
                .andWhere('status = :status', {
                    status: 'pendente'
                })
                .execute();

            if (resultadoVenda.affected !== 1) {
                throw new ConflictException('A venda não está mais pendente de aprovação');
            }

            const resultadoVeiculo = await manager
                .createQueryBuilder()
                .update(Veiculo)
                .set({ status: StatusVeiculo.VENDIDO })
                .where('id_veiculo = :id', {
                    id: venda.veiculo.id_veiculo,
                })
                .andWhere('status = :status', {
                    status: StatusVeiculo.RESERVADO,
                })
                .execute();

            if (resultadoVeiculo.affected !== 1) {
                throw new ConflictException('O veículo não está mais reservado');
            }

            return manager.findOneOrFail(Venda, {
                where: {
                    id_venda: venda.id_venda,
                },
                relations: {
                    cliente: true,
                    veiculo: true,
                    usuario: true,
                },
            });
        });
    }

    async rejeitar(id: number) {
        return this.dataSource.transaction(async (manager) => {
            const venda = await manager.findOne(Venda, {
                where: {
                    id_venda: id,
                    status: 'pendente',
                },
                relations: {
                    cliente: true,
                    veiculo: true,
                    usuario: true,
                },
            });

            if (!venda) {
                throw new NotFoundException('Venda pendente não encontrada')
            }

            const resultadoVenda = await manager
                .createQueryBuilder()
                .update(Venda)
                .set({ status: 'cancelada' })
                .where('id_venda = :id', {
                    id: venda.id_venda,
                })
                .andWhere('status = :status', {
                    status: 'pendente'
                })
                .execute();

            if (resultadoVenda.affected !== 1) {
                throw new ConflictException('A venda não está mais pendente de aprovação');
            }

            const resultadoVeiculo = await manager
                .createQueryBuilder()
                .update(Veiculo)
                .set({ status: StatusVeiculo.DISPONIVEL })
                .where('id_veiculo = :id', {
                    id: venda.veiculo.id_veiculo,
                })
                .andWhere('status = :status', {
                    status: StatusVeiculo.RESERVADO,
                })
                .execute();

            if (resultadoVeiculo.affected !== 1) {
                throw new ConflictException('O veículo não está mais reservado');
            }

            return manager.findOneOrFail(Venda, {
                where: {
                    id_venda: venda.id_venda,
                },
                relations: {
                    cliente: true,
                    veiculo: true,
                    usuario: true,
                },
            });
        });
    }
}