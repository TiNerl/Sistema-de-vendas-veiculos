import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

export type Perfil = 'admin' | 'vendedor';

@Entity({ name: 'usuarios' })
export class Usuario {
    @PrimaryGeneratedColumn()
    id_usuario: number;

    @Column({ type: 'varchar', length: 100 })
    nome: string;

    @Column({ type: 'varchar', length: 14, unique: true })
    cpf: string;

    @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
    email?: string;

    @Column({ type: 'varchar', length: 255 })
    senha: string;

    @Column({ type: 'varchar', length: 20 })
    perfil: Perfil;

    @Column({ type: 'boolean', default: true })
    ativo: boolean;

    @CreateDateColumn({ name: 'data_criacao', type: 'timestamptz' })
    data_criacao: Date;

    @UpdateDateColumn({ name: 'atualizado_em', type: 'timestamptz' })
    atualizado_em: Date;
}