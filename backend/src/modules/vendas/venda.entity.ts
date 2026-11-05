import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn
} from 'typeorm';

import { Cliente } from '../../modules/clientes/cliente.entity';
import { Usuario } from '../../modules/usuarios/usuario.entity';
import { Veiculo } from '../../modules/veiculos/veiculo.entity';

export type FormaPagamento = 'a_vista' | 'pix' | 'financiamento' | 'consorcio';
export type StatusVenda = 'pendente' | 'concluida' | 'cancelada';

@Entity({ name: 'venda' })
export class Venda {
    @PrimaryGeneratedColumn({ name: 'id_venda', type: 'integer' })
    id_venda: number;

    @ManyToOne(() => Cliente, { nullable: false })
    @JoinColumn({ name: 'id_cliente'})
    cliente: Cliente;

    @ManyToOne(() => Veiculo, { nullable: false })
    @JoinColumn({ name: 'id_veiculo'})
    veiculo: Veiculo;

    @ManyToOne(() => Usuario, { nullable: false })
    @JoinColumn({ name: 'id_usuario'})
    usuario: Usuario;

    @Column({name: 'valor_veiculo', type: 'decimal', precision: 12, scale: 2})
    valor_veiculo: string;

    @Column({name: 'percentual_desconto', type: 'decimal', precision: 5, scale: 2, nullable: true})
    percentual_desconto: string | null;

    @Column({ name: 'valor_desconto', type: 'decimal', precision: 12, scale: 2, nullable: true })
    valor_desconto: string | null;

    @Column({ name: 'valor_final', type: 'decimal', precision: 12, scale: 2 })
    valor_final: string;

    @Column({ name: 'forma_pagamento', type: 'varchar', length: 50, nullable: true })
    forma_pagamento: FormaPagamento;

    @Column({ name: 'percentual_comissao', type: 'decimal', precision: 5, scale: 2, nullable: true })
    percentual_comissao: string | null;

    @Column({ name: 'valor_comissao',type: 'decimal',precision: 12,scale: 2,nullable: true })
    valor_comissao: string | null;

    @Column({ name: 'status', type: 'varchar', length: 30 })
    status: StatusVenda;

    @CreateDateColumn({ name: 'data_venda', type: 'timestamptz' })
    data_venda: Date;

    @UpdateDateColumn({ name: 'atualizada_em', type: 'timestamptz' })
    atualizada_em: Date;
}