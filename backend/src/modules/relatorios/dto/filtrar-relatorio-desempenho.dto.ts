import { IsOptional, IsDateString, Min } from 'class-validator';

export class FiltrarRelatorioDesempenhoDto {
    @IsOptional()
    @Min(1)
    id_usuario?: number;

    @IsOptional()
    @IsDateString()
    dataInicio?: string;

    @IsOptional()
    @IsDateString()
    dataFim?: string;
}