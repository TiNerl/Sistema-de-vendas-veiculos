import { IsInt, IsIn, Min, IsString, IsNotEmpty, IsOptional, Max, IsNumber } from 'class-validator'

import type { FormaPagamento } from '../venda.entity';

export class CadastrarVendaDto {
    @IsNotEmpty()
    @Min(1)
    @IsInt()
    id_cliente: number;

    @IsNotEmpty()
    @IsInt()
    @Min(1)
    id_veiculo: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    id_usuario_responsavel?: number;

    @IsNotEmpty()
    @IsString()
    @IsIn(['a_vista', 'pix', 'financiamento', 'consorcio'])
    forma_pagamento: FormaPagamento;

    @Min(0)
    @Max(100)
    @IsOptional()
    @IsNumber({maxDecimalPlaces: 2})
    percentual_desconto?: number;
}