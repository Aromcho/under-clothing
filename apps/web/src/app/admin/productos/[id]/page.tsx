'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Category, Collection, Media, Product, SizeGuide } from '@/lib/types';
import { api } from '@/components/admin/api';
import { useUser } from '@/components/admin/Shell';
import { Card, Field, MediaPicker, PageTitle, Sortable, Spinner, Thumb, Toggle, uploadFiles, useConfirm, useToast } from '@/components/admin/ui';
import { IconArrow, IconClose, IconPlus, IconTrash } from '@/components/Icons';

type V = { id?: number; key: number; size: string; color: string; colorHex: string; stock: number };
type Form = { name: string; slug: string; description: string; details: string; categoryId: number | null; sizeGuideId: number | null; price: string; comparePrice: string; isNew: boolean; featured: boolean; visible: boolean; trackStock: boolean; sizesNote: string; igUrl: string; collectionIds: number[] };
const EMPTY: Form = { name: '', slug: '', description: '', details: '', categoryId: null, sizeGuideId: null, price: '', comparePrice: '', isNew: true, featured: false, visible: true, trackStock: false, sizesNote: '', igUrl: '', collectionIds: [] };
let k = 1;

export default function ProductEditor() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'nuevo';
  const router = useRouter();
  const toast = useToast();
  const user = useUser();
  const confirm = useConfirm();
  const [f, setF] = useState<Form | null>(isNew ? EMPTY : null);
  const [images, setImages] = useState<Media[]>([]);
  const [variants, setVariants] = useState<V[]>(isNew ? [{ key: k++, size: '', color: '', colorHex: '', stock: 0 }] : []);
  const [cats, setCats] = useState<Category[]>([]);
  const [cols, setCols] = useState<Collection[]>([]);
  const [guides, setGuides] = useState<SizeGuide[]>([]);
  const [picker, setPicker] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [gen, setGen] = useState({ sizes: '', colors: '' });

  useEffect(() => {
    api<Category[]>('admin/categories').then(setCats).catch(() => {});
    api<Collection[]>('admin/collections').then(setCols).catch(() => {});
    api<SizeGuide[]>('admin/size-guides').then(setGuides).catch(() => {});
    if (!isNew) api<Product>(`admin/products/${id}`).then((p) => {
      setF({ name: p.name, slug: p.slug, description: p.description, details: p.details, categoryId: p.categoryId, sizeGuideId: p.sizeGuideId, price: p.price?.toString() ?? '', comparePrice: p.comparePrice?.toString() ?? '', isNew: p.isNew, featured: p.featured, visible: p.visible, trackStock: p.trackStock, sizesNote: p.sizesNote, igUrl: p.igUrl, collectionIds: p.collections.map((c) => c.id) });
      setImages(p.images);
      setVariants(p.variants.map((v) => ({ ...v, key: k++ })));
    }).catch((e) => { toast(e.message, 'error'); router.replace('/admin/productos'); });
  }, [id, isNew, router, toast]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  if (!f) return <Spinner />;
  const set = <K extends keyof Form>(key: K, v: Form[K]) => { setF({ ...f, [key]: v }); setDirty(true); };
  const setV = (key: number, patch: Partial<V>) => { setVariants((vs) => vs.map((v) => (v.key === key ? { ...v, ...patch } : v))); setDirty(true); };
  const num = (s: string) => (s.trim() === '' ? null : Math.max(0, Math.round(Number(s.replace(/[^\d]/g, '')))));

  async function save() {
    if (!f) return;
    if (!f.name.trim()) return toast('Poné el nombre de la prenda', 'error');
    setBusy(true);
    const body = { ...f, name: f.name.trim(), slug: f.slug.trim(), price: num(f.price), comparePrice: num(f.comparePrice), mediaIds: images.map((m) => m.id), variants: variants.map(({ key, ...v }) => ({ ...v, stock: Number(v.stock) || 0 })) };
    try {
      const p = await api<Product>(isNew ? 'admin/products' : `admin/products/${id}`, { method: isNew ? 'POST' : 'PATCH', body });
      setDirty(false);
      toast('Guardado: ya se ve en la web');
      if (isNew) router.replace(`/admin/productos/${p.id}`);
      else { setVariants(p.variants.map((v) => ({ ...v, key: k++ }))); setF((x) => x && { ...x, slug: p.slug }); }
    } catch (e) { toast((e as Error).message, 'error'); }
    finally { setBusy(false); }
  }
  async function remove() {
    if (!(await confirm.ask(`¿Eliminar “${f!.name}”? No se puede deshacer.`))) return;
    try { await api(`admin/products/${id}`, { method: 'DELETE' }); toast('Prenda eliminada'); setDirty(false); router.replace('/admin/productos'); } catch (e) { toast((e as Error).message, 'error'); }
  }
  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    try { const up = await uploadFiles(files); setImages((l) => [...l, ...up]); setDirty(true); toast(`${up.length} imagen(es) subida(s)`); } catch (e) { toast((e as Error).message, 'error'); } finally { setBusy(false); }
  }
  function generate() {
    const sizes = gen.sizes.split(',').map((s) => s.trim()).filter(Boolean), colors = gen.colors.split(',').map((s) => s.trim()).filter(Boolean);
    const out: V[] = [];
    for (const c of colors.length ? colors : ['']) for (const s of sizes.length ? sizes : ['']) {
      if (!variants.some((v) => v.size === s && v.color === c)) out.push({ key: k++, size: s, color: c, colorHex: variants.find((v) => v.color === c)?.colorHex ?? '', stock: 0 });
    }
    setVariants((vs) => [...vs.filter((v) => v.size || v.color || v.id), ...out]); setDirty(true); setGen({ sizes: '', colors: '' });
  }

  return (
    <>
      <Link href="/admin/productos" className="mb-3 inline-flex items-center gap-2 text-sm text-muted hover:text-ink"><IconArrow width={16} height={16} className="rotate-180" /> Productos</Link>
      <PageTitle title={isNew ? 'Nueva prenda' : f.name || 'Prenda'} sub={isNew ? undefined : `/producto/${f.slug}`}>
        {!isNew && <Link href={`/producto/${f.slug}`} target="_blank" className="btn btn-ghost btn-sm">Ver en la web</Link>}
      </PageTitle>
      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4">
          <Card className="space-y-4">
            <Field label="Nombre"><input className="field" value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="Ej.: Top Mery" /></Field>
            <Field label="Descripción" help="El texto que acompaña a la prenda, como en el Instagram."><textarea className="field" rows={3} value={f.description} onChange={(e) => set('description', e.target.value)} /></Field>
            <Field label="Detalles" help="Tela, calce, cuidados (opcional)."><textarea className="field" rows={3} value={f.details} onChange={(e) => set('details', e.target.value)} /></Field>
          </Card>

          <Card>
            <div className="mb-3 flex items-center justify-between"><h2 className="font-medium">Fotos</h2><span className="text-xs text-muted">La primera es la portada · arrastrá para ordenar</span></div>
            <Sortable items={images} onChange={(l) => { setImages(l); setDirty(true); }} className="grid grid-cols-3 gap-2 sm:grid-cols-4" render={(m, handle) => (
              <div className="relative overflow-hidden rounded-xl ring-1 ring-line">
                <Thumb m={m} className="aspect-[4/5] w-full" />
                <div className="absolute inset-x-1 top-1 flex justify-between"><span className="rounded-lg bg-bg/90">{handle}</span><button type="button" aria-label="Quitar foto" onClick={() => { setImages((l) => l.filter((x) => x.id !== m.id)); setDirty(true); }} className="grid h-9 w-9 place-items-center rounded-lg bg-bg/90"><IconClose width={16} height={16} /></button></div>
                {images[0]?.id === m.id && <span className="label absolute bottom-1 left-1 rounded-full bg-ink px-2 py-1 text-[0.5rem] text-bg">Portada</span>}
              </div>
            )} />
            <div className="mt-3 flex flex-wrap gap-2">
              <label className={`btn btn-sm cursor-pointer ${busy ? 'pointer-events-none opacity-50' : ''}`}><IconPlus width={16} height={16} /> Subir fotos<input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => upload(e.target.files)} /></label>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPicker(true)}>Elegir de la biblioteca</button>
            </div>
          </Card>

          <Card>
            <div className="mb-1 flex items-center justify-between"><h2 className="font-medium">Talles, colores y stock</h2><span className="text-xs text-muted">{variants.length} variante(s)</span></div>
            <Toggle checked={f.trackStock} onChange={(v) => set('trackStock', v)} label="Controlar stock" help={f.trackStock ? 'La web muestra “Sin stock” cuando una variante llega a 0.' : 'Apagado: la web muestra “Stock a confirmar al hacer el pedido”.'} />
            <ul className="mt-2 space-y-2">
              {variants.map((v) => (
                <li key={v.key} className="grid grid-cols-[1fr_1.4fr_2.75rem_4.2rem_2.5rem] items-center gap-1.5">
                  <input className="field !min-h-11 !px-2.5" placeholder="Talle" aria-label="Talle" value={v.size} onChange={(e) => setV(v.key, { size: e.target.value })} />
                  <input className="field !min-h-11 !px-2.5" placeholder="Color" aria-label="Color" value={v.color} onChange={(e) => setV(v.key, { color: e.target.value })} />
                  <input type="color" aria-label="Tono del color" className="h-11 w-11 cursor-pointer rounded-xl border-0 bg-transparent p-0.5" value={/^#[0-9a-f]{6}$/i.test(v.colorHex) ? v.colorHex : '#ebcfcb'} onChange={(e) => setV(v.key, { colorHex: e.target.value })} />
                  <input className="field !min-h-11 !px-2 text-center tabular-nums" inputMode="numeric" aria-label="Stock" value={v.stock} disabled={!f.trackStock} onChange={(e) => setV(v.key, { stock: Math.max(0, Number(e.target.value.replace(/\D/g, '')) || 0) })} />
                  <button type="button" aria-label="Quitar variante" className="grid h-10 w-10 place-items-center rounded-lg text-muted hover:bg-surface hover:text-ink" onClick={() => { setVariants((vs) => vs.filter((x) => x.key !== v.key)); setDirty(true); }}><IconTrash width={16} height={16} /></button>
                </li>
              ))}
            </ul>
            <button type="button" className="mt-2 inline-flex items-center gap-1.5 py-2 text-sm" onClick={() => { setVariants((vs) => [...vs, { key: k++, size: '', color: '', colorHex: '', stock: 0 }]); setDirty(true); }}><IconPlus width={16} height={16} /> Agregar variante</button>
            <details className="mt-2 rounded-xl bg-surface/70 p-3">
              <summary className="cursor-pointer text-sm">Generar combinaciones de talles y colores</summary>
              <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                <input className="field !min-h-11" placeholder="Talles: S, M, L" value={gen.sizes} onChange={(e) => setGen({ ...gen, sizes: e.target.value })} aria-label="Talles separados por coma" />
                <input className="field !min-h-11" placeholder="Colores: Negro, Blanco" value={gen.colors} onChange={(e) => setGen({ ...gen, colors: e.target.value })} aria-label="Colores separados por coma" />
                <button type="button" className="btn btn-ghost btn-sm" onClick={generate}>Generar</button>
              </div>
            </details>
            <Field label="Nota de talles" help="Se muestra en la ficha. Ej.: “Talle único”, “Consultá los talles disponibles”." className="mt-4"><input className="field" value={f.sizesNote} onChange={(e) => set('sizesNote', e.target.value)} /></Field>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="space-y-1">
            <Toggle checked={f.visible} onChange={(v) => set('visible', v)} label="Visible en la web" />
            <Toggle checked={f.isNew} onChange={(v) => set('isNew', v)} label="Nuevo ingreso" help="Lleva la etiqueta “Nuevo” y aparece en la portada." />
            <Toggle checked={f.featured} onChange={(v) => set('featured', v)} label="Favorito de Under" help="Aparece en los destacados de la portada." />
          </Card>
          <Card className="grid grid-cols-2 gap-3">
            <Field label="Precio ($)" help="Vacío = “Consultá el precio”."><input className="field tabular-nums" inputMode="numeric" value={f.price} onChange={(e) => set('price', e.target.value)} placeholder="—" /></Field>
            <Field label="Precio anterior ($)" help="Opcional, se muestra tachado."><input className="field tabular-nums" inputMode="numeric" value={f.comparePrice} onChange={(e) => set('comparePrice', e.target.value)} placeholder="—" /></Field>
          </Card>
          <Card className="space-y-4">
            <Field label="Categoría"><select className="field" value={f.categoryId ?? ''} onChange={(e) => set('categoryId', e.target.value ? Number(e.target.value) : null)}><option value="">Sin categoría</option>{cats.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}</select></Field>
            <div><span className="label mb-1.5 block text-[0.625rem] text-muted">Colecciones</span><div className="flex flex-wrap gap-2">{cols.map((c) => (<button type="button" key={c.id} className="chip" aria-pressed={f.collectionIds.includes(c.id)} onClick={() => set('collectionIds', f.collectionIds.includes(c.id) ? f.collectionIds.filter((x) => x !== c.id) : [...f.collectionIds, c.id])}>{c.name}</button>))}</div></div>
            <Field label="Guía de talles"><select className="field" value={f.sizeGuideId ?? ''} onChange={(e) => set('sizeGuideId', e.target.value ? Number(e.target.value) : null)}><option value="">Ninguna</option>{guides.map((g) => (<option key={g.id} value={g.id}>{g.name}</option>))}</select></Field>
            <Field label="Publicación de Instagram"><input className="field" type="url" value={f.igUrl} onChange={(e) => set('igUrl', e.target.value)} placeholder="https://www.instagram.com/p/…" /></Field>
            {!isNew && <Field label="Dirección en la web" help="Se arma sola con el nombre."><input className="field" value={f.slug} onChange={(e) => set('slug', e.target.value)} /></Field>}
          </Card>
          {!isNew && user.role === 'admin' && <button type="button" onClick={remove} className="inline-flex items-center gap-2 px-1 text-sm text-[#8c2f2f]"><IconTrash width={16} height={16} /> Eliminar prenda</button>}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-[calc(4.1rem+env(safe-area-inset-bottom))] z-40 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur lg:bottom-0 lg:left-[16.5rem]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <span className="text-sm text-muted">{dirty ? 'Cambios sin guardar' : 'Todo guardado'}</span>
          <button className="btn btn-sm min-w-36" onClick={save} disabled={busy || (!dirty && !isNew)}>{busy ? 'Guardando…' : 'Guardar'}</button>
        </div>
      </div>
      <div className="h-16" />
      <MediaPicker open={picker} onClose={() => setPicker(false)} multiple onPick={(m) => { setImages((l) => [...l, ...m.filter((x) => !l.some((y) => y.id === x.id))]); setDirty(true); }} />
      {confirm.node}
    </>
  );
}
