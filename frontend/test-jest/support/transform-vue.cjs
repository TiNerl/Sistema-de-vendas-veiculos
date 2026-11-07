/**
 * Transformador de Single File Components (.vue) para o Jest.
 *
 * Usa diretamente o compilador oficial (@vue/compiler-sfc) no mesmo modo do
 * build de produção do Vite: `<script setup lang="ts">` com o template embutido
 * (inlineTemplate). O resultado, ainda em TypeScript/ESM, é convertido para
 * CommonJS pelo SWC. Estilos são ignorados (não afetam o comportamento testado).
 *
 * Optou-se por não usar o @vue/vue3-jest porque, com TypeScript 6, ele descarta
 * os imports do template (`_openBlock is not defined`).
 */
const crypto = require('node:crypto');
const { parse, compileScript, compileTemplate } = require('@vue/compiler-sfc');
const { transformSync } = require('@swc/core');

function compilarSfc(src, filename) {
  const { descriptor, errors } = parse(src, { filename });
  if (errors.length) throw errors[0];
  const id = crypto.createHash('md5').update(filename).digest('hex').slice(0, 8);

  if (descriptor.scriptSetup || descriptor.script) {
    const script = compileScript(descriptor, { id, inlineTemplate: true, isProd: false });
    return script.content;
  }
  // Componente apenas com template.
  const tpl = compileTemplate({ id, filename, source: descriptor.template?.content ?? '' });
  return `${tpl.code}\nexport default { render }`;
}

module.exports = {
  process(src, filename, options) {
    const codigo = compilarSfc(src, filename);
    const { code, map } = transformSync(codigo, {
      filename: `${filename}.ts`,
      sourceMaps: true,
      jsc: { parser: { syntax: 'typescript' }, target: 'es2022' },
      module: { type: 'commonjs' },
    });
    if (!options?.instrument) return { code, map };

    // Com --coverage, instrumenta o código gerado (o mapa aponta de volta ao .vue).
    const instrumentado = require('@babel/core').transformSync(code, {
      filename,
      babelrc: false,
      configFile: false,
      inputSourceMap: JSON.parse(map),
      sourceMaps: 'both',
      plugins: [[require.resolve('babel-plugin-istanbul'), { cwd: options.config.rootDir, exclude: [] }]],
    });
    return { code: instrumentado.code, map: instrumentado.map };
  },
  getCacheKey(src, filename, options) {
    const extra = options?.instrument ? 'cov' : '';
    return crypto.createHash('sha1').update(`${src}\0${filename}\0sfc-v4${extra}`).digest('hex');
  },
};
