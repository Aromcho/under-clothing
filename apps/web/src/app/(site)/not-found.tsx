import Link from 'next/link';
import { HangTag } from '@/components/HangTag';

export default function NotFound() {
  return (
    <div className="container-x flex min-h-[80svh] flex-col items-center justify-center pt-[var(--header-h)] text-center">
      <HangTag size={150} thread={90} flippable={false} front={<span className="text-5xl font-light">404</span>} />
      <h1 className="title mt-10">Esta prenda ya no está en el perchero</h1>
      <p className="mt-3 max-w-md text-lg font-light text-muted">La página que buscás no existe o cambió de lugar.</p>
      <Link href="/tienda" className="btn mt-8">Ver la tienda</Link>
    </div>
  );
}
