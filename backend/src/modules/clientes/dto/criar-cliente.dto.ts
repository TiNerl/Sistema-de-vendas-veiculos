import { IsString, IsNotEmpty, IsEmail, MinLength, MaxLength } from 'class-validator';

export class CriarClienteDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(150)
  nome: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(11)
  @MaxLength(11)
  cpf: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(11)
  telefone: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(8)
  cep: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  endereco: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  cidade: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(2)
  estado: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(14)
  documento: string;
}