// Prepara los videos de la web a partir de los videos fuente de Kling.
// 1) Descarga las fuentes que falten (el CDN de Kling sólo es accesible desde el servidor).
// 2) Si hay ffmpeg, genera las versiones livianas en apps/api/media-web (se sirven en /media).
// Nunca hace fallar el build.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, 'media', 'fuentes');
const OUT = path.join(root, 'apps', 'api', 'media-web');
const FUENTES = {
  'showroom-kling.mp4': 'https://v15-kling.klingai.com/bs2/upload-ylab-stunt-sgp/07765e54-7e63-44a6-b727-d0531d31e411-OejN0Lnoc9GNDQty0fZFzA-output.mp4?x-kcdn-pid=112372',
};
const log = (...a) => console.log('[media]', ...a);

async function ffmpegBin() {
  for (const bin of [process.env.FFMPEG_BIN, 'ffmpeg', '/usr/bin/ffmpeg', '/usr/local/bin/ffmpeg'].filter(Boolean)) {
    try { execFileSync(bin, ['-version'], { stdio: 'ignore' }); return bin; } catch {}
  }
  try { const p = (await import('ffmpeg-static')).default; if (p && existsSync(p)) return p; } catch {}
  return null;
}

try {
  mkdirSync(SRC, { recursive: true });
  mkdirSync(OUT, { recursive: true });
  for (const [name, url] of Object.entries(FUENTES)) {
    const out = path.join(SRC, name);
    if (existsSync(out) && statSync(out).size > 100000) continue;
    const r = await fetch(url);
    if (!r.ok) { log('no se pudo bajar', name, r.status); continue; }
    writeFileSync(out, Buffer.from(await r.arrayBuffer()));
    log('descargado', name, statSync(out).size, 'bytes');
  }

  const ff = await ffmpegBin();
  log('ffmpeg:', ff ?? 'NO DISPONIBLE');
  const src = path.join(SRC, 'showroom-kling.mp4');
  if (ff && existsSync(src)) {
    const done = (f) => existsSync(path.join(OUT, f)) && statSync(path.join(OUT, f)).mtimeMs > statSync(src).mtimeMs;
    // cortes de toma
    let cuts = [];
    try {
      const r = execFileSync(ff, ['-hide_banner', '-i', src, '-vf', "select='gt(scene,0.25)',showinfo", '-an', '-f', 'null', '-'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
      cuts = [...String(r).matchAll(/pts_time:([\d.]+)/g)].map((m) => +m[1]);
    } catch (e) {
      cuts = [...String(e.stderr ?? '').matchAll(/pts_time:([\d.]+)/g)].map((m) => +m[1]);
    }
    log('cortes de toma:', cuts.map((c) => c.toFixed(2)).join(', ') || 'ninguno');
    const interiorStart = cuts.find((c) => c > 0.8 && c < 3) ?? 1.5;
    const enc = ['-an', '-c:v', 'libx264', '-preset', 'slow', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-movflags', '+faststart'];
    const jobs = [
      ['showroom-720.mp4', ['-i', src, '-vf', 'scale=720:-2:flags=lanczos', '-crf', '27', ...enc]],
      ['showroom-480.mp4', ['-i', src, '-vf', 'scale=480:-2:flags=lanczos', '-crf', '29', ...enc]],
      ['showroom-poster.jpg', ['-i', src, '-vf', 'scale=720:-2:flags=lanczos', '-frames:v', '1', '-q:v', '3']],
      ['local-720.mp4', ['-ss', String(interiorStart + 0.05), '-i', src, '-vf', 'scale=720:-2:flags=lanczos', '-crf', '27', ...enc]],
      ['local-poster.jpg', ['-ss', String(interiorStart + 0.3), '-i', src, '-vf', 'scale=720:-2:flags=lanczos', '-frames:v', '1', '-q:v', '3']],
    ];
    for (const [name, args] of jobs) {
      if (done(name)) { log('ya está', name); continue; }
      execFileSync(ff, ['-y', '-loglevel', 'error', ...args, path.join(OUT, name)], { stdio: 'inherit' });
      log('generado', name, Math.round(statSync(path.join(OUT, name)).size / 1024), 'KB');
    }
  }
} catch (e) {
  log('error', e.message);
}
