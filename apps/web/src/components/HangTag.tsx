'use client';

import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform, useVelocity } from 'motion/react';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';

type Props = {
  size?: number;
  thread?: number;
  back?: ReactNode;
  front?: ReactNode;
  className?: string;
  /** La etiqueta se da vuelta al tocarla */
  flippable?: boolean;
  label?: string;
};

/**
 * Elemento firma de Under Clothing: la etiqueta colgante redonda (el círculo del logo)
 * que cuelga de un hilo, se balancea con el scroll y se da vuelta al tocarla.
 */
export function HangTag({ size = 132, thread = 96, back, front, className = '', flippable = true, label = 'Etiqueta Under Clothing' }: Props) {
  const reduce = useReducedMotion();
  const [flipped, setFlipped] = useState(false);
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  const target = useTransform(velocity, [-2400, 0, 2400], [16, 0, -16], { clamp: true });
  const swing = useSpring(target, { stiffness: 42, damping: 3.2, mass: 1.1 });
  const hole = Math.max(7, size * 0.07);

  const face = 'absolute inset-0 grid place-items-center rounded-full bg-bg [backface-visibility:hidden] shadow-[var(--shadow-tag)]';
  const ring = (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" aria-hidden>
      <circle cx="50" cy="50" r="45.5" fill="none" stroke="var(--color-accent)" strokeWidth="0.7" strokeDasharray="2.4 2.2" strokeLinecap="round" />
      <circle cx="50" cy="10.5" r="3.4" fill="var(--color-surface)" stroke="var(--color-accent)" strokeWidth="0.9" />
    </svg>
  );

  const Tag = flippable ? 'button' : 'div';
  return (
    <motion.div className={`pointer-events-none flex flex-col items-center ${className}`} style={{ rotate: reduce ? 0 : swing, transformOrigin: '50% 0%' }} aria-hidden={!flippable}>
      <div className="flex flex-col items-center" style={reduce ? undefined : { animation: 'tag-sway 6.5s ease-in-out infinite', transformOrigin: '50% 0%' }}>
        <span className="block w-px bg-ink/55" style={{ height: thread }} />
        <Tag
          {...(flippable ? { type: 'button' as const, onClick: () => setFlipped((f) => !f), 'aria-label': `${label}: tocá para darla vuelta`, 'aria-pressed': flipped } : {})}
          className="pointer-events-auto relative block rounded-full [perspective:800px]"
          style={{ width: size, height: size, marginTop: -hole * 1.550 }}
          onPointerEnter={() => { if (!reduce) { swing.set(7); setTimeout(() => swing.set(0), 160); } }}
        >
          <motion.span className="absolute inset-0 block [transform-style:preserve-3d]" animate={{ rotateY: flipped ? 180 : 0 }} transition={{ type: 'spring', stiffness: 120, damping: 14 }}>
            <span className={face}>{ring}{front}</span>
            <span className={`${face} [transform:rotateY(180deg)]`}>{ring}{back}</span>
          </motion.span>
        </Tag>
      </div>
    </motion.div>
  );
}

/**
 * Mini etiqueta para tarjetas ("Nuevo"): cuelga de un hilo y tiene "peso".
 * Se balancea con el scroll de la página y con el deslizamiento del carrusel donde esté,
 * cada una con un ritmo apenas distinto para que no se muevan todas iguales.
 */
export function MiniTag({ children, className = '' }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const id = useId();
  const seed = [...id].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 997, 7) / 997;
  const { scrollY } = useScroll();
  const vy = useVelocity(scrollY);
  const sx = useMotionValue(0);
  const vx = useVelocity(sx);
  const max = reduce ? 12 : 20;
  const target = useTransform([vy, vx], ([y, x]: number[]) => Math.max(-max, Math.min(max, -y / 110 - x / 70)));
  const swing = useSpring(target, { stiffness: 55 + seed * 30, damping: reduce ? 4.5 : 2.4 + seed * 1.4, mass: 0.9 + seed * 0.3 });

  // carrusel horizontal más cercano (si la tarjeta está dentro de uno)
  useEffect(() => {
    let el = ref.current?.parentElement ?? null;
    while (el && el !== document.body) {
      const o = getComputedStyle(el).overflowX;
      if ((o === 'auto' || o === 'scroll') && el.scrollWidth > el.clientWidth) break;
      el = el.parentElement;
    }
    if (!el || el === document.body) return;
    const box = el;
    const on = () => sx.set(box.scrollLeft);
    box.addEventListener('scroll', on, { passive: true });
    return () => box.removeEventListener('scroll', on);
  }, [sx]);

  return (
    <motion.span ref={ref} className={`pointer-events-none flex flex-col items-center ${className}`} style={{ rotate: swing, transformOrigin: '50% 0%' }} aria-hidden>
      <span className="flex origin-top flex-col items-center [.group:hover_&]:animate-[tag-sway-sm_1.2s_ease-in-out_infinite]">
        <span className="block h-4 w-px bg-ink/50" />
        <span className="label -mt-0.5 grid h-[3.250rem] w-[3.250rem] place-items-center rounded-full bg-bg text-[0.562rem] shadow-[var(--shadow-tag)] ring-1 ring-accent/60 ring-inset">{children}</span>
      </span>
    </motion.span>
  );
}
