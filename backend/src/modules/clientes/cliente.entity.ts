import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';


@Entity({ name: 'clientes' })
export class Cliente {
    @PrimaryGeneratedColumn()
    id_cliente: number;

    @Column({ type: 'varchar', length: 100 })
    nome: string;

    @Column({ type: 'varchar', length: 14, unique: true })
    cpf: string;

    @Column({ type: 'varchar', length: 150, unique: true })
    email: string;

    @Column({ type: 'varchar', length: 20 })
    telefone: string;

    @Column({ type: 'varchar', length: 200 })
    endereco: string;
    
    @Column({ type: 'varchar', length: 100 })
    cidade: string;

    @Column({ type: 'varchar', length: 2 })
    estado: string;

    @Column({ type: 'varchar', length: 10 })
    cep: string;

    @Column({ type: 'varchar', length: 50 })
    documento: string;

    @Column({ type: 'boolean', default: true })
    ativo: boolean;

    @CreateDateColumn({ name: 'data_criacao', type: 'timestamptz' })
    data_criacao: Date;

    @UpdateDateColumn({ name: 'atualizado_em', type: 'timestamptz' })
    atualizado_em: Date;
}