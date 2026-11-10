/**
 * Verificación de punta a punta con Playwright:
 *  - capturas mobile y desktop de cada página (carpeta capturas/)
 *  - flujo de compra completo (prenda → color → carrito → datos → pedido guardado)
 *  - búsqueda, filtros, historias
 *  - panel: login, pedido recibido, cambio de estado, edición de precio con revalidación, subida de imagen
 * Uso: npm run test:e2e   (con `npm run dev` o `npm start` corriendo)
 */
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(process.env.PLAYWRIGHT_FROM ?? path.join(root, 'package.json'));
const { chromium } = require('playwright');

const env = existsSync(path.join(root, '.env')) ? Object.fromEntries(readFileSync(path.join(root, '.env'), 'utf8').split(/\r?\n/).filter((l) => l.includes('=') && !l.startsWith('#')).map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])) : {};
const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const OUT = path.join(root, 'capturas');
mkdirSync(OUT, { recursive: true });

let failed = 0;
const ok = (name, cond, extra = '') => { console.log(`${cond ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m'} ${name}${extra ? ` — ${extra}` : ''}`); if (!cond) failed++; };
const MOBILE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
const DESKTOP = { viewport: { width: 1440, height: 900 } };

const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || undefined, args: ['--no-sandbox'] });
const errors = [];
async function page(ctxOpts) {
  const ctx = await browser.newContext({ ...ctxOpts, locale: 'es-AR', permissions: ['clipboard-read', 'clipboard-write'] });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errors.push(`${p.url()} → ${e.message}`));
  p.on('console', (m) => { if (m.type() === 'error' && !/maps|Failed to load resource|ERR_/.test(m.text())) errors.push(`${p.url()} → ${m.text()}`); });
  return p;
}
async function shot(p, name) {
  const h = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 600) { await p.evaluate((y) => window.scrollTo(0, y), y); await p.waitForTimeout(90); }
  await p.evaluate(() => window.scrollTo(0, 0));
  await p.waitForTimeout(500);
  await p.screenshot({ path: path.join(OUT, `${name}.jpg`), fullPage: true, type: 'jpeg', quality: 72 });
}

// ——— 1. Capturas de cada página pública
const products = await (await fetch(`${BASE}/api/public/products`)).json();
ok('La API responde con el catálogo', Array.isArray(products) && products.length > 0, `${products.length} prendas`);
const star = products.find((p) => p.slug === 'sweater-chomba-rayas-anchas') ?? products.find((p) => p.variants.length > 1) ?? products[0];
const PAGES = [['inicio', '/'], ['tienda', '/tienda'], ['tienda-categoria', '/tienda?categoria=tops'], ['producto', `/producto/${star.slug}`], ['colecciones', '/colecciones'], ['coleccion', '/colecciones/primavera-verano'], ['contacto', '/contacto'], ['envios', '/envios'], ['cambios', '/cambios-y-devoluciones'], ['pagos', '/medios-de-pago'], ['talles', '/guia-de-talles'], ['404', '/no-existe']];
for (const [mode, opts] of [['mobile', MOBILE], ['desktop', DESKTOP]]) {
  const p = await page(opts);
  for (const [name, url] of PAGES) {
    const r = await p.goto(BASE + url, { waitUntil: 'networkidle' });
    ok(`[${mode}] ${url}`, name === '404' ? r.status() === 404 : r.status() === 200, `HTTP ${r.status()}`);
    const overflow = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (overflow > 1) ok(`[${mode}] ${url} sin scroll horizontal`, false, `${overflow}px de desborde`);
    await shot(p, `${mode}-${name}`);
  }
  await p.context().close();
}

