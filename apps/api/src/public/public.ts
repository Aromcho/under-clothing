import { Controller, Get, Inject } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import { DB, Db, schema } from '../db/db';
import { loadProducts } from '../products/products';
import { loadSettings } from '../settings/settings';

const { categories, collections, stories, banners, benefits, sizeGuides, media } = schema;

@Controller('public')
export class PublicController {
  constructor(@Inject(DB) private db: Db) {}

  @Get('site')
  async site() {
    const withMedia = async <T extends { mediaId: number | null }>(rows: T[]) => {
      const all = await this.db.select().from(media);
      const byId = new Map(all.map((m) => [m.id, m]));
      return rows.map((r: any) => ({ ...r, image: r.mediaId ? byId.get(r.mediaId) ?? null : null, mobileImage: r.mobileMediaId ? byId.get(r.mobileMediaId) ?? null : null }));
    };
    const vis = <T extends { visible: boolean }>(rows: T[]) => rows.filter((r) => r.visible);
    const [settings, cats, cols, sts, bns, bfs, sgs] = await Promise.all([
      loadSettings(this.db),
      this.db.select().from(categories).orderBy(asc(categories.position), asc(categories.id)),
      this.db.select().from(collections).orderBy(asc(collections.position), asc(collections.id)),
      this.db.select().from(stories).orderBy(asc(stories.position), asc(stories.id)),
      this.db.select().from(banners).orderBy(asc(banners.position), asc(banners.id)),
      this.db.select().from(benefits).where(eq(benefits.visible, true)).orderBy(asc(benefits.position), asc(benefits.id)),
      this.db.select().from(sizeGuides).where(eq(sizeGuides.visible, true)).orderBy(asc(sizeGuides.position), asc(sizeGuides.id)),
    ]);
    return {
      settings,
      categories: await withMedia(vis(cats)),
      collections: await withMedia(vis(cols)),
      stories: (await withMedia(vis(sts))).filter((s) => s.image),
      banners: await withMedia(vis(bns)),
      benefits: bfs,
      sizeGuides: sgs,
    };
  }

  @Get('products')
  products() { return loadProducts(this.db, { onlyVisible: true }); }
}
