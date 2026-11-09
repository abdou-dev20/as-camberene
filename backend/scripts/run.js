const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const [name, ...args] = process.argv.slice(2);

if (!name) {
  console.error('Usage : node scripts/run.js <script> [options]');
  process.exit(1);
}

const root = path.resolve(__dirname, '..');
const compiled = path.join(root, 'dist-scripts', 'scripts', `${name}.js`);
const source = path.join(root, 'scripts', `${name}.ts`);

const tsx = [path.join(root, 'node_modules', '.bin', 'tsx'), path.join(root, 'node_modules', '.bin', 'tsx.cmd')].find(
  (candidate) => fs.existsSync(candidate)
);

if (!fs.existsSync(source) && !fs.existsSync(compiled)) {
  console.error(`Script inconnu : ${name}`);
  process.exit(1);
}

const [command, commandArgs] =
  tsx && fs.existsSync(source)
    ? [tsx, [source, ...args]]
    : fs.existsSync(compiled)
      ? [process.execPath, [compiled, ...args]]
      : [null, null];

if (!command) {
  console.error(
    `Rien à exécuter pour « ${name} » : ni version compilée, ni tsx pour lire les sources.\n\n`
    + 'Deux façons d\'en sortir, depuis backend/ :\n'
    + '  npm run build              construit les scripts (recommandé en production)\n'
    + '  npm install --include=dev  réinstalle tsx et les outils de développement'
  );
  process.exit(1);
}

const result = spawnSync(command, commandArgs, { stdio: 'inherit', cwd: root });

if (result.error) {
  console.error('Échec du lancement :', result.error.message);
  process.exit(1);
}

process.exit(result.status === null ? 1 : result.status);
