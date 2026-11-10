import 'server-only';
import type { Product, Settings, Site } from './types';

const API = process.env.API_URL ?? 'http://localhost:4000';

const EMPTY_SETTINGS: Settings = {
  business: { name: 'Under Clothing', displayName: 'UndeR Clothing', tagline: '', description: '', address: '', city: 'Villa Gesell', province: 'Buenos Aires', country: 'AR', mapsQuery: '', instagram: 'under.clothing7', whatsapp: '', email: '' },
  hours: { timezone: 'America/Argentina/Buenos_Aires', days: [], note: '' },
  shipping: { intro: '', items: [] }, returns: { intro: '', items: [] }, payments: { intro: '', methods: [] },
  seo: { title: 'Under Clothing', description: '' },
};

async function get<T>(path: string, tag: string): Promise<T | null> {
  try {
    // Caché de datos de Next con tags: el panel la invalida al guardar (ver /internal/revalidate)
    const r = await fetch(`${API}/api/public/${path}`, { cache: 'force-cache', next: { tags: [tag] } });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

export async function getSite(): Promise<Site> {
  const s = await get<Site>('site', 'site');
  if (!s) return { settings: EMPTY_SETTINGS, categories: [], collections: [], stories: [], banners: [], benefits: [], sizeGuides: [] };
  return { ...s, settings: { ...EMPTY_SETTINGS, ...s.settings } as Settings };
}

export async function getProducts(): Promise<Product[]> {
  return (await get<Product[]>('products', 'products')) ?? [];
}

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
