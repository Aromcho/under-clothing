import { getProducts, getSite, SITE_URL } from '@/lib/api';
import { colorsOf, imgUrl } from '@/lib/format';
import { CartProvider } from '@/components/Cart';
import { Footer } from '@/components/Footer';
import { Header, type SearchEntry } from '@/components/Header';
import { ScrollThread } from '@/components/Stitch';

export const dynamic = 'force-dynamic';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [site, products] = await Promise.all([getSite(), getProducts()]);
  const { business: b, hours } = site.settings;
  const index: SearchEntry[] = products.map((p) => ({
    slug: p.slug, name: p.name, category: p.category?.name ?? '', price: p.price, isNew: p.isNew,
    image: p.images[0] ? imgUrl(p.images[0], 320) : null, colors: colorsOf(p).map((c) => c.name).join(' '),
  }));
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ClothingStore',
    '@id': `${SITE_URL}/#store`,
    name: b.name,
    description: b.description,
    url: SITE_URL,
    image: `${SITE_URL}/opengraph-image`,
    logo: `${SITE_URL}/brand/logo-circle.png`,
    address: { '@type': 'PostalAddress', streetAddress: b.address, addressLocality: b.city, addressRegion: b.province, addressCountry: b.country },
    areaServed: { '@type': 'Country', name: 'Argentina' },
    sameAs: [`https://www.instagram.com/${b.instagram}/`],
    ...(b.whatsapp ? { telephone: b.whatsapp } : {}),
    openingHoursSpecification: hours.days.flatMap((d) => d.ranges.map(([opens, closes]) => ({ '@type': 'OpeningHoursSpecification', dayOfWeek: dayNames[d.day], opens, closes }))),
  };
  return (
    <CartProvider business={b}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <Header nav={{ categories: site.categories.map(({ slug, name }) => ({ slug, name })), collections: site.collections.map(({ slug, name }) => ({ slug, name })) }} index={index} business={b} />
      <ScrollThread />
      <main id="contenido" className="min-h-[70vh]">{children}</main>
      <Footer site={site} />
    </CartProvider>
  );
}
