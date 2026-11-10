'use client';

import { AnimatePresence, motion } from 'motion/react';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Media } from '@/lib/types';
import { IconCheck, IconClose, IconPlus, IconTrash } from '../Icons';
import { api, mediaUrl } from './api';

/* ——— Toasts ——— */
type Toast = { id: number; text: string; kind: 'ok' | 'error' };
const ToastCtx = createContext<(text: string, kind?: Toast['kind']) => void>(() => {});
export const useToast = () => useContext(ToastCtx);
export function ToastProvider({ children }: { children: ReactNode }) {
  const [list, setList] = useState<Toast[]>([]);
  const push = useCallback((text: string, kind: Toast['kind'] = 'ok') => {
    const id = Date.now() + Math.random();
    setList((l) => [...l, { id, text, kind }]);
    setTimeout(() => setList((l) => l.filter((t) => t.id !== id)), kind === 'error' ? 5000 : 2600);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-[120] flex flex-col items-center gap-2 px-4 lg:bottom-6" role="status" aria-live="polite">
        <AnimatePresence>
          {list.map((t) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8 }} className={`pointer-events-auto flex items-center gap-2 rounded-full px-4 py-2.5 text-sm shadow-lg ${t.kind === 'error' ? 'bg-[#8c2f2f] text-white' : 'bg-ink text-bg'}`}>
              {t.kind === 'ok' && <IconCheck width={16} height={16} />}{t.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

/* ——— Básicos ——— */
export function PageTitle({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="text-[1.7rem] leading-tight font-light">{title}</h1>{sub && <p className="mt-0.5 text-sm text-muted">{sub}</p>}</div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl bg-bg p-4 ring-1 ring-line md:p-5 ${className}`}>{children}</div>;
}
export function Field({ label, help, children, className = '' }: { label: string; help?: string; children: ReactNode; className?: string }) {
  return (<label className={`block ${className}`}><span className="label mb-1.5 block text-[0.625rem] text-muted">{label}</span>{children}{help && <span className="mt-1 block text-xs text-muted">{help}</span>}</label>);
}
export function Toggle({ checked, onChange, label, help }: { checked: boolean; onChange: (v: boolean) => void; label: string; help?: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="flex w-full items-center justify-between gap-4 rounded-xl px-1 py-2 text-left">
      <span><span className="block text-[0.95rem]">{label}</span>{help && <span className="block text-xs text-muted">{help}</span>}</span>
      <span className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${checked ? 'bg-ink' : 'bg-line'}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-bg shadow transition-all ${checked ? 'left-6' : 'left-1'}`} /></span>
    </button>
  );
}
export function Empty({ title, text, children }: { title: string; text?: string; children?: ReactNode }) {
  return (<div className="grid place-items-center rounded-2xl border border-dashed border-accent/60 px-6 py-14 text-center"><p className="text-xl font-light">{title}</p>{text && <p className="mt-1 max-w-sm text-sm text-muted">{text}</p>}{children && <div className="mt-5">{children}</div>}</div>);
}
export function Spinner() { return <div className="grid place-items-center py-20" role="status" aria-label="Cargando"><span className="h-7 w-7 animate-spin rounded-full border-2 border-line border-t-ink" /></div>; }

export function Sheet({ open, onClose, title, children, footer, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[100]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button className="absolute inset-0 cursor-default bg-ink/40" aria-label="Cerrar" onClick={onClose} />
          <motion.div role="dialog" aria-modal="true" aria-label={title} className={`absolute inset-x-0 bottom-0 flex max-h-[92svh] flex-col rounded-t-3xl bg-bg md:inset-y-0 md:right-0 md:left-auto md:max-h-none md:rounded-none ${wide ? 'md:w-[46rem]' : 'md:w-[30rem]'}`}
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 340, damping: 38 }}>
            <div className="flex items-center justify-between border-b border-line px-5 py-3"><h2 className="text-lg font-medium">{title}</h2><button className="-mr-2 grid h-11 w-11 place-items-center rounded-full hover:bg-surface" onClick={onClose} aria-label="Cerrar"><IconClose /></button></div>
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">{children}</div>
            {footer && <div className="flex gap-2 border-t border-line px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function useConfirm() {
  const [state, setState] = useState<{ text: string; resolve: (v: boolean) => void } | null>(null);
  const ask = useCallback((text: string) => new Promise<boolean>((resolve) => setState({ text, resolve })), []);
  const done = (v: boolean) => { state?.resolve(v); setState(null); };
  const node = (
    <AnimatePresence>
      {state && (
        <motion.div className="fixed inset-0 z-[130] grid place-items-center bg-ink/45 p-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div role="alertdialog" aria-modal="true" className="w-full max-w-sm rounded-3xl bg-bg p-6 text-center" initial={{ scale: 0.94 }} animate={{ scale: 1 }}>
            <p className="text-lg">{state.text}</p>
            <div className="mt-5 flex gap-2"><button className="btn btn-ghost btn-sm flex-1" onClick={() => done(false)}>Cancelar</button><button autoFocus className="btn btn-sm flex-1 !bg-[#8c2f2f]" onClick={() => done(true)}>Eliminar</button></div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
  return { ask, node };
}

/* ——— Ordenar arrastrando (mouse y táctil, listas y grillas) ——— */
export function Sortable<T extends { id: number }>({ items, onChange, onDrop, render, className }: { items: T[]; onChange: (items: T[]) => void; onDrop?: (items: T[]) => void; render: (item: T, handle: ReactNode, dragging: boolean) => ReactNode; className?: string }) {
  const [drag, setDrag] = useState<number | null>(null);
  const ref = useRef(items);
  ref.current = items;
  const start = (e: React.PointerEvent, id: number) => {
    e.preventDefault();
    setDrag(id);
    const move = (ev: PointerEvent) => {
      const el = (document.elementFromPoint(ev.clientX, ev.clientY) as HTMLElement | null)?.closest<HTMLElement>('[data-sort-id]');
      const over = el ? Number(el.dataset.sortId) : null;
      if (over == null || over === id) return;
      const list = [...ref.current];
      const from = list.findIndex((x) => x.id === id), to = list.findIndex((x) => x.id === over);
      if (from < 0 || to < 0) return;
      list.splice(to, 0, list.splice(from, 1)[0]);
      onChange(list);
    };
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); setDrag(null); onDrop?.(ref.current); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  };
  return (
    <div className={className}>
      {items.map((it) => (
        <motion.div key={it.id} layout transition={{ type: 'spring', stiffness: 500, damping: 40 }} data-sort-id={it.id} className={drag === it.id ? 'z-10 opacity-70' : ''}>
          {render(it, (
            <button type="button" aria-label="Arrastrar para ordenar" onPointerDown={(e) => start(e, it.id)} className="grid h-9 w-9 shrink-0 cursor-grab touch-none place-items-center rounded-lg text-muted hover:bg-surface active:cursor-grabbing">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden><circle cx="5" cy="3" r="1.4" /><circle cx="11" cy="3" r="1.4" /><circle cx="5" cy="8" r="1.4" /><circle cx="11" cy="8" r="1.4" /><circle cx="5" cy="13" r="1.4" /><circle cx="11" cy="13" r="1.4" /></svg>
            </button>
          ), drag === it.id)}
        </motion.div>
      ))}
    </div>
  );
}

/* ——— Medios ——— */
export function Thumb({ m, className = '' }: { m: Media | null | undefined; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return m ? <img src={mediaUrl(m, 320)} alt="" loading="lazy" className={`bg-surface object-cover ${className}`} style={{ objectPosition: 'center 25%' }} /> : <span className={`grid place-items-center bg-surface text-muted ${className}`} aria-hidden>—</span>;
}

export async function uploadFiles(files: FileList | File[]) {
  const form = new FormData();
  for (const f of Array.from(files)) form.append('files', f);
  return api<Media[]>('admin/media', { form });
}

export function MediaPicker({ open, onClose, onPick, multiple }: { open: boolean; onClose: () => void; onPick: (m: Media[]) => void; multiple?: boolean }) {
  const [list, setList] = useState<Media[] | null>(null);
  const [sel, setSel] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState('');
  const toast = useToast();
  useEffect(() => { if (open) { setSel([]); setQ(''); api<Media[]>('admin/media').then(setList).catch(() => setList([])); } }, [open]);
  const pick = (id: number) => (multiple ? setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id])) : setSel([id]));
  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    try { const up = await uploadFiles(files); setList((l) => [...up, ...(l ?? [])]); setSel((s) => (multiple ? [...s, ...up.map((u) => u.id)] : [up[0].id])); toast(`${up.length} imagen(es) subida(s)`); }
    catch (e) { toast((e as Error).message, 'error'); }
    finally { setBusy(false); }
  };
  const shown = (list ?? []).filter((m) => !q || m.alt.toLowerCase().includes(q.toLowerCase()));
  return (
    <Sheet open={open} onClose={onClose} title="Elegir imágenes" wide
      footer={<><button className="btn btn-ghost btn-sm flex-1" onClick={onClose}>Cancelar</button><button className="btn btn-sm flex-[2]" disabled={!sel.length} onClick={() => { onPick(sel.map((id) => list!.find((m) => m.id === id)!).filter(Boolean)); onClose(); }}>Usar {sel.length || ''} {sel.length === 1 ? 'imagen' : 'imágenes'}</button></>}>
      <div className="mb-4 flex gap-2">
        <input className="field !min-h-11" placeholder="Buscar por nombre…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar imágenes" />
        <label className={`btn btn-sm shrink-0 cursor-pointer ${busy ? 'pointer-events-none opacity-50' : ''}`}><IconPlus width={16} height={16} />{busy ? 'Subiendo…' : 'Subir'}<input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => upload(e.target.files)} /></label>
      </div>
      {!list ? <Spinner /> : (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {shown.map((m) => {
            const n = sel.indexOf(m.id);
            return (
              <li key={m.id}><button type="button" onClick={() => pick(m.id)} aria-pressed={n >= 0} title={m.alt} className={`relative block aspect-[4/5] w-full overflow-hidden rounded-xl ${n >= 0 ? 'ring-2 ring-ink ring-offset-2 ring-offset-bg' : ''}`}>
                <Thumb m={m} className="h-full w-full" />
                {n >= 0 && <span className="absolute top-1.5 right-1.5 grid h-6 w-6 place-items-center rounded-full bg-ink text-xs text-bg">{multiple ? n + 1 : <IconCheck width={14} height={14} />}</span>}
              </button></li>
            );
          })}
        </ul>
      )}
    </Sheet>
  );
}

/** Campo de una sola imagen (categorías, banners, historias…). */
export function MediaField({ value, onChange, label = 'Imagen' }: { value: Media | null; onChange: (m: Media | null) => void; label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <span className="label mb-1.5 block text-[0.625rem] text-muted">{label}</span>
      <div className="flex items-center gap-3">
        <Thumb m={value} className="h-24 w-20 rounded-xl" />
        <div className="flex flex-col gap-2">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(true)}>{value ? 'Cambiar' : 'Elegir imagen'}</button>
          {value && <button type="button" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink" onClick={() => onChange(null)}><IconTrash width={14} height={14} /> Quitar</button>}
        </div>
      </div>
      <MediaPicker open={open} onClose={() => setOpen(false)} onPick={(m) => onChange(m[0] ?? null)} />
    </div>
  );
}
