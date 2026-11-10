'use client';

import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import Link from 'next/link';
import { useRef } from 'react';
import type { Banner, Settings } from '@/lib/types';
import { AutoVideo } from './AutoVideo';
import { HangTag } from './HangTag';
import { IconArrow, IconPin } from './Icons';
import { OpenNow } from './OpenNow';

/**
 * Portada: el recorrido real del showroom en video.
 * Celular: video a pantalla completa con el texto encima.
 * Escritorio: tipografía grande a la izquierda y el video en un marco vertical a la derecha.
 * La etiqueta (elemento firma) cuelga sobre el video.
 */
export function Hero({ banner, newCount, business, hours }: { banner: Banner | null; newCount: number; business: Settings['business']; hours: Settings['hours'] }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const yText = useTransform(scrollYProgress, [0, 1], ['0%', '-14%']);
  const words = (banner?.title || 'Tu próximo “me lo merezco” está acá').split(' ');

  return (
    <section ref={ref} className="relative isolate overflow-hidden lg:bg-bg" aria-label="Portada">
      <div className="lg:mx-auto lg:grid lg:max-w-[82rem] lg:px-10 lg:min-h-[100svh] lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:gap-12 lg:pt-[var(--header-h)] lg:pb-10">
        {/* Video */}
        <div className="absolute inset-0 -z-10 lg:relative lg:inset-auto lg:z-0 lg:order-2 lg:justify-self-center">
          <div className="relative h-full w-full overflow-hidden bg-ink lg:aspect-[9/16] lg:h-[min(84svh,880px)] lg:w-auto lg:rounded-[1.6rem] lg:shadow-[var(--shadow-soft)]">
            <AutoVideo src="/media/showroom-720.mp4" poster="/media/showroom-poster.jpg" label="Recorrido por el showroom de Under en Villa Gesell" className="h-full w-full object-cover" controlClassName="absolute right-4 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-20 lg:bottom-5" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-ink/60 to-transparent lg:hidden" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-ink/85 via-ink/45 to-transparent lg:h-1/3 lg:from-ink/40 lg:via-transparent" />
            <p className="label absolute bottom-6 left-6 hidden text-[0.6rem] text-bg/90 lg:block">{business.address} · {business.city}</p>
          </div>
          {/* etiqueta colgando sobre el marco (escritorio) */}
          <div className="absolute -top-[var(--header-h)] -left-14 z-10 hidden lg:block">
            <HangTag size={150} thread={150} front={<TagFront />} back={<TagBack count={newCount} />} />
          </div>
        </div>

        {/* etiqueta (celular) */}
        <div className="absolute top-0 right-[7%] z-10 lg:hidden">
          <HangTag size={112} thread={128} front={<TagFront />} back={<TagBack count={newCount} />} />
        </div>

        {/* Texto */}
        <motion.div className="relative flex min-h-[100svh] flex-col justify-end px-5 pt-[calc(var(--header-h)+9rem)] pb-[max(2.25rem,env(safe-area-inset-bottom))] text-bg lg:order-1 lg:min-h-0 lg:px-0 lg:py-0 lg:text-ink" style={reduce ? undefined : { y: yText }}>
          <p className="label mb-4 text-bg/90 lg:mb-6 lg:text-muted">{banner?.eyebrow || 'Showroom · Villa Gesell · Envíos a todo el país'}</p>
          <h1 className="max-w-[13ch] text-[clamp(2.6rem,11vw,3.4rem)] leading-[1.02] font-light tracking-[-0.02em] lg:max-w-[12ch] lg:text-[clamp(3.6rem,5.6vw,6.2rem)]">
            {words.map((w, i) => (
              <span key={i} className="inline-block overflow-hidden pb-[0.1em] align-bottom">
                <span className="word-up inline-block" style={{ animationDelay: `${0.1 + i * 0.06}s` }}>
                  {w}{i < words.length - 1 ? ' ' : ''}
                </span>
              </span>
            ))}
          </h1>
          {banner?.text && <p className="fade-up mt-4 max-w-sm text-[1.05rem] font-light text-bg/85 [animation-delay:0.5s] lg:mt-6 lg:text-lg lg:text-muted">{banner.text}</p>}
          <div className="fade-up mt-7 flex flex-wrap gap-3 [animation-delay:0.65s] lg:mt-9">
            <Link href={banner?.ctaHref || '/tienda?novedades=1'} className="btn !bg-bg !text-ink lg:!bg-ink lg:!text-bg">{banner?.ctaLabel || 'Ver nuevos ingresos'} <IconArrow width={18} height={18} /></Link>
            <Link href="/tienda" className="btn btn-ghost !text-bg ![box-shadow:inset_0_0_0_1px_rgb(255_253_251/0.8)] hover:!bg-bg hover:!text-ink lg:!text-ink lg:![box-shadow:inset_0_0_0_1px_var(--color-ink)] lg:hover:!bg-ink lg:hover:!text-bg">Toda la tienda</Link>
          </div>
          <div className="fade-up mt-8 hidden items-center gap-6 border-t border-line pt-6 text-sm [animation-delay:0.8s] lg:flex">
            <span className="flex items-center gap-2"><IconPin width={18} height={18} /> {business.address}, {business.city}</span>
            <OpenNow hours={hours} />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function TagFront() {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/brand/logo.png" alt="Under Clothing" className="w-[80%] mix-blend-multiply" draggable={false} />;
}
function TagBack({ count }: { count: number }) {
  return (
    <span className="flex flex-col items-center gap-1 text-center text-ink">
      <span className="label text-[0.5rem] text-muted lg:text-[0.6rem]">New in</span>
      <span className="text-3xl leading-none font-light lg:text-[2.6rem]">{count}</span>
      <span className="label text-[0.48rem] lg:text-[0.55rem]">nuevos<br />ingresos</span>
    </span>
  );
}
