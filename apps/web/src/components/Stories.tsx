'use client';

import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Media } from '@/lib/types';
import { imgUrl, srcSet } from '@/lib/format';
import { IconClose } from './Icons';

export type StoryGroup = { title: string; items: { id: number; image: Media; href: string; title: string }[] };
const DURATION = 4500;

/** Historias destacadas tipo Instagram: círculos + visor a pantalla completa con barras de progreso. */
export function Stories({ groups, instagram }: { groups: StoryGroup[]; instagram: string }) {
  const [open, setOpen] = useState<number | null>(null);
  if (!groups.length) return null;
  return (
    <>
      <ul className="no-scrollbar -mx-5 flex gap-4 overflow-x-auto px-5 pb-1 md:mx-0 md:px-0" aria-label="Historias destacadas">
        {groups.map((g, i) => (
          <li key={g.title} className="shrink-0">
            <button onClick={() => setOpen(i)} className="group flex w-[4.9rem] flex-col items-center gap-2" aria-label={`Ver historias: ${g.title}`}>
              <span className="grid h-[4.6rem] w-[4.6rem] place-items-center rounded-full bg-[conic-gradient(from_210deg,var(--color-accent),var(--color-pink),var(--color-ink),var(--color-accent))] p-[2px] transition-transform duration-500 group-hover:scale-105 group-active:scale-95">
                <span className="block h-full w-full overflow-hidden rounded-full border-[3px] border-bg bg-surface">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imgUrl(g.items[0].image, 320)} alt="" className="h-full w-full object-cover" style={{ objectPosition: 'center 25%' }} />
                </span>
              </span>
              <span className="w-full truncate text-center text-[0.72rem]">{g.title}</span>
            </button>
          </li>
        ))}
      </ul>
      <AnimatePresence>{open !== null && <Viewer groups={groups} start={open} onClose={() => setOpen(null)} instagram={instagram} />}</AnimatePresence>
    </>
  );
}

function Viewer({ groups, start, onClose, instagram }: { groups: StoryGroup[]; start: number; onClose: () => void; instagram: string }) {
  const [g, setG] = useState(start);
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const group = groups[g];
  const item = group.items[i];

  const next = useCallback(() => {
    if (i < group.items.length - 1) setI(i + 1);
    else if (g < groups.length - 1) { setG(g + 1); setI(0); }
    else onClose();
  }, [i, g, group.items.length, groups.length, onClose]);
  const prev = useCallback(() => {
    if (i > 0) setI(i - 1);
    else if (g > 0) { setG(g - 1); setI(groups[g - 1].items.length - 1); }
  }, [i, g, groups]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); if (e.key === 'ArrowRight') next(); if (e.key === 'ArrowLeft') prev(); };
    window.addEventListener('keydown', k);
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = ''; };
  }, [next, prev, onClose]);

  return (
    <motion.div role="dialog" aria-modal="true" aria-label={`Historias: ${group.title}`} className="fixed inset-0 z-[90] grid place-items-center bg-ink/95" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div
        className="relative h-full w-full overflow-hidden bg-ink sm:h-[min(92vh,54rem)] sm:w-auto sm:rounded-3xl" style={{ aspectRatio: '9 / 16' }}
        initial={{ scale: 0.94, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 28 }}
        drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.6 }} onDragEnd={(_, info) => { if (info.offset.y > 110) onClose(); }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={item.id} src={imgUrl(item.image, 960)} srcSet={srcSet(item.image)} sizes="(min-width: 640px) 30rem, 100vw" alt={item.image.alt} className="fade-up absolute inset-0 h-full w-full object-cover" style={{ backgroundImage: `url("${item.image.blur}")`, backgroundSize: 'cover', animationDuration: '0.35s' }} draggable={false} />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-ink/55 to-transparent" />
        <div className="absolute inset-x-3 top-[max(0.75rem,env(safe-area-inset-top))] flex gap-1">
          {group.items.map((s, k) => (
            <span key={s.id} className="h-[2.5px] flex-1 overflow-hidden rounded-full bg-bg/35">
              <span key={`${g}-${i}`} className="block h-full origin-left bg-bg" onAnimationEnd={k === i ? next : undefined}
                style={k < i ? undefined : k === i ? { animation: `story-bar ${DURATION}ms linear forwards`, animationPlayState: paused ? 'paused' : 'running' } : { transform: 'scaleX(0)' }} />
            </span>
          ))}
        </div>
        <div className="absolute inset-x-4 top-[max(1.6rem,calc(env(safe-area-inset-top)+0.9rem))] flex items-center justify-between text-bg">
          <a href={`https://www.instagram.com/${instagram}/`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-circle.png" alt="" className="h-8 w-8 rounded-full bg-bg" />
            <span><strong className="font-medium">{instagram}</strong> · {group.title}</span>
          </a>
          <button ref={closeRef} className="grid h-11 w-11 place-items-center rounded-full bg-ink/30 backdrop-blur" onClick={onClose} aria-label="Cerrar historias"><IconClose /></button>
        </div>
        <button className="absolute inset-y-20 left-0 w-[32%] cursor-default" aria-label="Historia anterior" onClick={prev} onPointerDown={() => setPaused(true)} onPointerUp={() => setPaused(false)} onPointerLeave={() => setPaused(false)} />
        <button className="absolute inset-y-20 right-0 w-[68%] cursor-default" aria-label="Historia siguiente" onClick={next} onPointerDown={() => setPaused(true)} onPointerUp={() => setPaused(false)} onPointerLeave={() => setPaused(false)} />
        {(item.title || item.href) && (
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-ink/70 to-transparent px-5 pt-16 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-bg">
            <p className="text-lg leading-tight font-light">{item.title}</p>
            {item.href && <Link href={item.href} onClick={onClose} className="label shrink-0 rounded-full bg-bg px-4 py-3 text-ink">Ver prenda</Link>}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
