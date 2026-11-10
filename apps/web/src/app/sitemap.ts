import type { MetadataRoute } from 'next';
import { getProducts, getSite, SITE_URL } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [site, products] = await Promise.all([getSite(), getProducts()]);
  const now = new Date();
  const page = (path: string, priority: number, changeFrequency: 'daily' | 'weekly' | 'monthly' = 'weekly') => ({ url: `${SITE_URL}${path}`, lastModified: now, changeFrequency, priority });
  return [
    page('', 1, 'daily'), page('/tienda', 0.9, 'daily'), page('/colecciones', 0.7), page('/contacto', 0.7, 'monthly'),
    page('/envios', 0.4, 'monthly'), page('/cambios-y-devoluciones', 0.4, 'monthly'), page('/medios-de-pago', 0.4, 'monthly'), page('/guia-de-talles', 0.4, 'monthly'),
    ...site.collections.map((c) => page(`/colecciones/${c.slug}`, 0.7)),
    ...products.map((p) => ({ url: `${SITE_URL}/producto/${p.slug}`, lastModified: new Date(p.publishedAt), changeFrequency: 'weekly' as const, priority: p.isNew ? 0.8 : 0.6 })),
  ];
}
