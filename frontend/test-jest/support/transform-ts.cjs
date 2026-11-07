/**
 * Transformador TS para o Jest.
 * O Vite injeta variáveis em `import.meta.env`, sintaxe que não existe em CommonJS.
 * Antes de delegar ao SWC, trocamos `import.meta.env` por `process.env`, o que
 * permite testar `src/services/api.ts` sem alterar o código de produção.
 */
const { createTransformer } = require('@swc/jest');

const swc = createTransformer({
  jsc: { parser: { syntax: 'typescript' }, target: 'es2022' },
  module: { type: 'commonjs' },
});

const trocarImportMeta = (src) => src.replace(/import\.meta\.env/g, 'process.env');

module.exports = {
  process(src, filename, options) {
    return swc.process(trocarImportMeta(src), filename, options);
  },
  getCacheKey(src, filename, options) {
    return swc.getCacheKey(trocarImportMeta(src), filename, options);
  },
};
