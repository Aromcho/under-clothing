import type { Media } from '@/lib/types';
import { Picture } from './Picture';

/** Encabezado de página con fondo de tela (Kling) y título en Jost 300. */
export function PageHeader({ eyebrow, title, text, image, children }: { eyebrow?: string; title: string; text?: string; image?: Media | null; children?: React.ReactNode }) {
  return (
    <header className="relative isolate overflow-hidden bg-surface pt-[var(--header-h)]">
      {image && <Picture media={image} sizes="100vw" alt="" priority className="absolute inset-0 -z-10 h-full w-full opacity-70" />}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-bg via-bg/40 to-bg/10" />
      <div className="container-x pt-12 pb-9 md:pt-20 md:pb-12">
        {eyebrow && <p className="label fade-up mb-3 text-muted">{eyebrow}</p>}
        <h1 className="title fade-up !text-[clamp(2.2rem,8vw,4rem)] [animation-delay:0.08s]">{title}</h1>
        {text && <p className="fade-up mt-3 max-w-xl text-lg font-light text-muted [animation-delay:0.16s]">{text}</p>}
        {children}
      </div>
    </header>
  );
}
