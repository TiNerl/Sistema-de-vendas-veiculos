import { Body, Controller, Get, Param, ParseIntPipe, Post, Patch, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CriarVeiculoDto } from './dto/criar-veiculo.dto';
import { VeiculosService } from './veiculos.service';
import { AtualizarVeiculoDto } from './dto/atualizar-veiculo.dto';

@Controller('veiculos')
export class VeiculosController {
    constructor(private readonly veiculosService: VeiculosService) {}

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Get()
    listar() {
        return this.veiculosService.listar();
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Get(':id')
    buscarPorId(@Param('id', ParseIntPipe) id: number) {
        return this.veiculosService.buscarPorId(id);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Post()
    cadastrar(@Body() dto: CriarVeiculoDto) {
        return this.veiculosService.cadastrar(dto);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Patch(':id')
    atualizar(@Param('id', ParseIntPipe) id: number, @Body() dto: AtualizarVeiculoDto) {
        return this.veiculosService.atualizar(id, dto);
    }
}
