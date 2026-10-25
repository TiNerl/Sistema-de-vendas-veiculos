import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'veiculos' })
export class Veiculo {
    @PrimaryGeneratedColumn()
    id_veiculo: number;

    @Column({ type: 'varchar', length: 100 })
    marca: string;

    @Column({ type: 'varchar', length: 100 })
    modelo: string;

    @Column({ type: 'varchar', length: 100 })
    versao: string;

    @Column({ type: 'smallint' })
    ano: number;

    @Column({ type: 'varchar', length: 50 })
    cor: string;

    @Column({ type: 'integer' })
    quilometragem: number;

    @Column({ type: 'varchar', length: 20 })
    combustivel: string;

    @Column({ type: 'varchar', length: 20 })
    cambio: string;

    @Column({ type: 'varchar', length: 7, unique: true })
    placa: string;

    @Column({ type: 'varchar', length: 17, unique: true })
    chassi: string;

    @Column({ type: 'varchar', length: 11, unique: true })
    renavam: string;

    @Column({ type: 'numeric', precision: 12, scale: 2 })
    preco: string;

    @CreateDateColumn({ name: 'data_criacao', type: 'timestamptz' })
    data_criacao: Date;

    @UpdateDateColumn({ name: 'atualizado_em', type: 'timestamptz' })
    atualizado_em: Date;
}
