import type { Metadata } from 'next';
import { getSite } from '@/lib/api';
import { contactLink } from '@/lib/format';
import { ContactForm } from '@/components/ContactForm';
import { IconArrow, IconClock, IconInstagram, IconPin, IconWhatsapp } from '@/components/Icons';
import { HoursTable, OpenNow } from '@/components/OpenNow';
import { PageHeader } from '@/components/PageHeader';
import { Picture } from '@/components/Picture';
import { Reveal } from '@/components/Reveal';
import { StitchDivider } from '@/components/Stitch';

export const metadata: Metadata = { title: 'Showroom y contacto', description: 'Visitá el showroom de Under Clothing en Paseo 104 entre 3 y 4, Villa Gesell. Horarios, mapa y contacto.', alternates: { canonical: '/contacto' } };

export default async function Contacto() {
  const site = await getSite();
  const { business: b, hours } = site.settings;
  const photos = site.banners.filter((x) => x.placement === 'showroom' && x.image);
  const contact = contactLink(b);
  const q = encodeURIComponent(b.mapsQuery || `${b.address}, ${b.city}`);
  return (
    <>
      <PageHeader eyebrow="Showroom" title="Vení a conocernos" text={`${b.address}, ${b.city}.`} image={site.banners.find((x) => x.placement === 'info')?.image}>
        <OpenNow hours={hours} className="fade-up mt-5 rounded-full bg-bg/80 px-4 py-2 backdrop-blur [animation-delay:0.24s]" />
      </PageHeader>
      <div className="container-x">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <div className="overflow-hidden rounded-[1.4rem] bg-surface ring-1 ring-line">
              <iframe title={`Mapa: ${b.address}, ${b.city}`} src={`https://www.google.com/maps?q=${q}&z=16&output=embed`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="h-[22rem] w-full grayscale-[35%] md:h-[26rem]" style={{ border: 0 }} allowFullScreen />
            </div>
            <a href={`https://www.google.com/maps/search/?api=1&query=${q}`} target="_blank" rel="noopener noreferrer" className="btn mt-4 w-full sm:w-auto"><IconPin width={18} height={18} /> Cómo llegar <IconArrow width={16} height={16} /></a>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="label mb-4 flex items-center gap-2 text-muted"><IconClock width={18} height={18} /> Horarios del local</h2>
            <HoursTable hours={hours} />
            {hours.note && <p className="mt-3 text-sm text-muted">{hours.note}</p>}
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <a href={`https://www.instagram.com/${b.instagram}/`} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 rounded-2xl bg-surface p-4 transition-colors hover:bg-pink"><span className="grid h-11 w-11 place-items-center rounded-full bg-bg"><IconInstagram /></span><span><span className="label block text-[0.6rem] text-muted">Instagram</span>@{b.instagram}</span></a>
              {contact.kind === 'whatsapp' && <a href={contact.href} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 rounded-2xl bg-surface p-4 transition-colors hover:bg-pink"><span className="grid h-11 w-11 place-items-center rounded-full bg-bg"><IconWhatsapp /></span><span><span className="label block text-[0.6rem] text-muted">WhatsApp</span>Escribinos</span></a>}
            </div>
          </Reveal>
        </div>

        {photos.length > 0 && (
          <section className="pt-16" aria-labelledby="h-fotos">
            <StitchDivider className="mb-10" />
            <Reveal><p className="label mb-3 text-muted">Por dentro</p><h2 id="h-fotos" className="title">El showroom</h2></Reveal>
            <ul className="no-scrollbar -mx-5 mt-8 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 md:mx-0 md:grid md:grid-cols-3 md:gap-4 md:px-0">
              {photos.map((s, i) => (
                <li key={s.id} className="w-[72vw] max-w-sm shrink-0 snap-center md:w-auto md:max-w-none">
                  <Reveal delay={(i % 3) * 0.07}>
                    <figure className="group overflow-hidden rounded-[1.2rem] bg-surface">
                      <Picture media={s.image!} sizes="(min-width: 768px) 33vw, 72vw" className="aspect-[3/4] w-full transition-transform duration-[1400ms] ease-[var(--ease-out-soft)] group-hover:scale-105" />
                      <figcaption className="label px-4 py-3 text-[0.625rem]">{s.title}</figcaption>
                    </figure>
                  </Reveal>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mx-auto max-w-2xl pt-16" aria-labelledby="h-consulta">
          <Reveal>
            <p className="label mb-3 text-muted">Consultas</p>
            <h2 id="h-consulta" className="title mb-3">Escribinos</h2>
            <p className="mb-7 text-lg font-light text-muted">Precios, talles y envíos: mandanos tu consulta y te respondemos por {contact.label}.</p>
            <ContactForm business={b} />
          </Reveal>
        </section>
      </div>
    </>
  );
}
