import { Controller, Get, Post, Patch, Param, ParseIntPipe, UseGuards, Body, Query } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ClientesService } from './clientes.service';
import { CriarClienteDto } from './dto/criar-cliente.dto';
import { AtualizarClienteDto } from './dto/atualizar-cliente.dto';

@Controller('clientes')
export class ClientesController {
    constructor(private readonly clientesService: ClientesService) { }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'vendedor')
    @Post()
    cadastrar(@Body() dto: CriarClienteDto) {
        return this.clientesService.cadastrar(dto);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'vendedor')
    @Patch(':id/inativar')
    inativar(@Param('id', ParseIntPipe) id: number) {
        return this.clientesService.inativar(id);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'vendedor')
    @Get()
    findAll(@Query('busca') busca?: string) {
        return this.clientesService.findAll(busca);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'vendedor')
    @Get(':id')
    buscarPorId(@Param('id', ParseIntPipe) id: number) {
        return this.clientesService.buscarPorId(id);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'vendedor')
    @Patch(':id')
    atualizar(@Param('id', ParseIntPipe) id: number, @Body() dto: AtualizarClienteDto) {
        return this.clientesService.atualizar(id, dto);
    }
}