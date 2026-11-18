import { IsString, IsNotEmpty, MinLength, MaxLength, IsIn, IsEmail } from 'class-validator';

import type { Perfil } from '../usuario.entity';

export class CriarUsuarioDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nome: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(11)
  @MaxLength(11)
  cpf: string;

  @IsEmail({}, { message: 'Formato de e-mail inválido' })
  @IsNotEmpty()
  @MaxLength(255)
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(255)
  senha: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['admin', 'vendedor'])
  perfil: Perfil;
}