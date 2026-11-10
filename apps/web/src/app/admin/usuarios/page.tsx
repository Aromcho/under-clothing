'use client';

import { useEffect, useState } from 'react';
import { api, type AdminUser } from '@/components/admin/api';
import { useUser } from '@/components/admin/Shell';
import { Empty, Field, PageTitle, Sheet, Spinner, useConfirm, useToast } from '@/components/admin/ui';
import { IconPlus, IconTrash } from '@/components/Icons';

type Form = { id?: number; name: string; email: string; role: 'admin' | 'editor'; password: string };

export default function Users() {
  const me = useUser();
  const toast = useToast();
  const confirm = useConfirm();
  const [list, setList] = useState<AdminUser[] | null>(null);
  const [edit, setEdit] = useState<Form | null>(null);
  useEffect(() => { if (me.role === 'admin') api<AdminUser[]>('admin/users').then(setList).catch((e) => toast(e.message, 'error')); }, [me.role, toast]);
  if (me.role !== 'admin') return <Empty title="Sólo para administradores" text="Tu usuario es editor: podés cargar contenido y gestionar pedidos, pero no administrar usuarios." />;
  if (!list) return <Spinner />;

  async function save() {
    if (!edit) return;
    const { id, password, ...rest } = edit;
    try {
      const r = await api<AdminUser>(id ? `admin/users/${id}` : 'admin/users', { method: id ? 'PATCH' : 'POST', body: { ...rest, ...(password ? { password } : {}) } });
      setList((l) => (id ? l!.map((u) => (u.id === id ? r : u)) : [...l!, r])); setEdit(null); toast('Usuario guardado');
    } catch (e) { toast((e as Error).message, 'error'); }
  }
  async function remove() {
    if (!edit?.id || !(await confirm.ask(`¿Eliminar a ${edit.name}?`))) return;
    try { await api(`admin/users/${edit.id}`, { method: 'DELETE' }); setList((l) => l!.filter((u) => u.id !== edit.id)); setEdit(null); toast('Usuario eliminado'); } catch (e) { toast((e as Error).message, 'error'); }
  }
  return (
    <>
      <PageTitle title="Usuarios" sub="Administrador: todo. Editor: contenido y pedidos, sin eliminar ni gestionar usuarios."><button className="btn btn-sm" onClick={() => setEdit({ name: '', email: '', role: 'editor', password: '' })}><IconPlus width={16} height={16} /> Agregar</button></PageTitle>
      <ul className="space-y-2">
        {list.map((u) => (
          <li key={u.id}><button onClick={() => setEdit({ id: u.id, name: u.name, email: u.email, role: u.role, password: '' })} className="flex w-full items-center gap-3 rounded-2xl bg-bg p-3.5 text-left ring-1 ring-line">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-pink font-medium">{u.name[0]?.toUpperCase()}</span>
            <span className="min-w-0 flex-1"><span className="block truncate font-medium">{u.name}{u.id === me.id && <span className="ml-2 text-xs text-muted">(vos)</span>}</span><span className="block truncate text-xs text-muted">{u.email}</span></span>
            <span className="label rounded-full bg-surface px-3 py-2 text-[0.55rem]">{u.role === 'admin' ? 'Administrador' : 'Editor'}</span>
          </button></li>
        ))}
      </ul>
      <Sheet open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Editar usuario' : 'Nuevo usuario'} footer={<>{edit?.id && edit.id !== me.id && <button className="btn btn-ghost btn-sm" onClick={remove} aria-label="Eliminar"><IconTrash width={16} height={16} /></button>}<button className="btn btn-sm flex-1" onClick={save}>Guardar</button></>}>
        {edit && (
          <div className="space-y-4">
            <Field label="Nombre"><input className="field" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
            <Field label="Email"><input className="field" type="email" value={edit.email} onChange={(e) => setEdit({ ...edit, email: e.target.value })} /></Field>
            <div><span className="label mb-1.5 block text-[0.625rem] text-muted">Rol</span><div className="grid grid-cols-2 gap-2">{(['editor', 'admin'] as const).map((r) => (<button key={r} type="button" className="chip justify-center" aria-pressed={edit.role === r} onClick={() => setEdit({ ...edit, role: r })}>{r === 'admin' ? 'Administrador' : 'Editor'}</button>))}</div></div>
            <Field label={edit.id ? 'Nueva contraseña (opcional)' : 'Contraseña'} help="6 caracteres o más."><input className="field" type="password" autoComplete="new-password" value={edit.password} onChange={(e) => setEdit({ ...edit, password: e.target.value })} /></Field>
          </div>
        )}
      </Sheet>
      {confirm.node}
    </>
  );
}
