import Link from 'next/link';
import { getProducts, getSite } from '@/lib/api';
import { Hero } from '@/components/Hero';
import { BenefitIcon, IconArrow, IconInstagram } from '@/components/Icons';
import { Picture } from '@/components/Picture';
import { ProductCard } from '@/components/ProductCard';
import { Reveal } from '@/components/Reveal';
import { StitchDivider } from '@/components/Stitch';
import { Stories, type StoryGroup } from '@/components/Stories';
import { CategoryIndex } from '@/components/home/CategoryIndex';
import { CollectionStack } from '@/components/home/CollectionStack';
import { ShowroomBlock } from '@/components/home/ShowroomBlock';

function SectionHead({ eyebrow, title, id, href, cta }: { eyebrow: string; title: string; id: string; href?: string; cta?: string }) {
  return (
    <div className="container-x flex items-end justify-between gap-4">
      <Reveal>
        <p className="label mb-3 flex items-center gap-3 text-muted"><span className="h-px w-6 bg-accent" />{eyebrow}</p>
        <h2 id={id} className="title !text-[clamp(2.1rem,8.5vw,4.2rem)] !leading-[1]">{title}</h2>
      </Reveal>
      {href && <Link href={href} className="label stitch-link mb-2 hidden shrink-0 sm:inline-block">{cta}</Link>}
    </div>
  );
}

