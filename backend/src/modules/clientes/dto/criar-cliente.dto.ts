import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CriarClienteDto {
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  @IsString()
  nome: string;

  @IsNotEmpty({ message: 'O CPF é obrigatório' })
  @IsString()
  cpf: string;

  @IsNotEmpty({ message: 'O e-mail é obrigatório' })
  @IsEmail({}, { message: 'Formato de e-mail inválido' })
  email: string;

  @IsOptional()
  @IsString()
  telefone?: string;

  @IsOptional()
  @IsString()
  cep?: string;

  @IsOptional()
  @IsString()
  endereco?: string;

  @IsOptional()
  @IsString()
  cidade?: string;

  @IsOptional()
  @IsString()
  estado?: string;

  @IsOptional()
  @IsString()
  documento?: string;
}