import { Injectable, BadRequestException } from '@nestjs/common';
import { Venda } from '../vendas/venda.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FiltrarRelatorioFaturamentoDto } from './dto/filtrar-relatorio-faturamento.dto';

@Injectable()
export class RelatoriosService {
    constructor(@InjectRepository(Venda) private readonly vendaRepository: Repository<Venda>) { }

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
}
