/**
 * Utilitários compartilhados pelos testes unitários do backend.
 *
 * Os serviços do AutoSaller dependem de três abstrações do TypeORM:
 * `Repository`, `SelectQueryBuilder`/`UpdateQueryBuilder` e `EntityManager`
 * (usado dentro de `DataSource.transaction`). Aqui ficam dublês (test doubles)
 * dessas abstrações, para que nenhum teste unitário dependa de PostgreSQL.
 */
import { jest } from '@jest/globals';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FnMock = jest.Mock<(...args: any[]) => any>;

/** Cria um `jest.fn()` sem restrição de assinatura (evita ruído de tipos nos testes). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mockFn = (): FnMock => jest.fn<(...args: any[]) => any>();

/** QueryBuilder encadeável: todo método retorna o próprio builder. */
export function criarQueryBuilderMock() {
  const qb = {
    where: mockFn(),
    andWhere: mockFn(),
    leftJoinAndSelect: mockFn(),
    select: mockFn(),
    addSelect: mockFn(),
    groupBy: mockFn(),
    addGroupBy: mockFn(),
    orderBy: mockFn(),
    addOrderBy: mockFn(),
    update: mockFn(),
    set: mockFn(),
    getMany: mockFn(),
    getRawMany: mockFn(),
    execute: mockFn(),
  };
  for (const metodo of [
    'where', 'andWhere', 'leftJoinAndSelect', 'select', 'addSelect', 'groupBy',
    'addGroupBy', 'orderBy', 'addOrderBy', 'update', 'set',
  ] as const) {
    qb[metodo].mockReturnValue(qb);
  }
  qb.getMany.mockResolvedValue([]);
  qb.getRawMany.mockResolvedValue([]);
  qb.execute.mockResolvedValue({ affected: 1 });
  return qb;
}
export type QueryBuilderMock = ReturnType<typeof criarQueryBuilderMock>;

/** Repository<T> com os métodos usados pelos serviços. */
export function criarRepositorioMock(qb: QueryBuilderMock = criarQueryBuilderMock()) {
  const repo = {
    find: mockFn(),
    findOne: mockFn(),
    findOneBy: mockFn(),
    create: mockFn(),
    save: mockFn(),
    createQueryBuilder: mockFn(),
    qb,
  };
  repo.find.mockResolvedValue([]);
  repo.findOne.mockResolvedValue(null);
  repo.findOneBy.mockResolvedValue(null);
  repo.create.mockImplementation((dados: unknown) => ({ ...(dados as object) }));
  repo.save.mockImplementation(async (entidade: unknown) => entidade);
  repo.createQueryBuilder.mockReturnValue(qb);
  return repo;
}
export type RepositorioMock = ReturnType<typeof criarRepositorioMock>;

/**
 * EntityManager transacional + DataSource cujo `transaction(cb)` executa `cb(manager)`.
 * Permite verificar que venda e baixa de estoque ocorrem na MESMA transação.
 */
export function criarDataSourceMock(qb: QueryBuilderMock = criarQueryBuilderMock()) {
  const manager = {
    findOneBy: mockFn(),
    findOne: mockFn(),
    findOneOrFail: mockFn(),
    create: mockFn(),
    save: mockFn(),
    createQueryBuilder: mockFn(),
    qb,
  };
  manager.create.mockImplementation((_entidade: unknown, dados: unknown) => ({ ...(dados as object) }));
  manager.save.mockImplementation(async (_entidade: unknown, dados: unknown) => ({
    id_venda: 100,
    ...(dados as object),
  }));
  manager.createQueryBuilder.mockReturnValue(qb);

  const dataSource = {
    transaction: mockFn(),
    manager,
  };
  dataSource.transaction.mockImplementation(async (cb: unknown) =>
    (cb as (m: typeof manager) => unknown)(manager),
  );
  return dataSource;
}
export type DataSourceMock = ReturnType<typeof criarDataSourceMock>;
