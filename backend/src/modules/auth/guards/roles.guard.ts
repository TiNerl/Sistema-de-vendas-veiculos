import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Perfil } from '../../usuarios/usuario.entity';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const perfisExigidos = this.reflector.getAllAndOverride<Perfil[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!perfisExigidos?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    return perfisExigidos.includes(request.user?.perfil);
  }
}