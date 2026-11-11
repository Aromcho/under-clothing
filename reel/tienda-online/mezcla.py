"""Mezcla de audio del reel: voz en off cortada por frase y sincronizada con cada texto en pantalla + música con ducking.
voz-1.m4a: toma completa (el cierre salió mal y NO se usa). voz-2-final.m4a: cierre regrabado.
Uso: python3 mezcla.py  → audio/mezcla.wav  (después: mux con el video, ver LEEME.md)"""
import subprocess
DUR = 32.733
# (archivo, desde, hasta, segundo del video donde entra) — cortes en las pausas de la toma
FRASES = [
    (0, 0.40, 2.69, 0.20),    # Desde hoy, Under no cierra nunca.
    (0, 2.69, 4.17, 3.05),    # Abrimos nuestra tienda online:
    (0, 4.17, 6.58, 5.05),    # todo el showroom, ahora en tu celular.
    (0, 6.58, 10.05, 7.60),   # Más de setenta prendas para mirar tranquila, a la hora que quieras.
    (0, 10.00, 11.70, 12.45), # Elegís la prenda y el color…
    (0, 11.70, 12.97, 14.60), # …la sumás al pedido…
    (0, 12.97, 15.56, 16.05), # …y nos lo mandás en un mensaje. Así de fácil.
    (0, 15.56, 18.85, 19.60), # Enviamos a todo el país. Y en Gesell, el envío es gratis.
    (0, 18.85, 24.50, 23.00), # ¿Preferís probarte todo? Te esperamos en el showroom: Paseo 104, entre 3 y 4.
    (1, 0.60, 4.95, 28.55),   # Tu próximo "me lo merezco" está a un toque. Link en la bio.  (toma 2)
]
f, labels = [], []
for i, (src, a, b, at) in enumerate(FRASES):
    d = b - a; ms = int(at * 1000)
    f.append(f"[{src}]atrim={a}:{b},asetpts=N/SR/TB,aresample=44100,pan=stereo|c0=c0|c1=c0,"
             f"afade=t=in:d=0.02,afade=t=out:st={d - 0.03:.3f}:d=0.03,adelay={ms}|{ms},apad=whole_dur={DUR}[f{i}]")
    labels.append(f'[f{i}]')
f.append(f"{''.join(labels)}amix=inputs={len(labels)}:normalize=0:duration=longest,atrim=0:{DUR},highpass=f=90,"
         f"acompressor=threshold=-20dB:ratio=3:attack=5:release=120:makeup=4,loudnorm=I=-16:TP=-2:LRA=9,aresample=44100,apad=whole_dur={DUR},atrim=0:{DUR}[out]")
ff = lambda *a: subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', *a], check=True)
# 1) pista de voz armada (archivo intermedio: loudnorm dentro de un grafo con sidechain recorta el final)
ff('-i', 'audio/voz-1.m4a', '-i', 'audio/voz-2-final.m4a', '-filter_complex', ';'.join(f), '-map', '[out]', '-ar', '44100', 'audio/voz.wav')
# 2) música que baja cuando habla la voz + mezcla final a -14 LUFS
ff('-i', 'audio/voz.wav', '-i', 'audio/musica.wav', '-filter_complex',
   "[0]asplit[voz][sc];[1]volume=-9dB[m];[m][sc]sidechaincompress=threshold=0.04:ratio=6:attack=15:release=350[md];"
   f"[voz][md]amix=inputs=2:normalize=0:duration=longest,loudnorm=I=-14:TP=-1.5:LRA=11,aresample=44100,apad=whole_dur={DUR},atrim=0:{DUR},afade=t=out:st={DUR - 0.6}:d=0.6[out]",
   '-map', '[out]', '-ar', '44100', 'audio/mezcla.wav')
print('audio/mezcla.wav')
