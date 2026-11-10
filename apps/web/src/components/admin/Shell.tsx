'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { IconArrow, IconBag, IconChat, IconClose, IconHanger, IconMenu, IconSearch, IconTag } from '../Icons';
import { api, type AdminUser } from './api';
import { Spinner, ToastProvider } from './ui';

const UserCtx = createContext<AdminUser | null>(null);
export const useUser = () => useContext(UserCtx)!;

const I = ({ d }: { d: string }) => (<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>);
const NAV: { href: string; label: string; icon: ReactNode; main?: boolean; admin?: boolean; group?: string }[] = [
  { href: '/admin', label: 'Inicio', icon: <I d="M4 11 12 4l8 7v8.5H4V11Zm5.5 8.5v-5.5h5v5.5" />, main: true },
  { href: '/admin/pedidos', label: 'Pedidos', icon: <IconChat width={21} height={21} />, main: true },
  { href: '/admin/productos', label: 'Productos', icon: <IconHanger width={21} height={21} />, main: true },
  { href: '/admin/medios', label: 'Medios', icon: <I d="M4 5h16v14H4V5Zm0 10 4.5-4.5 4 4 2.5-2.5L20 17M15 9.5h.010" />, main: true },
  { href: '/admin/categorias', label: 'Categorías', icon: <IconTag width={21} height={21} />, group: 'Catálogo' },
  { href: '/admin/colecciones', label: 'Colecciones', icon: <I d="M5 4h14v16l-7-4-7 4V4Z" />, group: 'Catálogo' },
  { href: '/admin/talles', label: 'Guía de talles', icon: <I d="M3 9h18v6H3V9Zm4 0v3m4-3v3m4-3v3" />, group: 'Catálogo' },
  { href: '/admin/historias', label: 'Historias', icon: <I d="M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17Zm0 4.5a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />, group: 'Contenido' },
  { href: '/admin/banners', label: 'Banners y fotos', icon: <I d="M3.5 6h17v12h-17V6Zm3.5 8.5h6M7 11h10" />, group: 'Contenido' },
  { href: '/admin/beneficios', label: 'Beneficios', icon: <I d="m12 4 2.3 5 5.2.6-3.9 3.6 1.1 5.3L12 15.8 7.3 18.5l1.1-5.3L4.5 9.6l5.2-.600L12 4Z" />, group: 'Contenido' },
  { href: '/admin/negocio', label: 'Datos del negocio', icon: <I d="M4 10 5.5 4h13L20 10M4 10v10h16V10M4 10h16M9.5 20v-5h5v5" />, group: 'Negocio' },
  { href: '/admin/usuarios', label: 'Usuarios', icon: <I d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7.5 8.5c.500-4 3.5-6 7.5-6s7 2 7.5 6" />, group: 'Negocio', admin: true },
];

export function AdminApp({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null | undefined>(undefined);
  const load = useCallback(() => api<AdminUser>('auth/me').then(setUser).catch(() => setUser(null)), []);
  useEffect(() => {
    load();
    const out = () => setUser(null);
    window.addEventListener('uc-unauthorized', out);
    return () => window.removeEventListener('uc-unauthorized', out);
  }, [load]);

  return (
    <ToastProvider>
      <div className="min-h-[100svh] bg-surface/55 text-ink">
        {user === undefined ? <Spinner /> : user === null ? <Login onDone={setUser} /> : (
          <UserCtx.Provider value={user}><Frame onLogout={async () => { await api('auth/logout', { method: 'POST' }).catch(() => {}); setUser(null); }}>{children}</Frame></UserCtx.Provider>
        )}
      </div>
    </ToastProvider>
  );
}

function Login({ onDone }: { onDone: (u: AdminUser) => void }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setError('');
    const f = new FormData(e.currentTarget);
    try { onDone(await api<AdminUser>('auth/login', { body: { email: f.get('email'), password: f.get('password') } })); }
    catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }
  return (
    <div className="grid min-h-[100svh] place-items-center px-5">
      <form onSubmit={submit} className="w-full max-w-sm rounded-[1.75rem] bg-bg p-7 shadow-[var(--shadow-soft)] ring-1 ring-line">
        <div className="mb-7 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-circle.png" alt="Under Clothing" className="mx-auto h-20 w-20 rounded-full ring-1 ring-line" />
          <h1 className="mt-4 text-2xl font-light">Panel de Under</h1>
          <p className="text-sm text-muted">Ingresá para administrar la tienda</p>
        </div>
        <label className="mb-3 block"><span className="label mb-1.5 block text-[0.625rem] text-muted">Email</span><input name="email" type="email" required autoComplete="username" className="field" /></label>
        <label className="block"><span className="label mb-1.5 block text-[0.625rem] text-muted">Contraseña</span><input name="password" type="password" required autoComplete="current-password" className="field" /></label>
        {error && <p role="alert" className="mt-3 rounded-lg bg-pink/60 px-3 py-2 text-sm">{error}</p>}
        <button className="btn mt-5 w-full" disabled={busy}>{busy ? 'Ingresando…' : 'Ingresar'}</button>
        <Link href="/" className="mt-4 block text-center text-sm text-muted hover:text-ink">← Volver a la web</Link>
      </form>
    </div>
  );
}

function Frame({ children, onLogout }: { children: ReactNode; onLogout: () => void }) {
  const user = useUser();
  const pathname = usePathname();
  const [more, setMore] = useState(false);
  useEffect(() => setMore(false), [pathname]);
  const items = NAV.filter((n) => !n.admin || user.role === 'admin');
  const active = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname.startsWith(href));
  const groups = ['Catálogo', 'Contenido', 'Negocio'];
  const link = (n: (typeof NAV)[number]) => (
    <Link key={n.href} href={n.href} aria-current={active(n.href) ? 'page' : undefined} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.95rem] transition-colors ${active(n.href) ? 'bg-ink text-bg' : 'hover:bg-surface'}`}>{n.icon}{n.label}</Link>
  );
  const side = (
    <>
      <div className="space-y-1">{items.filter((n) => n.main).map(link)}</div>
      {groups.map((g) => (<div key={g} className="mt-5"><p className="label mb-2 px-3 text-[0.6rem] text-muted">{g}</p><div className="space-y-1">{items.filter((n) => n.group === g).map(link)}</div></div>))}
      <div className="mt-6 border-t border-line pt-4">
        <p className="px-3 text-sm font-medium">{user.name}</p>
        <p className="px-3 text-xs text-muted">{user.email} · {user.role === 'admin' ? 'Administrador' : 'Editor'}</p>
        <div className="mt-3 flex gap-2 px-3">
          <Link href="/" target="_blank" className="btn btn-ghost btn-sm flex-1">Ver web <IconArrow width={14} height={14} /></Link>
          <button onClick={onLogout} className="btn btn-ghost btn-sm">Salir</button>
        </div>
      </div>
    </>
  );
  return (
    <div className="lg:grid lg:grid-cols-[16.5rem_1fr]">
      <aside className="sticky top-0 hidden h-[100svh] overflow-y-auto border-r border-line bg-bg p-4 lg:block">
        <Link href="/admin" className="mb-6 flex items-center gap-3 px-2 pt-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-circle.png" alt="" className="h-10 w-10 rounded-full ring-1 ring-line" />
          <span><span className="brand block text-sm">Under</span><span className="label text-[0.55rem] text-muted">Panel</span></span>
        </Link>
        {side}
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-bg/92 px-4 backdrop-blur lg:hidden">
          <Link href="/admin" className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-circle.png" alt="" className="h-8 w-8 rounded-full ring-1 ring-line" /><span className="brand text-sm">Under</span><span className="label text-[0.55rem] text-muted">Panel</span>
          </Link>
          <Link href="/" target="_blank" className="label flex items-center gap-1.5 text-[0.6rem]">Ver web <IconArrow width={14} height={14} /></Link>
        </header>
        <main className="mx-auto max-w-6xl px-4 pt-5 pb-28 md:px-8 md:pt-8 lg:pb-12">{children}</main>
      </div>

      {/* Barra inferior en el celular */}
      <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-line bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden" aria-label="Panel">
        {items.filter((n) => n.main).map((n) => (
          <Link key={n.href} href={n.href} aria-current={active(n.href) ? 'page' : undefined} className={`flex flex-col items-center gap-1 pt-2.5 pb-2 text-[0.65rem] ${active(n.href) ? 'text-ink' : 'text-muted'}`}>
            <span className={`grid h-8 w-12 place-items-center rounded-full transition-colors ${active(n.href) ? 'bg-pink' : ''}`}>{n.icon}</span>{n.label}
          </Link>
        ))}
        <button onClick={() => setMore(true)} className={`flex flex-col items-center gap-1 pt-2.5 pb-2 text-[0.65rem] ${items.some((n) => !n.main && active(n.href)) ? 'text-ink' : 'text-muted'}`} aria-haspopup="dialog">
          <span className={`grid h-8 w-12 place-items-center rounded-full ${items.some((n) => !n.main && active(n.href)) ? 'bg-pink' : ''}`}><IconMenu width={21} height={21} /></span>Más
        </button>
      </nav>
      {more && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button className="absolute inset-0 cursor-default bg-ink/40" aria-label="Cerrar" onClick={() => setMore(false)} />
          <div role="dialog" aria-modal="true" aria-label="Más secciones" className="fade-up absolute inset-x-0 bottom-0 max-h-[85svh] overflow-y-auto rounded-t-3xl bg-bg p-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]" style={{ animationDuration: '0.3s' }}>
            <div className="mb-2 flex items-center justify-between px-2"><p className="label">Más</p><button className="grid h-11 w-11 place-items-center" onClick={() => setMore(false)} aria-label="Cerrar"><IconClose /></button></div>
            {side}
          </div>
        </div>
      )}
    </div>
  );
}
// íconos reexportados para las páginas
export { IconBag, IconSearch };
