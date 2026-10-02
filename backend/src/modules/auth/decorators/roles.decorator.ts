import { SetMetadata } from '@nestjs/common';
import { Perfil } from '../../usuarios/usuario.entity';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Perfil[]) => SetMetadata(ROLES_KEY, roles);