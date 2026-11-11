// Graba la web real en un iPhone (390x844 @2x), cuadro a cuadro, 30 fps, con tiempo virtual (vt.js).
// Deja frames/<segmento>/fNNNN.jpg y taps.json (toques para dibujar el indicador en la composición).
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
const require = createRequire(process.env.PLAYWRIGHT_FROM ?? '/opt/npm-tools/');
const { chromium } = require('playwright');
const FPS = 30, ROOT = new URL('./frames', import.meta.url).pathname, BASE = process.env.BASE_URL ?? 'http://localhost:3000';
rmSync(ROOT, { recursive: true, force: true });
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || 'chrome', args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'es-AR', timezoneId: 'America/Argentina/Buenos_Aires', permissions: ['clipboard-read', 'clipboard-write'] });
await ctx.addInitScript(readFileSync(new URL('./vt.js', import.meta.url), 'utf8')); // tiempo virtual
const page = await ctx.newPage();
const taps = {}, counts = {};
let seg = '', n = 0, t = 0;
function start(name) { seg = name; n = 0; taps[name] = []; mkdirSync(`${ROOT}/${name}`, { recursive: true }); }
async function prepare(url) {
  await page.goto(BASE + url, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: 'html{scroll-behavior:auto!important} ::-webkit-scrollbar{display:none} *{caret-color:transparent} nextjs-portal{display:none!important}' });
  await page.evaluate(async () => {
    document.querySelectorAll('img').forEach((i) => { i.loading = 'eager'; });
    await Promise.all([...document.images].map((i) => (i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; }))));
    await document.fonts.ready;
  });
  for (let i = 0; i < 3; i++) { t += 1000 / FPS; await page.evaluate((v) => window.__tick(v), t); }
}
async function frame(y, sx) {
  t += 1000 / FPS;
  await page.evaluate(([v, y, sx]) => window.__tick(v, y, sx), [t, y ?? null, sx ?? null]);
  await page.screenshot({ path: `${ROOT}/${seg}/f${String(n++).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 92 });
  counts[seg] = n;
}
const hold = async (sec, y, sx) => { for (let i = 0; i < Math.round(sec * FPS); i++) await frame(y, sx); };
const scroll = async (a, b, sec) => { const N = Math.round(sec * FPS); for (let i = 1; i <= N; i++) await frame(Math.round(a + (b - a) * ease(i / N))); };
/** Toca un elemento: registra el punto, deja ver el indicador y dispara el click. */
async function tap(locator, before = 0.3) {
  const box = await locator.evaluate((el) => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  taps[seg].push({ frame: n + Math.round(before * FPS * 0.6), x: box.x, y: box.y });
  await hold(before);
  await locator.evaluate((el) => el.click());
  await page.waitForTimeout(120);
}

// ——— A: portada → nuevos ingresos
start('a');
await prepare('/');
await hold(0.9, 0);
await scroll(0, 905, 1.25);
await hold(0.2, 905);
{ const N = Math.round(1.25 * FPS); for (let i = 1; i <= N; i++) await frame(905, Math.round(532 * ease(i / N))); }
await hold(0.3, 905, 532);

// ——— B: tienda → filtro por categoría
start('b');
await prepare('/tienda');
await hold(0.4, 0);
await scroll(0, 300, 0.8);
await tap(page.getByRole('button', { name: 'Nuevos', exact: true }), 0.35);
await hold(0.9);
const yb = await page.evaluate(() => window.scrollY);
await scroll(yb, yb + 520, 1.0);
await hold(0.25);

// ——— C: ficha → color → pedido → enviado
start('c');
await prepare('/producto/remera-oakland');
await hold(0.6, 0);
const yc = await page.evaluate(() => Math.max(0, document.querySelector('fieldset legend').getBoundingClientRect().top + window.scrollY - 250));
await scroll(0, yc, 0.85);
await tap(page.getByRole('button', { name: /^Color Negro/ }), 0.35);
await hold(0.3);
await tap(page.getByRole('button', { name: /Agregar al pedido/ }), 0.35);
await hold(1.0);
const drawer = page.getByRole('dialog', { name: 'Tu pedido' });
await tap(drawer.getByRole('button', { name: 'Continuar' }), 0.35);
await hold(0.3);
const name = 'Camila Pérez';
for (let i = 1; i <= name.length; i++) {
  await drawer.getByLabel('Nombre y apellido').evaluate((el, v) => { el.focus(); el.value = v; }, name.slice(0, i));
  await frame(); if (i % 2 === 0) await frame();
}
await hold(0.2);
await tap(drawer.getByRole('button', { name: /Enviar pedido por/ }), 0.35);
for (let i = 0; i < 40; i++) { if (await drawer.getByText('Guardamos tu pedido').count()) break; await page.waitForTimeout(100); }
const code = (await drawer.locator('strong').first().textContent())?.trim();
await hold(1.4);
writeFileSync(new URL('./taps.json', import.meta.url), JSON.stringify({ fps: FPS, counts, taps, code }, null, 1));
console.log(counts, Object.fromEntries(Object.entries(counts).map(([k, v]) => [k, (v / FPS).toFixed(2) + 's'])), 'pedido de prueba:', code);
await browser.close();
