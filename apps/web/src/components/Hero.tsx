'use client';

import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import Link from 'next/link';
import { useRef } from 'react';
import type { Banner } from '@/lib/types';
import { srcSet, imgUrl } from '@/lib/format';
import { HangTag } from './HangTag';
import { IconArrow } from './Icons';

export function Hero({ banner, newCount }: { banner: Banner | null; newCount: number }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const yBg = useTransform(scrollYProgress, [0, 1], ['0%', '18%']);
  const yText = useTransform(scrollYProgress, [0, 1], ['0%', '-22%']);
  const fade = useTransform(scrollYProgress, [0, 0.75], [1, 0]);
  const d = banner?.image, m = banner?.mobileImage ?? banner?.image;
  const words = (banner?.title ?? 'Under Clothing').split(' ');

  return (
    <section ref={ref} className="relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden bg-surface pt-[var(--header-h)]" aria-label="Portada">
      <motion.div className="absolute inset-0 -z-10" style={reduce ? undefined : { y: yBg }} aria-hidden>
        {m && (
          <picture>
            {d && <source media="(min-width: 768px)" srcSet={srcSet(d)} sizes="100vw" />}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imgUrl(m, 960)} srcSet={srcSet(m)} sizes="100vw" alt="" fetchPriority="high" className="h-[108%] w-full object-cover object-[70%_center] md:object-right" style={{ backgroundImage: `url("${m.blur}")`, backgroundSize: 'cover' }} />
          </picture>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/55 to-transparent md:bg-gradient-to-r md:from-bg/90 md:via-bg/40" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-bg to-transparent" />
      </motion.div>

      {/* Elemento firma: la etiqueta cuelga del borde superior */}
      <div className="absolute top-0 right-[22%] z-10 md:right-[14%]">
        <HangTag
          size={128} thread={150}
          className="md:hidden"
          front={<TagFront />}
          back={<TagBack count={newCount} />}
        />
        <HangTag size={176} thread={210} className="hidden md:flex" front={<TagFront />} back={<TagBack count={newCount} />} />
      </div>

      <motion.div className="container-x relative pb-10 md:pb-20" style={reduce ? undefined : { y: yText, opacity: fade }}>
        {banner?.eyebrow && <p className="label fade-up mb-5 text-muted">{banner.eyebrow}</p>}
        <h1 className="display max-w-[12ch] md:max-w-[13ch]">
          {words.map((w, i) => (
            <span key={i} className="inline-block overflow-hidden pb-[0.12em] align-bottom">
              <motion.span className="inline-block" initial={reduce ? false : { y: '110%' }} animate={{ y: 0 }} transition={{ duration: 0.9, delay: 0.15 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}>
                {w}{i < words.length - 1 ? ' ' : ''}
              </motion.span>
            </span>
          ))}
        </h1>
        {banner?.text && <p className="fade-up mt-5 max-w-sm text-lg font-light text-muted [animation-delay:0.6s]">{banner.text}</p>}
        <div className="fade-up mt-8 flex flex-wrap gap-3 [animation-delay:0.75s]">
          <Link href={banner?.ctaHref || '/tienda'} className="btn">{banner?.ctaLabel || 'Ver la tienda'} <IconArrow width={18} height={18} /></Link>
          <Link href="/contacto" className="btn btn-ghost">Showroom</Link>
        </div>
      </motion.div>
    </section>
  );
}

function TagFront() {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/brand/logo.png" alt="Under Clothing" className="w-[78%] mix-blend-multiply" draggable={false} />;
}
function TagBack({ count }: { count: number }) {
  return (
    <span className="flex flex-col items-center gap-1 text-center">
      <span className="label text-[0.55rem] text-muted md:text-[0.65rem]">New in</span>
      <span className="text-3xl leading-none font-light md:text-5xl">{count}</span>
      <span className="label text-[0.5rem] md:text-[0.6rem]">nuevos<br />ingresos</span>
    </span>
  );
}
