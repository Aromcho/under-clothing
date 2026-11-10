'use client';

import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import type { Settings } from '@/lib/types';
import { contactLink, money } from '@/lib/format';
import { IconBag, IconCheck, IconClose, IconInstagram, IconMinus, IconPlus, IconTrash, IconWhatsapp } from './Icons';

export type CartItem = { key: string; productId: number; variantId: number | null; slug: string; name: string; size: string; color: string; price: number | null; image: string | null; qty: number };
type Ctx = { items: CartItem[]; count: number; open: boolean; setOpen: (o: boolean) => void; add: (i: Omit<CartItem, 'key' | 'qty'>, qty?: number) => void; setQty: (key: string, qty: number) => void; clear: () => void; bump: number; business: Settings['business'] };

const CartCtx = createContext<Ctx | null>(null);
export const useCart = () => {
  const c = useContext(CartCtx);
  if (!c) throw new Error('useCart fuera de CartProvider');
  return c;
};
const KEY = 'under-cart-v1';

export function CartProvider({ children, business }: { children: ReactNode; business: Settings['business'] }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [bump, setBump] = useState(0);
  const loaded = useRef(false);

  useEffect(() => {
    try { const raw = localStorage.getItem(KEY); if (raw) setItems(JSON.parse(raw)); } catch {}
    loaded.current = true;
  }, []);
  useEffect(() => {
    if (!loaded.current) return;
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
  }, [items]);

  const add = useCallback<Ctx['add']>((i, qty = 1) => {
    const key = `${i.productId}:${i.variantId ?? 0}`;
    setItems((prev) => {
      const ex = prev.find((x) => x.key === key);
      return ex ? prev.map((x) => (x.key === key ? { ...x, qty: Math.min(20, x.qty + qty) } : x)) : [...prev, { ...i, key, qty }];
    });
    setBump((b) => b + 1);
    setOpen(true);
  }, []);
  const setQty = useCallback((key: string, qty: number) => setItems((prev) => (qty <= 0 ? prev.filter((x) => x.key !== key) : prev.map((x) => (x.key === key ? { ...x, qty: Math.min(20, qty) } : x)))), []);
  const clear = useCallback(() => setItems([]), []);
  const count = useMemo(() => items.reduce((s, i) => s + i.qty, 0), [items]);

  return (
    <CartCtx.Provider value={{ items, count, open, setOpen, add, setQty, clear, bump, business }}>
      {children}
      <CartDrawer />
    </CartCtx.Provider>
  );
}

function useLockScroll(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [active]);
}

