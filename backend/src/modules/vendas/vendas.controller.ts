import {
    Body,
    Controller,
    Get,
    Param,
    ParseIntPipe,
    Post,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { VendasService } from './vendas.service';
import { CadastrarVendaDto } from './dto/cadastrar-venda.dto';
import { FiltrarVendasDto } from './dto/filtrar-vendas.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

type RequisicaoAutenticada = {
    user: { id: number; perfil: string };
}

@Controller('vendas')
export class VendasController {
    constructor(private readonly vendasService: VendasService) { }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'vendedor')
    @Post()
    cadastrar(@Body() dto: CadastrarVendaDto, @Req() request: RequisicaoAutenticada) {
        return this.vendasService.cadastrarVenda(dto, request.user.id);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'vendedor')
    @Get()
    findAll(@Query() dto: FiltrarVendasDto) {
        return this.vendasService.buscarTodas(dto);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'vendedor')
    @Get(':id')
    buscarPorId(@Param('id', ParseIntPipe) id: number) {
        return this.vendasService.buscarPorId(id);
    }
}