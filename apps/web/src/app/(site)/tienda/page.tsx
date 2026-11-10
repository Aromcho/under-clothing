import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getProducts, getSite } from '@/lib/api';
import { Catalog } from '@/components/Catalog';
import { PageHeader } from '@/components/PageHeader';

export const metadata: Metadata = {
  title: 'Tienda',
  description: 'Todas las prendas de Under Clothing: tops, vestidos, sweaters, buzos, jeans, shorts y polleras. Elegí talle y color y hacé tu pedido.',
  alternates: { canonical: '/tienda' },
};

export default async function Tienda() {
  const [site, products] = await Promise.all([getSite(), getProducts()]);
  const banner = site.banners.find((b) => b.placement === 'tienda');
  return (
    <>
      <PageHeader eyebrow={banner?.eyebrow || 'Tienda'} title={banner?.title || 'Todas las prendas'} text={banner?.text} image={banner?.image} />
      <div className="container-x">
        <Suspense>
          <Catalog products={products} categories={site.categories.map(({ slug, name }) => ({ slug, name }))} collections={site.collections.map(({ slug, name }) => ({ slug, name }))} />
        </Suspense>
      </div>
    </>
  );
}
