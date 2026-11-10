'use client';

import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Media } from '@/lib/types';
import { imgUrl, srcSet } from '@/lib/format';
import { IconClose } from './Icons';

export type StoryGroup = { title: string; items: { id: number; image: Media; href: string; title: string }[] };
const DURATION = 5000;

/** Historias destacadas tipo Instagram: círculos + visor a pantalla completa. */
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

/**
 * Visor. El avance se maneja con un temporizador propio (no con animaciones CSS),
 * así funciona igual aunque el sistema tenga "reducir movimiento" activado.
 * Tocar a la izquierda: anterior · a la derecha: siguiente · mantener: pausa
 * Deslizar a los costados: cambia de destacada · hacia abajo: cierra.
 */
function Viewer({ groups, start, onClose, instagram }: { groups: StoryGroup[]; start: number; onClose: () => void; instagram: string }) {
  const [g, setG] = useState(start);
  const [i, setI] = useState(0);
  const [progress, setProgress] = useState(0);
  const [held, setHeld] = useState(false);
  const [loadedId, setLoadedId] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const gesture = useRef<{ x: number; y: number; t: number } | null>(null);
  const holdTimer = useRef<number | null>(null);
  const prog = useRef(0);
  const group = groups[g];
  const item = group.items[i];
  const loaded = loadedId === item.id;

  const next = useCallback(() => {
    if (i < group.items.length - 1) setI((x) => x + 1);
    else if (g < groups.length - 1) { setG((x) => x + 1); setI(0); }
    else onClose();
  }, [i, g, group.items.length, groups.length, onClose]);
  const prev = useCallback(() => {
    if (i > 0) setI((x) => x - 1);
    else if (g > 0) { setG((x) => x - 1); setI(groups[g - 1].items.length - 1); }
  }, [i, g, groups]);
  const nextGroup = useCallback(() => { if (g < groups.length - 1) { setG(g + 1); setI(0); } else onClose(); }, [g, groups.length, onClose]);
  const prevGroup = useCallback(() => { if (g > 0) { setG(g - 1); setI(0); } }, [g]);

  // reinicia el avance al cambiar de historia
  useEffect(() => { prog.current = 0; setProgress(0); }, [g, i]);

  // temporizador: avanza sólo con la imagen cargada, sin pausa y con la pestaña visible
  useEffect(() => {
    if (held || !loaded) return;
    let raf = 0, last = performance.now();
    const tick = (now: number) => {
      const dt = document.hidden ? 0 : now - last;
      last = now;
      prog.current = Math.min(1, prog.current + dt / DURATION);
      setProgress(prog.current);
      if (prog.current >= 1) { next(); return; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [held, loaded, next]);

  // precarga la siguiente
  useEffect(() => {
    const n = group.items[i + 1]?.image ?? groups[g + 1]?.items[0]?.image;
    if (n) { const im = new Image(); im.src = imgUrl(n, 960); }
  }, [g, i, group.items, groups]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); if (e.key === 'ArrowRight') next(); if (e.key === 'ArrowLeft') prev(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [next, prev, onClose]);
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => { document.body.style.overflow = prevOverflow; };
  }, []);

  const onDown = (e: React.PointerEvent) => {
    gesture.current = { x: e.clientX, y: e.clientY, t: performance.now() };
    holdTimer.current = window.setTimeout(() => setHeld(true), 220);
  };
  const onUp = (e: React.PointerEvent) => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    const s = gesture.current;
    gesture.current = null;
    const wasHeld = held;
    setHeld(false);
    if (!s) return;
    const dx = e.clientX - s.x, dy = e.clientY - s.y;
    if (dy > 90 && Math.abs(dy) > Math.abs(dx)) return onClose();
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) return dx < 0 ? nextGroup() : prevGroup();
    if (wasHeld || performance.now() - s.t > 260) return;
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (e.clientX - r.left < r.width * 0.32) prev(); else next();
  };

  return (
    <motion.div role="dialog" aria-modal="true" aria-label={`Historias: ${group.title}`} className="fixed inset-0 z-[90] grid place-items-center bg-ink/95" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
      <div className="relative h-full w-full overflow-hidden bg-ink select-none sm:h-[min(92vh,54rem)] sm:w-auto sm:rounded-3xl" style={{ aspectRatio: '9 / 16' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={item.id} src={imgUrl(item.image, 960)} srcSet={srcSet(item.image)} sizes="(min-width: 640px) 30rem, 100vw" alt={item.image.alt} ref={(el) => { if (el?.complete && el.naturalWidth) setLoadedId(item.id); }} onLoad={() => setLoadedId(item.id)} onError={() => setLoadedId(item.id)} draggable={false}
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-200" style={{ backgroundImage: `url("${item.image.blur}")`, backgroundSize: 'cover', opacity: loaded ? 1 : 0.6 }} />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-ink/60 to-transparent" />

        {/* zona de gestos (toda la historia) */}
        <div className="absolute inset-0 touch-none" onPointerDown={onDown} onPointerUp={onUp} onPointerCancel={() => { setHeld(false); gesture.current = null; }} onContextMenu={(e) => e.preventDefault()} aria-hidden />

        <div className="pointer-events-none absolute inset-x-3 top-[max(0.75rem,env(safe-area-inset-top))] flex gap-1" aria-hidden>
          {group.items.map((s, k) => (
            <span key={s.id} className="h-[2.5px] flex-1 overflow-hidden rounded-full bg-bg/35">
              <span className="block h-full origin-left bg-bg" style={{ transform: `scaleX(${k < i ? 1 : k === i ? progress : 0})` }} />
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
        {held && <span className="label pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink/45 px-4 py-2 text-[0.6rem] text-bg backdrop-blur">En pausa</span>}

        {(item.title || item.href) && (
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-ink/75 to-transparent px-5 pt-16 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-bg">
            <p className="pointer-events-none text-lg leading-tight font-light">{item.title}</p>
            {item.href && <Link href={item.href} onClick={onClose} className="label shrink-0 rounded-full bg-bg px-4 py-3 text-ink">Ver prenda</Link>}
          </div>
        )}

        {/* botones para teclado y lectores de pantalla */}
        <div className="sr-only">
          <button onClick={prev}>Historia anterior</button>
          <button onClick={next}>Historia siguiente</button>
        </div>
      </div>
      {/* flechas en escritorio */}
      <button onClick={prev} aria-label="Historia anterior" className="absolute top-1/2 left-[max(1rem,calc(50%-19rem))] hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-bg/90 text-ink sm:grid"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden><path d="m15 6-6 6 6 6" /></svg></button>
      <button onClick={next} aria-label="Historia siguiente" className="absolute top-1/2 right-[max(1rem,calc(50%-19rem))] hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-bg/90 text-ink sm:grid"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden><path d="m9 6 6 6-6 6" /></svg></button>
    </motion.div>
  );
}
