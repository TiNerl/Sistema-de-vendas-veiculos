import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AtualizarStatusVeiculoDto } from './dto/atualizar-status-veiculo.dto';
import { CriarVeiculoDto } from './dto/criar-veiculo.dto';
import { VeiculosService } from './veiculos.service';
import { AtualizarVeiculoDto } from './dto/atualizar-veiculo.dto';
import { FiltrarVeiculosDto } from './dto/filtrar-veiculos.dto';

@Controller('veiculos')
export class VeiculosController {
    constructor(private readonly veiculosService: VeiculosService) { }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'vendedor')
    @Get()
    listar(@Query() dto: FiltrarVeiculosDto) {
        return this.veiculosService.listar(dto);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'vendedor')
    @Get(':id')
    buscarPorId(@Param('id', ParseIntPipe) id: number) {
        return this.veiculosService.buscarPorId(id);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'vendedor')
    @Post()
    cadastrar(@Body() dto: CriarVeiculoDto) {
        return this.veiculosService.cadastrar(dto);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'vendedor')
    @Patch(':id')
    atualizar(@Param('id', ParseIntPipe) id: number, @Body() dto: AtualizarVeiculoDto) {
        return this.veiculosService.atualizar(id, dto);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Patch(':id/status')
    atualizarStatus(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: AtualizarStatusVeiculoDto,
    ) {
        return this.veiculosService.atualizarStatus(id, dto.status);
    }
}
