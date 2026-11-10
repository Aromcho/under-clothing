'use client';

import { notFound, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Media } from '@/lib/types';
import { api } from '@/components/admin/api';
import { useUser } from '@/components/admin/Shell';
import { Empty, Field, MediaField, PageTitle, Sheet, Sortable, Spinner, Thumb, Toggle, useConfirm, useToast } from '@/components/admin/ui';
import { BenefitIcon, IconPlus, IconTrash } from '@/components/Icons';

type FieldDef = { key: string; label: string; type: 'text' | 'textarea' | 'media' | 'select' | 'icon' | 'table'; help?: string; options?: [string, string][]; placeholder?: string };
type Res = { api: string; title: string; one: string; sub: string; nameKey: string; subKey?: string; media?: string; fields: FieldDef[]; defaults: Record<string, any> };

const ICONS = ['truck', 'pin', 'hanger', 'chat', 'tag', 'clock', 'check', 'bag'];
const RESOURCES: Record<string, Res> = {
  categorias: { api: 'categories', title: 'Categorías', one: 'categoría', sub: 'Agrupan las prendas en la tienda y en el menú', nameKey: 'name', media: 'mediaId', defaults: { name: '', description: '', mediaId: null },
    fields: [{ key: 'name', label: 'Nombre', type: 'text' }, { key: 'description', label: 'Descripción', type: 'textarea' }, { key: 'mediaId', label: 'Imagen de portada', type: 'media' }] },
  colecciones: { api: 'collections', title: 'Colecciones', one: 'colección', sub: 'Temporadas y selecciones: Primavera / Verano, Tejidos…', nameKey: 'name', subKey: 'tagline', media: 'mediaId', defaults: { name: '', tagline: '', description: '', mediaId: null },
    fields: [{ key: 'name', label: 'Nombre', type: 'text' }, { key: 'tagline', label: 'Frase corta', type: 'text' }, { key: 'description', label: 'Descripción', type: 'textarea' }, { key: 'mediaId', label: 'Imagen de portada', type: 'media' }] },
  historias: { api: 'stories', title: 'Historias', one: 'historia', sub: 'Las destacadas tipo Instagram de la portada. Se agrupan por nombre de destacada', nameKey: 'group', subKey: 'title', media: 'mediaId', defaults: { group: 'En stock', title: '', href: '', mediaId: null },
    fields: [{ key: 'mediaId', label: 'Imagen (vertical)', type: 'media' }, { key: 'group', label: 'Destacada', type: 'text', help: 'Las historias con el mismo nombre se ven juntas. Ej.: En stock.' }, { key: 'title', label: 'Texto (opcional)', type: 'text' }, { key: 'href', label: 'Link (opcional)', type: 'text', placeholder: '/producto/top-mery' }] },
  banners: { api: 'banners', title: 'Banners y fotos', one: 'banner', sub: 'Portada, encabezados y fotos del showroom', nameKey: 'title', subKey: 'placement', media: 'mediaId', defaults: { placement: 'showroom', eyebrow: '', title: '', text: '', ctaLabel: '', ctaHref: '', mediaId: null, mobileMediaId: null },
    fields: [{ key: 'placement', label: 'Ubicación', type: 'select', options: [['hero', 'Portada (hero)'], ['home', 'Bloque del showroom en la portada'], ['showroom', 'Foto del showroom'], ['tienda', 'Encabezado de la tienda'], ['info', 'Encabezado de páginas de ayuda']] }, { key: 'title', label: 'Título', type: 'text' }, { key: 'eyebrow', label: 'Etiqueta superior', type: 'text' }, { key: 'text', label: 'Texto', type: 'textarea' }, { key: 'ctaLabel', label: 'Texto del botón', type: 'text' }, { key: 'ctaHref', label: 'Link del botón', type: 'text', placeholder: '/tienda' }, { key: 'mediaId', label: 'Imagen', type: 'media' }, { key: 'mobileMediaId', label: 'Imagen para celular (opcional)', type: 'media' }] },
  beneficios: { api: 'benefits', title: 'Beneficios', one: 'beneficio', sub: 'Los puntos fuertes que se muestran en la portada', nameKey: 'title', subKey: 'text', defaults: { icon: 'tag', title: '', text: '' },
    fields: [{ key: 'icon', label: 'Ícono', type: 'icon' }, { key: 'title', label: 'Título', type: 'text' }, { key: 'text', label: 'Texto', type: 'textarea' }] },
  talles: { api: 'size-guides', title: 'Guía de talles', one: 'guía', sub: 'Tablas de medidas. Asignalas a cada prenda desde su ficha', nameKey: 'name', subKey: 'note', defaults: { name: '', columns: ['Talle', 'Busto (cm)', 'Cintura (cm)', 'Cadera (cm)'], rows: [['S', '', '', ''], ['M', '', '', ''], ['L', '', '', '']], note: '' },
    fields: [{ key: 'name', label: 'Nombre', type: 'text', placeholder: 'Ej.: Tops y remeras' }, { key: 'rows', label: 'Tabla de medidas', type: 'table' }, { key: 'note', label: 'Nota', type: 'textarea', help: 'Ej.: “Las medidas pueden variar 1–2 cm”.' }] },
};

