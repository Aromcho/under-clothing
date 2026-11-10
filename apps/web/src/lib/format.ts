import type { Media, Product, Settings } from './types';

export const money = (n: number) => '$' + n.toLocaleString('es-AR');
export const imgUrl = (m: Media, w = 640) => `${m.path}/${pickWidth(m, w)}.webp`;
export const pickWidth = (m: Media, w: number) => m.widths.find((x) => x >= w) ?? m.widths[m.widths.length - 1];
export const srcSet = (m: Media) => m.widths.map((w) => `${m.path}/${w}.webp ${w}w`).join(', ');

export const colorsOf = (p: Product) => {
  const seen = new Map<string, string>();
  for (const v of p.variants) if (v.color && !seen.has(v.color)) seen.set(v.color, v.colorHex);
  return [...seen].map(([name, hex]) => ({ name, hex }));
};
export const sizesOf = (p: Product) => [...new Set(p.variants.map((v) => v.size).filter(Boolean))];
export const available = (p: Product, v?: { stock: number } | null) => (p.trackStock ? (v ? v.stock > 0 : p.variants.some((x) => x.stock > 0)) : true);

/** Link de contacto: WhatsApp si está cargado, si no mensaje directo de Instagram. */
export function contactLink(s: Settings['business'], text?: string) {
  const wa = (s.whatsapp ?? '').replace(/\D/g, '');
  if (wa) return { kind: 'whatsapp' as const, label: 'WhatsApp', href: `https://wa.me/${wa}${text ? `?text=${encodeURIComponent(text)}` : ''}` };
  return { kind: 'instagram' as const, label: 'Instagram', href: `https://ig.me/m/${s.instagram}` };
}

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
export const dayName = (d: number) => DAY_NAMES[d] ?? '';
