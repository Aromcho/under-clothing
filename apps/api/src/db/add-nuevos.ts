/**
 * Suma los nuevos ingresos (prendas con post 0 en seed-data/catalog.ts) SIN borrar nada:
 * pensado para la web ya publicada, donde no se puede volver a correr el seed.
 * - Crea solo las prendas cuyo slug todavía no existe (se puede correr más de una vez).
 * - Las pone primeras en la tienda y les saca la marca "Nuevo" a los ingresos anteriores.
 * Uso: npm run db:nuevos
 */
import { inArray } from 'drizzle-orm';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { createDb, schema } from './db';
import { processImage } from '../common/image.service';
import { slugify } from '../common/services';
import { COLOR_HEX, PRODUCTS } from './seed-data/catalog';

const SEED = path.resolve(process.cwd(), 'seed/images');
/** Los que eran "Nuevo" antes de este ingreso. */
const ANTERIORES = ['remera-lover-confidence', 'sweater-con-cuello-tejido', 'buzo-chomba', 'buzo-corto', 'top-halter-con-hebilla', 'top-halter-de-encaje', 'conjunto-de-encaje', 'shorts-de-jean'];

(async () => {
  const { db, pool } = createDb();
  const nuevos = PRODUCTS.filter((p) => p.post === 0);
  const cats = new Map((await db.select().from(schema.categories)).map((c) => [c.slug, c.id]));
  const cols = new Map((await db.select().from(schema.collections)).map((c) => [c.slug, c.id]));
  const existentes = new Set((await db.select({ slug: schema.products.slug }).from(schema.products)).map((r) => r.slug));
  const cache = new Map<string, number>();
  const media = async (ref: string, alt: string) => {
    if (cache.has(ref)) return cache.get(ref)!;
    const file = path.join(SEED, 'nuevos', ref + '.jpg');
    if (!existsSync(file)) throw new Error('Falta la imagen ' + file);
    const [row] = await db.insert(schema.media).values({ ...(await processImage(file)), alt }).returning();
    cache.set(ref, row.id);
    return row.id;
  };

  let creadas = 0;
  for (const [i, p] of nuevos.entries()) {
    const slug = slugify(p.name);
    if (existentes.has(slug)) { console.log('  ya está:', p.name); continue; }
    const categoryId = cats.get(p.cat);
    if (!categoryId) throw new Error('No existe la categoría ' + p.cat);
    const [row] = await db.insert(schema.products).values({
      slug, name: p.name, description: p.desc ?? '', categoryId, isNew: !!p.isNew, featured: !!p.featured,
      sizesNote: p.sizesNote ?? (p.sizes ? '' : 'Consultá los talles disponibles'), igUrl: '', position: i - nuevos.length,
    }).returning();
    for (const [k, img] of p.imgs.entries()) {
      if (typeof img !== 'string') continue;
      await db.insert(schema.productMedia).values({ productId: row.id, mediaId: await media(img, `${p.name} — Under Clothing`), position: k }).onConflictDoNothing();
    }
    for (const c of p.cols ?? []) if (cols.has(c)) await db.insert(schema.productCollections).values({ productId: row.id, collectionId: cols.get(c)! });
    let vp = 0;
    for (const color of p.colors) for (const size of p.sizes ?? ['']) {
      await db.insert(schema.variants).values({ productId: row.id, size, color, colorHex: COLOR_HEX[color] ?? '', stock: 0, position: vp++ });
    }
    creadas++;
    console.log('  +', p.name);
  }
  if (creadas) {
    await db.update(schema.products).set({ isNew: false }).where(inArray(schema.products.slug, ANTERIORES));
    await db.insert(schema.activity).values({ userName: 'Sistema', action: 'importó', entity: 'productos', summary: `${creadas} nuevos ingresos` });
  }
  // la web vuelve a leer el catálogo al instante
  try {
    await fetch(`${process.env.WEB_URL ?? 'http://localhost:3000'}/internal/revalidate`, {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-revalidate-secret': process.env.REVALIDATE_SECRET ?? '' }, body: JSON.stringify({ tags: ['site', 'products'] }),
    });
  } catch {}
  console.log(`  Listo: ${creadas} prendas nuevas.`);
  await pool.end();
})().catch((e) => { console.error(e); process.exit(1); });