export default function ResourcePage() {
  const { resource } = useParams<{ resource: string }>();
  const cfg = RESOURCES[resource];
  const toast = useToast();
  const user = useUser();
  const confirm = useConfirm();
  const [list, setList] = useState<any[] | null>(null);
  const [media, setMedia] = useState<Map<number, Media>>(new Map());
  const [edit, setEdit] = useState<Record<string, any> | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!cfg) return;
    setList(null);
    api<any[]>(`admin/${cfg.api}`).then(setList).catch((e) => toast(e.message, 'error'));
    api<Media[]>('admin/media').then((m) => setMedia(new Map(m.map((x) => [x.id, x])))).catch(() => {});
  }, [cfg, toast]);
  if (!cfg) notFound();

  async function save() {
    if (!edit) return;
    setBusy(true);
    const { id, position, ...body } = edit;
    for (const f of cfg.fields) if (f.type === 'text' || f.type === 'textarea') body[f.key] = String(body[f.key] ?? '').trim();
    delete body.slug; delete body.createdAt;
    try {
      const r = await api<any>(id ? `admin/${cfg.api}/${id}` : `admin/${cfg.api}`, { method: id ? 'PATCH' : 'POST', body: id ? body : { ...body, position: list?.length ?? 0 } });
      setList((l) => (id ? l!.map((x) => (x.id === id ? r : x)) : [...l!, r]));
      setEdit(null); toast('Guardado: ya se ve en la web');
    } catch (e) { toast((e as Error).message, 'error'); } finally { setBusy(false); }
  }
  async function remove() {
    if (!edit?.id || !(await confirm.ask(`¿Eliminar ${cfg.one}?`))) return;
    try { await api(`admin/${cfg.api}/${edit.id}`, { method: 'DELETE' }); setList((l) => l!.filter((x) => x.id !== edit.id)); setEdit(null); toast('Eliminado'); } catch (e) { toast((e as Error).message, 'error'); }
  }
  async function toggle(row: any) {
    setList((l) => l!.map((x) => (x.id === row.id ? { ...x, visible: !x.visible } : x)));
    try { await api(`admin/${cfg.api}/${row.id}`, { method: 'PATCH', body: { visible: !row.visible } }); } catch (e) { toast((e as Error).message, 'error'); }
  }
  const setK = (key: string, v: any) => setEdit((e) => ({ ...e!, [key]: v }));

  return (
    <>
      <PageTitle title={cfg.title} sub={cfg.sub}><button className="btn btn-sm" onClick={() => setEdit({ ...cfg.defaults, visible: true })}><IconPlus width={16} height={16} /> Agregar</button></PageTitle>
      {!list ? <Spinner /> : list.length === 0 ? <Empty title={`Todavía no hay ${cfg.title.toLowerCase()}`} text={cfg.sub}><button className="btn btn-sm" onClick={() => setEdit({ ...cfg.defaults, visible: true })}>Crear {cfg.one}</button></Empty> : (
        <Sortable items={list} onChange={setList} className={cfg.media ? 'grid gap-2 sm:grid-cols-2' : 'space-y-2'} onDrop={(items) => api(`admin/${cfg.api}/reorder`, { method: 'PUT', body: { ids: items.map((i) => i.id) } }).then(() => toast('Orden guardado')).catch((e) => toast(e.message, 'error'))}
          render={(row, handle) => (
            <div className="flex items-center gap-2 rounded-2xl bg-bg p-2 ring-1 ring-line">
              {handle}
              <button className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => setEdit(row)}>
                {cfg.media ? <Thumb m={media.get(row[cfg.media])} className="h-16 w-[3.2rem] shrink-0 rounded-lg" /> : resource === 'beneficios' ? <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface"><BenefitIcon name={row.icon} /></span> : null}
                <span className="min-w-0"><span className="block truncate font-medium">{row[cfg.nameKey] || '(sin título)'}</span>{cfg.subKey && <span className="block truncate text-xs text-muted">{cfg.subKey === 'placement' ? cfg.fields[0].options?.find((o) => o[0] === row.placement)?.[1] : row[cfg.subKey]}</span>}</span>
              </button>
              <button onClick={() => toggle(row)} aria-pressed={row.visible} className={`label shrink-0 rounded-full px-3 py-2 text-[0.55rem] ${row.visible ? 'bg-surface' : 'bg-line text-muted'}`}>{row.visible ? 'Visible' : 'Oculto'}</button>
            </div>
          )} />
      )}
      <Sheet open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? `Editar ${cfg.one}` : `Nueva ${cfg.one}`} wide={resource === 'talles'}
        footer={<>{edit?.id && user.role === 'admin' && <button className="btn btn-ghost btn-sm" onClick={remove} aria-label="Eliminar"><IconTrash width={16} height={16} /></button>}<button className="btn btn-sm flex-1" onClick={save} disabled={busy}>{busy ? 'Guardando…' : 'Guardar'}</button></>}>
        {edit && (
          <div className="space-y-4">
            {cfg.fields.map((f) => f.type === 'media' ? (
              <MediaField key={f.key} label={f.label} value={media.get(edit[f.key]) ?? null} onChange={(m) => { if (m) setMedia((mm) => new Map(mm).set(m.id, m)); setK(f.key, m?.id ?? null); }} />
            ) : f.type === 'icon' ? (
              <div key={f.key}><span className="label mb-1.5 block text-[0.625rem] text-muted">{f.label}</span><div className="flex flex-wrap gap-2">{ICONS.map((i) => (<button key={i} type="button" aria-label={i} aria-pressed={edit[f.key] === i} onClick={() => setK(f.key, i)} className={`grid h-12 w-12 place-items-center rounded-full ${edit[f.key] === i ? 'bg-ink text-bg' : 'bg-surface'}`}><BenefitIcon name={i} /></button>))}</div></div>
            ) : f.type === 'table' ? (
              <TableEditor key={f.key} columns={edit.columns} rows={edit.rows} onChange={(columns, rows) => setEdit((e) => ({ ...e!, columns, rows }))} />
            ) : (
              <Field key={f.key} label={f.label} help={f.help}>
                {f.type === 'textarea' ? <textarea className="field" rows={3} value={edit[f.key] ?? ''} onChange={(e) => setK(f.key, e.target.value)} />
                  : f.type === 'select' ? <select className="field" value={edit[f.key] ?? ''} onChange={(e) => setK(f.key, e.target.value)}>{f.options!.map(([v, l]) => (<option key={v} value={v}>{l}</option>))}</select>
                  : <input className="field" value={edit[f.key] ?? ''} placeholder={f.placeholder} onChange={(e) => setK(f.key, e.target.value)} />}
              </Field>
            ))}
            <Toggle checked={!!edit.visible} onChange={(v) => setK('visible', v)} label="Visible en la web" />
          </div>
        )}
      </Sheet>
      {confirm.node}
    </>
  );
}

