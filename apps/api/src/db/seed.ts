/**
 * Seed: carga TODO el contenido relevado del Instagram (@under.clothing7).
 * Reprocesa las imágenes con sharp (WebP en varios tamaños + placeholder borroso).
 * Uso: npm run db:seed   (borra y vuelve a cargar el contenido; los pedidos se conservan con --keep-orders)
 */
import bcrypt from 'bcryptjs';
import sharp from 'sharp';
import { sql } from 'drizzle-orm';
import { existsSync, readdirSync } from 'node:fs';
import { rm, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { createDb, schema, UPLOADS_DIR } from './db';
import { processImage } from '../common/image.service';
import { slugify } from '../common/services';
import { BENEFITS, CATEGORIES, COLLECTIONS, COLOR_HEX, Img, PRODUCTS, SETTINGS, STORIES } from './seed-data/catalog';
import relevamiento from './seed-data/relevamiento.json';

const SEED = path.resolve(process.cwd(), 'seed/images');
const postFiles = readdirSync(path.join(SEED, 'posts'));
const storyFiles = readdirSync(path.join(SEED, 'stories'));

(async () => {
  const { db, pool } = createDb();
  const keepOrders = process.argv.includes('--keep-orders');
  console.log('  Limpiando contenido anterior…');
  await db.execute(sql.raw(`TRUNCATE users, media, categories, collections, size_guides, products, product_media, product_collections, variants, stories, banners, benefits, settings, activity${keepOrders ? '' : ', orders'} RESTART IDENTITY CASCADE`));
  await rm(UPLOADS_DIR, { recursive: true, force: true });
  await mkdir(UPLOADS_DIR, { recursive: true });

  // ——— Imágenes (cada archivo se procesa una sola vez)
  const cache = new Map<string, number>();
  let pos = 0;
  async function addImage(file: string, alt: string, crop?: [number, number, number, number]) {
    const key = file + (crop ? crop.join(',') : '');
    if (cache.has(key)) return cache.get(key)!;
    if (!existsSync(file)) throw new Error('Falta la imagen ' + file);
    let input: Buffer | string = file;
    if (crop) input = await sharp(file).extract({ left: crop[0], top: crop[1], width: crop[2], height: crop[3] }).toBuffer();
    const img = await processImage(input);
    const [row] = await db.insert(schema.media).values({ ...img, alt, position: pos++ }).returning();
    cache.set(key, row.id);
    return row.id;
  }
  const postFile = (ref: string) => {
    if (/^n\d+_\d+$/.test(ref)) return path.join(SEED, 'nuevos', ref + '.jpg');
    const [n, k] = ref.split('_');
    const f = postFiles.find((x) => x.startsWith(n + '_') && new RegExp(`_${k}(_videocover)?\\.jpg$`).test(x));
    if (!f) throw new Error('No encuentro la foto ' + ref);
    return path.join(SEED, 'posts', f);
  };
  const postImg = (img: Img, alt: string) => (typeof img === 'string' ? addImage(postFile(img), alt) : addImage(postFile(img.f), alt, img.crop));
  const brand = async (name: string, alt: string) => {
    const f = path.join(SEED, 'brand', name);
    return existsSync(f) ? addImage(f, alt) : null;
  };

  // ——— Usuario administrador
  const email = (process.env.ADMIN_EMAIL ?? 'admin@underclothing.com.ar').toLowerCase();
  await db.insert(schema.users).values({ email, name: 'Under Clothing', role: 'admin', passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD ?? 'under2026', 10) });

  // ——— Categorías y colecciones
  const catId = new Map<string, number>();
  for (const [i, c] of CATEGORIES.entries()) {
    const [row] = await db.insert(schema.categories).values({ slug: c.slug, name: c.name, position: i, mediaId: await postImg(c.cover, c.name) }).returning();
    catId.set(c.slug, row.id);
  }
  const colId = new Map<string, number>();
  for (const [i, c] of COLLECTIONS.entries()) {
    const [row] = await db.insert(schema.collections).values({ slug: c.slug, name: c.name, tagline: c.tagline, description: c.description, position: i, mediaId: await postImg(c.cover, c.name) }).returning();
    colId.set(c.slug, row.id);
  }

  // ——— Productos
  process.stdout.write(`  Procesando ${PRODUCTS.length} prendas`);
  const slugs = new Set<string>();
  for (const [i, p] of PRODUCTS.entries()) {
    const post = p.post ? (relevamiento as any).posts[p.post - 1] : { url: '', fecha: '2026-11-10T12:00:00-03:00' };
    let slug = slugify(p.name);
    for (let n = 2; slugs.has(slug); n++) slug = `${slugify(p.name)}-${n}`;
    slugs.add(slug);
    const [row] = await db.insert(schema.products).values({
      slug, name: p.name, description: p.desc ?? '', categoryId: catId.get(p.cat)!, isNew: !!p.isNew, featured: !!p.featured,
      sizesNote: p.sizesNote ?? (p.sizes ? '' : 'Consultá los talles disponibles'), igUrl: post.url, position: i, publishedAt: new Date(post.fecha),
    }).returning();
    for (const [k, img] of p.imgs.entries()) {
      const mediaId = await postImg(img, `${p.name} — Under Clothing`);
      await db.insert(schema.productMedia).values({ productId: row.id, mediaId, position: k }).onConflictDoNothing();
    }
    for (const c of p.cols ?? []) await db.insert(schema.productCollections).values({ productId: row.id, collectionId: colId.get(c)! });
    let vp = 0;
    for (const color of p.colors) for (const size of p.sizes ?? ['']) {
      await db.insert(schema.variants).values({ productId: row.id, size, color, colorHex: COLOR_HEX[color] ?? '', stock: 0, position: vp++ });
    }
    process.stdout.write('.');
  }
  console.log(' ok');

  // ——— Historias destacadas (EN STOCK)
  for (const [i, n] of STORIES.entries()) {
    const f = storyFiles.find((x) => x.startsWith(String(n).padStart(2, '0')));
    if (!f) continue;
    await db.insert(schema.stories).values({ group: 'En stock', title: '', position: i, mediaId: await addImage(path.join(SEED, 'stories', f), 'Historia En stock — Under Clothing') });
  }

  // ——— Banners (fondos de tela generados con Kling en la paleta de la marca)
  const heroD = await brand('hero-desktop.jpg', 'Raso rosa empolvado');
  const heroM = await brand('hero-mobile.jpg', 'Raso rosa empolvado');
  const pliegues = await brand('pliegues.jpg', 'Pliegues de tela rosa');
  const tul = await brand('tul.jpg', 'Tul translúcido');
  const costura = await brand('costura.jpg', 'Costura a mano');
  await brand('lino.jpg', 'Textura de lino');
  await db.insert(schema.banners).values([
    { placement: 'hero', eyebrow: 'Villa Gesell · Envíos a todo el país', title: 'Tu próximo “me lo merezco” está acá', text: 'Nuevos ingresos todas las temporadas.', ctaLabel: 'Ver nuevos ingresos', ctaHref: '/tienda?novedades=1', mediaId: heroD, mobileMediaId: heroM, position: 0 },
    { placement: 'home', eyebrow: 'Showroom', title: 'Vení a probarte todo', text: 'Un poco de lo que es y lo que hay en nuestro showroom: Paseo 104 entre 3 y 4, Villa Gesell.', ctaLabel: 'Cómo llegar', ctaHref: '/contacto', mediaId: pliegues, position: 1 },
    { placement: 'tienda', eyebrow: 'Tienda', title: 'Todas las prendas', text: 'Elegí talle y color, sumá al carrito y mandanos el pedido.', mediaId: tul, position: 2 },
    { placement: 'info', eyebrow: 'Under Clothing', title: 'Hecho con amor, prenda por prenda', text: '', mediaId: costura, position: 3 },
  ]);

  // ——— Showroom: fotos reales del local enviadas por la clienta
  const showroom = [
    ['01-fachada.jpg', 'La entrada al showroom'], ['02-interior.jpg', 'El showroom por dentro'], ['03-percheros.jpg', 'Percheros con los ingresos'],
    ['04-cintos.jpg', 'Cintos y accesorios'], ['05-puerta.jpg', 'Paseo 104 entre 3 y 4'], ['06-rincon.jpg', 'El rincón de los accesorios'],
  ];
  for (const [i, [file, title]] of showroom.entries()) {
    const f = path.join(SEED, 'showroom', file);
    if (existsSync(f)) await db.insert(schema.banners).values({ placement: 'showroom', title, mediaId: await addImage(f, `${title} — Under Clothing, Villa Gesell`), position: 10 + i });
  }

  // ——— Beneficios y datos del negocio
  await db.insert(schema.benefits).values(BENEFITS.map((b, position) => ({ ...b, position })));
  for (const [key, value] of Object.entries(SETTINGS)) await db.insert(schema.settings).values({ key, value });
  await db.insert(schema.activity).values({ userName: 'Sistema', action: 'importó', entity: 'contenido', summary: `${PRODUCTS.length} prendas del Instagram @under.clothing7` });

  console.log(`  Seed listo: ${PRODUCTS.length} prendas, ${cache.size} imágenes, ${STORIES.length} historias.`);
  console.log(`  Admin: ${email}`);
  await pool.end();
})().catch((e) => { console.error(e); process.exit(1); });
