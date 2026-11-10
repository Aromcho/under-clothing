'use client';

import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Settings } from '@/lib/types';
import { contactLink, money } from '@/lib/format';
import { useCart } from './Cart';
import { IconBag, IconClose, IconInstagram, IconMenu, IconSearch } from './Icons';

export type SearchEntry = { slug: string; name: string; category: string; image: string | null; price: number | null; isNew: boolean; colors: string };
type Nav = { categories: { slug: string; name: string }[]; collections: { slug: string; name: string }[] };

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex flex-col items-center leading-none ${className}`}>
      <span className="brand text-[1.05rem] font-normal">Under</span>
      <span className="label mt-[0.3rem] text-[0.5rem] tracking-[0.42em] text-muted">Clothing</span>
    </span>
  );
}

export function Header({ nav, index, business }: { nav: Nav; index: SearchEntry[]; business: Settings['business'] }) {
  const { count, setOpen, bump } = useCart();
  const pathname = usePathname();
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const on = () => setSolid(window.scrollY > 12);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  useEffect(() => { setMenu(false); setSearch(false); }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = menu || search ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menu, search]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setMenu(false); setSearch(false); }
      if (e.key === '/' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) { e.preventDefault(); setSearch(true); }
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, []);

  const links = [
    { href: '/tienda', label: 'Tienda' },
    { href: '/tienda?novedades=1', label: 'Nuevos ingresos' },
    { href: '/colecciones', label: 'Colecciones' },
    { href: '/contacto', label: 'Showroom' },
  ];
  const ig = contactLink({ ...business, whatsapp: '' });

  return (
    <>
      <a href="#contenido" className="btn btn-sm sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[90]">Saltar al contenido</a>
      <header className={`fixed inset-x-0 top-0 z-50 h-[var(--header-h)] transition-[background,box-shadow] duration-300 ${solid || menu ? 'bg-bg/92 shadow-[0_1px_0_var(--color-line)] backdrop-blur-md' : 'bg-transparent'}`}>
        <div className="container-x grid h-full grid-cols-[1fr_auto_1fr] items-center">
          <div className="flex items-center gap-7">
            <button className="-ml-2 grid h-11 w-11 place-items-center rounded-full lg:hidden" onClick={() => setMenu((m) => !m)} aria-expanded={menu} aria-controls="menu-movil" aria-label={menu ? 'Cerrar menú' : 'Abrir menú'}>
              {menu ? <IconClose /> : <IconMenu />}
            </button>
            <nav className="hidden items-center gap-7 lg:flex" aria-label="Principal">
              {links.map((l) => (
                <Link key={l.href} href={l.href} className="label stitch-link" aria-current={pathname === l.href ? 'page' : undefined}>{l.label}</Link>
              ))}
            </nav>
          </div>
          <Link href="/" aria-label="Under Clothing, inicio" className="justify-self-center py-2"><Wordmark /></Link>
          <div className="flex items-center justify-end gap-1">
            <button className="grid h-11 w-11 place-items-center rounded-full hover:bg-surface" onClick={() => setSearch(true)} aria-label="Buscar prendas"><IconSearch /></button>
            <button className="relative -mr-2 grid h-11 w-11 place-items-center rounded-full hover:bg-surface" onClick={() => setOpen(true)} aria-label={`Abrir carrito, ${count} ${count === 1 ? 'prenda' : 'prendas'}`}>
              <IconBag />
              {count > 0 && <span key={bump} className="animate-pop absolute top-1 right-0.5 grid h-[1.15rem] min-w-[1.15rem] place-items-center rounded-full bg-ink px-1 text-[0.625rem] font-medium text-bg tabular-nums">{count}</span>}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menu && (
          <motion.div id="menu-movil" className="fixed inset-0 z-40 overflow-y-auto bg-bg pt-[var(--header-h)] lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            <nav className="container-x flex min-h-full flex-col pt-8 pb-10" aria-label="Menú">
              <ul className="space-y-1">
                {links.map((l, i) => (
                  <motion.li key={l.href} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + i * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
                    <Link href={l.href} className="block py-2 text-[2.1rem] leading-tight font-light">{l.label}</Link>
                  </motion.li>
                ))}
              </ul>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-8 border-t border-line pt-6">
                <p className="label mb-4 text-muted">Categorías</p>
                <ul className="grid grid-cols-2 gap-x-4 gap-y-3">
                  {nav.categories.map((c) => (<li key={c.slug}><Link href={`/tienda?categoria=${c.slug}`} className="text-[0.95rem]">{c.name}</Link></li>))}
                </ul>
              </motion.div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.38 }} className="mt-auto flex flex-wrap items-center gap-x-6 gap-y-3 pt-10 text-sm">
                <Link href="/envios" className="stitch-link">Envíos</Link>
                <Link href="/cambios-y-devoluciones" className="stitch-link">Cambios</Link>
                <Link href="/guia-de-talles" className="stitch-link">Talles</Link>
                <a href={ig.href} target="_blank" rel="noopener noreferrer" className="ml-auto inline-flex items-center gap-2"><IconInstagram /> @{business.instagram}</a>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>{search && <SearchOverlay index={index} onClose={() => setSearch(false)} />}</AnimatePresence>
    </>
  );
}

function SearchOverlay({ index, onClose }: { index: SearchEntry[]; onClose: () => void }) {
  const [q, setQ] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  useEffect(() => { input.current?.focus(); }, []);
  const results = useMemo(() => {
    const terms = norm(q).split(/\s+/).filter(Boolean);
    if (!terms.length) return index.filter((p) => p.isNew).slice(0, 6);
    return index.filter((p) => { const hay = norm(`${p.name} ${p.category} ${p.colors}`); return terms.every((t) => hay.includes(t)); }).slice(0, 12);
  }, [q, index]);

  return (
    <motion.div role="dialog" aria-modal="true" aria-label="Buscar" className="fixed inset-0 z-[80] overflow-y-auto bg-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
      <div className="container-x pt-4 pb-16">
        <form className="flex items-center gap-3 border-b border-ink pb-2" role="search" onSubmit={(e) => { e.preventDefault(); if (q.trim()) { router.push(`/tienda?q=${encodeURIComponent(q.trim())}`); onClose(); } }}>
          <IconSearch className="shrink-0" />
          <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} type="search" enterKeyHint="search" placeholder="Buscá top, vestido, sweater…" aria-label="Buscar prendas" className="h-14 w-full bg-transparent text-xl font-light outline-none placeholder:text-muted/70 [&::-webkit-search-cancel-button]:hidden" />
          <button type="button" className="-mr-2 grid h-11 w-11 shrink-0 place-items-center rounded-full hover:bg-surface" onClick={onClose} aria-label="Cerrar búsqueda"><IconClose /></button>
        </form>
        <p className="label mt-6 mb-4 text-muted" aria-live="polite">{q.trim() ? `${results.length} ${results.length === 1 ? 'resultado' : 'resultados'}` : 'Nuevos ingresos'}</p>
        {results.length === 0 ? (
          <p className="text-muted">No encontramos prendas con “{q}”. Probá con otra palabra o <Link href="/tienda" className="text-ink underline underline-offset-4" onClick={onClose}>mirá toda la tienda</Link>.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-6">
            {results.map((p, i) => (
              <motion.li key={p.slug} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.25) }}>
                <Link href={`/producto/${p.slug}`} onClick={onClose} className="group block">
                  <span className="block aspect-[4/5] overflow-hidden rounded-xl bg-surface">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {p.image && <img src={p.image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />}
                  </span>
                  <span className="mt-2 block truncate text-sm font-medium">{p.name}</span>
                  <span className="block text-xs text-muted">{p.price != null ? money(p.price) : p.category}</span>
                </Link>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  );
}
