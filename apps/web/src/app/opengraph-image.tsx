import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const alt = 'Under Clothing — Ropa de mujer en Villa Gesell';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  const dir = path.join(process.cwd(), 'src/fonts');
  const [light, medium, logo] = await Promise.all([
    readFile(path.join(dir, 'jost-latin-300-normal.woff')), readFile(path.join(dir, 'jost-latin-500-normal.woff')),
    readFile(path.join(process.cwd(), 'public/brand/logo-circle.png')),
  ]);
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: '#F5ECE9', fontFamily: 'Jost', color: '#1C1A1A' }}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '72px 80px', width: 760 }}>
          <div style={{ display: 'flex', fontSize: 22, letterSpacing: 6, fontWeight: 500 }}>VILLA GESELL · ENVÍOS A TODO EL PAÍS</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', fontSize: 92, fontWeight: 300, lineHeight: 1.02, letterSpacing: -2 }}>Tu próximo “me lo merezco” está acá</div>
          </div>
          <div style={{ display: 'flex', fontSize: 26, letterSpacing: 10, fontWeight: 500 }}>UNDER CLOTHING</div>
        </div>
        <div style={{ display: 'flex', flex: 1, background: '#EBCFCB', alignItems: 'flex-start', justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: 2, height: 170, background: '#1C1A1A', opacity: 0.6 }} />
            <div style={{ display: 'flex', width: 300, height: 300, borderRadius: 300, background: '#FFFDFB', alignItems: 'center', justifyContent: 'center', boxShadow: '0 30px 60px rgba(28,26,26,0.18)', border: '2px dashed #C99A98', marginTop: -14 }}>
              {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
              <img src={`data:image/png;base64,${logo.toString('base64')}`} width={250} height={250} style={{ borderRadius: 250 }} />
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: 'Jost', data: light, weight: 300, style: 'normal' }, { name: 'Jost', data: medium, weight: 500, style: 'normal' }] },
  );
}
