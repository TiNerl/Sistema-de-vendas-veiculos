
import {
    IsString,
    IsNotEmpty,
    MinLength,
    MaxLength,
    ValidateIf,
} from 'class-validator';

export class AtualizarUsuarioDto {
    @ValidateIf((_object, value) => value !== undefined)
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    nome?: string;

    @ValidateIf((_object, value) => value !== undefined)
    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    @MaxLength(255)
    senha?: string;
}
