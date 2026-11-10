export type Media = { id: number; path: string; alt: string; width: number; height: number; widths: number[]; blur: string; color: string };
export type Variant = { id: number; size: string; color: string; colorHex: string; stock: number; position: number };
export type Product = {
  id: number; slug: string; name: string; description: string; details: string; price: number | null; comparePrice: number | null;
  isNew: boolean; featured: boolean; visible: boolean; trackStock: boolean; sizesNote: string; igUrl: string; position: number; publishedAt: string;
  categoryId: number | null; sizeGuideId: number | null;
  category: { id: number; slug: string; name: string } | null;
  collections: { id: number; slug: string; name: string }[];
  images: Media[]; variants: Variant[];
};
export type Category = { id: number; slug: string; name: string; description: string; mediaId: number | null; image: Media | null; position: number; visible: boolean };
export type Collection = Category & { tagline: string };
export type Story = { id: number; title: string; group: string; href: string; image: Media | null; mediaId: number | null; position: number; visible: boolean };
export type Banner = { id: number; placement: string; eyebrow: string; title: string; text: string; ctaLabel: string; ctaHref: string; image: Media | null; mobileImage: Media | null; mediaId: number | null; mobileMediaId: number | null; position: number; visible: boolean };
export type Benefit = { id: number; icon: string; title: string; text: string; position: number; visible: boolean };
export type SizeGuide = { id: number; name: string; columns: string[]; rows: string[][]; note: string; position: number; visible: boolean };
export type InfoItem = { title: string; text: string };
export type DayHours = { day: number; ranges: [string, string][] };
export type Settings = {
  business: { name: string; displayName: string; tagline: string; description: string; address: string; city: string; province: string; country: string; mapsQuery: string; instagram: string; whatsapp: string; email: string };
  hours: { timezone: string; days: DayHours[]; note: string };
  shipping: { intro: string; items: InfoItem[] };
  returns: { intro: string; items: InfoItem[] };
  payments: { intro: string; methods: InfoItem[] };
  seo: { title: string; description: string };
};
export type Site = { settings: Settings; categories: Category[]; collections: Collection[]; stories: Story[]; banners: Banner[]; benefits: Benefit[]; sizeGuides: SizeGuide[] };
export type OrderItem = { productId: number; variantId: number | null; name: string; slug: string; size: string; color: string; qty: number; price: number | null; image: string | null };
export type Order = { id: number; code: string; kind: 'pedido' | 'consulta'; status: string; customerName: string; phone: string; delivery: string; address: string; message: string; items: OrderItem[]; total: number | null; notes: { at: string; by: string; text: string }[]; createdAt: string; updatedAt: string };
