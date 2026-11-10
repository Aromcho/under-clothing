"""
Reel de lanzamiento de Under Clothing (1080x1920, 24 fps, sin audio).
Fondo: clip de Kling · Encima: la web real grabada en un iPhone + textos con Jost.
Uso: python3 compose.py <kling.mp4> <web-iphone.mp4> <salida.mp4>
"""
import math, os, re, subprocess, sys, glob, shutil
from PIL import Image, ImageDraw, ImageFilter, ImageFont

KLING, WEB, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
HERE = os.path.dirname(os.path.abspath(__file__))
W, H, FPS = 1080, 1920, 24
INK, BG, PINK, ACCENT = (28, 26, 26), (255, 253, 251), (235, 207, 203), (201, 154, 152)
F300, F500 = os.path.join(HERE, 'fonts/Jost-300.ttf'), os.path.join(HERE, 'fonts/Jost-500.ttf')
LOGO = os.path.join(HERE, 'logo-circle.png')
font = lambda path, size: ImageFont.truetype(path, size)

def sh(*a): return subprocess.run(a, check=True, capture_output=True, text=True)
def dur(p): return float(sh('ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p).stdout.strip())

# ——— c) cortes de toma del clip de Kling
r = subprocess.run(['ffmpeg', '-i', KLING, '-vf', "select='gt(scene,0.08)',showinfo", '-f', 'null', '-'], capture_output=True, text=True)
cuts = sorted(float(x) for x in re.findall(r'pts_time:([\d.]+)', r.stderr))
KD = dur(KLING)
clean = []
for c in cuts:
    if c > 1.2 and c < KD - 1.2 and (not clean or c - clean[-1] > 1.5): clean.append(c)
C1 = clean[0] if clean else KD / 3
C2 = clean[1] if len(clean) > 1 else max(C1 + 2.5, KD * 2 / 3)
print('cortes detectados:', [round(c, 2) for c in cuts], '→ uso', round(C1, 2), round(C2, 2))

PHONE_OUT = 11.4            # el teléfono sale
TOTAL = 14.5
WD = dur(WEB)

# ——— cuadros de origen
tmp = os.path.join(HERE, 'tmp'); shutil.rmtree(tmp, ignore_errors=True); os.makedirs(tmp + '/bg'); os.makedirs(tmp + '/web')
sh('ffmpeg', '-y', '-loglevel', 'error', '-i', KLING, '-vf', f'fps={FPS},scale={W}:{H}:force_original_aspect_ratio=increase:flags=lanczos,crop={W}:{H}', '-q:v', '2', tmp + '/bg/%04d.jpg')
SW, SH_ = 520, 1125          # pantalla del iPhone en el reel
BAR = 62                     # barra de estado
sh('ffmpeg', '-y', '-loglevel', 'error', '-i', WEB, '-vf', f'fps={FPS},scale={SW}:-2:flags=lanczos,crop={SW}:{SH_ - BAR}:0:0', '-q:v', '2', tmp + '/web/%04d.jpg')
bgs, webs = sorted(glob.glob(tmp + '/bg/*.jpg')), sorted(glob.glob(tmp + '/web/*.jpg'))

# ——— utilidades
ease = lambda t: 1 - (1 - max(0, min(1, t))) ** 3
ramp = lambda t, a, b: max(0.0, min(1.0, (t - a) / (b - a))) if b > a else float(t >= a)

def text_layer(lines, width=W):
    """lines: [(texto, fuente, color, tracking, gap)] centrado. Devuelve RGBA recortada."""
    probe = ImageDraw.Draw(Image.new('RGBA', (10, 10)))
    rows, y = [], 0
    for txt, f, color, tracking, gap in lines:
        y += gap
        wds = [probe.textlength(ch, font=f) for ch in txt]
        tw = sum(wds) + tracking * (len(txt) - 1)
        asc, desc = f.getmetrics()
        rows.append((txt, f, color, tracking, y, tw, wds)); y += asc + desc
    img = Image.new('RGBA', (width, y + 20), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    for txt, f, color, tracking, yy, tw, wds in rows:
        x = (width - tw) / 2
        for ch, cw in zip(txt, wds):
            d.text((x, yy), ch, font=f, fill=color); x += cw + tracking
    return img

def put(base, layer, y, alpha, rise=0):
    if alpha <= 0: return
    l = layer if alpha >= 1 else Image.composite(layer, Image.new('RGBA', layer.size, (0, 0, 0, 0)), layer.getchannel('A').point(lambda v: int(v * alpha)))
    base.alpha_composite(l, (0, int(y + rise)))

def shadow_text(layer, blur=14, strength=0.55):
    a = layer.getchannel('A').filter(ImageFilter.GaussianBlur(blur)).point(lambda v: int(v * strength))
    s = Image.new('RGBA', layer.size, (20, 16, 16, 0)); s.putalpha(a)
    out = Image.new('RGBA', layer.size, (0, 0, 0, 0)); out.alpha_composite(s); out.alpha_composite(layer); return out

# ——— iPhone dibujado (bisel, isla, barra de estado 9:41)
BZ, R = 16, 78
PW, PH = SW + BZ * 2, SH_ + BZ * 2
S = 3
frame = Image.new('RGBA', (PW * S, PH * S), (0, 0, 0, 0)); fd = ImageDraw.Draw(frame)
fd.rounded_rectangle([0, 0, PW * S - 1, PH * S - 1], radius=(R + BZ) * S, fill=(34, 31, 31, 255))
fd.rounded_rectangle([3 * S, 3 * S, PW * S - 3 * S - 1, PH * S - 3 * S - 1], radius=(R + BZ - 3) * S, fill=(12, 11, 11, 255))
fd.rounded_rectangle([BZ * S, BZ * S, (BZ + SW) * S - 1, (BZ + SH_) * S - 1], radius=R * S, fill=(0, 0, 0, 0))
frame = frame.resize((PW, PH), Image.LANCZOS)
mask = Image.new('L', (SW * S, SH_ * S), 0); ImageDraw.Draw(mask).rounded_rectangle([0, 0, SW * S - 1, SH_ * S - 1], radius=R * S, fill=255); mask = mask.resize((SW, SH_), Image.LANCZOS)
status = Image.new('RGBA', (SW * S, BAR * S), BG + (255,)); sd = ImageDraw.Draw(status)
sd.text((46 * S, 22 * S), '9:41', font=font(F500, 22 * S), fill=INK)
sd.rounded_rectangle([(SW / 2 - 62) * S, 14 * S, (SW / 2 + 62) * S, 50 * S], radius=18 * S, fill=(8, 8, 8))            # isla
bx = SW - 46
sd.rounded_rectangle([(bx - 34) * S, 25 * S, bx * S, 41 * S], radius=5 * S, outline=INK, width=int(1.6 * S)); sd.rounded_rectangle([(bx - 31) * S, 28 * S, (bx - 9) * S, 38 * S], radius=2 * S, fill=INK)
for i in range(4): sd.rounded_rectangle([(bx - 78 + i * 8) * S, (38 - 4 - i * 3.4) * S, (bx - 73 + i * 8) * S, 40 * S], radius=1 * S, fill=INK)  # señal
status = status.resize((SW, BAR), Image.LANCZOS)
pshadow = Image.new('RGBA', (PW + 200, PH + 200), (0, 0, 0, 0)); ImageDraw.Draw(pshadow).rounded_rectangle([100, 120, 100 + PW, 120 + PH], radius=R + BZ, fill=(0, 0, 0, 150)); pshadow = pshadow.filter(ImageFilter.GaussianBlur(42))

def phone(webframe):
    scr = Image.new('RGBA', (SW, SH_), BG + (255,)); scr.paste(status, (0, 0)); scr.paste(webframe, (0, BAR))
    p = Image.new('RGBA', (PW, PH), (0, 0, 0, 0)); p.paste(scr, (BZ, BZ), mask); p.alpha_composite(frame); return p

# ——— textos (nada en el 20 % inferior: lo tapa la interfaz de Instagram)
t1 = shadow_text(text_layer([('UNDER', font(F300, 150), BG, 46, 0), ('CLOTHING', font(F500, 34), BG, 22, 6), ('Paseo 104 entre 3 y 4 · Villa Gesell', font(F300, 44), BG, 1, 64)]), 18, 0.7)
t2 = shadow_text(text_layer([('AHORA, TAMBIÉN ONLINE', font(F500, 30), PINK, 9, 0), ('Mirá la web', font(F300, 88), BG, 0, 18), ('desde tu celular', font(F300, 88), BG, 0, -14)]))
t3 = shadow_text(text_layer([('TOPS, VESTIDOS, SWEATERS Y MUCHO MÁS', font(F500, 27), PINK, 6, 0), ('Elegí online y', font(F300, 88), BG, 0, 18), ('pedí por mensaje', font(F300, 88), BG, 0, -14)]))
logo = Image.open(LOGO).convert('RGBA').resize((330, 330), Image.LANCZOS)
lm = Image.new('L', (330 * 3, 330 * 3), 0); ImageDraw.Draw(lm).ellipse([0, 0, 989, 989], fill=255); logo.putalpha(lm.resize((330, 330), Image.LANCZOS))
glow = Image.new('RGBA', (730, 730), (0, 0, 0, 0)); ImageDraw.Draw(glow).ellipse([170, 170, 560, 560], fill=PINK + (235,)); glow = glow.filter(ImageFilter.GaussianBlur(70))
t4 = shadow_text(text_layer([('UNDER CLOTHING', font(F500, 46), BG, 20, 0), ('Villa Gesell · Envíos a todo el país', font(F300, 42), BG, 1, 26)]), 16, 0.7)
pill_txt = text_layer([('LINK EN LA BIO', font(F500, 30), INK, 8, 0)])
pill = Image.new('RGBA', (W, 110), (0, 0, 0, 0)); ImageDraw.Draw(pill).rounded_rectangle([W / 2 - 215, 8, W / 2 + 215, 96], radius=44, fill=BG + (255,)); pill.alpha_composite(pill_txt, (0, 30))
band = Image.new('L', (1, H), 0)
for y in range(H): band.putpixel((0, y), int(150 * math.exp(-((y - 900) / 380) ** 2)))
band = band.resize((W, H)); dark_band = Image.new('RGBA', (W, H), (18, 14, 14, 0)); dark_band.putalpha(band)

enc = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-', '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', OUT], stdin=subprocess.PIPE)
N = int(TOTAL * FPS)
for n in range(N):
    t = n / FPS
    bg = Image.open(bgs[min(len(bgs) - 1, n)]).convert('RGB')
    if t > KD:                                            # cierre: último cuadro congelado con zoom lento
        z = 1 + 0.07 * (t - KD) / (TOTAL - KD); w2, h2 = int(W / z), int(H / z)
        bg = bg.crop(((W - w2) // 2, (H - h2) // 2, (W - w2) // 2 + w2, (H - h2) // 2 + h2)).resize((W, H), Image.BICUBIC)
    k = ease(ramp(t, C1, C1 + 0.5)) * (1 - ease(ramp(t, PHONE_OUT, PHONE_OUT + 0.5)))   # desenfoque mientras está el teléfono
    kc = ease(ramp(t, PHONE_OUT + 0.1, PHONE_OUT + 0.8))                                # cierre
    blur = 16 * k + 9 * kc
    if blur > 0.4: bg = bg.filter(ImageFilter.GaussianBlur(blur))
    f = bg.convert('RGBA')
    dim = int(255 * (0.42 * k + 0.5 * kc))
    if dim: f.alpha_composite(Image.new('RGBA', (W, H), (22, 17, 17, dim)))

    # Toma 1: marca + dirección
    a1 = ease(ramp(t, 0.35, 1.0)) * (1 - ease(ramp(t, C1 - 0.55, C1 - 0.1)))
    if a1 > 0:
        db = dark_band.copy(); db.putalpha(band.point(lambda v: int(v * a1))); f.alpha_composite(db)
        put(f, t1, 730, a1, 26 * (1 - ease(ramp(t, 0.35, 1.0))))
    # Toma 2 y 3: iPhone con la web real
    pin, pout = ease(ramp(t, C1 + 0.05, C1 + 0.85)), ease(ramp(t, PHONE_OUT, PHONE_OUT + 0.55))
    if pin > 0 and pout < 1:
        wi = int(ramp(t, C1 + 0.5, PHONE_OUT) * (len(webs) - 1))
        ph = phone(Image.open(webs[wi]).convert('RGB'))
        py = 560 + (H - 560) * (1 - pin) + (H - 300) * pout
        f.alpha_composite(pshadow, (int((W - PW) / 2 - 100), int(py - 100))) if py < H - 150 else None
        f.alpha_composite(ph, (int((W - PW) / 2), int(py)))
    a2 = ease(ramp(t, C1 + 0.45, C1 + 1.0)) * (1 - ease(ramp(t, C2 - 0.4, C2 - 0.05)))
    put(f, t2, 222, a2, 22 * (1 - ease(ramp(t, C1 + 0.45, C1 + 1.0))))
    a3 = ease(ramp(t, C2 + 0.05, C2 + 0.6)) * (1 - ease(ramp(t, PHONE_OUT - 0.35, PHONE_OUT)))
    put(f, t3, 222, a3, 22 * (1 - ease(ramp(t, C2 + 0.05, C2 + 0.6))))
    # Cierre: logo con glow, nombre, pastilla y ciudad
    a4 = ease(ramp(t, PHONE_OUT + 0.45, PHONE_OUT + 1.1))
    if a4 > 0:
        rise = 30 * (1 - a4)
        put(f, Image.new('RGBA', (W, 730), (0, 0, 0, 0)), 0, 0)
        g = Image.new('RGBA', (W, 730), (0, 0, 0, 0)); g.alpha_composite(glow, (175, 0)); g.alpha_composite(logo, (375, 200)); put(f, g, 340, a4, rise)
        put(f, t4, 930, ease(ramp(t, PHONE_OUT + 0.65, PHONE_OUT + 1.3)), rise)
        put(f, pill, 1180, ease(ramp(t, PHONE_OUT + 0.95, PHONE_OUT + 1.6)), 18 * (1 - ease(ramp(t, PHONE_OUT + 0.95, PHONE_OUT + 1.6))))
    enc.stdin.write(f.convert('RGB').tobytes())
    if n % 48 == 0: print(f'  {n}/{N}', flush=True)
enc.stdin.close(); enc.wait()
shutil.rmtree(tmp, ignore_errors=True)
print('listo →', OUT)
