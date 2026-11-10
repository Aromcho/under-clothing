import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProducts, getSite, SITE_URL } from '@/lib/api';
import { colorsOf, imgUrl } from '@/lib/format';
import { ProductCard } from '@/components/ProductCard';
import { ProductView } from '@/components/ProductView';
import { Reveal } from '@/components/Reveal';
import { StitchDivider } from '@/components/Stitch';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = (await getProducts()).find((x) => x.slug === slug);
  if (!p) return { title: 'Prenda no encontrada' };
  const colors = colorsOf(p).map((c) => c.name.toLowerCase());
  const description = [p.description, colors.length ? `Disponible en ${colors.join(', ')}.` : '', 'Showroom en Villa Gesell y envíos a todo el país.'].filter(Boolean).join(' ');
  const img = p.images[0];
  return {
    title: p.name, description, alternates: { canonical: `/producto/${p.slug}` },
    openGraph: { title: `${p.name} — Under Clothing`, description, url: `/producto/${p.slug}`, type: 'website', images: img ? [{ url: imgUrl(img, 960), width: Math.min(960, img.width), height: Math.round((Math.min(960, img.width) / img.width) * img.height), alt: p.name }] : undefined },
  };
}

export default async function Producto({ params }: Props) {
  const { slug } = await params;
  const [site, products] = await Promise.all([getSite(), getProducts()]);
  const p = products.find((x) => x.slug === slug);
  if (!p) notFound();
  const guide = site.sizeGuides.find((g) => g.id === p.sizeGuideId) ?? null;
  const related = [...products.filter((x) => x.id !== p.id && x.category?.slug === p.category?.slug), ...products.filter((x) => x.id !== p.id && x.category?.slug !== p.category?.slug && x.collections.some((c) => p.collections.some((k) => k.slug === c.slug)))].slice(0, 4);
  const url = `${SITE_URL}/producto/${p.slug}`;
  const inStock = !p.trackStock || p.variants.some((v) => v.stock > 0);
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'Product', '@id': `${url}#product`, name: p.name, url,
    description: p.description || `${p.name} de Under Clothing.`,
    image: p.images.map((m) => `${SITE_URL}${imgUrl(m, 1440)}`),
    brand: { '@type': 'Brand', name: site.settings.business.name },
    category: p.category?.name,
    color: colorsOf(p).map((c) => c.name).join(', ') || undefined,
    ...(p.price != null ? { offers: { '@type': 'Offer', url, priceCurrency: 'ARS', price: p.price, availability: `https://schema.org/${inStock ? 'InStock' : 'OutOfStock'}`, itemCondition: 'https://schema.org/NewCondition', seller: { '@id': `${SITE_URL}/#store` } } } : {}),
  };
  const crumbs = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [{ name: 'Tienda', item: `${SITE_URL}/tienda` }, ...(p.category ? [{ name: p.category.name, item: `${SITE_URL}/tienda?categoria=${p.category.slug}` }] : []), { name: p.name, item: url }].map((x, i) => ({ '@type': 'ListItem', position: i + 1, ...x })),
  };
  return (
    <div className="container-x pt-[calc(var(--header-h)+0px)] md:pt-[calc(var(--header-h)+2rem)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, crumbs]).replace(/</g, '\\u003c') }} />
      <ProductView p={p} guide={guide} info={{ shipping: site.settings.shipping, returns: site.settings.returns }} url={url} />
      {related.length > 0 && (
        <section className="pt-20" aria-labelledby="h-rel">
          <StitchDivider className="mb-12" />
          <Reveal><p className="label mb-3 text-muted">Seguí mirando</p><h2 id="h-rel" className="title">También te puede gustar</h2></Reveal>
          <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-4 md:gap-x-6">{related.map((r, i) => (<li key={r.id}><Reveal delay={i * 0.06}><ProductCard p={r} /></Reveal></li>))}</ul>
        </section>
      )}
    </div>
  );
}
