import { z } from 'zod';
import { schema } from '../db/db';
import { crud } from './crud';

const pos = { position: z.number().int().optional(), visible: z.boolean().optional() };
const mediaId = z.number().int().nullable().optional();

export const CategoriesController = crud({
  path: 'categories', table: schema.categories, label: 'categoría', tags: ['site', 'products'], slugFrom: 'name',
  schema: z.object({ name: z.string().min(1), slug: z.string().optional(), description: z.string().optional(), mediaId, ...pos }),
});
export const CollectionsController = crud({
  path: 'collections', table: schema.collections, label: 'colección', tags: ['site', 'products'], slugFrom: 'name',
  schema: z.object({ name: z.string().min(1), slug: z.string().optional(), tagline: z.string().optional(), description: z.string().optional(), mediaId, ...pos }),
});
export const StoriesController = crud({
  path: 'stories', table: schema.stories, label: 'historia', tags: ['site'], nameKey: 'title',
  schema: z.object({ title: z.string().optional(), group: z.string().min(1), mediaId, href: z.string().optional(), ...pos }),
});
export const BannersController = crud({
  path: 'banners', table: schema.banners, label: 'banner', tags: ['site'], nameKey: 'title',
  schema: z.object({ placement: z.string().min(1), eyebrow: z.string().optional(), title: z.string().min(1), text: z.string().optional(), ctaLabel: z.string().optional(), ctaHref: z.string().optional(), mediaId, mobileMediaId: mediaId, ...pos }),
});
export const BenefitsController = crud({
  path: 'benefits', table: schema.benefits, label: 'beneficio', tags: ['site'], nameKey: 'title',
  schema: z.object({ icon: z.string().optional(), title: z.string().min(1), text: z.string().optional(), ...pos }),
});
export const SizeGuidesController = crud({
  path: 'size-guides', table: schema.sizeGuides, label: 'guía de talles', tags: ['site', 'products'],
  schema: z.object({ name: z.string().min(1), columns: z.array(z.string()), rows: z.array(z.array(z.string())), note: z.string().optional(), ...pos }),
});
