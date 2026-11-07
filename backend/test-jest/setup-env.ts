import 'reflect-metadata';
// Variáveis mínimas exigidas pelos módulos de autenticação durante os testes.
// Nenhum teste unitário acessa banco de dados real.
process.env.JWT_SECRET ??= 'segredo-somente-para-testes';
process.env.JWT_EXPIRES_IN_SECONDS ??= '900';
