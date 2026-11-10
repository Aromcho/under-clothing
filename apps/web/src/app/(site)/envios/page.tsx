import type { Metadata } from 'next';
import { getSite } from '@/lib/api';
import { InfoPage } from '@/components/InfoPage';

export const metadata: Metadata = { title: 'Envíos', description: 'Under Clothing hace envíos a todo el país. Dentro de Villa Gesell el envío es gratis.', alternates: { canonical: '/envios' } };

export default async function Page() {
  const site = await getSite();
  const s = site.settings.shipping;
  return <InfoPage site={site} eyebrow="Ayuda" title="Envíos" intro={s.intro} items={s.items} emptyText="Hacemos envíos a todo el país. Escribinos y te pasamos el costo y los tiempos para tu localidad." />;
}
