import type { CSSProperties } from 'react';
import type { Media } from '@/lib/types';
import { imgUrl, srcSet } from '@/lib/format';

type Props = { media: Media; sizes: string; alt?: string; className?: string; priority?: boolean; style?: CSSProperties; fit?: 'cover' | 'contain'; position?: string; draggable?: boolean };

/** Imagen responsive: WebP en varios tamaños + placeholder borroso generado con sharp. */
export function Picture({ media, sizes, alt, className = '', priority, style, fit = 'cover', position = 'center', draggable }: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imgUrl(media, 640)}
      srcSet={srcSet(media)}
      sizes={sizes}
      alt={alt ?? media.alt}
      width={media.width}
      height={media.height}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding="async"
      draggable={draggable ?? false}
      className={className}
      style={{ objectFit: fit, objectPosition: position, backgroundImage: `url("${media.blur}")`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: media.color, ...style }}
    />
  );
}
