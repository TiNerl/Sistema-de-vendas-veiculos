import { IsEnum } from 'class-validator';
import { StatusVeiculo } from '../veiculo-status.enum';

export class AtualizarStatusVeiculoDto {
    @IsEnum(StatusVeiculo)
    status: StatusVeiculo;
}