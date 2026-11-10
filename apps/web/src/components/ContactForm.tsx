'use client';

import { useState, type FormEvent } from 'react';
import type { Settings } from '@/lib/types';
import { contactLink } from '@/lib/format';
import { IconCheck, IconInstagram, IconWhatsapp } from './Icons';

/** Consulta: se guarda en el panel y abre WhatsApp (o Instagram) con el mensaje armado. */
export function ContactForm({ business }: { business: Settings['business'] }) {
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ href: string; copied: boolean; code: string } | null>(null);
  const channel = contactLink(business);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setState('sending');
    const f = new FormData(e.currentTarget);
    const win = channel.kind === 'whatsapp' ? window.open('', '_blank') : null;
    try {
      const r = await fetch('/api/public/orders', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ kind: 'consulta', customerName: f.get('name'), phone: f.get('phone') ?? '', message: f.get('message') }) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || 'No pudimos enviar la consulta');
      const link = contactLink(business, data.message);
      let copied = false;
      if (link.kind === 'instagram') { try { await navigator.clipboard.writeText(data.message); copied = true; } catch {} }
      if (win) win.location.href = link.href;
      setResult({ href: link.href, copied, code: data.code });
      setState('done');
    } catch (err) {
      win?.close();
      setError(err instanceof Error ? err.message : 'Algo salió mal');
      setState('idle');
    }
  }

  if (state === 'done' && result) {
    return (
      <div className="rounded-[1.4rem] bg-surface p-7 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-pink"><IconCheck /></span>
        <h3 className="mt-4 text-2xl">¡Recibimos tu consulta!</h3>
        <p className="mt-2 text-muted">Código {result.code}. {channel.kind === 'whatsapp' ? 'Terminá de enviarla por WhatsApp.' : result.copied ? 'Copiamos tu mensaje: pegalo en el chat de Instagram.' : 'Escribinos por Instagram y te respondemos.'}</p>
        <a href={result.href} target="_blank" rel="noopener noreferrer" className="btn mt-5">{channel.kind === 'whatsapp' ? <IconWhatsapp /> : <IconInstagram />} Abrir {channel.label}</a>
      </div>
    );
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block"><span className="label mb-2 block">Nombre</span><input name="name" required minLength={2} maxLength={80} autoComplete="name" className="field" /></label>
        <label className="block"><span className="label mb-2 block">Teléfono <span className="tracking-normal text-muted normal-case">(opcional)</span></span><input name="phone" type="tel" inputMode="tel" autoComplete="tel" maxLength={40} className="field" /></label>
      </div>
      <label className="block"><span className="label mb-2 block">Tu consulta</span><textarea name="message" required rows={4} maxLength={600} className="field resize-none" placeholder="Precio, talles, envíos… contanos qué prenda te gustó" /></label>
      {error && <p role="alert" className="rounded-lg bg-pink/60 px-3 py-2 text-sm">{error}</p>}
      <button className="btn w-full sm:w-auto" disabled={state === 'sending'}>{channel.kind === 'whatsapp' ? <IconWhatsapp width={18} height={18} /> : <IconInstagram width={18} height={18} />}{state === 'sending' ? 'Enviando…' : `Enviar por ${channel.label}`}</button>
    </form>
  );
}
