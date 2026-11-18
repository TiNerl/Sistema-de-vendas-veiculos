import { MigrationInterface, QueryRunner } from 'typeorm';

export class AdicionaRegistradorVenda1794960000000 implements MigrationInterface {
    name = 'AdicionaRegistradorVenda1794960000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "venda" ADD "id_usuario_registro" integer`);
        await queryRunner.query(`ALTER TABLE "venda" ADD CONSTRAINT "FK_venda_usuario_registro" FOREIGN KEY ("id_usuario_registro") REFERENCES "usuarios"("id_usuario") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "venda" DROP CONSTRAINT "FK_venda_usuario_registro"`);
        await queryRunner.query(`ALTER TABLE "venda" DROP COLUMN "id_usuario_registro"`);
    }
}
