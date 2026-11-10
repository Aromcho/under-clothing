import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { getSite, SITE_URL } from '@/lib/api';
import './globals.css';

// Jost (Google Fonts) servida desde el propio sitio: variable 300–500
const jost = localFont({
  src: [
    { path: '../fonts/jost-latin-wght-normal.woff2', weight: '100 900', style: 'normal' },
  ],
  variable: '--font-jost',
  display: 'swap',
  fallback: ['ui-sans-serif', 'system-ui', 'sans-serif'],
});

export const viewport: Viewport = { themeColor: '#FFFDFB', width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getSite();
  const title = settings.seo.title || settings.business.name;
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s — ${settings.business.name}` },
    description: settings.seo.description,
    applicationName: settings.business.name,
    keywords: ['ropa de mujer', 'Villa Gesell', 'Under Clothing', 'tops', 'vestidos', 'sweaters', 'buzos', 'jeans', 'showroom', 'envíos a todo el país'],
    alternates: { canonical: '/' },
    openGraph: { type: 'website', locale: 'es_AR', siteName: settings.business.name, title, description: settings.seo.description, url: SITE_URL },
    twitter: { card: 'summary_large_image', title, description: settings.seo.description },
    robots: { index: true, follow: true },
    formatDetection: { telephone: false },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" className={jost.variable}>
      <body style={{ ['--header-h' as string]: '3.75rem' }}>{children}</body>
    </html>
  );
}