// ——— 2. SEO
const html = await (await fetch(BASE + '/')).text();
ok('JSON-LD ClothingStore', html.includes('"@type":"ClothingStore"'));
ok('Open Graph', html.includes('og:title') && html.includes('og:image'));
const ph = await (await fetch(`${BASE}/producto/${star.slug}`)).text();
ok('JSON-LD Product', ph.includes('"@type":"Product"'));
for (const f of ['/sitemap.xml', '/robots.txt', '/manifest.webmanifest', '/opengraph-image', '/icon.png']) ok(f, (await fetch(BASE + f)).status === 200);

// ——— 3. Flujo de compra (celular)
const m = await page(MOBILE);
await m.goto(BASE + '/', { waitUntil: 'networkidle' });
await m.getByRole('button', { name: /Ver historias/ }).first().click();
ok('Historias: se abre el visor', await m.getByRole('dialog', { name: /Historias/ }).isVisible());
await m.screenshot({ path: path.join(OUT, 'flujo-0-historias.jpg'), type: 'jpeg', quality: 72 });
await m.keyboard.press('Escape');

await m.getByRole('button', { name: 'Buscar prendas' }).click();
await m.getByRole('searchbox').fill('vestido');
await m.waitForTimeout(400);
const found = await m.getByRole('dialog', { name: 'Buscar' }).getByRole('link').count();
ok('Búsqueda: “vestido” devuelve resultados', found >= 3, `${found} resultados`);
await m.screenshot({ path: path.join(OUT, 'flujo-1-busqueda.jpg'), type: 'jpeg', quality: 72 });
await m.keyboard.press('Escape');

await m.goto(BASE + '/tienda', { waitUntil: 'networkidle' });
const total = await m.locator('main ul > li a[href^="/producto/"]').count();
await m.getByRole('button', { name: /Filtros/ }).click();
await m.getByRole('dialog', { name: 'Filtros' }).getByRole('button', { name: 'Bordó', exact: true }).click();
await m.screenshot({ path: path.join(OUT, 'flujo-2-filtros.jpg'), type: 'jpeg', quality: 72 });
await m.getByRole('button', { name: /^Ver \d+ prenda/ }).click();
await m.waitForTimeout(700);
const filtered = await m.locator('main ul > li a[href^="/producto/"]').count();
ok('Filtros: por color reduce el listado', filtered > 0 && filtered < total, `${total} → ${filtered}`);
ok('Filtros: quedan en la URL', m.url().includes('color=Bord'));

