import Link from 'next/link';
import type { Banner, Settings } from '@/lib/types';
import { AutoVideo } from '../AutoVideo';
import { IconArrow, IconInstagram, IconPin } from '../Icons';
import { HoursTable, OpenNow } from '../OpenNow';
import { Picture } from '../Picture';
import { Reveal } from '../Reveal';

/** El showroom real: video del local, dirección, "Abierto ahora" y horarios. */
export function ShowroomBlock({ banner, photos, business, hours }: { banner?: Banner; photos: Banner[]; business: Settings['business']; hours: Settings['hours'] }) {
  return (
    <section className="linen mt-20 lg:mt-28" aria-labelledby="h-show">
      <div className="lg:mx-auto lg:grid lg:max-w-[82rem] lg:px-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-14 lg:py-20">
        <div className="relative h-[82svh] max-h-[52rem] overflow-hidden lg:aspect-[9/16] lg:w-full lg:max-w-[26rem] lg:justify-self-center lg:h-auto lg:max-h-[80svh] lg:rounded-[6px]">
          <AutoVideo src="/media/local-720.mp4" poster="/media/local-poster.jpg" label="El showroom de Under por dentro" className="h-full w-full object-cover" controlClassName="absolute top-4 right-4 z-10" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink/80 to-transparent lg:hidden" />
          <div className="absolute inset-x-5 bottom-6 text-bg lg:hidden">
            <p className="label text-[0.6rem] text-pink">{banner?.eyebrow || 'Showroom'}</p>
            <h2 className="mt-2 text-[2.6rem] leading-[1.02] font-light">{banner?.title || 'Vení a probarte todo'}</h2>
          </div>
        </div>
        <div className="px-5 pt-8 pb-14 lg:px-0 lg:py-0">
          <Reveal>
            <p className="label hidden text-muted lg:block">{banner?.eyebrow || 'Showroom'}</p>
            <h2 id="h-show" className="title hidden lg:mt-3 lg:block lg:!text-[clamp(2.4rem,4vw,4rem)]">{banner?.title || 'Vení a probarte todo'}</h2>
            <h2 className="sr-only lg:hidden">{banner?.title || 'Vení a probarte todo'}</h2>
            {banner?.text && <p className="max-w-md text-lg font-light text-muted lg:mt-4">{banner.text}</p>}
            <div className="mt-6 flex flex-col gap-3">
              <p className="flex items-start gap-3"><IconPin className="mt-0.5 shrink-0" /><span>{business.address}<br /><span className="text-muted">{business.city}, {business.province}</span></span></p>
              <OpenNow hours={hours} className="pl-0.5" />
            </div>
            <div className="mt-6 max-w-md rounded-[6px] bg-bg/70 px-4 py-1"><HoursTable hours={hours} /></div>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href={banner?.ctaHref || '/contacto'} className="btn">{banner?.ctaLabel || 'Cómo llegar'} <IconArrow width={18} height={18} /></Link>
              <a href={`https://www.instagram.com/${business.instagram}/`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost"><IconInstagram width={18} height={18} /> @{business.instagram}</a>
            </div>
          </Reveal>
          {photos.length > 0 && (
            <ul className="no-scrollbar -mx-5 mt-9 flex gap-2 overflow-x-auto px-5 lg:mx-0 lg:grid lg:grid-cols-3 lg:px-0">
              {photos.slice(2, 5).map((s) => (
                <li key={s.id} className="w-[38vw] shrink-0 lg:w-auto"><Picture media={s.image!} sizes="(min-width: 1024px) 14vw, 38vw" className="aspect-[3/4] w-full rounded-[3px]" alt={s.title} /></li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
