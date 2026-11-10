import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

/** La API llama acá cada vez que se guarda algo en el panel: los cambios se ven al instante. */
export async function POST(req: Request) {
  if (req.headers.get('x-revalidate-secret') !== (process.env.REVALIDATE_SECRET ?? '')) return NextResponse.json({ ok: false }, { status: 401 });
  const { tags } = (await req.json().catch(() => ({ tags: [] }))) as { tags?: string[] };
  const valid = (tags ?? []).filter((t) => t === 'site' || t === 'products');
  for (const t of valid) revalidateTag(t, { expire: 0 });
  return NextResponse.json({ ok: true, tags: valid });
}
