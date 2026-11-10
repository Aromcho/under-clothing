'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import type { Product } from '@/lib/types';
import { money } from '@/lib/format';
import { api } from '@/components/admin/api';
import { Empty, PageTitle, Sortable, Spinner, Thumb, useToast } from '@/components/admin/ui';
import { IconPlus, IconSearch } from '@/components/Icons';

const FILTERS = [['todos', 'Todos'], ['nuevos', 'Nuevos'], ['sin-precio', 'Sin precio'], ['ocultos', 'Ocultos'], ['sin-stock', 'Sin stock']] as const;

function List() {
  const sp = useSearchParams();
  const toast = useToast();
  const [list, setList] = useState<Product[] | null>(null);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState(sp.get('filtro') ?? 'todos');
  useEffect(() => { api<Product[]>('admin/products').then(setList).catch((e) => toast(e.message, 'error')); }, [toast]);
  const shown = useMemo(() => (list ?? []).filter((p) => {
    if (q && !`${p.name} ${p.category?.name ?? ''}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (filter === 'nuevos') return p.isNew;
    if (filter === 'sin-precio') return p.price == null;
    if (filter === 'ocultos') return !p.visible;
    if (filter === 'sin-stock') return p.trackStock && p.variants.every((v) => v.stock <= 0);
    return true;
  }), [list, q, filter]);
  const canSort = !q && filter === 'todos';

  async function quick(p: Product, patch: Partial<Product>) {
    setList((l) => l!.map((x) => (x.id === p.id ? { ...x, ...patch } : x)));
    try { await api(`admin/products/${p.id}`, { method: 'PATCH', body: patch }); toast('Guardado'); } catch (e) { toast((e as Error).message, 'error'); }
  }

  if (!list) return <Spinner />;
  const row = (p: Product, handle?: React.ReactNode) => (
    <div className="flex items-center gap-2 rounded-2xl bg-bg p-2 ring-1 ring-line">
      {handle}
      <Link href={`/admin/productos/${p.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        <Thumb m={p.images[0]} className="h-16 w-[3.2rem] shrink-0 rounded-lg" />
        <span className="min-w-0">
          <span className="flex items-center gap-2"><span className="truncate font-medium">{p.name}</span>{p.isNew && <span className="label rounded-full bg-pink px-2 py-1 text-[0.5rem]">Nuevo</span>}</span>
          <span className="block truncate text-xs text-muted">{p.category?.name ?? 'Sin categoría'} · {p.variants.length} variante(s) · {p.price != null ? money(p.price) : 'sin precio'}</span>
        </span>
      </Link>
      <button onClick={() => quick(p, { visible: !p.visible })} aria-pressed={p.visible} className={`label shrink-0 rounded-full px-3 py-2 text-[0.55rem] ${p.visible ? 'bg-surface' : 'bg-line text-muted'}`}>{p.visible ? 'Visible' : 'Oculto'}</button>
    </div>
  );
  return (
    <>
      <PageTitle title="Productos" sub={`${list.length} prendas · arrastrá para ordenar cómo se ven en la tienda`}>
        <Link href="/admin/productos/nuevo" className="btn btn-sm"><IconPlus width={16} height={16} /> Nueva prenda</Link>
      </PageTitle>
      <div className="relative mb-3"><IconSearch className="absolute top-1/2 left-3.5 -translate-y-1/2 text-muted" width={18} height={18} /><input className="field !pl-11" placeholder="Buscar prenda o categoría…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar productos" /></div>
      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4">{FILTERS.map(([v, l]) => (<button key={v} className="chip" aria-pressed={filter === v} onClick={() => setFilter(v)}>{l}</button>))}</div>
      {shown.length === 0 ? <Empty title="No hay prendas acá" text="Probá con otro filtro o creá una prenda nueva." /> : canSort ? (
        <Sortable items={shown} className="space-y-2" onChange={setList} onDrop={(items) => api('admin/products/reorder', { method: 'PUT', body: { ids: items.map((i) => i.id) } }).then(() => toast('Orden guardado')).catch((e) => toast(e.message, 'error'))} render={(p, handle) => row(p, handle)} />
      ) : <ul className="space-y-2">{shown.map((p) => (<li key={p.id}>{row(p)}</li>))}</ul>}
    </>
  );
}
export default function Page() { return <Suspense><List /></Suspense>; }
