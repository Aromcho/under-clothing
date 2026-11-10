'use client';

import { useEffect, useState } from 'react';
import type { Media } from '@/lib/types';
import { api } from '@/components/admin/api';
import { useUser } from '@/components/admin/Shell';
import { Empty, Field, PageTitle, Sheet, Sortable, Spinner, Thumb, uploadFiles, useConfirm, useToast } from '@/components/admin/ui';
import { IconPlus, IconTrash } from '@/components/Icons';

export default function MediaLibrary() {
  const toast = useToast();
  const user = useUser();
  const confirm = useConfirm();
  const [list, setList] = useState<Media[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const [edit, setEdit] = useState<Media | null>(null);
  const [alt, setAlt] = useState('');
  const [q, setQ] = useState('');
  useEffect(() => { api<Media[]>('admin/media').then(setList).catch((e) => toast(e.message, 'error')); }, [toast]);

  async function upload(files: FileList | File[] | null) {
    const imgs = Array.from(files ?? []).filter((f) => f.type.startsWith('image/'));
    if (!imgs.length) return;
    setBusy(true);
    try { const up = await uploadFiles(imgs); setList((l) => [...up, ...(l ?? [])]); toast(`${up.length} imagen(es) subida(s) y optimizada(s)`); } catch (e) { toast((e as Error).message, 'error'); } finally { setBusy(false); }
  }
  async function saveAlt() {
    if (!edit) return;
    try { const r = await api<Media>(`admin/media/${edit.id}`, { method: 'PATCH', body: { alt } }); setList((l) => l!.map((m) => (m.id === r.id ? r : m))); setEdit(null); toast('Guardado'); } catch (e) { toast((e as Error).message, 'error'); }
  }
  async function remove() {
    if (!edit || !(await confirm.ask('¿Eliminar esta imagen? Se quita también de las prendas que la usan.'))) return;
    try { await api(`admin/media/${edit.id}`, { method: 'DELETE' }); setList((l) => l!.filter((m) => m.id !== edit.id)); setEdit(null); toast('Imagen eliminada'); } catch (e) { toast((e as Error).message, 'error'); }
  }

  if (!list) return <Spinner />;
  const filtered = q ? list.filter((m) => m.alt.toLowerCase().includes(q.toLowerCase())) : list;
  const tile = (m: Media, handle?: React.ReactNode) => (
    <div className="group relative overflow-hidden rounded-xl bg-bg ring-1 ring-line">
      <button type="button" className="block w-full" onClick={() => { setEdit(m); setAlt(m.alt); }} aria-label={`Editar ${m.alt || 'imagen'}`}><Thumb m={m} className="aspect-[4/5] w-full" /></button>
      {handle && <span className="absolute top-1 left-1 rounded-lg bg-bg/90">{handle}</span>}
    </div>
  );
  return (
    <>
      <PageTitle title="Biblioteca de medios" sub={`${list.length} imágenes · se convierten solas a WebP en varios tamaños`}>
        <label className={`btn btn-sm cursor-pointer ${busy ? 'pointer-events-none opacity-50' : ''}`}><IconPlus width={16} height={16} />{busy ? 'Subiendo…' : 'Subir'}<input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => upload(e.target.files)} /></label>
      </PageTitle>
      <div onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={(e) => { e.preventDefault(); setOver(false); upload(e.dataTransfer.files); }}
        className={`mb-4 hidden rounded-2xl border border-dashed px-6 py-7 text-center text-sm transition-colors md:block ${over ? 'border-ink bg-pink/50' : 'border-accent/70 text-muted'}`}>Arrastrá fotos acá para subirlas</div>
      <input className="field mb-4" placeholder="Buscar por nombre…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar imágenes" />
      {filtered.length === 0 ? <Empty title="No hay imágenes" text="Subí las fotos de tus prendas: se optimizan automáticamente." /> : q ? (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">{filtered.map((m) => (<li key={m.id}>{tile(m)}</li>))}</ul>
      ) : (
        <Sortable items={list} onChange={setList} className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6" onDrop={(items) => api('admin/media/reorder', { method: 'PUT', body: { ids: items.map((i) => i.id) } }).then(() => toast('Orden guardado')).catch((e) => toast(e.message, 'error'))} render={(m, handle) => tile(m, handle)} />
      )}
      <Sheet open={!!edit} onClose={() => setEdit(null)} title="Imagen" footer={<>{user.role === 'admin' && <button className="btn btn-ghost btn-sm" onClick={remove}><IconTrash width={16} height={16} /> Eliminar</button>}<button className="btn btn-sm flex-1" onClick={saveAlt}>Guardar</button></>}>
        {edit && (<div className="space-y-4"><Thumb m={edit} className="mx-auto max-h-[45svh] w-auto rounded-2xl" /><Field label="Descripción (texto alternativo)" help="Ayuda a Google y a quienes usan lector de pantalla."><input className="field" value={alt} onChange={(e) => setAlt(e.target.value)} /></Field><p className="text-xs text-muted">{edit.width}×{edit.height}px · tamaños: {edit.widths.join(', ')}px · WebP</p></div>)}
      </Sheet>
      {confirm.node}
    </>
  );
}
