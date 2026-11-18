import { IsEmail, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import type { Perfil } from '../usuario.entity';

export class AtualizarUsuarioDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  nome?: string;

  @IsOptional()
  @IsString()
  @MinLength(11)
  @MaxLength(11)
  cpf?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Formato de e-mail inválido' })
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @IsIn(['admin', 'vendedor'])
  perfil?: Perfil;
}
