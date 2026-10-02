import { IsString, IsNotEmpty, MinLength, MaxLength, IsIn } from 'class-validator';

import type { Perfil } from '../usuario.entity';

export class CriarUsuarioDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nome: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(14)
  cpf: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(255)
  senha: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @IsIn(['admin', 'funcionario'])
  perfil: Perfil;
}