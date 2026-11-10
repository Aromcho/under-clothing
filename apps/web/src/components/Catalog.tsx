'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import type { Product } from '@/lib/types';
import { available, colorsOf, sizesOf } from '@/lib/format';
import { IconCheck, IconClose, IconFilter } from './Icons';
import { ProductCard } from './ProductCard';

type Opt = { slug: string; name: string };
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const SORTS = [['destacados', 'Destacados'], ['nuevos', 'Más nuevos'], ['precio-asc', 'Menor precio'], ['precio-desc', 'Mayor precio'], ['nombre', 'A–Z']] as const;

export function Catalog({ products, categories, collections, lockCollection }: { products: Product[]; categories: Opt[]; collections: Opt[]; lockCollection?: string }) {
  const sp = useSearchParams();
  const reduce = useReducedMotion();
  const [sheet, setSheet] = useState(false);

  const f = {
    cat: sp.get('categoria') ?? '',
    col: lockCollection ?? sp.get('coleccion') ?? '',
    sizes: (sp.get('talle') ?? '').split(',').filter(Boolean),
    colors: (sp.get('color') ?? '').split(',').filter(Boolean),
    news: sp.get('novedades') === '1',
    q: sp.get('q') ?? '',
    sort: sp.get('orden') ?? 'destacados',
  };

  // La URL es la fuente de verdad: los filtros se pueden compartir y sobreviven al "atrás"
  const set = (patch: Record<string, string | null>) => {
    const p = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) (v ? p.set(k, v) : p.delete(k));
    const qs = p.toString();
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
  };
  const toggle = (key: 'talle' | 'color', list: string[], v: string) => set({ [key]: (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]).join(',') || null });

  const allSizes = useMemo(() => [...new Set(products.flatMap(sizesOf))], [products]);
  const allColors = useMemo(() => {
    const m = new Map<string, { hex: string; n: number }>();
    for (const p of products) for (const c of colorsOf(p)) m.set(c.name, { hex: c.hex, n: (m.get(c.name)?.n ?? 0) + 1 });
    return [...m].sort((a, b) => b[1].n - a[1].n).map(([name, v]) => ({ name, hex: v.hex }));
  }, [products]);

  const list = useMemo(() => {
    const terms = norm(f.q).split(/\s+/).filter(Boolean);
    let r = products.filter((p) =>
      (!f.cat || p.category?.slug === f.cat) &&
      (!f.col || p.collections.some((c) => c.slug === f.col)) &&
      (!f.news || p.isNew) &&
      (!f.sizes.length || p.variants.some((v) => f.sizes.includes(v.size))) &&
      (!f.colors.length || p.variants.some((v) => f.colors.includes(v.color))) &&
      (!terms.length || terms.every((t) => norm(`${p.name} ${p.category?.name ?? ''} ${p.description} ${colorsOf(p).map((c) => c.name).join(' ')}`).includes(t))));
    const price = (p: Product, d: number) => (p.price == null ? d : p.price);
    if (f.sort === 'nuevos') r = [...r].sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt));
    else if (f.sort === 'precio-asc') r = [...r].sort((a, b) => price(a, Infinity) - price(b, Infinity));
    else if (f.sort === 'precio-desc') r = [...r].sort((a, b) => price(b, -1) - price(a, -1));
    else if (f.sort === 'nombre') r = [...r].sort((a, b) => a.name.localeCompare(b.name, 'es'));
    return [...r].sort((a, b) => Number(available(b)) - Number(available(a)));
  }, [products, f.cat, f.col, f.news, f.q, f.sort, f.sizes.join(), f.colors.join()]); // eslint-disable-line react-hooks/exhaustive-deps

  const extra = f.sizes.length + f.colors.length + (f.news ? 1 : 0) + (f.col && !lockCollection ? 1 : 0) + (f.sort !== 'destacados' ? 1 : 0);
  const clear = () => set({ categoria: null, coleccion: null, talle: null, color: null, novedades: null, q: null, orden: null });

  useEffect(() => {
    document.body.style.overflow = sheet ? 'hidden' : '';
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setSheet(false);
    window.addEventListener('keydown', k);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', k); };
  }, [sheet]);

  return (
    <div>
      <div className="sticky top-[var(--header-h)] z-30 -mx-5 border-b border-line bg-bg/92 backdrop-blur-md md:mx-0 md:rounded-full md:border md:px-2">
        <div className="flex items-center gap-2 py-2.5 pl-5 md:pl-1">
          <ul className="no-scrollbar flex flex-1 gap-2 overflow-x-auto pr-3" aria-label="Categorías">
            <li><button className="chip" aria-pressed={!f.cat && !f.news} onClick={() => set({ categoria: null, novedades: null })}>Todo</button></li>
            <li><button className="chip" aria-pressed={f.news} onClick={() => set({ novedades: f.news ? null : '1' })}>Nuevos</button></li>
            {categories.map((c) => (<li key={c.slug}><button className="chip" aria-pressed={f.cat === c.slug} onClick={() => set({ categoria: f.cat === c.slug ? null : c.slug })}>{c.name}</button></li>))}
          </ul>
          <button className="chip mr-5 shrink-0 !bg-ink !text-bg md:mr-1" onClick={() => setSheet(true)} aria-haspopup="dialog">
            <IconFilter width={16} height={16} /> Filtros{extra > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-pink px-1 text-[0.65rem] font-medium text-ink">{extra}</span>}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-5 pb-4 text-sm text-muted" aria-live="polite">
        <span>{list.length} {list.length === 1 ? 'prenda' : 'prendas'}</span>
        {f.q && <Pill onClear={() => set({ q: null })}>“{f.q}”</Pill>}
        {f.col && !lockCollection && <Pill onClear={() => set({ coleccion: null })}>{collections.find((c) => c.slug === f.col)?.name ?? f.col}</Pill>}
        {f.sizes.map((s) => (<Pill key={s} onClear={() => toggle('talle', f.sizes, s)}>Talle {s}</Pill>))}
        {f.colors.map((c) => (<Pill key={c} onClear={() => toggle('color', f.colors, c)}>{c}</Pill>))}
      </div>

      {list.length === 0 ? (
        <div className="grid place-items-center rounded-[1.4rem] bg-surface px-6 py-20 text-center">
          <p className="text-2xl font-light">No hay prendas con esos filtros</p>
          <p className="mt-2 text-muted">Probá quitando alguno o mirá todo el catálogo.</p>
          <button className="btn mt-6" onClick={clear}>Limpiar filtros</button>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
          <AnimatePresence mode="popLayout" initial={false}>
            {list.map((p, i) => (
              <motion.li key={p.id} layout={!reduce} initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
                <ProductCard p={p} priority={i < 4} />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      <AnimatePresence>
        {sheet && (
          <motion.div className="fixed inset-0 z-[70]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button className="absolute inset-0 cursor-default bg-ink/35" aria-label="Cerrar filtros" onClick={() => setSheet(false)} />
            <motion.div role="dialog" aria-modal="true" aria-label="Filtros" className="absolute inset-x-0 bottom-0 flex max-h-[86svh] flex-col rounded-t-[1.6rem] bg-bg md:inset-y-0 md:right-0 md:left-auto md:max-h-none md:w-[26rem] md:rounded-none"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 320, damping: 36 }}>
              <div className="flex items-center justify-between border-b border-line px-5 py-3">
                <p className="label">Filtros</p>
                <button className="-mr-2 grid h-11 w-11 place-items-center rounded-full hover:bg-surface" onClick={() => setSheet(false)} aria-label="Cerrar"><IconClose /></button>
              </div>
              <div className="flex-1 space-y-7 overflow-y-auto overscroll-contain px-5 py-6">
                <Group title="Ordenar por">
                  {SORTS.map(([v, l]) => (<button key={v} className="chip" aria-pressed={f.sort === v} onClick={() => set({ orden: v === 'destacados' ? null : v })}>{l}</button>))}
                </Group>
                {!lockCollection && collections.length > 0 && (
                  <Group title="Colección">
                    {collections.map((c) => (<button key={c.slug} className="chip" aria-pressed={f.col === c.slug} onClick={() => set({ coleccion: f.col === c.slug ? null : c.slug })}>{c.name}</button>))}
                  </Group>
                )}
                {allSizes.length > 0 && (
                  <Group title="Talle">
                    {allSizes.map((s) => (<button key={s} className="chip min-w-12 justify-center" aria-pressed={f.sizes.includes(s)} onClick={() => toggle('talle', f.sizes, s)}>{s}</button>))}
                  </Group>
                )}
                <Group title="Color">
                  {allColors.map((c) => {
                    const on = f.colors.includes(c.name);
                    return (
                      <button key={c.name} className="chip !pl-1.5" aria-pressed={on} onClick={() => toggle('color', f.colors, c.name)}>
                        <span className="grid h-7 w-7 place-items-center rounded-full ring-1 ring-line" style={{ background: c.hex || 'var(--color-pink)' }}>{on && <IconCheck width={14} height={14} className="text-bg mix-blend-difference" />}</span>{c.name}
                      </button>
                    );
                  })}
                </Group>
              </div>
              <div className="flex gap-3 border-t border-line px-5 pt-3 pb-[max(0.9rem,env(safe-area-inset-bottom))]">
                <button className="btn btn-ghost flex-1" onClick={clear}>Limpiar</button>
                <button className="btn flex-[1.6]" onClick={() => setSheet(false)}>Ver {list.length} {list.length === 1 ? 'prenda' : 'prendas'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (<fieldset><legend className="label mb-3 text-muted">{title}</legend><div className="flex flex-wrap gap-2">{children}</div></fieldset>);
}
function Pill({ children, onClear }: { children: React.ReactNode; onClear: () => void }) {
  return (<button onClick={onClear} className="inline-flex items-center gap-1.5 rounded-full bg-surface py-1.5 pr-2 pl-3 text-xs text-ink">{children}<IconClose width={12} height={12} aria-hidden /><span className="sr-only">Quitar filtro</span></button>);
}
