import { IsOptional, IsDateString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class FiltrarVendasDto {
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  @IsInt({ message: 'O ID do cliente deve ser um número inteiro' })
  cliente_id?: number;

  @IsOptional()
  @IsDateString({}, { message: 'A data inicial deve estar num formato de data válido (YYYY-MM-DD)' })
  dataInicio?: string;

  @IsOptional()
  @IsDateString({}, { message: 'A data final deve estar num formato de data válido (YYYY-MM-DD)' })
  dataFim?: string;
}