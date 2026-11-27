import 'reflect-metadata'
import { IsCPF } from 'cpf-cnpj-validator/class-validator'
import { IsNotEmpty, IsString, MinLength } from 'class-validator'

export class LoginDto {
    @IsCPF()
    @IsNotEmpty()
    cpf: string

    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    senha: string
}