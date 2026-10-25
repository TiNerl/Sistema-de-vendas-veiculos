import { Transform } from 'class-transformer';
import {
    IsIn,
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Matches,
    Max,
    MaxLength,
    Min,
} from 'class-validator';

export class AtualizarVeiculoDto {
    @IsOptional()
    @IsString()
    @MaxLength(100)
    marca?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    modelo?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    versao?: string;

    @IsOptional()
    @IsInt()
    @Min(1886)
    @Max(2100)
    ano?: number;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    cor?: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(2000000)
    quilometragem?: number;

    @IsOptional()
    @IsString()
    @IsIn(['gasolina', 'etanol', 'flex', 'diesel', 'eletrico', 'hibrido'])
    combustivel?: string;

    @IsOptional()
    @IsString()
    @IsIn(['manual', 'automatico', 'cvt', 'automatizado'])
    cambio?: string;

    @IsOptional()
    @Transform(({ value }) =>
        typeof value === 'string' ? value.replace(/-/g, '').trim().toUpperCase() : value,
    )
    @IsString()
    @Matches(/^[A-Z]{3}\d[A-Z0-9]\d{2}$/)
    placa?: string;

    @IsOptional()
    @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
    @IsString()
    @Matches(/^[A-HJ-NPR-Z0-9]{17}$/)
    chassi?: string;

    @IsOptional()
    @IsString()
    @Matches(/^\d{11}$/)
    renavam?: string;

    @IsOptional()
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0.01)
    @Max(9999999999.99)
    preco?: number;
}
