import type { Metadata } from 'next';
import Link from 'next/link';
import { getProducts, getSite } from '@/lib/api';
import { IconArrow } from '@/components/Icons';
import { PageHeader } from '@/components/PageHeader';
import { Picture } from '@/components/Picture';
import { Parallax, Reveal } from '@/components/Reveal';

export const metadata: Metadata = { title: 'Colecciones', description: 'Las colecciones de Under Clothing por temporada.', alternates: { canonical: '/colecciones' } };

export default async function Colecciones() {
  const [site, products] = await Promise.all([getSite(), getProducts()]);
  const banner = site.banners.find((b) => b.placement === 'tienda');
  return (
    <>
      <PageHeader eyebrow="Temporada" title="Colecciones" image={banner?.image} />
      <div className="container-x space-y-5 md:space-y-8">
        {site.collections.map((c, i) => {
          const n = products.filter((p) => p.collections.some((x) => x.slug === c.slug)).length;
          return (
            <Reveal key={c.id}>
              <Link href={`/colecciones/${c.slug}`} className={`group grid overflow-hidden rounded-[1.4rem] bg-surface md:grid-cols-2 ${i % 2 ? 'md:[&>*:first-child]:order-2' : ''}`}>
                <Parallax amount={24} className="aspect-[4/3.6] md:aspect-[4/3]">{c.image && <Picture media={c.image} sizes="(min-width: 768px) 50vw, 100vw" alt="" className="h-full w-full" position="center 30%" />}</Parallax>
                <div className="flex flex-col justify-center p-7 md:p-14">
                  <p className="label text-muted">{n} prendas</p>
                  <h2 className="title mt-3">{c.name}</h2>
                  <p className="mt-3 text-lg font-light text-muted">{c.description || c.tagline}</p>
                  <span className="label mt-7 inline-flex items-center gap-3">Ver colección <IconArrow width={18} height={18} className="transition-transform duration-500 group-hover:translate-x-1.5" /></span>
                </div>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </>
  );
}
