import type { Metadata } from 'next';
import { getSite } from '@/lib/api';
import { InfoPage } from '@/components/InfoPage';
import { GuideTable } from '@/components/ProductView';
import { Reveal } from '@/components/Reveal';

export const metadata: Metadata = { title: 'Guía de talles', description: 'Guía de talles de Under Clothing.', alternates: { canonical: '/guia-de-talles' } };

export default async function Page() {
  const site = await getSite();
  const guides = site.sizeGuides;
  return (
    <InfoPage site={site} eyebrow="Ayuda" title="Guía de talles" items={[]} intro={guides.length ? 'Medidas de referencia para elegir tu talle.' : undefined}
      emptyText={guides.length ? 'Si estás entre dos talles, escribinos y te ayudamos a elegir.' : 'Cada prenda calza distinto. Escribinos con la prenda que te gusta y el talle que usás, y te decimos cuál te va mejor. En el showroom te podés probar todo.'}>
      {guides.map((g) => (
        <Reveal key={g.id} className="mt-10">
          <h2 className="mb-4 text-2xl">{g.name}</h2>
          <GuideTable guide={g} />
          {g.note && <p className="mt-3 text-sm text-muted">{g.note}</p>}
        </Reveal>
      ))}
    </InfoPage>
  );
}
