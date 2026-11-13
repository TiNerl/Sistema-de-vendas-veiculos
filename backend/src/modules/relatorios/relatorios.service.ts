import { Injectable, BadRequestException } from '@nestjs/common';
import { Venda } from '../vendas/venda.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FiltrarRelatorioFaturamentoDto } from './dto/filtrar-relatorio-faturamento.dto';
import { Veiculo } from '../veiculos/veiculo.entity';
import { StatusVeiculo } from '../veiculos/veiculo-status.enum';
import { Usuario } from '../usuarios/usuario.entity';
import { FiltrarRelatorioDesempenhoDto } from './dto/filtrar-relatorio-desempenho.dto';

type UsuarioRelatorio = {
    id: number,
    perfil: string,
}

@Injectable()
export class RelatoriosService {
    constructor(
        @InjectRepository(Venda) private readonly vendaRepository: Repository<Venda>,
        @InjectRepository(Veiculo) private readonly veiculoRepository: Repository<Veiculo>,
        @InjectRepository(Usuario) private readonly usuarioRepository: Repository<Usuario>,
    ) { }

    async gerarRelatorioFaturamento(filtro: FiltrarRelatorioFaturamentoDto) {

        if (filtro.dataInicio && filtro.dataFim && filtro.dataInicio > filtro.dataFim) {
            throw new BadRequestException('A data inicial não pode ser posterior à data final');
        }

        const query = this.vendaRepository
            .createQueryBuilder('venda')
            .where('venda.status = :status', { status: 'concluida' });

        if (filtro.dataInicio) {
            query.andWhere('venda.data_venda >= :dataInicio', {
                dataInicio: filtro.dataInicio,
            });
        }

        if (filtro.dataFim) {
            query.andWhere('venda.data_venda < (:dataFim::date + INTERVAL \'1 day\')',
                { dataFim: filtro.dataFim },
            );
        }

        const relatorio = await query
            .select('EXTRACT(YEAR FROM venda.data_venda)', 'ano')
            .addSelect('EXTRACT(MONTH FROM venda.data_venda)', 'mes')
            .addSelect('COUNT(venda.id_venda)', 'quantidade_vendas')
            .addSelect('SUM(venda.valor_final)', 'faturamento_total')
            .groupBy('ano')
            .addGroupBy('mes')
            .orderBy('ano', 'ASC')
            .addOrderBy('mes', 'ASC')
            .getRawMany();

        return relatorio;
    }

    async gerarRelatorioEstoque() {
        const totais = await this.veiculoRepository
            .createQueryBuilder('veiculo')
            .select('veiculo.status', 'status')
            .addSelect('COUNT(veiculo.id_veiculo)', 'quantidade_veiculos')
            .addSelect('SUM(veiculo.preco)', 'valor_total')
            .groupBy('veiculo.status')
            .getRawMany<{
                status: StatusVeiculo;
                quantidade_veiculos: string;
                valor_total: string;
            }>();

        const totaisPorStatus = new Map(totais.map((total) => [total.status, total]));

        return Object.values(StatusVeiculo).map((status) => {
            const total = totaisPorStatus.get(status);

            return {
                status,
                quantidade_veiculos: Number(total?.quantidade_veiculos ?? 0),
                valor_total: Number(total?.valor_total ?? 0),
            };
        });
    }

    async gerarRelatorioDesempenhoVendedores(filtro: FiltrarRelatorioDesempenhoDto, usuario: UsuarioRelatorio) {

        if (filtro.dataInicio && filtro.dataFim && filtro.dataInicio > filtro.dataFim) {
            throw new BadRequestException('A data inicial não pode ser posterior à data final');
        }

        const query = this.usuarioRepository
            .createQueryBuilder('usuario')
            .leftJoin(Venda, 'venda', 'venda.id_usuario = usuario.id_usuario AND venda.status = :status',
            { status: 'concluida' })
            .where('usuario.perfil = :perfil', { perfil: 'vendedor' });
            
        if (usuario.perfil === 'vendedor') {
            query.andWhere('usuario.id_usuario = :id_usuario', {
                id_usuario: usuario.id,
            });
        } else if (filtro.id_usuario) {
            query.andWhere('usuario.id_usuario = :id_usuario', {
                id_usuario: filtro.id_usuario,
            });
        }

        if (filtro.dataInicio) {
            query.andWhere('venda.data_venda >= :dataInicio', {
                dataInicio: filtro.dataInicio,
            });
        }

        if (filtro.dataFim) {
            query.andWhere('venda.data_venda < (:dataFim::date + INTERVAL \'1 day\')',
                { dataFim: filtro.dataFim },
            );
        }
        const relatorio = await query
            .select('usuario.id_usuario', 'id_usuario')
            .addSelect('usuario.nome', 'nome_usuario')
            .addSelect('COUNT(venda.id_venda)', 'quantidade_vendas')
            .addSelect('COALESCE(SUM(venda.valor_final), 0)', 'faturamento_total')
            .addSelect('COALESCE(SUM(venda.valor_comissao), 0)', 'comissao_total')
            .groupBy('usuario.id_usuario')
            .addGroupBy('usuario.nome')
            .orderBy('quantidade_vendas', 'DESC')
            .getRawMany();

        return relatorio;
    }
}
