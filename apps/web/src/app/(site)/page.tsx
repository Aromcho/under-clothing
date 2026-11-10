import Link from 'next/link';
import { getProducts, getSite } from '@/lib/api';
import { Hero } from '@/components/Hero';
import { BenefitIcon, IconArrow, IconInstagram, IconPin } from '@/components/Icons';
import { OpenNow } from '@/components/OpenNow';
import { Picture } from '@/components/Picture';
import { ProductCard } from '@/components/ProductCard';
import { Parallax, Reveal } from '@/components/Reveal';
import { StitchDivider } from '@/components/Stitch';
import { Stories, type StoryGroup } from '@/components/Stories';

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

  const marquee = ['Envíos a todo el país', 'Showroom en Villa Gesell', 'Nuevos ingresos', b.address, 'Envío gratis en Villa Gesell'];

  return (
    <>
      <Hero banner={hero} newCount={news.length} />

      <section className="container-x pt-6 pb-10" aria-label="Historias destacadas">
        <Stories groups={groups} instagram={b.instagram} />
      </section>

      <div className="overflow-hidden bg-pink py-3.5" aria-hidden>
        <div className="flex w-max animate-[marquee_38s_linear_infinite] gap-10 pr-10">
          {[...marquee, ...marquee, ...marquee, ...marquee].map((t, i) => (
            <span key={i} className="label flex items-center gap-10 whitespace-nowrap">{t}<span className="h-1 w-1 rounded-full bg-ink/60" /></span>
          ))}
        </div>
      </div>

      {news.length > 0 && (
        <section className="pt-16 md:pt-24" aria-labelledby="h-news">
          <div className="container-x flex items-end justify-between gap-4">
            <Reveal>
              <p className="label mb-3 text-muted">Recién llegados</p>
              <h2 id="h-news" className="title">Nuevos ingresos</h2>
            </Reveal>
            <Link href="/tienda?novedades=1" className="label stitch-link mb-2 hidden shrink-0 sm:inline-block">Ver todos</Link>
          </div>
          <ul className="no-scrollbar mt-8 flex snap-x snap-mandatory scroll-pl-5 gap-4 overflow-x-auto px-5 pb-2 md:mx-auto md:grid md:max-w-[82rem] md:grid-cols-4 md:px-10 md:gap-x-6 md:gap-y-10 md:overflow-visible">
            {news.slice(0, 8).map((p, i) => (
              <li key={p.id} className="fade-up w-[64vw] max-w-[19rem] shrink-0 snap-start md:w-auto md:max-w-none" style={{ animationDelay: `${Math.min(i, 4) * 70}ms` }}>
                <ProductCard p={p} sizes="(min-width: 768px) 25vw, 64vw" priority={i < 2} />
              </li>
            ))}
          </ul>
          <div className="container-x mt-6 sm:hidden"><Link href="/tienda?novedades=1" className="btn btn-ghost w-full">Ver todos los ingresos</Link></div>
        </section>
      )}

      <section className="container-x pt-20 md:pt-28" aria-labelledby="h-cats">
        <Reveal>
          <p className="label mb-3 text-muted">Elegí por prenda</p>
          <h2 id="h-cats" className="title">Categorías</h2>
        </Reveal>
        <ul className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-5 md:gap-4">
          {site.categories.map((c, i) => (
            <li key={c.id}>
              <Reveal delay={(i % 5) * 0.05}>
                <Link href={`/tienda?categoria=${c.slug}`} className={`group relative block overflow-hidden rounded-[1.1rem] bg-surface aspect-[4/5]`}>
                  {c.image && <Picture media={c.image} sizes="(min-width: 768px) 20vw, 50vw" alt="" className="h-full w-full transition-transform duration-[1400ms] ease-[var(--ease-out-soft)] group-hover:scale-105" position="center 22%" />}
                  <span className="absolute inset-0 bg-gradient-to-t from-ink/55 via-transparent to-transparent" />
                  <span className="absolute inset-x-3 bottom-3 flex items-center justify-between rounded-full bg-bg/92 py-2.5 pr-3 pl-4 backdrop-blur">
                    <span className="label text-[0.625rem]">{c.name}</span>
                    <IconArrow width={16} height={16} className="transition-transform duration-500 group-hover:translate-x-1" />
                  </span>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
      </section>

      {site.collections.length > 0 && (
        <section className="container-x pt-20 md:pt-28" aria-labelledby="h-cols">
          <Reveal>
            <p className="label mb-3 text-muted">Temporada</p>
            <h2 id="h-cols" className="title">Colecciones</h2>
          </Reveal>
          <div className="mt-8 grid gap-4 md:grid-cols-3 md:gap-5">
            {site.collections.map((c, i) => (
              <Reveal key={c.id} delay={i * 0.08}>
                <Link href={`/colecciones/${c.slug}`} className="group relative block overflow-hidden rounded-[1.4rem] bg-surface">
                  <Parallax amount={26} className="aspect-[4/5] md:aspect-[3/4]">
                    {c.image && <Picture media={c.image} sizes="(min-width: 768px) 33vw, 100vw" alt="" className="h-full w-full" position="center 30%" />}
                  </Parallax>
                  <span className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
                  <span className="absolute inset-x-5 bottom-5 text-bg">
                    <span className="label text-[0.625rem] opacity-90">{c.tagline}</span>
                    <span className="mt-2 flex items-end justify-between gap-3">
                      <span className="text-3xl leading-none font-light">{c.name}</span>
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-bg text-ink transition-transform duration-500 group-hover:-rotate-45"><IconArrow width={18} height={18} /></span>
                    </span>
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {featured.length > 0 && (
        <section className="container-x pt-20 md:pt-28" aria-labelledby="h-fav">
          <div className="flex items-end justify-between gap-4">
            <Reveal>
              <p className="label mb-3 text-muted">Los que más amamos</p>
              <h2 id="h-fav" className="title">Favoritos de Under</h2>
            </Reveal>
            <Link href="/tienda" className="label stitch-link mb-2 hidden shrink-0 sm:inline-block">Toda la tienda</Link>
          </div>
          <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-4 md:gap-x-6">
            {featured.map((p, i) => (<li key={p.id}><Reveal delay={(i % 4) * 0.06}><ProductCard p={p} /></Reveal></li>))}
          </ul>
          <div className="mt-10 text-center"><Link href="/tienda" className="btn">Ver toda la tienda <IconArrow width={18} height={18} /></Link></div>
        </section>
      )}

      {/* Showroom */}
      <section className="relative mt-20 overflow-hidden md:mt-28" aria-labelledby="h-show">
        <div className="linen">
          <div className="container-x grid gap-10 py-16 md:grid-cols-2 md:items-center md:gap-16 md:py-24">
            <Reveal>
              <p className="label mb-3 text-muted">{showroomBanner?.eyebrow || 'Showroom'}</p>
              <h2 id="h-show" className="title">{showroomBanner?.title || 'Vení a probarte todo'}</h2>
              {showroomBanner?.text && <p className="mt-4 max-w-md text-lg font-light text-muted">{showroomBanner.text}</p>}
              <div className="mt-7 space-y-3">
                <p className="flex items-start gap-3"><IconPin className="mt-0.5 shrink-0" /><span>{b.address}<br /><span className="text-muted">{b.city}, {b.province}</span></span></p>
                <OpenNow hours={site.settings.hours} className="pl-0.5" />
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={showroomBanner?.ctaHref || '/contacto'} className="btn">{showroomBanner?.ctaLabel || 'Cómo llegar'}</Link>
                <a href={`https://www.instagram.com/${b.instagram}/`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost"><IconInstagram width={18} height={18} /> @{b.instagram}</a>
              </div>
            </Reveal>
            {showroomPhotos.length > 0 && (
              <div className="grid grid-cols-5 grid-rows-6 gap-3 md:gap-4">
                {showroomPhotos.slice(0, 3).map((s, i) => (
                  <Reveal key={s.id} delay={i * 0.1} className={['col-span-3 row-span-6', 'col-span-2 row-span-3', 'col-span-2 row-span-3'][i]}>
                    <Parallax amount={i === 0 ? 22 : 12} className={`h-full rounded-[1.2rem] ${i === 0 ? 'aspect-[3/4.4]' : ''}`}>
                      <Picture media={s.image!} sizes="(min-width: 768px) 30vw, 60vw" className="h-full w-full" />
                    </Parallax>
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {site.benefits.length > 0 && (
        <section className="container-x pt-16 md:pt-20" aria-label="Beneficios">
          <ul className="grid grid-cols-2 gap-x-5 gap-y-9 md:grid-cols-4">
            {site.benefits.map((x, i) => (
              <li key={x.id}>
                <Reveal delay={i * 0.06}>
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-surface"><BenefitIcon name={x.icon} /></span>
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
