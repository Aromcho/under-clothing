// Levanta API + Web en paralelo con salida prefijada (sin dependencias, anda en Windows)
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mode = process.argv[2] === 'start' ? 'start' : 'dev';
const procs = [
  { name: 'api', color: '\x1b[35m', args: ['run', mode, '-w', 'apps/api'] },
  { name: 'web', color: '\x1b[36m', args: ['run', mode, '-w', 'apps/web'] },
];
const children = procs.map((p) => {
  const c = spawn('npm', p.args, { cwd: root, shell: true, env: process.env });
  const pipe = (stream, out) => {
    let buf = '';
    stream.on('data', (d) => {
      buf += d.toString();
      const lines = buf.split(/\r?\n/);
      buf = lines.pop() ?? '';
      for (const l of lines) out.write(`${p.color}[${p.name}]\x1b[0m ${l}\n`);
    });
  };
  pipe(c.stdout, process.stdout);
  pipe(c.stderr, process.stderr);
  c.on('exit', (code) => {
    if (code && code !== 0) console.error(`[${p.name}] terminó con código ${code}`);
  });
  return c;
});
const stop = () => { for (const c of children) c.kill(); process.exit(0); };
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