function TableEditor({ columns, rows, onChange }: { columns: string[]; rows: string[][]; onChange: (c: string[], r: string[][]) => void }) {
  const cell = 'field !min-h-10 !px-2 text-sm';
  return (
    <div>
      <span className="label mb-1.5 block text-[0.625rem] text-muted">Tabla de medidas</span>
      <div className="overflow-x-auto pb-1">
        <table className="w-full min-w-[26rem] border-separate border-spacing-1">
          <thead><tr>{columns.map((c, i) => (<th key={i}><input className={`${cell} font-medium`} value={c} aria-label={`Columna ${i + 1}`} onChange={(e) => onChange(columns.map((x, k) => (k === i ? e.target.value : x)), rows)} /></th>))}<th className="w-9" /></tr></thead>
          <tbody>{rows.map((r, ri) => (<tr key={ri}>{columns.map((_, ci) => (<td key={ci}><input className={cell} value={r[ci] ?? ''} aria-label={`${columns[ci]} fila ${ri + 1}`} onChange={(e) => onChange(columns, rows.map((x, k) => (k === ri ? columns.map((__, j) => (j === ci ? e.target.value : x[j] ?? '')) : x)))} /></td>))}<td><button type="button" aria-label="Quitar fila" className="grid h-9 w-9 place-items-center text-muted" onClick={() => onChange(columns, rows.filter((_, k) => k !== ri))}><IconTrash width={15} height={15} /></button></td></tr>))}</tbody>
        </table>
      </div>
      <div className="mt-1 flex flex-wrap gap-3 text-sm"><button type="button" onClick={() => onChange(columns, [...rows, columns.map(() => '')])}>+ Fila</button><button type="button" onClick={() => onChange([...columns, 'Medida'], rows.map((r) => [...r, '']))}>+ Columna</button>{columns.length > 2 && <button type="button" className="text-muted" onClick={() => onChange(columns.slice(0, -1), rows.map((r) => r.slice(0, columns.length - 1)))}>− Última columna</button>}</div>
    </div>
  );
}
