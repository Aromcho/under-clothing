// Setup multiplataforma (Windows / macOS / Linux): env + db + migraciones + seed
import { execSync, spawnSync } from 'node:child_process';
import { existsSync, copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const run = (cmd) => execSync(cmd, { cwd: root, stdio: 'inherit' });
const step = (t) => console.log(`\n\x1b[35m▸ ${t}\x1b[0m`);

step('1/5 Variables de entorno');
const envPath = path.join(root, '.env');
if (!existsSync(envPath)) {
  copyFileSync(path.join(root, '.env.example'), envPath);
  let env = readFileSync(envPath, 'utf8');
  env = env
    .replace('cambiar-por-un-secreto-largo', randomBytes(32).toString('hex'))
    .replace('cambiar-por-otro-secreto', randomBytes(24).toString('hex'));
  writeFileSync(envPath, env);
  console.log('  .env creado con secretos aleatorios');
} else console.log('  .env ya existe, no se modifica');

const env = Object.fromEntries(
  readFileSync(envPath, 'utf8').split(/\r?\n/).filter((l) => l && !l.startsWith('#')).map((l) => {
    const i = l.indexOf('=');
    return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
  }),
);
const dbUrl = new URL(env.DATABASE_URL);

const portOpen = () =>
  new Promise((res) => {
    const s = net.connect({ host: dbUrl.hostname, port: Number(dbUrl.port || 5432) });
    s.once('connect', () => { s.destroy(); res(true); });
    s.once('error', () => res(false));
    s.setTimeout(1500, () => { s.destroy(); res(false); });
  });

step('2/5 Base de datos (PostgreSQL en Docker, puerto ' + dbUrl.port + ')');
if (await portOpen()) console.log('  Ya hay un PostgreSQL escuchando, se usa ese');
else {
  const d = spawnSync('docker', ['compose', 'up', '-d'], { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' });
  if (d.status !== 0) {
    console.error('\n  No se pudo levantar Docker. Abrí Docker Desktop y volvé a correr `npm run setup`.');
    process.exit(1);
  }
}
process.stdout.write('  Esperando a la base');
let ready = false;
for (let i = 0; i < 60 && !ready; i++) {
  ready = await portOpen();
  if (!ready) { process.stdout.write('.'); await new Promise((r) => setTimeout(r, 1000)); }
}
console.log(ready ? ' lista' : ' sin respuesta');
if (!ready) process.exit(1);
await new Promise((r) => setTimeout(r, 1500));

step('3/5 Dependencias');
if (!existsSync(path.join(root, 'node_modules'))) run('npm install');
else console.log('  node_modules ya instalado');

step('4/5 Migraciones');
run('npm run db:migrate -w apps/api');

step('5/5 Seed con el contenido relevado');
run('npm run db:seed -w apps/api');

console.log('\n\x1b[32m✔ Listo.\x1b[0m  Corré `npm run dev` y abrí http://localhost:3000  (panel: /admin)\n');
