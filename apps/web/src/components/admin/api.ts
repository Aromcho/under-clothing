'use client';

export class ApiError extends Error { constructor(message: string, public status: number) { super(message); } }

/** Cliente del panel: usa la cookie JWT (httpOnly) vía el proxy /api de Next. */
export async function api<T = any>(path: string, opts: { method?: string; body?: unknown; form?: FormData } = {}): Promise<T> {
  const r = await fetch(`/api/${path}`, {
    method: opts.method ?? (opts.body || opts.form ? 'POST' : 'GET'),
    credentials: 'include',
    headers: opts.body ? { 'content-type': 'application/json' } : undefined,
    body: opts.form ?? (opts.body ? JSON.stringify(opts.body) : undefined),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const msg = Array.isArray(data?.message) ? data.message.join(' · ') : data?.message;
    if (r.status === 401 && !path.startsWith('auth/')) window.dispatchEvent(new Event('uc-unauthorized'));
    throw new ApiError(msg || 'Algo salió mal', r.status);
  }
  return data as T;
}

export type AdminUser = { id: number; email: string; name: string; role: 'admin' | 'editor' };
export const mediaUrl = (m: { path: string; widths: number[] }, w = 320) => `${m.path}/${m.widths.find((x) => x >= w) ?? m.widths[m.widths.length - 1]}.webp`;
export const fmtDate = (s: string) => new Date(s).toLocaleString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
export const timeAgo = (s: string) => {
  const m = Math.round((Date.now() - +new Date(s)) / 60000);
  if (m < 1) return 'recién';
  if (m < 60) return `hace ${m} min`;
  if (m < 1440) return `hace ${Math.round(m / 60)} h`;
  return `hace ${Math.round(m / 1440)} d`;
};
