'use client';

import { motion, useReducedMotion, useScroll, useSpring, useTransform, useVelocity } from 'motion/react';
import { useState, type ReactNode } from 'react';

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

/** Mini etiqueta para tarjetas ("Nuevo"): cuelga y se mueve al pasar el mouse. */
export function MiniTag({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`pointer-events-none flex origin-top flex-col items-center [.group:hover_&]:animate-[tag-sway-sm_1.2s_ease-in-out_infinite] ${className}`} aria-hidden>
      <span className="block h-4 w-px bg-ink/50" />
      <span className="label -mt-0.5 grid h-[3.250rem] w-[3.250rem] place-items-center rounded-full bg-bg text-[0.562rem] shadow-[var(--shadow-tag)] ring-1 ring-accent/60 ring-inset">{children}</span>
    </span>
  );
}
