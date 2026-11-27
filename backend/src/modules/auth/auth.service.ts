import { Injectable } from '@nestjs/common';
import { UsuariosService, UsuarioAutenticado } from '../usuarios/usuarios.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login-dto.dto';

@Injectable()
export class AuthService {
  constructor(private readonly usuariosService: UsuariosService, private readonly jwtService: JwtService) {}

  async validarUsuario(dto: LoginDto) {
    const usuario = await this.usuariosService.buscarParaLogin(dto.cpf);
    if (!usuario || !usuario.ativo) {
        return null;
    }

    const senhaValida = await bcrypt.compare(dto.senha, usuario.senha);

    if (!senhaValida) {
      return null;
    }

    const { senha: _senha, ...principal } = usuario;
    return principal;
  }

  login(usuario: UsuarioAutenticado) {
    const payload = {
      sub: usuario.id_usuario,
      cpf: usuario.cpf,
      perfil: usuario.perfil,
      nome: usuario.nome,
    };

    return {
      accessToken: this.jwtService.sign(payload),
    };
  }
}