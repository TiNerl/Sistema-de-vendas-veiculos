import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RelatoriosService } from './relatorios.service';
import { FiltrarRelatorioFaturamentoDto } from './dto/filtrar-relatorio-faturamento.dto';

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
    @Get('estoque')
    gerarRelatorioEstoque() {
        return this.relatoriosService.gerarRelatorioEstoque();
    }
}
