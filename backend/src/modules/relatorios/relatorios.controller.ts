import { Controller, Get, Header, Query, UseGuards, Req } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RelatoriosService } from './relatorios.service';
import { FiltrarRelatorioFaturamentoDto } from './dto/filtrar-relatorio-faturamento.dto';
import { FiltrarRelatorioDesempenhoDto } from './dto/filtrar-relatorio-desempenho.dto';

type RequisicaoAutenticada = {
    user: {
        id: number;
        perfil: string;
    }
};

@Controller('relatorios')
export class RelatoriosController {
    constructor(private readonly relatoriosService: RelatoriosService) { }

    @UseGuards(JwtAuthGuard, RolesGuard)
        @Roles('admin', 'vendedor')
        @Get('faturamento')
        gerarRelatorioFaturamento(@Query() filtro: FiltrarRelatorioFaturamentoDto) {
            return this.relatoriosService.gerarRelatorioFaturamento(filtro);
        }

        @UseGuards(JwtAuthGuard, RolesGuard)
        @Roles('admin', 'vendedor')
        @Get('faturamento/csv')
        @Header('Content-Type', 'text/csv; charset=utf-8')
        @Header('Content-Disposition', 'attachment; filename="faturamento.csv"')
        exportarRelatorioFaturamentoCsv(
            @Query() filtro: FiltrarRelatorioFaturamentoDto,
        ) {
            return this.relatoriosService.exportarRelatorioFaturamentoCsv(filtro);
        }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'vendedor')
    @Get('estoque')
    gerarRelatorioEstoque() {
        return this.relatoriosService.gerarRelatorioEstoque();
    }

        @UseGuards(JwtAuthGuard, RolesGuard)
        @Roles('admin', 'vendedor')
        @Get('estoque/csv')
        @Header('Content-Type', 'text/csv; charset=utf-8')
        @Header('Content-Disposition', 'attachment; filename="estoque.csv"')
        exportarRelatorioEstoqueCsv() {
            return this.relatoriosService.exportarRelatorioEstoqueCsv();
        }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'vendedor')
    @Get('desempenho-vendedores')
    gerarRelatorioDesempenhoVendedores(@Query() filtro: FiltrarRelatorioDesempenhoDto, @Req() request: RequisicaoAutenticada) {
        return this.relatoriosService.gerarRelatorioDesempenhoVendedores(filtro, request.user);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'vendedor')
    @Get('desempenho-vendedores/csv')
    @Header('Content-Type', 'text/csv; charset=utf-8')
    @Header('Content-Disposition', 'attachment; filename="desempenho-vendedores.csv"')
    exportarRelatorioDesempenhoVendedoresCsv(
        @Query() filtro: FiltrarRelatorioDesempenhoDto,
        @Req() request: RequisicaoAutenticada,
    ) {
        return this.relatoriosService.exportarRelatorioDesempenhoVendedoresCsv(filtro, request.user);
    }
}
