'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Product, Settings, SizeGuide } from '@/lib/types';
import { available, colorsOf, contactLink, imgUrl, money, sizesOf, srcSet } from '@/lib/format';
import { useCart } from './Cart';
import { IconArrow, IconBag, IconCheck, IconChevron, IconClose, IconInstagram, IconWhatsapp, IconZoom } from './Icons';
import { Picture } from './Picture';

type Info = { shipping: Settings['shipping']; returns: Settings['returns'] };

export function ProductView({ p, guide, info, url }: { p: Product; guide: SizeGuide | null; info: Info; url: string }) {
  const cart = useCart();
  const reduce = useReducedMotion();
  const colors = useMemo(() => colorsOf(p), [p]);
  const sizes = useMemo(() => sizesOf(p), [p]);
  const [color, setColor] = useState(colors.length === 1 ? colors[0].name : '');
  const [size, setSize] = useState(sizes.length === 1 ? sizes[0] : '');
  const [idx, setIdx] = useState(0);
  const [zoom, setZoom] = useState<number | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [err, setErr] = useState('');
  const [added, setAdded] = useState(false);
  const [stuck, setStuck] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const cta = useRef<HTMLButtonElement>(null);

  const variant = p.variants.find((v) => (!colors.length || v.color === color) && (!sizes.length || v.size === size)) ?? null;
  const needColor = colors.length > 1 && !color, needSize = sizes.length > 1 && !size;
  const stockOf = (c: string, s: string) => p.variants.filter((v) => (!c || v.color === c) && (!s || v.size === s)).reduce((n, v) => n + v.stock, 0);
  const canBuy = available(p, variant ?? undefined) || (!variant && available(p));
  const contact = contactLink(cart.business, `¡Hola Under! 🤍 Quiero consultar por ${p.name}: ${url}`);

  useEffect(() => {
    const el = cta.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setStuck(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const go = (i: number) => {
    setIdx(i);
    const el = scroller.current;
    if (el) el.scrollTo({ left: el.clientWidth * i, behavior: reduce ? 'auto' : 'smooth' });
  };

  function add() {
    if (needColor) return setErr('Elegí un color');
    if (needSize) return setErr('Elegí un talle');
    if (!canBuy) return setErr('Esa combinación no tiene stock');
    setErr('');
    const img = p.images[0];
    cart.add({ productId: p.id, variantId: variant?.id ?? null, slug: p.slug, name: p.name, size: variant?.size ?? size, color: variant?.color ?? color, price: p.price, image: img ? imgUrl(img, 320) : null });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  const stockMsg = !p.trackStock
    ? 'Stock a confirmar al hacer el pedido'
    : !variant ? (available(p) ? 'Elegí talle y color para ver el stock' : 'Sin stock por ahora')
    : variant.stock <= 0 ? 'Sin stock en esta combinación' : variant.stock <= 2 ? `¡Últimas ${variant.stock === 1 ? 'unidad' : `${variant.stock} unidades`}!` : 'En stock';

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-14">
      {/* ——— Galería */}
      <div className="lg:flex lg:gap-4">
        {p.images.length > 1 && (
          <ul className="no-scrollbar hidden max-h-[80vh] w-20 shrink-0 flex-col gap-3 overflow-y-auto lg:flex" aria-label="Miniaturas">
            {p.images.map((m, i) => (
              <li key={m.id}><button onClick={() => go(i)} aria-label={`Ver foto ${i + 1}`} aria-current={i === idx} className={`block aspect-[4/5] w-full overflow-hidden rounded-lg transition-opacity ${i === idx ? 'ring-1 ring-ink ring-offset-2 ring-offset-bg' : 'opacity-60 hover:opacity-100'}`}><Picture media={m} sizes="80px" alt="" className="h-full w-full" /></button></li>
            ))}
          </ul>
        )}
        <div className="relative -mx-5 flex-1 md:mx-0">
          <div ref={scroller} className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto md:rounded-[1.4rem]" onScroll={(e) => { const el = e.currentTarget; const i = Math.round(el.scrollLeft / el.clientWidth); if (i !== idx) setIdx(i); }}>
            {p.images.map((m, i) => (
              <button key={m.id} className="group relative aspect-[4/5] w-full shrink-0 snap-center cursor-zoom-in overflow-hidden bg-surface" onClick={() => setZoom(i)} aria-label={`Ampliar foto ${i + 1} de ${p.images.length}`}>
                <Picture media={m} sizes="(min-width: 1024px) 46vw, 100vw" priority={i === 0} className="h-full w-full" alt={`${p.name}, foto ${i + 1}`} />
              </button>
            ))}
          </div>
          <span className="pointer-events-none absolute right-4 bottom-4 grid h-10 w-10 place-items-center rounded-full bg-bg/85 backdrop-blur" aria-hidden><IconZoom width={18} height={18} /></span>
          {p.images.length > 1 && (
            <div className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5" aria-hidden>
              {p.images.map((m, i) => (<span key={m.id} className={`h-1.5 rounded-full bg-bg shadow-sm transition-all duration-300 ${i === idx ? 'w-5' : 'w-1.5 opacity-60'}`} />))}
            </div>
          )}
        </div>
      </div>

      {/* ——— Ficha */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <nav aria-label="Migas" className="label mb-4 flex flex-wrap items-center gap-2 text-[0.625rem] text-muted">
          <Link href="/tienda" className="hover:text-ink">Tienda</Link>
          {p.category && (<><span aria-hidden>/</span><Link href={`/tienda?categoria=${p.category.slug}`} className="hover:text-ink">{p.category.name}</Link></>)}
        </nav>
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-[clamp(1.9rem,6.5vw,2.75rem)] leading-[1.05] font-light">{p.name}</h1>
          {p.isNew && <span className="label mt-2 shrink-0 rounded-full bg-pink px-3 py-2 text-[0.6rem]">Nuevo</span>}
        </div>
        <p className="mt-3 text-xl">
          {p.price != null ? (<>{money(p.price)}{p.comparePrice != null && p.comparePrice > p.price && <s className="ml-3 text-base text-muted">{money(p.comparePrice)}</s>}</>) : <span className="text-base text-muted">Precio: consultanos por mensaje</span>}
        </p>
        {p.description && <p className="mt-5 text-[1.05rem] leading-relaxed font-light text-muted">{p.description}</p>}

        {colors.length > 0 && (
          <fieldset className="mt-7">
            <legend className="label mb-3">Color{color && <span className="ml-2 tracking-normal text-muted normal-case">{color}</span>}</legend>
            <div className="flex flex-wrap gap-2.5">
              {colors.map((c) => {
                const out = p.trackStock && stockOf(c.name, size) <= 0;
                return (
                  <button key={c.name} type="button" title={c.name} aria-label={`Color ${c.name}${out ? ', sin stock' : ''}`} aria-pressed={color === c.name} onClick={() => { setColor(c.name); setErr(''); }}
                    className={`relative grid h-11 w-11 place-items-center rounded-full transition-transform active:scale-90 ${color === c.name ? 'ring-1 ring-ink ring-offset-[3px] ring-offset-bg' : 'ring-1 ring-line'} ${out ? 'opacity-40' : ''}`} style={{ background: c.hex || 'var(--color-pink)' }}>
                    {color === c.name && <IconCheck width={16} height={16} className="text-bg mix-blend-difference" />}
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        {sizes.length > 0 ? (
          <fieldset className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <legend className="label">Talle</legend>
              {guide ? <button type="button" className="stitch-link text-sm" onClick={() => setShowGuide(true)}>Guía de talles</button> : <Link href="/guia-de-talles" className="stitch-link text-sm">Guía de talles</Link>}
            </div>
            <div className="flex flex-wrap gap-2">
              {sizes.map((s) => {
                const out = p.trackStock && stockOf(color, s) <= 0;
                return (<button key={s} type="button" aria-pressed={size === s} disabled={out} onClick={() => { setSize(s); setErr(''); }} className={`chip min-w-14 justify-center ${out ? 'text-muted line-through opacity-50' : ''}`}>{s}</button>);
              })}
            </div>
          </fieldset>
        ) : (
          <p className="mt-6 flex items-center justify-between gap-3 rounded-xl bg-surface px-4 py-3 text-sm">
            <span><span className="label mr-2">Talle</span>{p.sizesNote || 'Consultá los talles disponibles'}</span>
            {guide ? <button type="button" className="stitch-link shrink-0" onClick={() => setShowGuide(true)}>Guía</button> : null}
          </p>
        )}
        {sizes.length > 0 && p.sizesNote && <p className="mt-2 text-sm text-muted">{p.sizesNote}</p>}

        <p className="mt-5 flex items-center gap-2 text-sm text-muted" aria-live="polite">
          <span className={`h-2 w-2 rounded-full ${p.trackStock ? (canBuy ? 'bg-[#3f8f5f]' : 'bg-accent') : 'bg-accent'}`} />{stockMsg}
        </p>
        {err && <p role="alert" className="mt-3 rounded-lg bg-pink/60 px-3 py-2 text-sm">{err}</p>}

        <div className="mt-5 flex flex-col gap-3">
          <button ref={cta} className="btn w-full" onClick={add} disabled={p.trackStock && !available(p)}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.span key={added ? 'ok' : 'add'} className="inline-flex items-center gap-2" initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -14, opacity: 0 }} transition={{ duration: 0.2 }}>
                {added ? <><IconCheck width={18} height={18} /> Agregado</> : <><IconBag width={18} height={18} /> Agregar al pedido</>}
              </motion.span>
            </AnimatePresence>
          </button>
          <a href={contact.href} target="_blank" rel="noopener noreferrer" className="btn btn-ghost w-full">{contact.kind === 'whatsapp' ? <IconWhatsapp width={18} height={18} /> : <IconInstagram width={18} height={18} />} Consultar por {contact.label}</a>
        </div>

        <div className="mt-8 divide-y divide-line border-y border-line">
          {p.details && <Acc title="Detalles" open><p className="whitespace-pre-line">{p.details}</p></Acc>}
          <Acc title="Envíos y retiro">
            {info.shipping.intro && <p>{info.shipping.intro}</p>}
            <ul className="mt-2 space-y-2">{info.shipping.items.map((x) => (<li key={x.title}><strong className="font-medium text-ink">{x.title}.</strong> {x.text}</li>))}</ul>
          </Acc>
          <Acc title="Cambios y devoluciones">
            {info.returns.items.length ? <ul className="space-y-2">{info.returns.items.map((x) => (<li key={x.title}><strong className="font-medium text-ink">{x.title}.</strong> {x.text}</li>))}</ul> : <p>Escribinos por mensaje y coordinamos el cambio. <Link href="/cambios-y-devoluciones" className="text-ink underline underline-offset-4">Más info</Link></p>}
          </Acc>
        </div>
        {p.igUrl && <a href={p.igUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm text-muted hover:text-ink"><IconInstagram width={18} height={18} /> Ver la publicación en Instagram <IconArrow width={14} height={14} /></a>}
      </div>

      {/* Barra fija en el celular cuando el botón queda fuera de vista */}
      <AnimatePresence>
        {stuck && (
          <motion.div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/95 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 380, damping: 38 }}>
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{p.name}</p><p className="truncate text-xs text-muted">{[color, size && `Talle ${size}`].filter(Boolean).join(' · ') || (p.price != null ? money(p.price) : 'Elegí color y talle')}</p></div>
              <button className="btn btn-sm shrink-0 !min-h-11" onClick={() => { if (needColor || needSize) { cta.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }); setErr(needColor ? 'Elegí un color' : 'Elegí un talle'); } else add(); }}><IconBag width={16} height={16} /> Agregar</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>{zoom !== null && <Lightbox p={p} start={zoom} onClose={() => setZoom(null)} />}</AnimatePresence>
      <AnimatePresence>{showGuide && guide && <GuideModal guide={guide} onClose={() => setShowGuide(false)} />}</AnimatePresence>
    </div>
  );
}

function Acc({ title, children, open }: { title: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details className="group" open={open}>
      <summary className="flex cursor-pointer list-none items-center justify-between py-4 [&::-webkit-details-marker]:hidden"><span className="label">{title}</span><IconChevron width={18} height={18} className="transition-transform duration-300 group-open:rotate-180" /></summary>
      <div className="pb-5 text-[0.95rem] leading-relaxed text-muted">{children}</div>
    </details>
  );
}

/** Visor con zoom: tocá para acercar, arrastrá para recorrer la prenda. */
function Lightbox({ p, start, onClose }: { p: Product; start: number; onClose: () => void }) {
  const [i, setI] = useState(start);
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState('50% 50%');
  const box = useRef<HTMLDivElement>(null);
  const moved = useRef(false);
  const m = p.images[i];
  const n = p.images.length;
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); if (e.key === 'ArrowRight') { setZoomed(false); setI((x) => (x + 1) % n); } if (e.key === 'ArrowLeft') { setZoomed(false); setI((x) => (x - 1 + n) % n); } };
    window.addEventListener('keydown', k);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = ''; };
  }, [n, onClose]);
  const setFromEvent = (e: React.PointerEvent | React.MouseEvent) => {
    const r = box.current?.getBoundingClientRect();
    if (r) setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
  };
  return (
    <motion.div role="dialog" aria-modal="true" aria-label={`Fotos de ${p.name}`} className="fixed inset-0 z-[90] flex flex-col bg-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="flex items-center justify-between px-4 py-3">
        <p className="label tabular-nums">{i + 1} / {n}</p>
        <p className="hidden text-sm text-muted sm:block">{zoomed ? 'Mové para recorrer · tocá para alejar' : 'Tocá la foto para acercar'}</p>
        <button autoFocus className="grid h-11 w-11 place-items-center rounded-full hover:bg-surface" onClick={onClose} aria-label="Cerrar"><IconClose /></button>
      </div>
      <div ref={box} className={`relative flex-1 touch-none overflow-hidden ${zoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
        onPointerDown={() => { moved.current = false; }}
        onPointerMove={(e) => { if (zoomed) { moved.current = e.pointerType !== 'mouse' ? true : moved.current; setFromEvent(e); } }}
        onClick={(e) => { if (moved.current && zoomed) { moved.current = false; return; } setFromEvent(e); setZoomed((z) => !z); }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={m.id} src={imgUrl(m, 1440)} srcSet={srcSet(m)} sizes={zoomed ? '250vw' : '100vw'} alt={`${p.name}, foto ${i + 1}`} draggable={false}
          className="absolute inset-0 h-full w-full object-contain transition-transform duration-300 ease-out select-none" style={{ transformOrigin: origin, transform: zoomed ? 'scale(2.5)' : 'scale(1)' }} />
      </div>
      {n > 1 && (
        <ul className="no-scrollbar flex justify-center gap-2 overflow-x-auto px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {p.images.map((x, k) => (<li key={x.id}><button onClick={() => { setZoomed(false); setI(k); }} aria-label={`Foto ${k + 1}`} aria-current={k === i} className={`block h-16 w-12 overflow-hidden rounded-md ${k === i ? 'ring-1 ring-ink ring-offset-2 ring-offset-bg' : 'opacity-55'}`}><Picture media={x} sizes="48px" alt="" className="h-full w-full" /></button></li>))}
        </ul>
      )}
    </motion.div>
  );
}

export function GuideTable({ guide }: { guide: SizeGuide }) {
  return (
    <div className="overflow-x-auto rounded-xl ring-1 ring-line">
      <table className="w-full min-w-[20rem] text-left text-sm">
        <thead className="bg-surface"><tr>{guide.columns.map((c) => (<th key={c} scope="col" className="label px-4 py-3 text-[0.625rem]">{c}</th>))}</tr></thead>
        <tbody className="divide-y divide-line">{guide.rows.map((r, i) => (<tr key={i}>{r.map((c, k) => (k === 0 ? <th key={k} scope="row" className="px-4 py-3 font-medium">{c}</th> : <td key={k} className="px-4 py-3 text-muted tabular-nums">{c}</td>))}</tr>))}</tbody>
      </table>
    </div>
  );
}

function GuideModal({ guide, onClose }: { guide: SizeGuide; onClose: () => void }) {
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [onClose]);
  return (
    <motion.div className="fixed inset-0 z-[90] grid place-items-end bg-ink/40 sm:place-items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div role="dialog" aria-modal="true" aria-label={guide.name} className="max-h-[85svh] w-full overflow-y-auto rounded-t-[1.6rem] bg-bg p-6 sm:max-w-xl sm:rounded-[1.6rem]" initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }} onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between"><h2 className="text-2xl">{guide.name}</h2><button autoFocus className="grid h-11 w-11 place-items-center rounded-full hover:bg-surface" onClick={onClose} aria-label="Cerrar"><IconClose /></button></div>
        <GuideTable guide={guide} />
        {guide.note && <p className="mt-4 text-sm text-muted">{guide.note}</p>}
      </motion.div>
    </motion.div>
  );
}
