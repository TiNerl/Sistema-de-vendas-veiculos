import { Controller, Post, Get, Req, Body, Query, UseGuards, Patch, Param, ParseIntPipe } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { VendasService } from './vendas.service';
import { CadastrarVendaDto } from './dto/cadastrar-venda.dto';
import { FiltrarVendasDto } from './dto/filtrar-vendas.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { Perfil } from '../usuarios/usuario.entity';

type RequisicaoAutenticada = {
    user: { id: number; perfil: Perfil };
}

@Controller('vendas')
export class VendasController {
    constructor(private readonly vendasService: VendasService) { }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'vendedor')
    @Post()
    cadastrar(@Body() dto: CadastrarVendaDto, @Req() request: RequisicaoAutenticada) {
        return this.vendasService.cadastrarVenda(dto, request.user);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'vendedor')
    @Get()
    findAll(@Query() dto: FiltrarVendasDto, @Req() request: RequisicaoAutenticada) {
        return this.vendasService.buscarTodas(dto, request.user);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'vendedor')
    @Get(':id')
    buscarPorId(
        @Param('id', ParseIntPipe) id: number,
        @Req() request: RequisicaoAutenticada,
    ) {
        return this.vendasService.buscarPorId(id, request.user);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Patch(':id/aprovar')
    aprovar(@Param('id', ParseIntPipe) id:number, @Req() request: RequisicaoAutenticada) {
        return this.vendasService.aprovar(id, request.user.id);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Patch(':id/rejeitar')
    rejeitar(@Param('id', ParseIntPipe) id:number, @Req() request: RequisicaoAutenticada) {
        return this.vendasService.rejeitar(id, request.user.id);
    }
}