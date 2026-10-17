import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class AtualizarClienteDto {
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'O nome deve ter no mínimo 3 caracteres' })
  @MaxLength(100, { message: 'O nome deve ter no máximo 100 caracteres' })
  nome?: string;

  @IsOptional()
  @IsString()
  @MinLength(11, { message: 'O CPF deve ter exatamente 11 dígitos' })
  @MaxLength(11, { message: 'O CPF deve ter exatamente 11 dígitos' })
  cpf?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Formato de e-mail inválido' })
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(10, { message: 'O telefone deve ter no mínimo 10 dígitos' })
  @MaxLength(15, { message: 'O telefone deve ter no máximo 15 dígitos' })
  telefone?: string;

  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'O CEP deve ter exatamente 8 dígitos' })
  @MaxLength(8, { message: 'O CEP deve ter exatamente 8 dígitos' })
  cep?: string;

  @IsOptional()
  @IsString()
  @MinLength(5, { message: 'O endereço deve ter no mínimo 5 caracteres' })
  @MaxLength(150, { message: 'O endereço deve ter no máximo 150 caracteres' })
  endereco?: string;

  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'A cidade deve ter no mínimo 2 caracteres' })
  @MaxLength(50, { message: 'A cidade deve ter no máximo 50 caracteres' })
  cidade?: string;

  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'O estado deve ter exatamente 2 caracteres (ex: SP)' })
  @MaxLength(2, { message: 'O estado deve ter exatamente 2 caracteres (ex: SP)' })
  estado?: string;

  @IsOptional()
  @IsString()
  @MinLength(5, { message: 'O documento deve ter no mínimo 5 caracteres' })
  @MaxLength(20, { message: 'O documento deve ter no máximo 20 caracteres' })
  documento?: string;
}