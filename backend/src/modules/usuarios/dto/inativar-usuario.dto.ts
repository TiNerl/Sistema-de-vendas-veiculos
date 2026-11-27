import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { IsCPF } from 'cpf-cnpj-validator/class-validator'

export class InativarUsuarioDto {
    @IsCPF({ message: 'Formato de CPF inválido' })
    @IsString()
    @IsNotEmpty()
    @MinLength(11)
    @MaxLength(11)
    cpf: string;
}