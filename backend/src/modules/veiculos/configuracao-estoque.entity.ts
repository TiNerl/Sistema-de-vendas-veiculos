import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'configuracao_estoque' })
export class ConfiguracaoEstoque {
    @PrimaryColumn({ type: 'integer' })
    id: number;

    @Column({ name: 'quantidade_minima', type: 'integer' })
    quantidade_minima: number;

    @UpdateDateColumn({ name: 'atualizado_em', type: 'timestamptz' })
    atualizado_em: Date;
}
