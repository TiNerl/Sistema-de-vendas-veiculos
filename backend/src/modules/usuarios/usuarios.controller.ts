import { Controller, Get, Post, Param, ParseIntPipe, Body, UseGuards } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { CriarUsuarioDto } from './dto/criar-usuario.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';


@Controller('usuarios')
export class UsuariosController {
    constructor(private readonly usuariosService: UsuariosService) { }

    @Get()
    listar() {
        return this.usuariosService.listar();
    }
    @Get(':id')
    buscarPorId(@Param('id', ParseIntPipe) id: number) {
        return this.usuariosService.buscarPorId(id);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Post()
    cadastrar(@Body() dto: CriarUsuarioDto) {
        return this.usuariosService.cadastrar(dto);
    }
}