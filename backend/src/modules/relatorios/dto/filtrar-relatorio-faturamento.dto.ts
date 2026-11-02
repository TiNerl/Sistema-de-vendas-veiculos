import { IsOptional, IsDateString } from 'class-validator';

export class FiltrarRelatorioFaturamentoDto {
    @IsOptional()
    @IsDateString()
    dataInicio?: string;
    @IsOptional()
    @IsDateString()
    dataFim?: string;
}
