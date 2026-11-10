'use client';

import { useEffect, useState } from 'react';
import type { InfoItem, Settings } from '@/lib/types';
import { dayName } from '@/lib/format';
import { api } from '@/components/admin/api';
import { useUser } from '@/components/admin/Shell';
import { Card, Field, PageTitle, Spinner, useToast } from '@/components/admin/ui';
import { IconPlus, IconTrash } from '@/components/Icons';

const TABS = [['business', 'Negocio'], ['hours', 'Horarios'], ['shipping', 'Envíos'], ['returns', 'Cambios'], ['payments', 'Pagos'], ['seo', 'SEO']] as const;
type Key = (typeof TABS)[number][0];

export default function SettingsPage() {
  const toast = useToast();
  const user = useUser();
  const [s, setS] = useState<Settings | null>(null);
  const [tab, setTab] = useState<Key>('business');
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  useEffect(() => { api<Settings>('admin/settings').then(setS).catch((e) => toast(e.message, 'error')); }, [toast]);
  if (!s) return <Spinner />;
  const upd = <K extends Key>(key: K, patch: Partial<Settings[K]>) => { setS({ ...s, [key]: { ...s[key], ...patch } }); setDirty(true); };
  async function save() {
    setBusy(true);
    try { await api(`admin/settings/${tab}`, { method: 'PUT', body: s![tab] }); setDirty(false); toast('Guardado: ya se ve en la web'); } catch (e) { toast((e as Error).message, 'error'); } finally { setBusy(false); }
  }
  const b = s.business;
  const txt = (key: keyof Settings['business'], label: string, help?: string, placeholder?: string) => (<Field label={label} help={help}><input className="field" value={b[key] ?? ''} placeholder={placeholder} onChange={(e) => upd('business', { [key]: e.target.value })} /></Field>);

  return (
    <>
      <PageTitle title="Datos del negocio" sub="Lo que se muestra en el pie, contacto, envíos y buscadores" />
      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4" role="tablist">{TABS.map(([k, l]) => (<button key={k} role="tab" aria-selected={tab === k} aria-pressed={tab === k} className="chip" onClick={() => { if (!dirty || window.confirm('Hay cambios sin guardar en esta pestaña. ¿Cambiar igual?')) { setTab(k); setDirty(false); } }}>{l}</button>))}</div>

      {tab === 'business' && (
        <Card className="grid gap-4 md:grid-cols-2">
          {txt('name', 'Nombre')}
          {txt('tagline', 'Frase de la marca')}
          <Field label="Descripción" className="md:col-span-2"><textarea className="field" rows={2} value={b.description} onChange={(e) => upd('business', { description: e.target.value })} /></Field>
          {txt('whatsapp', 'WhatsApp', 'Con código de país y área, sin 0 ni 15. Ej.: 5492255123456. Si está vacío, los pedidos se envían por mensaje de Instagram.', '549…')}
          {txt('instagram', 'Usuario de Instagram', 'Sin @')}
          {txt('email', 'Email (opcional)')}
          {txt('address', 'Dirección')}
          {txt('city', 'Ciudad')}
          {txt('province', 'Provincia')}
          <div className="md:col-span-2">{txt('mapsQuery', 'Búsqueda para el mapa', 'El texto que se busca en Google Maps para ubicar el local.')}</div>
        </Card>
      )}

      {tab === 'hours' && (
        <Card>
          <ul className="divide-y divide-line">
            {[1, 2, 3, 4, 5, 6, 0].map((d) => {
              const row = s.hours.days.find((x) => x.day === d) ?? { day: d, ranges: [] };
              const setRanges = (ranges: [string, string][]) => upd('hours', { days: [...s.hours.days.filter((x) => x.day !== d), { day: d, ranges }].sort((a, b) => a.day - b.day) });
              return (
                <li key={d} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center">
                  <span className="w-28 shrink-0 font-medium">{dayName(d)}</span>
                  <div className="flex flex-1 flex-wrap items-center gap-2">
                    {row.ranges.length === 0 && <span className="text-sm text-muted">Cerrado</span>}
                    {row.ranges.map((r, i) => (
                      <span key={i} className="flex items-center gap-1 rounded-xl bg-surface p-1">
                        <input type="time" aria-label={`${dayName(d)} abre`} className="rounded-lg bg-bg px-2 py-1.5 text-sm tabular-nums" value={r[0]} onChange={(e) => setRanges(row.ranges.map((x, k) => (k === i ? [e.target.value, x[1]] : x)))} />
                        <span className="text-muted">a</span>
                        <input type="time" aria-label={`${dayName(d)} cierra`} className="rounded-lg bg-bg px-2 py-1.5 text-sm tabular-nums" value={r[1]} onChange={(e) => setRanges(row.ranges.map((x, k) => (k === i ? [x[0], e.target.value] : x)))} />
                        <button type="button" aria-label="Quitar horario" className="grid h-8 w-8 place-items-center text-muted" onClick={() => setRanges(row.ranges.filter((_, k) => k !== i))}><IconTrash width={14} height={14} /></button>
                      </span>
                    ))}
                    {row.ranges.length < 3 && <button type="button" className="inline-flex items-center gap-1 text-sm" onClick={() => setRanges([...row.ranges, row.ranges.length ? ['17:30', '20:00'] : ['11:00', '13:00']])}><IconPlus width={14} height={14} /> Turno</button>}
                  </div>
                </li>
              );
            })}
          </ul>
          <Field label="Aviso" help="Ej.: horarios especiales de temporada o feriados." className="mt-3"><input className="field" value={s.hours.note} onChange={(e) => upd('hours', { note: e.target.value })} /></Field>
        </Card>
      )}

      {tab === 'shipping' && <ItemsEditor intro={s.shipping.intro} items={s.shipping.items} onChange={(intro, items) => upd('shipping', { intro, items })} hint="Zonas, costos, tiempos y retiro en el local." />}
      {tab === 'returns' && <ItemsEditor intro={s.returns.intro} items={s.returns.items} onChange={(intro, items) => upd('returns', { intro, items })} hint="Plazo para cambiar, condiciones de la prenda, devoluciones. Mientras esté vacío, la web invita a consultar por mensaje." />}
      {tab === 'payments' && <ItemsEditor intro={s.payments.intro} items={s.payments.methods} onChange={(intro, methods) => upd('payments', { intro, methods })} hint="Efectivo, transferencia, tarjetas, cuotas, descuentos. Mientras esté vacío, la web invita a consultar." />}

      {tab === 'seo' && (
        <Card className="space-y-4">
          <Field label="Título para Google" help={`${s.seo.title.length}/60 caracteres recomendados`}><input className="field" value={s.seo.title} onChange={(e) => upd('seo', { title: e.target.value })} /></Field>
          <Field label="Descripción para Google" help={`${s.seo.description.length}/160 caracteres recomendados`}><textarea className="field" rows={3} value={s.seo.description} onChange={(e) => upd('seo', { description: e.target.value })} /></Field>
          <div className="rounded-xl bg-surface p-4"><p className="text-xs text-muted">Así se ve en Google</p><p className="mt-1 text-[#1a0dab]">{s.seo.title}</p><p className="text-sm text-muted">{s.seo.description}</p></div>
        </Card>
      )}

      <div className="sticky bottom-[calc(4.6rem+env(safe-area-inset-bottom))] z-30 mt-4 flex items-center justify-between gap-3 rounded-2xl bg-bg/95 p-3 ring-1 ring-line backdrop-blur lg:bottom-4">
        <span className="text-sm text-muted">{user.role !== 'admin' && tab === 'business' ? 'Editás como editor' : dirty ? 'Cambios sin guardar' : 'Todo guardado'}</span>
        <button className="btn btn-sm min-w-32" onClick={save} disabled={busy || !dirty}>{busy ? 'Guardando…' : 'Guardar'}</button>
      </div>
    </>
  );
}

