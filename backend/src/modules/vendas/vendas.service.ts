import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Venda } from './venda.entity'
import { Cliente } from '../clientes/cliente.entity';
import { Usuario } from '../usuarios/usuario.entity';
import { Veiculo } from '../veiculos/veiculo.entity';
import { CadastrarVendaDto } from './dto/cadastrar-venda.dto';
import { StatusVeiculo } from '../veiculos/veiculo-status.enum';

@Injectable()
export class VendasService {
    constructor(@InjectRepository(Venda) private readonly repository: Repository<Venda>,
        private readonly dataSource: DataSource) { }

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
                throw new NotFoundException('Usuário não encontrado')
            }

            if (!cliente) {
                throw new NotFoundException('Cliente não encontrado')
            }

            if (!cliente.ativo) {
                throw new ConflictException('Cliente não está ativo')
            }

            if (!veiculo) {
                throw new NotFoundException('Veículo não cadastrado no estoque')
            }

            if (veiculo.status !== StatusVeiculo.DISPONIVEL) {
                throw new ConflictException('O veículo não está disponível em estoque')
            }

            const percentualDesconto = dto.percentual_desconto ?? 0;

            const valorDesconto = (percentualDesconto / 100) * Number(veiculo.preco);

            const valorFinal = Number(veiculo.preco) - valorDesconto;

            const valorComissao = (this.PERCENTUAL_COMISSAO / 100) * valorFinal;

            const venda = this.repository.create({
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
                status: 'concluida'
            })

            const vendaSalva = await manager.save(Venda, venda);

            const resultado = await manager
                .createQueryBuilder()
                .update(Veiculo)
                .set({ status: StatusVeiculo.VENDIDO })
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

            veiculo.status = StatusVeiculo.VENDIDO;
            vendaSalva.veiculo.status = StatusVeiculo.VENDIDO;

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
}

