import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { getProducts, getSite } from '@/lib/api';
import { Catalog } from '@/components/Catalog';
import { PageHeader } from '@/components/PageHeader';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = (await getSite()).collections.find((x) => x.slug === slug);
  if (!c) return {};
  return { title: c.name, description: c.description || c.tagline, alternates: { canonical: `/colecciones/${c.slug}` } };
}

export default async function Coleccion({ params }: Props) {
  const { slug } = await params;
  const [site, products] = await Promise.all([getSite(), getProducts()]);
  const c = site.collections.find((x) => x.slug === slug);
  if (!c) notFound();
  const list = products.filter((p) => p.collections.some((x) => x.slug === slug));
  const cats = site.categories.filter((k) => list.some((p) => p.category?.slug === k.slug)).map(({ slug, name }) => ({ slug, name }));
  return (
    <>
      <PageHeader eyebrow={`Colección · ${c.tagline}`} title={c.name} text={c.description} image={c.image} />
      <div className="container-x">
        <Suspense><Catalog products={list} categories={cats} collections={[]} lockCollection={slug} /></Suspense>
      </div>
    </>
  );
}
