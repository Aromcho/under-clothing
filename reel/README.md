# Reel de lanzamiento

Vertical 1080×1920, 24 fps, sin audio.

1. `kling.mp4`: clip de fondo generado con Kling 3.0 Omni (720p, 10 s, sin sonido).
2. `node reel/record.mjs`: graba la web real en un iPhone cuadro a cuadro (con la web corriendo en `localhost:3000`).
   Después: `ffmpeg -framerate 24 -i reel/frames/f%04d.jpg -c:v libx264 -crf 14 -pix_fmt yuv420p reel/web-iphone.mp4`
3. `python reel/compose.py reel/kling.mp4 reel/web-iphone.mp4 reel/under-clothing-lanzamiento.mp4`
   (necesita Python con Pillow y ffmpeg en el PATH).

`compose.py` detecta los cortes de toma del clip y sincroniza los textos con ellos. Los textos se editan al principio del bloque “textos”.
