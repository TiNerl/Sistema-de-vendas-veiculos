import { Injectable } from '@nestjs/common';
import { UsuariosService, UsuarioAutenticado } from '../usuarios/usuarios.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private readonly usuariosService: UsuariosService, private readonly jwtService: JwtService) {}

  async validarUsuario(cpf: string, senha: string) {
    const usuario = await this.usuariosService.buscarParaLogin(cpf);
    if (!usuario || !usuario.ativo) {
        return null;
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha);

    if (!senhaValida) {
      return null;
    }

    const { senha: _senha, ...principal } = usuario;
    return principal;
  }

  login(usuario: UsuarioAutenticado) {
    const payload = {
      sub: usuario.id_usuario,
      email: usuario.cpf,
      perfil: usuario.perfil,
    };

    return {
      accessToken: this.jwtService.sign(payload),
    };
  }
}