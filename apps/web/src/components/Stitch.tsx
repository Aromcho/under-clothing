'use client';

import { motion, useMotionTemplate, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react';

const dashH = 'repeating-linear-gradient(90deg, var(--color-accent) 0 7px, transparent 7px 12px)';
const dashV = 'repeating-linear-gradient(180deg, var(--color-accent) 0 7px, transparent 7px 12px)';

/** La costura que se va cosiendo con el scroll: vertical en escritorio, bajo el header en el celular. */
export function ScrollThread() {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const p = useSpring(scrollYProgress, { stiffness: 90, damping: 22, mass: 0.4 });
  const rest = useTransform(p, (v) => (1 - v) * 100);
  const clipV = useMotionTemplate`inset(0 0 ${rest}% 0)`;
  const clipH = useMotionTemplate`inset(0 ${rest}% 0 0)`;
  const top = useTransform(p, (v) => `${v * 100}%`);
  if (reduce) return null;
  return (
    <>
      <div className="pointer-events-none fixed top-0 bottom-0 left-[0.9rem] z-30 hidden w-px lg:block" aria-hidden>
        <motion.div className="absolute inset-0" style={{ backgroundImage: dashV, clipPath: clipV }} />
        <motion.span className="absolute -left-[3px] h-[18px] w-[7px]" style={{ top }}>
          {/* aguja */}
          <svg viewBox="0 0 7 18" className="h-full w-full"><path d="M3.5 0v14" stroke="var(--color-ink)" strokeWidth="1" /><ellipse cx="3.5" cy="15.2" rx="1.6" ry="2.6" fill="none" stroke="var(--color-ink)" strokeWidth="1" /></svg>
        </motion.span>
      </div>
      <motion.div className="pointer-events-none fixed inset-x-0 top-[var(--header-h,3.750rem)] z-40 h-px lg:hidden" style={{ backgroundImage: dashH, clipPath: clipH }} aria-hidden />
    </>
  );
}

/** Divisor de sección: una puntada que se cose cuando entra en pantalla. */
export function StitchDivider({ className = '' }: { className?: string }) {
  const reduce = useReducedMotion();
  return (
    <div className={`flex items-center gap-2 ${className}`} aria-hidden>
      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
      <motion.span
        className="h-px flex-1"
        style={{ backgroundImage: dashH }}
        initial={reduce ? false : { clipPath: 'inset(0 100% 0 0)' }}
        whileInView={{ clipPath: 'inset(0 0% 0 0)' }}
        viewport={{ once: true, margin: '-12% 0px' }}
        transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1] }}
      />
      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
    </div>
  );
}
