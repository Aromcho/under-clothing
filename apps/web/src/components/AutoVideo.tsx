'use client';

import { useEffect, useRef, useState } from 'react';

type Props = { src: string; poster: string; className?: string; label: string; controls?: boolean; controlClassName?: string };

/**
 * Video de ambiente: sin sonido, en loop, sólo se reproduce cuando está en pantalla.
 * Si el archivo no está disponible queda la imagen de portada. Botón de pausa accesible.
 */
export function AutoVideo({ src, poster, className = '', label, controls = true, controlClassName = '' }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(true);
  const [ok, setOk] = useState(true);
  const userPaused = useRef(false);
  const inView = useRef<boolean | null>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const sync = () => setPaused(v.paused);
    // si arranca solo (autoplay) estando fuera de pantalla, se pausa
    const onPlay = () => { if (inView.current === false) v.pause(); sync(); };
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', sync);
    sync();
    const io = new IntersectionObserver(([e]) => {
      inView.current = e.isIntersecting;
      if (e.isIntersecting && !userPaused.current) v.play().catch(() => {});
      else v.pause();
    }, { threshold: 0.15 });
    io.observe(v);
    return () => { io.disconnect(); v.removeEventListener('play', onPlay); v.removeEventListener('pause', sync); };
  }, []);

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) { userPaused.current = false; v.play().catch(() => {}); } else { userPaused.current = true; v.pause(); }
  };

  return (
    <>
      <video
        ref={ref}
        className={className}
        src={src}
        poster={poster}
        muted
        autoPlay
        loop
        playsInline
        preload="auto"
        aria-label={label}
        onError={() => setOk(false)}
        disablePictureInPicture
      />
      {controls && ok && (
        <button type="button" onClick={toggle} aria-label={paused ? 'Reproducir video' : 'Pausar video'} className={`grid h-10 w-10 place-items-center rounded-full bg-ink/35 text-bg backdrop-blur-md transition-colors hover:bg-ink/55 ${controlClassName}`}>
          {paused ? (
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden><path d="M3 1.5v11l9-5.5-9-5.5Z" fill="currentColor" /></svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden><path d="M3 1.5h2.6v11H3zM8.4 1.5H11v11H8.4z" fill="currentColor" /></svg>
          )}
        </button>
      )}
    </>
  );
}
