import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class AtualizarMinimoEstoqueDto {
    @Type(() => Number)
    @IsInt()
    @Min(0)
    quantidadeMinima: number;
}
