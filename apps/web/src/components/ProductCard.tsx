import Link from 'next/link';
import type { Product } from '@/lib/types';
import { available, colorsOf, money } from '@/lib/format';
import { Picture } from './Picture';
import { MiniTag } from './HangTag';

export function ProductCard({ p, priority, sizes = '(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw' }: { p: Product; priority?: boolean; sizes?: string }) {
  const [a, b] = p.images;
  const colors = colorsOf(p);
  const out = !available(p);
  return (
    <Link href={`/producto/${p.slug}`} className="group relative block" aria-label={`${p.name}${p.price != null ? `, ${money(p.price)}` : ''}`}>
      <div className="relative aspect-[4/5] overflow-hidden rounded-[1.1rem] bg-surface">
        {a && <Picture media={a} sizes={sizes} alt="" priority={priority} className="h-full w-full transition-transform duration-[1200ms] ease-[var(--ease-out-soft)] group-hover:scale-[1.045]" position="center 20%" />}
        {b && <Picture media={b} sizes={sizes} alt="" className="absolute inset-0 hidden h-full w-full opacity-0 transition-opacity duration-500 group-hover:opacity-100 [@media(hover:hover)]:block" position="center 20%" />}
        {p.isNew && !out && <MiniTag className="absolute -top-px right-3.5">Nuevo</MiniTag>}
        {out && <span className="label absolute bottom-3 left-3 rounded-full bg-bg/90 px-3 py-2 text-[0.6rem]">Sin stock</span>}
      </div>
      <div className="mt-3 flex items-start justify-between gap-3 px-0.5">
        <div className="min-w-0">
          <h3 className="truncate text-[0.95rem] leading-snug font-medium">{p.name}</h3>
          <p className="mt-0.5 text-sm text-muted">
            {p.price != null ? (
              <>
                <span className="text-ink">{money(p.price)}</span>
                {p.comparePrice != null && p.comparePrice > p.price && <s className="ml-2">{money(p.comparePrice)}</s>}
              </>
            ) : 'Consultá el precio'}
          </p>
        </div>
        {colors.length > 1 && (
          <span className="mt-1.5 flex shrink-0 -space-x-1" aria-label={`${colors.length} colores`}>
            {colors.slice(0, 4).map((c) => (<span key={c.name} title={c.name} className="h-3.5 w-3.5 rounded-full ring-1 ring-bg" style={{ background: c.hex || 'var(--color-pink)', boxShadow: '0 0 0 1px var(--color-line)' }} />))}
          </span>
        )}
      </div>
    </Link>
  );
}
