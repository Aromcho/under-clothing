import Link from 'next/link';
import type { Product } from '@/lib/types';
import { available, colorsOf, money } from '@/lib/format';
import { Picture } from './Picture';
import { MiniTag } from './HangTag';

/** Tarjeta de prenda: foto protagonista, nombre en mayúsculas, precio y colores. */
export function ProductCard({ p, priority, sizes = '(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw', index }: { p: Product; priority?: boolean; sizes?: string; index?: number }) {
  const [a, b] = p.images;
  const colors = colorsOf(p);
  const out = !available(p);
  return (
    <Link href={`/producto/${p.slug}`} className="group relative block" aria-label={`${p.name}${p.price != null ? `, ${money(p.price)}` : ''}`}>
      <div className="relative aspect-[3/4] overflow-hidden rounded-[3px] bg-surface">
        {a && <Picture media={a} sizes={sizes} alt="" priority={priority} className="h-full w-full transition-transform duration-[1400ms] ease-[var(--ease-out-soft)] group-hover:scale-[1.04]" position="center 30%" />}
        {b && <Picture media={b} sizes={sizes} alt="" className="absolute inset-0 hidden h-full w-full opacity-0 transition-opacity duration-500 group-hover:opacity-100 [@media(hover:hover)]:block" position="center 30%" />}
        {p.isNew && !out && <MiniTag className="absolute -top-px right-4">Nuevo</MiniTag>}
        {out && <span className="label absolute top-2.5 left-2.5 rounded-full bg-bg/92 px-2.5 py-1.5 text-[0.55rem]">Sin stock</span>}
        {index != null && <span className="label absolute right-2.5 bottom-2.5 rounded-full bg-bg/80 px-2 py-1 text-[0.55rem] tabular-nums backdrop-blur">{String(index).padStart(2, '0')}</span>}
      </div>
      <div className="mt-3 px-0.5">
        <h3 className="truncate text-[0.74rem] leading-snug font-medium tracking-[0.1em] uppercase">{p.name}</h3>
        <div className="mt-1 flex items-center justify-between gap-2">
          <p className="text-[0.82rem] text-muted">
            {p.price != null ? (
              <>
                <span className="text-ink">{money(p.price)}</span>
                {p.comparePrice != null && p.comparePrice > p.price && <s className="ml-2">{money(p.comparePrice)}</s>}
              </>
            ) : 'Consultá el precio'}
          </p>
          {colors.length > 1 && (
            <span className="flex shrink-0 gap-1" aria-label={`${colors.length} colores`}>
              {colors.slice(0, 4).map((c) => (<span key={c.name} title={c.name} className="h-2.5 w-2.5 rounded-full" style={{ background: c.hex || 'var(--color-pink)', boxShadow: '0 0 0 1px var(--color-line)' }} />))}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
