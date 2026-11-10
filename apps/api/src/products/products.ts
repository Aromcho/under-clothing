import { BadRequestException, Body, Controller, Delete, Get, Inject, NotFoundException, Param, ParseIntPipe, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { asc, desc, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { AuthGuard, CurrentUser, Roles, SessionUser } from '../auth/auth';
import { DB, Db, schema } from '../db/db';
import { ActivityLog, Revalidator, slugify } from '../common/services';

const { products, productMedia, productCollections, variants, media, categories, collections } = schema;

export async function loadProducts(db: Db, opts: { onlyVisible?: boolean; id?: number } = {}) {
  let rows = await db.select().from(products).orderBy(asc(products.position), desc(products.publishedAt));
  if (opts.onlyVisible) rows = rows.filter((p) => p.visible);
  if (opts.id) rows = rows.filter((p) => p.id === opts.id);
  if (!rows.length) return [];
  const ids = rows.map((p) => p.id);
  const [pm, pc, vs, cats] = await Promise.all([
    db.select({ productId: productMedia.productId, position: productMedia.position, m: media }).from(productMedia)
      .innerJoin(media, eq(media.id, productMedia.mediaId)).where(inArray(productMedia.productId, ids)).orderBy(asc(productMedia.position)),
    db.select({ productId: productCollections.productId, id: collections.id, slug: collections.slug, name: collections.name }).from(productCollections)
      .innerJoin(collections, eq(collections.id, productCollections.collectionId)).where(inArray(productCollections.productId, ids)),
    db.select().from(variants).where(inArray(variants.productId, ids)).orderBy(asc(variants.position), asc(variants.id)),
    db.select().from(categories),
  ]);
  const catById = new Map(cats.map((c) => [c.id, c]));
  return rows.map((p) => {
    const c = p.categoryId ? catById.get(p.categoryId) : null;
    return {
      ...p,
      category: c ? { id: c.id, slug: c.slug, name: c.name } : null,
      collections: pc.filter((x) => x.productId === p.id).map(({ productId, ...r }) => r),
      images: pm.filter((x) => x.productId === p.id).map((x) => x.m),
      variants: vs.filter((v) => v.productId === p.id).map(({ productId, ...v }) => v),
    };
  });
}

const body = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  description: z.string().optional(),
  details: z.string().optional(),
  categoryId: z.number().int().nullable().optional(),
  sizeGuideId: z.number().int().nullable().optional(),
  price: z.number().int().nonnegative().nullable().optional(),
  comparePrice: z.number().int().nonnegative().nullable().optional(),
  isNew: z.boolean().optional(),
  featured: z.boolean().optional(),
  visible: z.boolean().optional(),
  trackStock: z.boolean().optional(),
  sizesNote: z.string().optional(),
  igUrl: z.string().optional(),
  mediaIds: z.array(z.number().int()).optional(),
  collectionIds: z.array(z.number().int()).optional(),
  variants: z.array(z.object({
    id: z.number().int().optional(), size: z.string().default(''), color: z.string().default(''), colorHex: z.string().default(''), stock: z.number().int().min(0).default(0),
  })).optional(),
});

@Controller('admin/products')
@UseGuards(AuthGuard)
export class ProductsController {
  constructor(@Inject(DB) private db: Db, private rv: Revalidator, private log: ActivityLog) {}

  @Get() list() { return loadProducts(this.db); }

  @Get(':id')
  async one(@Param('id', ParseIntPipe) id: number) {
    const [p] = await loadProducts(this.db, { id });
    if (!p) throw new NotFoundException();
    return p;
  }

  private parse(b: unknown, partial = false) {
    const r = (partial ? body.partial() : body).safeParse(b);
    if (!r.success) throw new BadRequestException(r.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(' · '));
    return r.data;
  }

  private async uniqueSlug(base: string, exceptId?: number) {
    const all = await this.db.select({ id: products.id, slug: products.slug }).from(products);
    const taken = new Set(all.filter((p) => p.id !== exceptId).map((p) => p.slug));
    let slug = slugify(base) || 'prenda';
    for (let i = 2; taken.has(slug); i++) slug = `${slugify(base)}-${i}`;
    return slug;
  }

  private async saveRelations(tx: any, id: number, d: z.infer<typeof body> | Partial<z.infer<typeof body>>) {
    if (d.mediaIds) {
      await tx.delete(productMedia).where(eq(productMedia.productId, id));
      const uniq = [...new Set(d.mediaIds)];
      if (uniq.length) await tx.insert(productMedia).values(uniq.map((mediaId, position) => ({ productId: id, mediaId, position })));
    }
    if (d.collectionIds) {
      await tx.delete(productCollections).where(eq(productCollections.productId, id));
      const uniq = [...new Set(d.collectionIds)];
      if (uniq.length) await tx.insert(productCollections).values(uniq.map((collectionId) => ({ productId: id, collectionId })));
    }
    if (d.variants) {
      const existing = await tx.select({ id: variants.id }).from(variants).where(eq(variants.productId, id));
      const keep = new Set(d.variants.filter((v) => v.id).map((v) => v.id));
      const drop = existing.filter((e: any) => !keep.has(e.id)).map((e: any) => e.id);
      if (drop.length) await tx.delete(variants).where(inArray(variants.id, drop));
      for (let i = 0; i < d.variants.length; i++) {
        const { id: vid, ...v } = d.variants[i];
        if (vid) await tx.update(variants).set({ ...v, position: i }).where(eq(variants.id, vid));
        else await tx.insert(variants).values({ ...v, productId: id, position: i });
      }
    }
  }

  @Post()
  async create(@Body() b: unknown, @CurrentUser() u: SessionUser) {
    const { mediaIds, collectionIds, variants: vs, ...d } = this.parse(b) as z.infer<typeof body>;
    const slug = await this.uniqueSlug(d.slug || d.name);
    const id = await this.db.transaction(async (tx) => {
      const [row] = await tx.insert(products).values({ ...d, slug }).returning();
      await this.saveRelations(tx, row.id, { mediaIds, collectionIds, variants: vs });
      return row.id;
    });
    await this.log.add(u.name, 'creó', 'producto', d.name);
    await this.rv.tags('products');
    return this.one(id);
  }

  @Put('reorder')
  async reorder(@Body() b: { ids: number[] }) {
    await this.db.transaction(async (tx) => {
      for (let i = 0; i < b.ids.length; i++) await tx.update(products).set({ position: i }).where(eq(products.id, Number(b.ids[i])));
    });
    await this.rv.tags('products');
    return { ok: true };
  }

  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() b: unknown, @CurrentUser() u: SessionUser) {
    const { mediaIds, collectionIds, variants: vs, ...d } = this.parse(b, true);
    if (d.slug !== undefined) d.slug = await this.uniqueSlug(d.slug || d.name || 'prenda', id);
    await this.db.transaction(async (tx) => {
      if (Object.keys(d).length) {
        const [row] = await tx.update(products).set(d).where(eq(products.id, id)).returning();
        if (!row) throw new NotFoundException();
      }
      await this.saveRelations(tx, id, { mediaIds, collectionIds, variants: vs });
    });
    const p = await this.one(id);
    await this.log.add(u.name, 'editó', 'producto', p.name);
    await this.rv.tags('products');
    return p;
  }

  @Delete(':id')
  @Roles('admin')
  async remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() u: SessionUser) {
    const [row] = await this.db.delete(products).where(eq(products.id, id)).returning();
    if (!row) throw new NotFoundException();
    await this.log.add(u.name, 'eliminó', 'producto', row.name);
    await this.rv.tags('products');
    return { ok: true };
  }
}
