import { Controller, Get, Post, Param, ParseIntPipe, Body, UseGuards, Patch } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { CriarUsuarioDto } from './dto/criar-usuario.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { InativarUsuarioDto } from './dto/inativar-usuario.dto';


@Controller('usuarios')
export class UsuariosController {
    constructor(private readonly usuariosService: UsuariosService) { }

   @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Get()
    listar() {
        return this.usuariosService.listar();
    }
    
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
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

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Patch(':id/inativar')
    inativar(@Param('id', ParseIntPipe) id: number, @Body() dto: InativarUsuarioDto) {
        return this.usuariosService.inativar(dto, id);
    }
}