function ItemsEditor({ intro, items, onChange, hint }: { intro: string; items: InfoItem[]; onChange: (intro: string, items: InfoItem[]) => void; hint: string }) {
  return (
    <Card className="space-y-4">
      <p className="text-sm text-muted">{hint}</p>
      <Field label="Introducción"><input className="field" value={intro} onChange={(e) => onChange(e.target.value, items)} /></Field>
      {items.map((it, i) => (
        <div key={i} className="rounded-2xl bg-surface/70 p-3">
          <div className="flex gap-2"><input className="field !min-h-11 font-medium" placeholder="Título" aria-label="Título" value={it.title} onChange={(e) => onChange(intro, items.map((x, k) => (k === i ? { ...x, title: e.target.value } : x)))} /><button type="button" aria-label="Quitar" className="grid h-11 w-11 shrink-0 place-items-center text-muted" onClick={() => onChange(intro, items.filter((_, k) => k !== i))}><IconTrash width={16} height={16} /></button></div>
          <textarea className="field mt-2" rows={2} placeholder="Detalle" aria-label="Detalle" value={it.text} onChange={(e) => onChange(intro, items.map((x, k) => (k === i ? { ...x, text: e.target.value } : x)))} />
        </div>
      ))}
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange(intro, [...items, { title: '', text: '' }])}><IconPlus width={16} height={16} /> Agregar punto</button>
    </Card>
  );
}
