const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

// Load the app's pure TypeScript modules using its installed compiler.
module.exports = function loadTypescript(filename, dependencies = {}, cache = new Map()) {
  const resolved = path.resolve(filename);
  if (cache.has(resolved)) return cache.get(resolved).exports;
  const module = { exports: {} };
  cache.set(resolved, module);
  const { outputText } = ts.transpileModule(fs.readFileSync(resolved, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: resolved,
  });
  const execute = vm.runInThisContext(`(function(require, module, exports) { ${outputText}\n})`, { filename: resolved });
  execute((specifier) => {
    if (Object.hasOwn(dependencies, specifier)) return dependencies[specifier];
    if (!specifier.startsWith('.')) throw new Error(`Unexpected dependency in pure module: ${specifier}`);
    return loadTypescript(path.resolve(path.dirname(resolved), `${specifier}.ts`), dependencies, cache);
  }, module, module.exports);
  return module.exports;
};
