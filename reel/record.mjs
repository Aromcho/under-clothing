// Graba la web real en un iPhone, cuadro a cuadro y de forma determinística (reloj controlado, 24 fps)
import { createRequire } from 'node:module';
import { mkdirSync, rmSync } from 'node:fs';
const require = createRequire(process.env.PLAYWRIGHT_FROM ?? new URL('../package.json', import.meta.url));
const { chromium } = require('playwright');
const FPS = 24, OUT = new URL('./frames', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'), BASE = 'http://localhost:3000';
rmSync(OUT, { recursive: true, force: true }); mkdirSync(OUT, { recursive: true });
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || undefined, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'es-AR', timezoneId: 'America/Argentina/Buenos_Aires' });
const page = await ctx.newPage();
await page.clock.install({ time: new Date('2026-11-12T18:10:00-03:00') });
let n = 0, t = 0;
async function prepare(url) {
  await page.goto(BASE + url, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: 'html{scroll-behavior:auto!important} ::-webkit-scrollbar{display:none}' });
  await page.evaluate(async () => {
    document.querySelectorAll('img').forEach((i) => { i.loading = 'eager'; });
    await Promise.all([...document.images].map((i) => (i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; }))));
    await document.fonts.ready;
  });
  await page.clock.runFor(60);
}
async function frame(scrollY, sx) {
  await page.clock.runFor(1000 / FPS); t += 1000 / FPS;
  await page.evaluate(([y, time, sx]) => {
    if (y != null) window.scrollTo(0, y);
    if (sx != null) { const ul = document.querySelector('section[aria-labelledby="h-news"] ul'); if (ul) { ul.style.scrollSnapType = 'none'; ul.scrollLeft = sx; } }
    for (const a of document.getAnimations()) { if (a instanceof CSSAnimation) { a.pause(); a.currentTime = time % 1e7; } }
  }, [scrollY, t, sx ?? null]);
  await page.clock.runFor(1);
  await page.screenshot({ path: `${OUT}/f${String(n++).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 92 });
}
async function hold(sec, y) { for (let i = 0; i < sec * FPS; i++) await frame(y); }
async function scroll(from, to, sec) { const N = Math.round(sec * FPS); for (let i = 1; i <= N; i++) await frame(Math.round(from + (to - from) * ease(i / N))); }

await prepare('/');
await hold(1.5, 0);            // portada con la etiqueta
await scroll(0, 905, 1.7);     // historias + nuevos ingresos
await hold(0.4, 905);
{ const N = Math.round(1.5 * FPS); for (let i = 1; i <= N; i++) await frame(905, Math.round(532 * ease(i / N))); } // desliza el carrusel
for (let i = 0; i < 0.6 * FPS; i++) await frame(905, 532);
const cut = n;
await prepare('/producto/sweater-chomba-rayas-anchas');
await hold(0.9, 0);
await scroll(0, 470, 1.3);     // ficha: colores, talle y botón
await hold(1.0, 470);
console.log('frames', n, 'corte en', cut, 'duración', (n / FPS).toFixed(2));
await browser.close();
