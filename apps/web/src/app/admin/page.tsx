'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Order } from '@/lib/types';
import { api, timeAgo } from '@/components/admin/api';
import { STATUS, StatusBadge } from '@/components/admin/orders';
import { useUser } from '@/components/admin/Shell';
import { Card, PageTitle, Spinner } from '@/components/admin/ui';

type Dash = {
  counts: { products: number; visible: number; noPrice: number; noStock: number; media: number; orders: number; newOrders: number; ordersWeek: number };
  byStatus: Record<string, number>; days: { day: string; count: number }[]; recentOrders: Order[];
  lowStock: { productId: number; name: string; size: string; color: string; stock: number }[];
  activity: { id: number; userName: string; action: string; entity: string; summary: string; createdAt: string }[];
};

export default function Dashboard() {
  const user = useUser();
  const [d, setD] = useState<Dash | null>(null);
  const [wa, setWa] = useState(true);
  useEffect(() => {
    api<Dash>('admin/dashboard').then(setD).catch(() => {});
    api<any>('admin/settings').then((s) => setWa(!!s.business?.whatsapp)).catch(() => {});
  }, []);
  if (!d) return <Spinner />;
  const max = Math.max(1, ...d.days.map((x) => x.count));
  const todo = [
    !wa && { text: 'Cargá el número de WhatsApp para recibir los pedidos ahí', href: '/admin/negocio' },
    d.counts.noPrice > 0 && { text: `${d.counts.noPrice} prendas sin precio (se muestran como “Consultá el precio”)`, href: '/admin/productos?filtro=sin-precio' },
  ].filter(Boolean) as { text: string; href: string }[];
  const stats = [
    { label: 'Pedidos nuevos', value: d.counts.newOrders, href: '/admin/pedidos', hi: d.counts.newOrders > 0 },
    { label: 'Pedidos (7 días)', value: d.counts.ordersWeek, href: '/admin/pedidos' },
    { label: 'Prendas visibles', value: `${d.counts.visible}/${d.counts.products}`, href: '/admin/productos' },
    { label: 'Imágenes', value: d.counts.media, href: '/admin/medios' },
  ];
  return (
    <>
      <PageTitle title={`Hola, ${user.name.split(' ')[0]}`} sub="Así está la tienda hoy" />
      {todo.length > 0 && (
        <ul className="mb-4 space-y-2">
          {todo.map((t) => (<li key={t.href}><Link href={t.href} className="flex items-center justify-between gap-3 rounded-2xl bg-pink/70 px-4 py-3 text-sm"><span>{t.text}</span><span className="label shrink-0 text-[0.6rem]">Resolver →</span></Link></li>))}
        </ul>
      )}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className={`rounded-2xl p-4 ring-1 ring-line transition-transform hover:-translate-y-0.5 ${s.hi ? 'bg-ink text-bg' : 'bg-bg'}`}>
            <p className={`label text-[0.6rem] ${s.hi ? 'opacity-80' : 'text-muted'}`}>{s.label}</p><p className="mt-2 text-4xl font-light tabular-nums">{s.value}</p>
          </Link>
        ))}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <div className="mb-4 flex items-center justify-between"><h2 className="font-medium">Pedidos y consultas · últimos 14 días</h2><span className="text-sm text-muted">{d.counts.orders} en total</span></div>
          <div className="flex h-32 items-end gap-1.5" role="img" aria-label={`Pedidos por día: ${d.days.map((x) => `${x.day.slice(5)}: ${x.count}`).join(', ')}`}>
            {d.days.map((x) => (<div key={x.day} className="flex flex-1 flex-col items-center gap-1" title={`${x.day}: ${x.count}`}><span className="text-[0.6rem] text-muted tabular-nums">{x.count || ''}</span><span className={`w-full rounded-t-md ${x.count ? 'bg-accent' : 'bg-line'}`} style={{ height: `${Math.max(4, (x.count / max) * 84)}px` }} /></div>))}
          </div>
          <div className="mt-2 flex justify-between text-[0.65rem] text-muted"><span>{d.days[0].day.slice(5).split('-').reverse().join('/')}</span><span>hoy</span></div>
          <div className="mt-4 flex flex-wrap gap-2">{Object.entries(STATUS).map(([k, v]) => (<span key={k} className="rounded-full bg-surface px-3 py-1 text-xs">{v.label} <strong className="font-medium tabular-nums">{d.byStatus[k] ?? 0}</strong></span>))}</div>
        </Card>
        <Card>
          <div className="mb-3 flex items-center justify-between"><h2 className="font-medium">Últimos pedidos</h2><Link href="/admin/pedidos" className="text-sm text-muted hover:text-ink">Ver todos</Link></div>
          {d.recentOrders.length === 0 ? <p className="py-6 text-center text-sm text-muted">Todavía no llegó ningún pedido.</p> : (
            <ul className="divide-y divide-line">{d.recentOrders.map((o) => (<li key={o.id}><Link href={`/admin/pedidos?ver=${o.id}`} className="flex items-center justify-between gap-3 py-2.5"><span className="min-w-0"><span className="block truncate text-sm font-medium">{o.customerName}</span><span className="block text-xs text-muted">{o.code} · {o.kind === 'pedido' ? `${o.items.reduce((s, i) => s + i.qty, 0)} prenda(s)` : 'consulta'} · {timeAgo(o.createdAt)}</span></span><StatusBadge status={o.status} /></Link></li>))}</ul>
          )}
        </Card>
        <Card>
          <h2 className="mb-3 font-medium">Actividad</h2>
          <ul className="space-y-3">{d.activity.map((a) => (<li key={a.id} className="flex gap-3 text-sm"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" /><span><strong className="font-medium">{a.userName}</strong> {a.action} {a.entity}{a.summary ? <>: <span className="text-muted">{a.summary}</span></> : ''}<span className="block text-xs text-muted">{timeAgo(a.createdAt)}</span></span></li>))}</ul>
        </Card>
        <Card>
          <h2 className="mb-3 font-medium">Stock por agotarse</h2>
          {d.lowStock.length === 0 ? <p className="py-6 text-center text-sm text-muted">Nada por agotarse. El stock se controla en las prendas que tengan activado “Controlar stock”.</p> : (
            <ul className="divide-y divide-line">{d.lowStock.map((l, i) => (<li key={i}><Link href={`/admin/productos/${l.productId}`} className="flex items-center justify-between py-2.5 text-sm"><span>{l.name} <span className="text-muted">{[l.size, l.color].filter(Boolean).join(' · ')}</span></span><span className="rounded-full bg-pink px-2.5 py-1 text-xs tabular-nums">queda {l.stock}</span></Link></li>))}</ul>
          )}
        </Card>
      </div>
    </>
  );
}
