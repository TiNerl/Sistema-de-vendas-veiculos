import { IsString, IsNotEmpty, MinLength, MaxLength, IsIn } from 'class-validator';
import { IsCPF } from 'cpf-cnpj-validator/class-validator'

import type { Perfil } from '../usuario.entity';

export class CriarUsuarioDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nome: string;

  @IsCPF({ message: 'Formato de CPF inválido' })
  @IsString()
  @IsNotEmpty()
  @MinLength(11)
  @MaxLength(11)
  cpf: string;

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