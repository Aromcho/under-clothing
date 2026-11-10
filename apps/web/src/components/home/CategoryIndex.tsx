'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import Link from 'next/link';
import { useRef, useState } from 'react';
import type { Media } from '@/lib/types';
import { imgUrl } from '@/lib/format';
import { IconArrow } from '../Icons';

type Row = { slug: string; name: string; count: number; image: Media | null };

/**
 * Índice de categorías tipo revista: nombres grandes separados por puntadas.
 * En el celular cada fila lleva su miniatura; en escritorio la foto aparece y sigue al mouse.
 */
export function CategoryIndex({ rows }: { rows: Row[] }) {
  const reduce = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const onMove = (e: React.MouseEvent) => {
    const r = box.current?.getBoundingClientRect();
    if (r) setPos({ x: e.clientX - r.left, y: e.clientY - r.top });
  };
  return (
    <div ref={box} className="relative" onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
      <ul>
        {rows.map((r, i) => (
          <li key={r.slug} className="border-b border-dashed border-accent/70 first:border-t">
            <Link href={`/tienda?categoria=${r.slug}`} onMouseEnter={() => setHover(i)} className="group flex items-center gap-4 py-4 md:py-5">
              <span className="label w-7 shrink-0 text-[0.6rem] text-muted tabular-nums">{String(i + 1).padStart(2, '0')}</span>
              <span className="min-w-0 flex-1 text-[clamp(1.55rem,6.4vw,3.6rem)] leading-[1.08] font-light tracking-[-0.01em] transition-transform duration-500 ease-[var(--ease-out-soft)] md:group-hover:translate-x-3">
                {r.name}<sup className="label ml-1.5 align-super text-[0.55rem] font-medium text-muted tracking-normal">{r.count}</sup>
              </span>
              {r.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imgUrl(r.image, 320)} alt="" loading="lazy" className="h-16 w-12 shrink-0 rounded-[3px] object-cover md:hidden" style={{ objectPosition: 'center 30%' }} />
              )}
              <span className="hidden h-10 w-10 shrink-0 place-items-center rounded-full md:grid transition-colors duration-300 group-hover:bg-ink group-hover:text-bg"><IconArrow width={18} height={18} /></span>
            </Link>
          </li>
        ))}
      </ul>
      <AnimatePresence>
        {hover !== null && rows[hover]?.image && (
          <motion.div key="preview" className="pointer-events-none absolute top-0 left-0 z-10 hidden w-56 overflow-hidden rounded-[4px] shadow-[var(--shadow-soft)] md:block"
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1, x: pos.x + 28, y: pos.y - 150 }} exit={{ opacity: 0, scale: 0.9 }}
            transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 28, opacity: { duration: 0.2 } }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imgUrl(rows[hover].image!, 640)} alt="" className="aspect-[3/4] w-full object-cover" style={{ objectPosition: 'center 30%' }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
