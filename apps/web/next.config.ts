import type { NextConfig } from 'next';
import { config } from 'dotenv';
import path from 'node:path';

// El .env vive en la raíz del monorepo
config({ path: path.resolve(process.cwd(), '../../.env'), quiet: true });
const API = process.env.API_URL ?? 'http://localhost:4000';

const nextConfig: NextConfig = {
  // El deploy del MCP compila en .next-new y después lo intercambia con .next (sin cortar el sitio)
  distDir: process.env.NEXT_DIST_DIR ?? '.next',
  reactStrictMode: true,
  poweredByHeader: false,
  env: { NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000' },
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${API}/api/:path*` },
      { source: '/uploads/:path*', destination: `${API}/uploads/:path*` },
    ];
  },
  async headers() {
    return [{ source: '/uploads/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] }];
  },
};
export default nextConfig;
