import { Type } from 'class-transformer';
import {
    IsEnum,
    IsIn,
    IsInt,
    IsNumber,
    IsOptional,
    IsString,
    Max,
    MaxLength,
    Min,
} from 'class-validator';
import { StatusVeiculo } from '../veiculo-status.enum';

export class FiltrarVeiculosDto {
    @IsOptional()
    @IsString()
    @MaxLength(100)
    marca?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    modelo?: string;

    @IsOptional()
    @Type(() => Number)
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    precoMin?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    precoMax?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1886)
    @Max(2100)
    ano?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1886)
    @Max(2100)
    anoMin?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1886)
    @Max(2100)
    anoMax?: number;
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1886)
    @Max(2100)
    anoInicio?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1886)
    @Max(2100)
    anoFim?: number;

    @IsOptional()
    @IsString()
    @IsIn(['gasolina', 'etanol', 'flex', 'diesel', 'eletrico', 'hibrido'])
    combustivel?: string;

    @IsOptional()
    @IsEnum(StatusVeiculo)
    status?: StatusVeiculo;

}