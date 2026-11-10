import Link from 'next/link';
import type { Collection } from '@/lib/types';
import { IconArrow } from '../Icons';
import { Picture } from '../Picture';

/** Colecciones como tarjetas que se apilan al hacer scroll (sticky, sin JS). */
export function CollectionStack({ items, counts }: { items: Collection[]; counts: Record<string, number> }) {
  return (
    <div className="relative">
      {items.map((c, i) => (
        <div key={c.id} className="sticky pb-4" style={{ top: `calc(var(--header-h) + 0.75rem + ${i * 14}px)` }}>
          <Link href={`/colecciones/${c.slug}`} className="group relative block h-[72svh] max-h-[46rem] min-h-[26rem] overflow-hidden rounded-[6px] bg-surface shadow-[0_-18px_40px_-24px_rgb(28_26_26/0.35)]">
            {c.image && <Picture media={c.image} sizes="(min-width: 1024px) 80vw, 100vw" alt="" className="h-full w-full transition-transform duration-[1600ms] ease-[var(--ease-out-soft)] group-hover:scale-[1.03]" position="center 30%" />}
            <span className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/15 to-transparent" />
            <span className="absolute inset-x-5 bottom-6 text-bg md:inset-x-10 md:bottom-10">
              <span className="label flex items-center gap-3 text-[0.6rem] text-pink"><span className="tabular-nums">{String(i + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}</span><span className="h-px w-8 bg-pink/70" />{counts[c.slug] ?? 0} prendas</span>
              <span className="mt-3 block text-[clamp(2.4rem,10vw,5.5rem)] leading-[0.95] font-light tracking-[-0.02em]">{c.name}</span>
              <span className="mt-3 flex items-end justify-between gap-4">
                <span className="max-w-sm text-[0.95rem] font-light text-bg/85">{c.tagline}</span>
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-bg text-ink transition-transform duration-500 group-hover:-rotate-45"><IconArrow width={18} height={18} /></span>
              </span>
            </span>
          </Link>
        </div>
      ))}
    </div>
  );
}