export default async function Home() {
  const [site, products] = await Promise.all([getSite(), getProducts()]);
  const b = site.settings.business;
  const hero = site.banners.find((x) => x.placement === 'hero') ?? null;
  const showroomBanner = site.banners.find((x) => x.placement === 'home');
  const showroomPhotos = site.banners.filter((x) => x.placement === 'showroom' && x.image);
  const news = products.filter((p) => p.isNew);
  const featured = products.filter((p) => p.featured && !p.isNew).slice(0, 8);

  // Historias: la destacada real "En stock" + grupos armados con el catálogo
  const groups: StoryGroup[] = [];
  const byGroup = new Map<string, StoryGroup['items']>();
  for (const s of site.stories) if (s.image) byGroup.set(s.group, [...(byGroup.get(s.group) ?? []), { id: s.id, image: s.image, href: s.href, title: s.title }]);
  for (const [title, items] of byGroup) groups.push({ title, items });
  const fromProducts = (title: string, list: typeof products) => list.length && groups.push({ title, items: list.slice(0, 12).map((p) => ({ id: 100000 + p.id, image: p.images[0], href: `/producto/${p.slug}`, title: p.name })).filter((i) => i.image) });
  fromProducts('Nuevos', news);
  for (const c of site.collections) fromProducts(c.name.split(' / ')[0], products.filter((p) => !p.isNew && p.collections.some((x) => x.slug === c.slug)));
  if (showroomPhotos.length) groups.push({ title: 'Showroom', items: showroomPhotos.map((s) => ({ id: 200000 + s.id, image: s.image!, href: '', title: s.title })) });

  const catRows = site.categories
    .map((c) => ({ slug: c.slug, name: c.name, image: c.image, count: products.filter((p) => p.category?.slug === c.slug).length }))
    .filter((c) => c.count > 0);
  const colCounts = Object.fromEntries(site.collections.map((c) => [c.slug, products.filter((p) => p.collections.some((x) => x.slug === c.slug)).length]));
  const igShots = products.filter((p) => p.images.length).slice(0, 12).map((p) => ({ slug: p.slug, image: p.images[0], name: p.name }));

  const marquee = ['Envíos a todo el país', 'Showroom en Villa Gesell', 'Nuevos ingresos todas las semanas', b.address, 'Envío gratis en Villa Gesell'];

  return (
    <>
      <Hero banner={hero} newCount={news.length} business={b} hours={site.settings.hours} />

      <section className="container-x pt-7 pb-8" aria-label="Historias destacadas">
        <Stories groups={groups} instagram={b.instagram} />
      </section>

      <div className="overflow-hidden border-y border-dashed border-accent/60 bg-pink py-3" aria-hidden>
        <div className="flex w-max gap-10 pr-10 motion-safe:animate-[marquee_42s_linear_infinite]">
          {[...marquee, ...marquee, ...marquee, ...marquee].map((t, i) => (
            <span key={i} className="label flex items-center gap-10 whitespace-nowrap text-[0.66rem]">{t}<span className="h-1 w-1 rounded-full bg-ink/60" /></span>
          ))}
        </div>
      </div>

      {news.length > 0 && (
        <section className="pt-16 md:pt-24" aria-labelledby="h-news">
          <SectionHead eyebrow={`Recién llegados · ${news.length}`} title="Nuevos ingresos" id="h-news" href="/tienda?novedades=1" cta="Ver todos" />
          <ul className="no-scrollbar mt-9 flex snap-x snap-mandatory scroll-pl-5 gap-3 overflow-x-auto px-5 pb-2 md:mx-auto md:grid md:max-w-[86rem] md:grid-cols-4 md:gap-x-6 md:gap-y-12 md:overflow-visible md:px-10">
            {news.slice(0, 8).map((p, i) => (
              <li key={p.id} className="w-[74vw] max-w-[21rem] shrink-0 snap-start md:w-auto md:max-w-none">
                <ProductCard p={p} index={i + 1} sizes="(min-width: 768px) 25vw, 74vw" priority={i < 2} />
              </li>
            ))}
            <li className="w-[40vw] shrink-0 snap-start md:hidden">
              <Link href="/tienda?novedades=1" className="flex aspect-[3/4] flex-col items-center justify-center gap-4 rounded-[3px] border border-dashed border-accent text-center">
                <span className="grid h-14 w-14 place-items-center rounded-full bg-ink text-bg"><IconArrow width={20} height={20} /></span>
                <span className="label text-[0.62rem]">Ver los {news.length}</span>
              </Link>
            </li>
          </ul>
        </section>
      )}

      {catRows.length > 0 && (
        <section className="pt-20 md:pt-28" aria-labelledby="h-cats">
          <SectionHead eyebrow="Elegí por prenda" title="Categorías" id="h-cats" />
          <div className="container-x mt-8"><CategoryIndex rows={catRows} /></div>
        </section>
      )}

      {site.collections.length > 0 && (
        <section className="pt-20 md:pt-28" aria-labelledby="h-cols">
          <SectionHead eyebrow="Temporada" title="Colecciones" id="h-cols" href="/colecciones" cta="Todas las colecciones" />
          <div className="container-x mt-8"><CollectionStack items={site.collections} counts={colCounts} /></div>
        </section>
      )}

      {featured.length > 0 && (
        <section className="pt-16 md:pt-24" aria-labelledby="h-fav">
          <SectionHead eyebrow="Los que más amamos" title="Favoritos de Under" id="h-fav" href="/tienda" cta="Toda la tienda" />
          <ul className="container-x mt-9 grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-4 md:gap-x-6">
            {featured.map((p, i) => (<li key={p.id} className={i % 2 === 1 ? 'mt-10 md:mt-0' : ''}><Reveal delay={(i % 4) * 0.06}><ProductCard p={p} /></Reveal></li>))}
          </ul>
          <div className="container-x mt-12 text-center"><Link href="/tienda" className="btn w-full sm:w-auto">Ver toda la tienda <IconArrow width={18} height={18} /></Link></div>
        </section>
      )}

      <ShowroomBlock banner={showroomBanner} photos={showroomPhotos} business={b} hours={site.settings.hours} />

      {igShots.length > 0 && (
        <section className="pt-16 md:pt-24" aria-labelledby="h-ig">
          <div className="container-x text-center">
            <Reveal>
              <p className="label text-muted">Seguinos</p>
              <h2 id="h-ig" className="mt-3 text-[clamp(1.9rem,7vw,3.4rem)] leading-none font-light">
                <a href={`https://www.instagram.com/${b.instagram}/`} target="_blank" rel="noopener noreferrer" className="stitch-link">@{b.instagram}</a>
              </h2>
            </Reveal>
          </div>
          <ul className="mt-8 grid grid-cols-3 gap-1 md:grid-cols-6">
            {igShots.slice(0, 6).map((s) => (
              <li key={s.slug}>
                <Link href={`/producto/${s.slug}`} className="group relative block aspect-square overflow-hidden bg-surface" aria-label={s.name}>
                  <Picture media={s.image} sizes="(min-width: 768px) 17vw, 33vw" alt="" className="h-full w-full transition-transform duration-[1200ms] group-hover:scale-105" position="center 30%" />
                  <span className="absolute inset-0 grid place-items-center bg-ink/0 text-bg opacity-0 transition duration-300 group-hover:bg-ink/35 group-hover:opacity-100"><IconInstagram /></span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {site.benefits.length > 0 && (
        <section className="container-x pt-16 md:pt-20" aria-label="Beneficios">
          <ul className="grid grid-cols-2 gap-x-5 gap-y-9 md:grid-cols-4">
            {site.benefits.map((x, i) => (
              <li key={x.id}>
                <Reveal delay={i * 0.06}>
                  <span className="grid h-12 w-12 place-items-center rounded-full border border-dashed border-accent"><BenefitIcon name={x.icon} /></span>
                  <h3 className="mt-4 text-base font-medium">{x.title}</h3>
                  <p className="mt-1 text-sm text-muted">{x.text}</p>
                </Reveal>
              </li>
            ))}
          </ul>
          <StitchDivider className="mt-16" />
        </section>
      )}
    </>
  );
}
