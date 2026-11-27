import { Controller, Get, Post, Param, ParseIntPipe, Body, UseGuards, Patch, Req } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { CriarUsuarioDto } from './dto/criar-usuario.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { InativarUsuarioDto } from './dto/inativar-usuario.dto';
import { AtualizarUsuarioDto } from './dto/atualizar-usuario.dto';
import { Perfil } from './usuario.entity';

type RequisicaoAutenticada = {
    user: { id: number; perfil: Perfil };
}

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
    cadastrar(@Body() dto: CriarUsuarioDto, @Req()request: RequisicaoAutenticada) {
        return this.usuariosService.cadastrar(dto, request.user.id);
    }


    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Patch(':id')
    atualizar(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: AtualizarUsuarioDto,
    ) {
        return this.usuariosService.atualizar(id, dto);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Patch(':id/inativar')
    inativar(@Param('id', ParseIntPipe) id: number, @Body() dto: InativarUsuarioDto, @Req() request: RequisicaoAutenticada) {
        return this.usuariosService.inativar(dto, id, request.user.id);
    }
}