import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({ usernameField: 'cpf', passwordField: 'senha' });
  }

  async validate(cpf: string, senha: string) {
    const usuario = await this.authService.validarUsuario(cpf, senha);

    if (!usuario) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    return usuario;
  }
}