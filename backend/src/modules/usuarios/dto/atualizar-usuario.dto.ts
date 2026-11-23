
import {
    IsString,
    IsNotEmpty,
    MinLength,
    MaxLength,
    IsOptional,
} from 'class-validator';

export class AtualizarUsuarioDto {
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    nome?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    @MaxLength(255)
    senha?: string;
}
