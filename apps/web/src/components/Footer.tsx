import Link from 'next/link';
import type { Site } from '@/lib/types';
import { contactLink } from '@/lib/format';
import { IconInstagram, IconPin, IconWhatsapp } from './Icons';
import { OpenNow } from './OpenNow';
import { StitchDivider } from './Stitch';

export function Footer({ site }: { site: Site }) {
  const b = site.settings.business;
  const contact = contactLink(b);
  return (
    <footer className="linen mt-24 pb-[max(2rem,env(safe-area-inset-bottom))]">
      <div className="container-x pt-14">
        <div className="grid gap-12 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div>
            <p className="brand text-2xl">Under</p>
            <p className="label mt-1.5 tracking-[0.42em] text-muted">Clothing</p>
            {b.tagline && <p className="mt-5 max-w-xs text-lg leading-snug font-light">{b.tagline}</p>}
            <div className="mt-6 flex gap-2">
              <a href={`https://www.instagram.com/${b.instagram}/`} target="_blank" rel="noopener noreferrer" aria-label={`Instagram @${b.instagram}`} className="grid h-11 w-11 place-items-center rounded-full bg-bg transition-transform hover:-translate-y-0.5"><IconInstagram /></a>
              {contact.kind === 'whatsapp' && <a href={contact.href} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="grid h-11 w-11 place-items-center rounded-full bg-bg transition-transform hover:-translate-y-0.5"><IconWhatsapp /></a>}
            </div>
          </div>
          <nav aria-label="Tienda">
            <p className="label mb-4 text-muted">Tienda</p>
            <ul className="space-y-2.5 text-[0.95rem]">
              <li><Link href="/tienda?novedades=1" className="stitch-link">Nuevos ingresos</Link></li>
              {site.categories.slice(0, 6).map((c) => (<li key={c.slug}><Link href={`/tienda?categoria=${c.slug}`} className="stitch-link">{c.name}</Link></li>))}
              <li><Link href="/tienda" className="stitch-link">Ver todo</Link></li>
            </ul>
          </nav>
          <nav aria-label="Ayuda">
            <p className="label mb-4 text-muted">Ayuda</p>
            <ul className="space-y-2.5 text-[0.95rem]">
              <li><Link href="/envios" className="stitch-link">Envíos</Link></li>
              <li><Link href="/cambios-y-devoluciones" className="stitch-link">Cambios y devoluciones</Link></li>
              <li><Link href="/medios-de-pago" className="stitch-link">Medios de pago</Link></li>
              <li><Link href="/guia-de-talles" className="stitch-link">Guía de talles</Link></li>
              <li><Link href="/contacto" className="stitch-link">Contacto</Link></li>
            </ul>
          </nav>
          <div>
            <p className="label mb-4 text-muted">Showroom</p>
            <address className="space-y-3 text-[0.95rem] not-italic">
              <p className="flex gap-2"><IconPin className="mt-0.5 shrink-0" width={18} height={18} /><span>{b.address}<br />{b.city}, {b.province}</span></p>
              <OpenNow hours={site.settings.hours} />
              <p><Link href="/contacto" className="stitch-link">Cómo llegar</Link></p>
            </address>
          </div>
        </div>
        <StitchDivider className="mt-14" />
        <div className="flex flex-col gap-2 pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {b.name} · {b.city}, Argentina</p>
          <p>Envíos a todo el país 🇦🇷</p>
        </div>
      </div>
    </footer>
  );
}
