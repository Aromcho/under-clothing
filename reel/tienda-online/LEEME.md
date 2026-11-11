# Reel "Abrimos la tienda online"

- `guion.md`: guion de la voz en off con tiempos.
- `under-clothing-tienda-online.mp4`: el video (1080×1920, 30 fps) con la voz en off y la música.
- `audio/`: voz en off (`voz-1.m4a` toma completa hasta el showroom, `voz-2-final.m4a` cierre regrabado), `musica.wav` y `mezcla.wav`.
- `musica.py`: genera la música por código (house minimal, 120 BPM): es original, sin derechos de terceros.

## Para volver a generarlo

1. Con la web corriendo (`npm run dev`): `node record2.mjs` graba la web en un iPhone cuadro a cuadro (carpeta `frames/`) y deja `taps.json`. El pedido de prueba que crea se borra desde el panel.
2. Copiar acá `kling.mp4` (clip de la prenda con la etiqueta) y, si está, `tour.mp4` (recorrido del showroom de Kling) junto con `tour-cuts.json` (los cortes de toma, en segundos).
3. `python make.py` renderiza una escena por archivo en `scenes/` y las une. `python make.py hook` vuelve a hacer sólo esa escena.

Necesita Python con Pillow y ffmpeg. Los textos en pantalla están en el diccionario `TX` de `make.py`.

## Audio

`python musica.py 32.8` genera `audio/musica.wav`. La mezcla (voz con compresión y normalizada, música que baja sola cuando habla la voz, −14 LUFS) se arma con ffmpeg: `voz-1` desde el inicio (recortada a 28,3 s) y `voz-2-final` a partir de 28,4 s.

## Actualización noviembre 2026

Las prendas de la web y del mosaico son los 16 nuevos ingresos (fotos en `apps/api/seed/images/nuevos`). Las escenas del gancho, el showroom y el cierre se tomaron de la versión anterior del video, porque los clips de Kling (`tour.mp4`, `kling.mp4`) no están en el repo.
