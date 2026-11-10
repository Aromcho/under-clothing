import type { Metadata } from 'next';
import { getSite } from '@/lib/api';
import { InfoPage } from '@/components/InfoPage';

export const metadata: Metadata = { title: 'Medios de pago', description: 'Medios de pago disponibles en Under Clothing.', alternates: { canonical: '/medios-de-pago' } };

export default async function Page() {
  const site = await getSite();
  const s = site.settings.payments;
  return <InfoPage site={site} eyebrow="Ayuda" title="Medios de pago" intro={s.intro} items={s.methods} emptyText="No hay pago online: armás tu pedido en la web y coordinamos el pago por mensaje al confirmarlo. Consultanos los medios de pago disponibles." />;
}