await m.goto(`${BASE}/producto/${star.slug}`, { waitUntil: 'networkidle' });
await m.getByRole('button', { name: /Agregar al pedido/ }).click();
ok('Ficha: pide elegir color antes de agregar', await m.getByRole('alert').filter({ hasText: 'Elegí un color' }).isVisible());
await m.getByRole('button', { name: /^Color / }).nth(1).click();
await m.getByRole('button', { name: /Ampliar foto 1/ }).click();
ok('Galería: zoom a pantalla completa', await m.getByRole('dialog', { name: /Fotos de/ }).isVisible());
await m.getByRole('dialog', { name: /Fotos de/ }).locator('img').first().click();
await m.waitForTimeout(350);
await m.screenshot({ path: path.join(OUT, 'flujo-3-zoom.jpg'), type: 'jpeg', quality: 72 });
await m.keyboard.press('Escape');
await m.getByRole('button', { name: /Agregar al pedido/ }).click();
const drawer = m.getByRole('dialog', { name: 'Tu pedido' });
await drawer.waitFor();
ok('Carrito: se abre con la prenda', await drawer.getByText(star.name).isVisible());
await m.screenshot({ path: path.join(OUT, 'flujo-4-carrito.jpg'), type: 'jpeg', quality: 72 });
await drawer.getByRole('button', { name: /Sumar una unidad/ }).click();
await drawer.getByRole('button', { name: 'Continuar' }).click();
await drawer.getByLabel('Nombre y apellido').fill('Prueba Playwright');
await drawer.getByLabel(/Teléfono/).fill('2255 123456');
await drawer.getByRole('button', { name: 'Envío', exact: true }).click();
await drawer.getByLabel('Dirección y localidad').fill('Av. 3 1234, Villa Gesell');
await drawer.getByLabel(/Comentario/).fill('Pedido de prueba automático');
await m.screenshot({ path: path.join(OUT, 'flujo-5-datos.jpg'), type: 'jpeg', quality: 72 });
const popupP = m.context().waitForEvent('page', { timeout: 4000 }).catch(() => null);
await drawer.getByRole('button', { name: /Enviar pedido por/ }).click();
await drawer.getByText('Guardamos tu pedido').waitFor({ timeout: 10000 });
const code = (await drawer.locator('strong').first().textContent())?.trim() ?? '';
ok('Pedido: se guarda y devuelve un código', /^UC-/.test(code), code);
const href = await drawer.getByRole('link', { name: /Abrir (WhatsApp|Instagram)/ }).getAttribute('href');
ok('Pedido: link con el mensaje armado', /wa\.me\/\d+\?text=|ig\.me\/m\//.test(href ?? ''), (href ?? '').slice(0, 60));
const popup = await popupP;
if (popup) await popup.close().catch(() => {});
await m.screenshot({ path: path.join(OUT, 'flujo-6-enviado.jpg'), type: 'jpeg', quality: 72 });
await m.context().close();

// ——— 4. Panel
for (const [mode, opts] of [['mobile', MOBILE], ['desktop', DESKTOP]]) {
  const a = await page(opts);
  await a.goto(BASE + '/admin', { waitUntil: 'networkidle' });
  await a.screenshot({ path: path.join(OUT, `panel-${mode}-login.jpg`), type: 'jpeg', quality: 72 });
  await a.getByLabel('Email').fill(env.ADMIN_EMAIL ?? 'admin@underclothing.com.ar');
  await a.getByLabel('Contraseña').fill(env.ADMIN_PASSWORD ?? 'under2026');
  await a.getByRole('button', { name: 'Ingresar' }).click();
  await a.getByRole('heading', { name: /^Hola/ }).waitFor({ timeout: 10000 });
  ok(`[panel ${mode}] login con cookie JWT`, true);
  for (const [name, url] of [['inicio', '/admin'], ['pedidos', '/admin/pedidos'], ['productos', '/admin/productos'], ['medios', '/admin/medios'], ['categorias', '/admin/categorias'], ['colecciones', '/admin/colecciones'], ['historias', '/admin/historias'], ['banners', '/admin/banners'], ['beneficios', '/admin/beneficios'], ['talles', '/admin/talles'], ['negocio', '/admin/negocio'], ['usuarios', '/admin/usuarios']]) {
    await a.goto(BASE + url, { waitUntil: 'networkidle' });
    await a.locator('main h1').first().waitFor();
    await a.waitForTimeout(350);
    await a.screenshot({ path: path.join(OUT, `panel-${mode}-${name}.jpg`), type: 'jpeg', quality: 72, fullPage: mode === 'desktop' });
  }
  if (mode === 'mobile') {
    // pedido recibido → confirmado + nota
    await a.goto(BASE + '/admin/pedidos', { waitUntil: 'networkidle' });
    await a.getByRole('button', { name: new RegExp(code) }).click();
    const sheet = a.getByRole('dialog', { name: new RegExp(code) });
    ok('[panel] el pedido de la web llegó al panel', await sheet.getByText('Prueba Playwright').isVisible());
    await sheet.getByRole('button', { name: 'Confirmado' }).click();
    await a.getByText('Marcado como confirmado').waitFor();
    await sheet.getByLabel('Nueva nota').fill('Seña recibida (prueba)');
    await sheet.getByRole('button', { name: 'Agregar' }).click();
    await sheet.getByText('Seña recibida (prueba)').waitFor();
    ok('[panel] estado y nota guardados', true);
    const wa = await sheet.getByRole('link', { name: /Responder por WhatsApp/ }).getAttribute('href');
    ok('[panel] botón de responder por WhatsApp', /wa\.me\/549\d+/.test(wa ?? ''), (wa ?? '').slice(0, 40));
    await a.screenshot({ path: path.join(OUT, 'panel-mobile-pedido-detalle.jpg'), type: 'jpeg', quality: 72 });

    // precio → se ve al instante en la web (revalidación por tags)
    await a.goto(`${BASE}/admin/productos/${star.id}`, { waitUntil: 'networkidle' });
    await a.getByLabel('Precio ($)', { exact: false }).first().fill('45900');
    await a.getByRole('button', { name: 'Guardar' }).click();
    await a.getByText('Guardado: ya se ve en la web').waitFor();
    await a.screenshot({ path: path.join(OUT, 'panel-mobile-producto-editor.jpg'), type: 'jpeg', quality: 72, fullPage: true });
    const after = await (await fetch(`${BASE}/producto/${star.slug}`)).text();
    ok('[panel] el precio nuevo aparece al instante en la web', after.includes('45.900'));
    ok('[panel] JSON-LD con oferta al cargar precio', after.includes('"priceCurrency":"ARS"'));
    await a.getByLabel('Precio ($)', { exact: false }).first().fill('');
    await a.getByRole('button', { name: 'Guardar' }).click();
    await a.getByText('Guardado: ya se ve en la web').waitFor();
    const back = await (await fetch(`${BASE}/producto/${star.slug}`)).text();
    ok('[panel] al quitar el precio vuelve “consultanos”', !back.includes('45.900'));

    // subida de imagen (sharp → WebP) y borrado
    await a.goto(BASE + '/admin/medios', { waitUntil: 'networkidle' });
    const before = await a.locator('[data-sort-id]').count();
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAEAAAABQCAIAAAAm9BqxAAAAQElEQVR4nO3PQQ0AIBDAsAP/nuGNAvZoFSzZOjNnZt/fAb8ZqBmoGagZqBmoGagZqBmoGagZqBmoGagZqBmoPcqWAp8WqyGGAAAAAElFTkSuQmCC', 'base64');
    await a.locator('input[type=file]').first().setInputFiles({ name: 'prueba-e2e.png', mimeType: 'image/png', buffer: png });
    await a.getByText(/subida\(s\) y optimizada/).waitFor({ timeout: 15000 });
    ok('[panel] subida de imagen a la biblioteca', (await a.locator('[data-sort-id]').count()) === before + 1);
    await a.getByRole('button', { name: 'Editar prueba e2e' }).click();
    await a.getByRole('dialog', { name: 'Imagen' }).getByRole('button', { name: /Eliminar/ }).click();
    await a.getByRole('alertdialog').getByRole('button', { name: 'Eliminar' }).click();
    await a.getByText('Imagen eliminada').waitFor();
    ok('[panel] borrado de la imagen de prueba', (await a.locator('[data-sort-id]').count()) === before);

    // limpiar el pedido de prueba
    await a.goto(BASE + '/admin/pedidos', { waitUntil: 'networkidle' });
    await a.getByRole('button', { name: new RegExp(code) }).click();
    await a.getByRole('dialog', { name: new RegExp(code) }).getByRole('button', { name: /Eliminar/ }).click();
    await a.getByRole('alertdialog').getByRole('button', { name: 'Eliminar' }).click();
    await a.getByText('Eliminado').waitFor();
    ok('[panel] pedido de prueba eliminado', true);
  }
  await a.context().close();
}

ok('Sin errores de JavaScript en consola', errors.length === 0, errors.slice(0, 4).join(' | '));
await browser.close();
console.log(failed ? `\n\x1b[31m${failed} verificación(es) fallaron\x1b[0m` : '\n\x1b[32mTodo OK\x1b[0m — capturas en /capturas');
process.exit(failed ? 1 : 0);
