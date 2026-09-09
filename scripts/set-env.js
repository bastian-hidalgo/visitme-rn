const fs = require('fs');
const path = require('path');

const target = (process.argv[2] || '').toLowerCase().trim();

const envMap = {
  local: '.envLocal',
  dev: '.envLocal',
  development: '.envLocal',
  prod: '.envProd',
  production: '.envProd',
};

const envFile = envMap[target];

if (!envFile) {
  console.error('\x1b[31m✖ Error:\x1b[0m Debes especificar el entorno: "local" o "prod"');
  console.log('Uso: node scripts/set-env.js [local|prod]');
  process.exit(1);
}

const rootDir = process.cwd();
const srcPath = path.resolve(rootDir, envFile);
const destPath = path.resolve(rootDir, '.env');

if (!fs.existsSync(srcPath)) {
  console.error(`\x1b[31m✖ Error:\x1b[0m No se encontró el archivo de origen: ${envFile}`);
  process.exit(1);
}

try {
  fs.copyFileSync(srcPath, destPath);
  const targetLabel = ['prod', 'production'].includes(target) ? 'PRODUCCIÓN' : 'LOCAL';
  console.log(`\x1b[32m✔\x1b[0m Entorno configurado en \x1b[1m${targetLabel}\x1b[0m (Copiado ${envFile} -> .env)`);
} catch (error) {
  console.error(`\x1b[31m✖ Error al copiar el archivo de entorno:\x1b[0m`, error.message);
  process.exit(1);
}
