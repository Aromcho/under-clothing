import Link from 'next/link';
import type { InfoItem, Site } from '@/lib/types';
import { contactLink } from '@/lib/format';
import { IconInstagram, IconWhatsapp } from './Icons';
import { PageHeader } from './PageHeader';
import { Reveal } from './Reveal';
import { StitchDivider } from './Stitch';

/** Página informativa (envíos, cambios, pagos). Si el dato no está cargado, invita a consultar: no inventa políticas. */
export function InfoPage({ site, eyebrow, title, intro, items, emptyText, children }: { site: Site; eyebrow: string; title: string; intro?: string; items: InfoItem[]; emptyText: string; children?: React.ReactNode }) {
  const b = site.settings.business;
  const contact = contactLink(b, `¡Hola Under! 🤍 Tengo una consulta sobre ${title.toLowerCase()}.`);
  const image = site.banners.find((x) => x.placement === 'info')?.image;
  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} text={intro} image={image} />
      <div className="container-x max-w-3xl">
        {items.length > 0 ? (
          <ol className="divide-y divide-line">
            {items.map((x, i) => (
              <li key={x.title}>
                <Reveal className="grid grid-cols-[2.75rem_1fr] gap-4 py-7" delay={i * 0.05}>
                  <span className="label grid h-11 w-11 place-items-center rounded-full bg-surface tabular-nums" aria-hidden>{String(i + 1).padStart(2, '0')}</span>
                  <div><h2 className="text-xl font-medium">{x.title}</h2><p className="mt-2 leading-relaxed whitespace-pre-line text-muted">{x.text}</p></div>
                </Reveal>
              </li>
            ))}
          </ol>
        ) : (
          <p className="rounded-[1.4rem] bg-surface p-7 text-lg leading-relaxed font-light">{emptyText}</p>
        )}
        {children}
        <StitchDivider className="my-10" />
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-lg font-light">¿Te quedó alguna duda? Escribinos y te respondemos.</p>
          <div className="flex gap-3">
            <a href={contact.href} target="_blank" rel="noopener noreferrer" className="btn">{contact.kind === 'whatsapp' ? <IconWhatsapp width={18} height={18} /> : <IconInstagram width={18} height={18} />} {contact.label}</a>
            <Link href="/contacto" className="btn btn-ghost">Contacto</Link>
          </div>
        </div>
      </div>
    </>
  );
}
