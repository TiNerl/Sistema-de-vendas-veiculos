import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class InativarUsuarioDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(11)
    @MaxLength(11)
    cpf: string;
}