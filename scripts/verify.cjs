// Validação local sem instalar pacotes ou alterar versões.
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const checks = [
  ['TypeScript', 'typescript/bin/tsc', ['--noEmit']],
  ['ESLint', 'eslint/bin/eslint.js', ['.', '--max-warnings=0']],
  ['Testes', null, ['--test', 'tests/*.test.cjs']],
];

for (const [label, entry, args] of checks) {
  console.log(`\n${label}`);
  const result = spawnSync(process.execPath, entry ? [path.join(root, 'node_modules', entry), ...args] : args, {
    cwd: root,
    stdio: 'inherit',
  });
  if (result.error) console.error(result.error.message);
  if (result.error || result.status !== 0) process.exit(result.status || 1);
}
