import type { Metadata } from 'next';
import { getSite } from '@/lib/api';
import { InfoPage } from '@/components/InfoPage';

export const metadata: Metadata = { title: 'Cambios y devoluciones', description: 'Cómo gestionar un cambio en Under Clothing.', alternates: { canonical: '/cambios-y-devoluciones' } };

export default async function Page() {
  const site = await getSite();
  const s = site.settings.returns;
  return <InfoPage site={site} eyebrow="Ayuda" title="Cambios y devoluciones" intro={s.intro} items={s.items} emptyText="Si necesitás cambiar una prenda, escribinos por mensaje con tu pedido y lo coordinamos. También podés acercarte al showroom." />;
}
