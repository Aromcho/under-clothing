'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import type { Order } from '@/lib/types';
import { money } from '@/lib/format';
import { api, fmtDate, timeAgo } from '@/components/admin/api';
import { STATUS, StatusBadge } from '@/components/admin/orders';
import { useUser } from '@/components/admin/Shell';
import { Empty, PageTitle, Sheet, Spinner, useConfirm, useToast } from '@/components/admin/ui';
import { IconTrash, IconWhatsapp } from '@/components/Icons';

const waNumber = (phone: string) => {
  let d = phone.replace(/\D/g, '');
  if (!d) return '';
  if (d.startsWith('0')) d = d.slice(1);
  if (!d.startsWith('54')) d = '54' + d;
  if (!d.startsWith('549')) d = '549' + d.slice(2);
  return d;
};

function Orders() {
  const sp = useSearchParams();
  const toast = useToast();
  const user = useUser();
  const confirm = useConfirm();
  const [list, setList] = useState<Order[] | null>(null);
  const [status, setStatus] = useState('todos');
  const [openId, setOpenId] = useState<number | null>(sp.get('ver') ? Number(sp.get('ver')) : null);
  const [note, setNote] = useState('');
  const load = () => api<Order[]>('admin/orders').then(setList).catch((e) => toast(e.message, 'error'));
  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const shown = useMemo(() => (list ?? []).filter((o) => status === 'todos' || (status === 'consultas' ? o.kind === 'consulta' : o.status === status)), [list, status]);
  const o = list?.find((x) => x.id === openId) ?? null;

  async function patch(body: { status?: string; note?: string }) {
    if (!o) return;
    try { const r = await api<Order>(`admin/orders/${o.id}`, { method: 'PATCH', body }); setList((l) => l!.map((x) => (x.id === r.id ? r : x))); setNote(''); toast(body.status ? `Marcado como ${STATUS[body.status]?.label.toLowerCase()}` : 'Nota agregada'); }
    catch (e) { toast((e as Error).message, 'error'); }
  }
  async function remove() {
    if (!o || !(await confirm.ask(`¿Eliminar ${o.code}?`))) return;
    try { await api(`admin/orders/${o.id}`, { method: 'DELETE' }); setList((l) => l!.filter((x) => x.id !== o.id)); setOpenId(null); toast('Eliminado'); } catch (e) { toast((e as Error).message, 'error'); }
  }

  if (!list) return <Spinner />;
  const counts = (k: string) => list.filter((x) => (k === 'consultas' ? x.kind === 'consulta' : x.status === k)).length;
  const reply = o ? `¡Hola ${o.customerName.split(' ')[0]}! Te escribimos de Under Clothing por tu ${o.kind} ${o.code} 🤍` : '';
  return (
    <>
      <PageTitle title="Pedidos y consultas" sub="Llegan desde el carrito y el formulario de contacto de la web" />
      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4">
        <button className="chip" aria-pressed={status === 'todos'} onClick={() => setStatus('todos')}>Todos <span className="opacity-60">{list.length}</span></button>
        {Object.entries(STATUS).map(([k, v]) => (<button key={k} className="chip" aria-pressed={status === k} onClick={() => setStatus(k)}>{v.label} <span className="opacity-60">{counts(k)}</span></button>))}
        <button className="chip" aria-pressed={status === 'consultas'} onClick={() => setStatus('consultas')}>Consultas <span className="opacity-60">{counts('consultas')}</span></button>
      </div>
      {shown.length === 0 ? <Empty title="Sin pedidos por acá" text="Cuando alguien envíe un pedido o una consulta desde la web, aparece en esta lista." /> : (
        <ul className="grid gap-2 md:grid-cols-2">
          {shown.map((x) => (
            <li key={x.id}>
              <button onClick={() => setOpenId(x.id)} className="flex w-full items-center gap-3 rounded-2xl bg-bg p-3.5 text-left ring-1 ring-line transition-transform hover:-translate-y-0.5">
                <span className="flex -space-x-3">{x.items.slice(0, 3).map((i, k) => (/* eslint-disable-next-line @next/next/no-img-element */ i.image ? <img key={k} src={i.image} alt="" className="h-14 w-11 rounded-lg object-cover ring-2 ring-bg" /> : null))}{x.items.length === 0 && <span className="grid h-14 w-11 place-items-center rounded-lg bg-surface text-lg">?</span>}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{x.customerName}</span>
                  <span className="block truncate text-xs text-muted">{x.code} · {x.kind === 'pedido' ? `${x.items.reduce((s, i) => s + i.qty, 0)} prenda(s)${x.total != null ? ` · ${money(x.total)}` : ''}` : x.message}</span>
                  <span className="block text-xs text-muted">{timeAgo(x.createdAt)}</span>
                </span>
                <StatusBadge status={x.status} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Sheet open={!!o} onClose={() => setOpenId(null)} title={o ? `${o.kind === 'pedido' ? 'Pedido' : 'Consulta'} ${o.code}` : ''}
        footer={o && (o.phone ? <a className="btn btn-sm flex-1" href={`https://wa.me/${waNumber(o.phone)}?text=${encodeURIComponent(reply)}`} target="_blank" rel="noopener noreferrer" onClick={() => o.status === 'nuevo' && patch({ status: 'contactado' })}><IconWhatsapp width={18} height={18} /> Responder por WhatsApp</a> : <p className="flex-1 py-2 text-center text-sm text-muted">No dejó teléfono: el mensaje te llega con su nombre y código.</p>)}>
        {o && (
          <div className="space-y-5">
            <div><p className="text-xl">{o.customerName}</p><p className="text-sm text-muted">{fmtDate(o.createdAt)}{o.phone ? ` · ${o.phone}` : ''}</p>{o.kind === 'pedido' && <p className="mt-1 text-sm">{o.delivery === 'envio' ? `Envío a: ${o.address || 'dirección a confirmar'}` : 'Retira por el local'}</p>}</div>
            <div><p className="label mb-2 text-[0.6rem] text-muted">Estado</p><div className="flex flex-wrap gap-2">{Object.entries(STATUS).map(([k, v]) => (<button key={k} className="chip" aria-pressed={o.status === k} onClick={() => o.status !== k && patch({ status: k })}>{v.label}</button>))}</div><p className="mt-2 text-xs text-muted">Al confirmar se descuenta el stock de las prendas que lo controlan; al cancelar se repone.</p></div>
            {o.items.length > 0 && (
              <ul className="divide-y divide-line rounded-2xl ring-1 ring-line">
                {o.items.map((i, k) => (<li key={k} className="flex items-center gap-3 p-3">{/* eslint-disable-next-line @next/next/no-img-element */ i.image && <img src={i.image} alt="" className="h-16 w-12 rounded-lg object-cover" />}<span className="min-w-0 flex-1"><a href={`/producto/${i.slug}`} target="_blank" className="block truncate font-medium hover:underline">{i.qty} × {i.name}</a><span className="block text-xs text-muted">{[i.size && `Talle ${i.size}`, i.color].filter(Boolean).join(' · ') || 'Talle y color a confirmar'}</span></span><span className="text-sm tabular-nums">{i.price != null ? money(i.price * i.qty) : '—'}</span></li>))}
                <li className="flex justify-between p-3 text-sm"><span className="label text-[0.6rem]">Total</span><span className="font-medium">{o.total != null ? money(o.total) : 'A confirmar'}</span></li>
              </ul>
            )}
            {o.message && <div><p className="label mb-1.5 text-[0.6rem] text-muted">{o.kind === 'consulta' ? 'Consulta' : 'Comentario'}</p><p className="rounded-2xl bg-surface p-3 whitespace-pre-line">{o.message}</p></div>}
            <div>
              <p className="label mb-2 text-[0.6rem] text-muted">Notas internas</p>
              {o.notes.length > 0 && <ul className="mb-3 space-y-2">{o.notes.map((n, k) => (<li key={k} className="rounded-xl bg-pink/40 px-3 py-2 text-sm">{n.text}<span className="block text-xs text-muted">{n.by} · {fmtDate(n.at)}</span></li>))}</ul>}
              <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (note.trim()) patch({ note }); }}><input className="field !min-h-11" placeholder="Ej.: seña recibida, retira el sábado…" value={note} onChange={(e) => setNote(e.target.value)} aria-label="Nueva nota" /><button className="btn btn-sm shrink-0" disabled={!note.trim()}>Agregar</button></form>
            </div>
            {user.role === 'admin' && <button onClick={remove} className="inline-flex items-center gap-2 text-sm text-[#8c2f2f]"><IconTrash width={16} height={16} /> Eliminar</button>}
          </div>
        )}
      </Sheet>
      {confirm.node}
    </>
  );
}
export default function Page() { return <Suspense><Orders /></Suspense>; }
