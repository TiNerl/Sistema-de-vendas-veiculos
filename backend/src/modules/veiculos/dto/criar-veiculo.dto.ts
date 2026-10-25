import { Transform } from 'class-transformer';
import {
    IsIn,
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsString,
    Matches,
    Max,
    MaxLength,
    Min,
} from 'class-validator';

export class CriarVeiculoDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    marca: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    modelo: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    versao: string;

    @IsInt()
    @Min(1886)
    @Max(2100)
    ano: number;

    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    cor: string;

    @IsInt()
    @Min(0)
    @Max(2000000)
    quilometragem: number;

    @IsString()
    @IsIn(['gasolina', 'etanol', 'flex', 'diesel', 'eletrico', 'hibrido'])
    combustivel: string;

    @IsString()
    @IsIn(['manual', 'automatico', 'cvt', 'automatizado'])
    cambio: string;

    @Transform(({ value }) =>
        typeof value === 'string' ? value.replace(/-/g, '').trim().toUpperCase() : value,
    )
    @IsString()
    @Matches(/^[A-Z]{3}\d[A-Z0-9]\d{2}$/)
    placa: string;

    @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
    @IsString()
    @Matches(/^[A-HJ-NPR-Z0-9]{17}$/)
    chassi: string;

    @IsString()
    @Matches(/^\d{11}$/)
    renavam: string;

    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0.01)
    @Max(9999999999.99)
    preco: number;
}
