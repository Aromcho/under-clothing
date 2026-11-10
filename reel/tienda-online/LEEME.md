# Reel "Abrimos la tienda online"

- `guion.md`: guion de la voz en off con tiempos.
- `under-clothing-tienda-online.mp4`: el video (1080×1920, 30 fps, sin audio).

## Para volver a generarlo

1. Con la web corriendo (`npm run dev`): `node record2.mjs` graba la web en un iPhone cuadro a cuadro (carpeta `frames/`) y deja `taps.json`. El pedido de prueba que crea se borra desde el panel.
2. Copiar acá `kling.mp4` (clip de la prenda con la etiqueta) y, si está, `tour.mp4` (recorrido del showroom de Kling) junto con `tour-cuts.json` (los cortes de toma, en segundos).
3. `python make.py` renderiza una escena por archivo en `scenes/` y las une. `python make.py hook` vuelve a hacer sólo esa escena.

Necesita Python con Pillow y ffmpeg. Los textos en pantalla están en el diccionario `TX` de `make.py`.
