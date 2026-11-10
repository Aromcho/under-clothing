import { pgTable, serial, text, integer, boolean, jsonb, timestamp, primaryKey, index } from 'drizzle-orm/pg-core';

const ts = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').$type<'admin' | 'editor'>().notNull().default('editor'),
  createdAt: ts(),
});

export const media = pgTable('media', {
  id: serial('id').primaryKey(),
  path: text('path').notNull(), // /uploads/<carpeta>
  alt: text('alt').notNull().default(''),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  widths: jsonb('widths').$type<number[]>().notNull(),
  blur: text('blur').notNull(), // data URI
  color: text('color').notNull().default('#F5ECE9'),
  position: integer('position').notNull().default(0),
  createdAt: ts(),
});

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  mediaId: integer('media_id').references(() => media.id, { onDelete: 'set null' }),
  position: integer('position').notNull().default(0),
  visible: boolean('visible').notNull().default(true),
});

export const collections = pgTable('collections', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  tagline: text('tagline').notNull().default(''),
  description: text('description').notNull().default(''),
  mediaId: integer('media_id').references(() => media.id, { onDelete: 'set null' }),
  position: integer('position').notNull().default(0),
  visible: boolean('visible').notNull().default(true),
});

export const sizeGuides = pgTable('size_guides', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  columns: jsonb('columns').$type<string[]>().notNull().default([]),
  rows: jsonb('rows').$type<string[][]>().notNull().default([]),
  note: text('note').notNull().default(''),
  position: integer('position').notNull().default(0),
  visible: boolean('visible').notNull().default(true),
});

export const products = pgTable(
  'products',
  {
    id: serial('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    name: text('name').notNull(),
    description: text('description').notNull().default(''),
    details: text('details').notNull().default(''),
    categoryId: integer('category_id').references(() => categories.id, { onDelete: 'set null' }),
    sizeGuideId: integer('size_guide_id').references(() => sizeGuides.id, { onDelete: 'set null' }),
    price: integer('price'), // ARS, null = consultar
    comparePrice: integer('compare_price'),
    isNew: boolean('is_new').notNull().default(false),
    featured: boolean('featured').notNull().default(false),
    visible: boolean('visible').notNull().default(true),
    trackStock: boolean('track_stock').notNull().default(false), // false = disponibilidad a confirmar por mensaje
    sizesNote: text('sizes_note').notNull().default(''),
    igUrl: text('ig_url').notNull().default(''),
    position: integer('position').notNull().default(0),
    publishedAt: timestamp('published_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: ts(),
  },
  (t) => [index('products_cat_idx').on(t.categoryId)],
);

export const productMedia = pgTable(
  'product_media',
  {
    productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
    mediaId: integer('media_id').notNull().references(() => media.id, { onDelete: 'cascade' }),
    position: integer('position').notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.productId, t.mediaId] })],
);

export const productCollections = pgTable(
  'product_collections',
  {
    productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
    collectionId: integer('collection_id').notNull().references(() => collections.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.productId, t.collectionId] })],
);

export const variants = pgTable(
  'variants',
  {
    id: serial('id').primaryKey(),
    productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
    size: text('size').notNull().default(''),
    color: text('color').notNull().default(''),
    colorHex: text('color_hex').notNull().default(''),
    stock: integer('stock').notNull().default(0),
    position: integer('position').notNull().default(0),
  },
  (t) => [index('variants_product_idx').on(t.productId)],
);

export const stories = pgTable('stories', {
  id: serial('id').primaryKey(),
  title: text('title').notNull().default(''),
  group: text('group').notNull().default('En stock'),
  mediaId: integer('media_id').references(() => media.id, { onDelete: 'cascade' }),
  href: text('href').notNull().default(''),
  position: integer('position').notNull().default(0),
  visible: boolean('visible').notNull().default(true),
});

export const banners = pgTable('banners', {
  id: serial('id').primaryKey(),
  placement: text('placement').notNull().default('home'), // hero | home | tienda
  eyebrow: text('eyebrow').notNull().default(''),
  title: text('title').notNull(),
  text: text('text').notNull().default(''),
  ctaLabel: text('cta_label').notNull().default(''),
  ctaHref: text('cta_href').notNull().default(''),
  mediaId: integer('media_id').references(() => media.id, { onDelete: 'set null' }),
  mobileMediaId: integer('mobile_media_id').references(() => media.id, { onDelete: 'set null' }),
  position: integer('position').notNull().default(0),
  visible: boolean('visible').notNull().default(true),
});

export const benefits = pgTable('benefits', {
  id: serial('id').primaryKey(),
  icon: text('icon').notNull().default('tag'),
  title: text('title').notNull(),
  text: text('text').notNull().default(''),
  position: integer('position').notNull().default(0),
  visible: boolean('visible').notNull().default(true),
});

export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').$type<Record<string, any>>().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type OrderItem = {
  productId: number; variantId: number | null; name: string; slug: string;
  size: string; color: string; qty: number; price: number | null; image: string | null;
};
export type OrderNote = { at: string; by: string; text: string };

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  kind: text('kind').$type<'pedido' | 'consulta'>().notNull().default('pedido'),
  status: text('status').notNull().default('nuevo'),
  customerName: text('customer_name').notNull(),
  phone: text('phone').notNull().default(''),
  delivery: text('delivery').notNull().default('retiro'), // retiro | envio
  address: text('address').notNull().default(''),
  message: text('message').notNull().default(''),
  items: jsonb('items').$type<OrderItem[]>().notNull().default([]),
  total: integer('total'),
  stockApplied: boolean('stock_applied').notNull().default(false),
  notes: jsonb('notes').$type<OrderNote[]>().notNull().default([]),
  createdAt: ts(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const activity = pgTable('activity', {
  id: serial('id').primaryKey(),
  userName: text('user_name').notNull().default('Sistema'),
  action: text('action').notNull(), // creó | editó | eliminó | ...
  entity: text('entity').notNull(),
  summary: text('summary').notNull().default(''),
  createdAt: ts(),
});
