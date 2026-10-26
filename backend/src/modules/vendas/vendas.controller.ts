import { Controller, Post, Req, Body, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { VendasService } from './vendas.service';
import { CadastrarVendaDto } from './dto/cadastrar-venda.dto';
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
}