function CartDrawer() {
  const { items, open, setOpen, setQty, clear, business } = useCart();
  const [step, setStep] = useState<'cart' | 'form' | 'done'>('cart');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ code: string; href: string; kind: 'whatsapp' | 'instagram'; copied: boolean } | null>(null);
  const [delivery, setDelivery] = useState<'retiro' | 'envio'>('retiro');
  const panel = useRef<HTMLDivElement>(null);
  useLockScroll(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    panel.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [open, setOpen]);
  useEffect(() => { if (!open && step === 'done') { setStep('cart'); setResult(null); } }, [open, step]);

  const allPriced = items.length > 0 && items.every((i) => i.price != null);
  const total = allPriced ? items.reduce((s, i) => s + (i.price as number) * i.qty, 0) : null;
  const channel = contactLink(business);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setSending(true);
    const f = new FormData(e.currentTarget);
    // Se abre la pestaña en el mismo gesto del usuario para que el navegador no la bloquee
    const win = channel.kind === 'whatsapp' ? window.open('', '_blank') : null;
    try {
      const r = await fetch('/api/public/orders', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          kind: 'pedido', customerName: f.get('name'), phone: f.get('phone') ?? '', delivery, address: f.get('address') ?? '', message: f.get('message') ?? '',
          items: items.map((i) => ({ productId: i.productId, variantId: i.variantId, qty: i.qty })),
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(Array.isArray(data.message) ? data.message[0] : data.message || 'No pudimos guardar el pedido');
      const link = contactLink(business, data.message);
      let copied = false;
      if (link.kind === 'instagram') { try { await navigator.clipboard.writeText(data.message); copied = true; } catch {} }
      if (win) win.location.href = link.href;
      setResult({ code: data.code, href: link.href, kind: link.kind, copied });
      setStep('done');
      clear();
    } catch (err) {
      win?.close();
      setError(err instanceof Error ? err.message : 'Algo salió mal. Probá de nuevo.');
    } finally {
      setSending(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[70]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
          <button className="absolute inset-0 cursor-default bg-ink/35 backdrop-blur-[2px]" aria-label="Cerrar carrito" onClick={() => setOpen(false)} />
          <motion.div
            ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Tu pedido"
            className="absolute inset-y-0 right-0 flex w-full max-w-[27rem] flex-col bg-bg shadow-2xl outline-none"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 320, damping: 36 }}
          >
            <header className="flex items-center justify-between border-b border-line px-5 py-4">
              <p className="label">{step === 'done' ? 'Pedido enviado' : step === 'form' ? 'Tus datos' : `Tu pedido${items.length ? ` · ${items.reduce((s, i) => s + i.qty, 0)}` : ''}`}</p>
              <button className="-mr-2 grid h-11 w-11 place-items-center rounded-full hover:bg-surface" onClick={() => setOpen(false)} aria-label="Cerrar"><IconClose /></button>
            </header>

            {step === 'done' && result ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center">
                <span className="grid h-16 w-16 place-items-center rounded-full bg-pink"><IconCheck width={28} height={28} /></span>
                <h2 className="text-3xl">¡Listo! Guardamos tu pedido</h2>
                <p className="text-muted">Código <strong className="font-medium text-ink">{result.code}</strong>. {result.kind === 'whatsapp' ? 'Te abrimos WhatsApp con el mensaje armado: sólo falta enviarlo.' : result.copied ? 'Copiamos el mensaje: pegalo en el chat de Instagram y enviálo.' : 'Escribinos por Instagram con tu código y te respondemos.'}</p>
                <a className="btn w-full" href={result.href} target="_blank" rel="noopener noreferrer">
                  {result.kind === 'whatsapp' ? <IconWhatsapp /> : <IconInstagram />} Abrir {result.kind === 'whatsapp' ? 'WhatsApp' : 'Instagram'}
                </a>
                <button className="stitch-link text-sm" onClick={() => setOpen(false)}>Seguir mirando</button>
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
                <span className="grid h-16 w-16 place-items-center rounded-full bg-surface"><IconBag width={26} height={26} /></span>
                <h2 className="text-2xl">Tu carrito está vacío</h2>
                <p className="text-muted">Elegí tus prendas, sumalas acá y mandanos el pedido en un mensaje.</p>
                <Link href="/tienda" className="btn mt-2" onClick={() => setOpen(false)}>Ver la tienda</Link>
              </div>
            ) : step === 'cart' ? (
              <>
                <ul className="flex-1 divide-y divide-line overflow-y-auto overscroll-contain px-5">
                  <AnimatePresence initial={false}>
                    {items.map((i) => (
                      <motion.li key={i.key} layout exit={{ opacity: 0, height: 0 }} className="flex gap-4 py-4">
                        <Link href={`/producto/${i.slug}`} onClick={() => setOpen(false)} className="block h-28 w-[5.6rem] shrink-0 overflow-hidden rounded-lg bg-surface">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {i.image && <img src={i.image} alt="" className="h-full w-full object-cover" />}
                        </Link>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <p className="truncate font-medium">{i.name}</p>
                          <p className="text-sm text-muted">{[i.size && `Talle ${i.size}`, i.color].filter(Boolean).join(' · ') || 'Talle a confirmar'}</p>
                          <p className="mt-1 text-sm">{i.price != null ? money(i.price * i.qty) : <span className="text-muted">Precio a confirmar</span>}</p>
                          <div className="mt-auto flex items-center justify-between pt-2">
                            <div className="flex items-center rounded-full ring-1 ring-line ring-inset">
                              <button className="grid h-9 w-9 place-items-center" aria-label={`Quitar una unidad de ${i.name}`} onClick={() => setQty(i.key, i.qty - 1)}><IconMinus width={16} height={16} /></button>
                              <span className="w-6 text-center text-sm tabular-nums" aria-live="polite">{i.qty}</span>
                              <button className="grid h-9 w-9 place-items-center" aria-label={`Sumar una unidad de ${i.name}`} onClick={() => setQty(i.key, i.qty + 1)}><IconPlus width={16} height={16} /></button>
                            </div>
                            <button className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-surface hover:text-ink" aria-label={`Eliminar ${i.name}`} onClick={() => setQty(i.key, 0)}><IconTrash width={18} height={18} /></button>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
                <footer className="space-y-3 border-t border-line bg-surface/60 px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                  <div className="flex items-baseline justify-between">
                    <span className="label">Total</span>
                    <span className="text-xl">{total != null ? money(total) : <span className="text-base text-muted">Te lo confirmamos por mensaje</span>}</span>
                  </div>
                  <button className="btn w-full" onClick={() => setStep('form')}>Continuar</button>
                  <p className="text-center text-xs text-muted">Sin pago online: coordinás todo por {channel.label}.</p>
                </footer>
              </>
            ) : (
              <form onSubmit={submit} className="flex flex-1 flex-col overflow-y-auto">
                <div className="flex-1 space-y-4 px-5 py-5">
                  <label className="block"><span className="label mb-2 block">Nombre y apellido</span><input name="name" required minLength={2} maxLength={80} autoComplete="name" className="field" placeholder="¿Cómo te llamás?" /></label>
                  <label className="block"><span className="label mb-2 block">Teléfono <span className="tracking-normal normal-case text-muted">(opcional)</span></span><input name="phone" type="tel" inputMode="tel" autoComplete="tel" maxLength={40} className="field" placeholder="Para avisarte cuando esté listo" /></label>
                  <fieldset>
                    <legend className="label mb-2">Entrega</legend>
                    <div className="grid grid-cols-2 gap-2">
                      {([['retiro', 'Retiro en el local'], ['envio', 'Envío']] as const).map(([v, l]) => (
                        <button type="button" key={v} className="chip justify-center" aria-pressed={delivery === v} onClick={() => setDelivery(v)}>{l}</button>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-muted">{delivery === 'retiro' ? `${business.address}, ${business.city}.` : 'Enviamos a todo el país. En Villa Gesell es gratis.'}</p>
                  </fieldset>
                  {delivery === 'envio' && (
                    <label className="block"><span className="label mb-2 block">Dirección y localidad</span><input name="address" required maxLength={200} autoComplete="street-address" className="field" placeholder="Calle, número, ciudad y provincia" /></label>
                  )}
                  <label className="block"><span className="label mb-2 block">Comentario <span className="tracking-normal normal-case text-muted">(opcional)</span></span><textarea name="message" rows={3} maxLength={600} className="field resize-none" placeholder="Talle que usás, dudas, horario para retirar…" /></label>
                  {error && <p role="alert" className="rounded-lg bg-pink/60 px-3 py-2 text-sm">{error}</p>}
                </div>
                <footer className="space-y-2 border-t border-line bg-surface/60 px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                  <button className="btn w-full" disabled={sending}>{channel.kind === 'whatsapp' ? <IconWhatsapp /> : <IconInstagram />}{sending ? 'Enviando…' : `Enviar pedido por ${channel.label}`}</button>
                  <button type="button" className="w-full py-2 text-sm text-muted hover:text-ink" onClick={() => setStep('cart')}>Volver al carrito</button>
                </footer>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
