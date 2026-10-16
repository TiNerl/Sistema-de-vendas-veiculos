import {
    Body,
    Controller,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Put,
    UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AtualizarStatusVeiculoDto } from './dto/atualizar-status-veiculo.dto';
import { CriarVeiculoDto } from './dto/criar-veiculo.dto';
import { VeiculosService } from './veiculos.service';

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
    @Put(':id')
    atualizar(@Param('id', ParseIntPipe) id: number, @Body() dto: CriarVeiculoDto) {
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
