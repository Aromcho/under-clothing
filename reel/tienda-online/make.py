"""
Reel "Abrimos la tienda online" — Under Clothing. 1080x1920, 30 fps, sin audio (la voz en off se graba aparte: ver guion.md).
Una escena por archivo y unión con concat (-c copy).
Uso: python3 make.py [escena ...]   (sin argumentos: todas)   ·   python3 make.py preview  → cuadros de prueba
"""
import glob, json, math, os, subprocess, sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
P = lambda *a: os.path.join(HERE, *a)
W, H, FPS = 1080, 1920, 30
INK, BG, PINK, SURF, ACCENT = (28, 26, 26), (255, 253, 251), (235, 207, 203), (245, 236, 233), (201, 154, 152)
F3 = lambda s: ImageFont.truetype(P('fonts/Jost-300.ttf'), s)
F5 = lambda s: ImageFont.truetype(P('fonts/Jost-500.ttf'), s)

# ——— Línea de tiempo (segundos). Cada bloque coincide con una línea de la voz en off.
T_HOOK, T_PHONE_IN, T_PHONE_OUT, T_SHIP, T_SHOW, T_END = 3.0, 4.6, 18.95, 22.4, 27.4, 32.0
taps = json.load(open(P('taps.json')))
SEG = {k: sorted(glob.glob(P('frames', k, '*.jpg'))) for k in 'abc'}
SEG_START = {'a': T_PHONE_IN + 0.25}
SEG_START['b'] = SEG_START['a'] + len(SEG['a']) / FPS
SEG_START['c'] = SEG_START['b'] + len(SEG['b']) / FPS
T_PHONE_OUT = SEG_START['c'] + len(SEG['c']) / FPS - 0.1

ease = lambda t: 1 - (1 - max(0.0, min(1.0, t))) ** 3
ramp = lambda t, a, b: max(0.0, min(1.0, (t - a) / (b - a)))
io = lambda t, a, b, d=0.45, d2=0.35: ease(ramp(t, a, a + d)) * (1 - ease(ramp(t, b - d2, b)))   # entra y sale

def sh(*a): return subprocess.run(a, check=True, capture_output=True, text=True)

def cover(im, w=W, h=H, zoom=1.0, cx=0.5, cy=0.5):
    r = max(w / im.width, h / im.height) * zoom
    nw, nh = int(im.width * r + 0.5), int(im.height * r + 0.5)
    im = im.resize((nw, nh), Image.BICUBIC if zoom != 1 else Image.LANCZOS)
    x, y = int((nw - w) * cx), int((nh - h) * cy)
    return im.crop((x, y, x + w, y + h))

def fast_blur(im, radius):
    if radius < 0.6: return im
    s = im.resize((W // 4, H // 4), Image.BILINEAR).filter(ImageFilter.GaussianBlur(radius / 4))
    return s.resize((W, H), Image.BICUBIC)

def text_layer(lines, width=W, align='c', x0=90):
    """lines: [(texto, fuente, color, tracking, gap_arriba)]"""
    probe = ImageDraw.Draw(Image.new('RGBA', (8, 8)))
    rows, y = [], 0
    for txt, f, color, tracking, gap in lines:
        y += gap
        wds = [probe.textlength(ch, font=f) for ch in txt]
        asc, desc = f.getmetrics()
        rows.append((txt, f, color, tracking, y, sum(wds) + tracking * max(0, len(txt) - 1), wds)); y += asc + desc
    img = Image.new('RGBA', (width, y + 30), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    for txt, f, color, tracking, yy, tw, wds in rows:
        x = (width - tw) / 2 if align == 'c' else x0
        for ch, cw in zip(txt, wds): d.text((x, yy), ch, font=f, fill=color); x += cw + tracking
    return img

def shadow(layer, blur=16, strength=0.6):
    a = layer.getchannel('A').filter(ImageFilter.GaussianBlur(blur)).point(lambda v: int(v * strength))
    s = Image.new('RGBA', layer.size, (18, 14, 14, 0)); s.putalpha(a); s.alpha_composite(layer); return s

def put(base, layer, y, alpha=1.0, rise=0.0, x=0):
    if alpha <= 0.003: return
    if alpha < 0.997:
        layer = layer.copy(); layer.putalpha(layer.getchannel('A').point(lambda v: int(v * alpha)))
    base.alpha_composite(layer, (int(x), int(y + rise)))

def band(center, spread, strength):
    col = Image.new('L', (1, H))
    col.putdata([int(255 * strength * math.exp(-((y - center) / spread) ** 2)) for y in range(H)])
    b = Image.new('RGBA', (W, H), (18, 14, 14, 0)); b.putalpha(col.resize((W, H))); return b

def pill(text, fg=INK, bg=BG, size=30, padx=46, h=86):
    t = text_layer([(text, F5(size), fg, 8, 0)])
    tw = t.getbbox()[2] - t.getbbox()[0]
    p = Image.new('RGBA', (W, h + 16), (0, 0, 0, 0))
    ImageDraw.Draw(p).rounded_rectangle([W / 2 - tw / 2 - padx, 4, W / 2 + tw / 2 + padx, 4 + h], radius=h // 2, fill=bg + (255,))
    p.alpha_composite(t, (0, int(4 + (h - size * 1.42) / 2))); return p

class Clip:
    """Cuadros de un clip a 30 fps y 1080x1920 (se extraen una vez)."""
    def __init__(self, path, name, ss=0.0, dur=None, slow=1.0):
        d = P('tmp', name)
        if not os.path.isdir(d) or not os.listdir(d):
            os.makedirs(d, exist_ok=True)
            vf = []
            if slow != 1.0: vf.append(f"minterpolate=fps={int(24 / slow * 2)}:mi_mode=mci:mc_mode=aobmc:vsbmc=1,setpts={1 / slow}*PTS")
            vf += [f'framerate=fps={FPS}', f'scale={W}:{H}:force_original_aspect_ratio=increase:flags=lanczos', f'crop={W}:{H}']
            cmd = ['ffmpeg', '-y', '-loglevel', 'error', '-ss', str(ss)] + (['-t', str(dur)] if dur else []) + ['-i', path, '-vf', ','.join(vf), '-q:v', '2', d + '/%04d.jpg']
            sh(*cmd)
        self.files = sorted(glob.glob(d + '/*.jpg'))
    def at(self, t): return Image.open(self.files[max(0, min(len(self.files) - 1, int(t * FPS)))]).convert('RGB')
    @property
    def dur(self): return len(self.files) / FPS

def encode(name, n_frames, draw):
    tmp, out = P('scenes', name + '.part.mp4'), P('scenes', name + '.mp4')
    os.makedirs(P('scenes'), exist_ok=True)
    enc = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-', '-an', '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', '-r', str(FPS), '-video_track_timescale', '15360', tmp], stdin=subprocess.PIPE)
    for i in range(n_frames): enc.stdin.write(draw(i).convert('RGB').tobytes())
    enc.stdin.close()
    if enc.wait() == 0: os.replace(tmp, out)
    print('escena', name, n_frames, 'cuadros', flush=True)

# ——— recursos
STILL = {k: Image.open(P('fotos', k + '.jpg')).convert('RGB') for k in ['1-fachada', '2-interior', '3-percheros', '4-cintos', '5-puerta', '6-rincon']}
TOUR = P('tour.mp4') if os.path.exists(P('tour.mp4')) else None
TOUR_CUTS = json.load(open(P('tour-cuts.json'))) if os.path.exists(P('tour-cuts.json')) else None

def tour_shot(i, name, slow=1.0):
    a, b = TOUR_CUTS[i], TOUR_CUTS[i + 1]
    return Clip(TOUR, name, ss=a + 0.02, dur=b - a - 0.04, slow=slow)

def still_move(key, t, dur, z0=1.0, z1=1.1, cx=(0.5, 0.5), cy=(0.5, 0.5)):
    k = t / dur
    return cover(STILL[key], zoom=z0 + (z1 - z0) * k, cx=cx[0] + (cx[1] - cx[0]) * k, cy=cy[0] + (cy[1] - cy[0]) * k)

# ——— iPhone dibujado
SW, SH_, BAR, BZ, R = 520, 1125, 62, 16, 78
PW, PH = SW + BZ * 2, SH_ + BZ * 2
PX, PY = (W - PW) // 2, 610
def build_phone():
    S = 3
    fr = Image.new('RGBA', (PW * S, PH * S), (0, 0, 0, 0)); d = ImageDraw.Draw(fr)
    d.rounded_rectangle([0, 0, PW * S - 1, PH * S - 1], radius=(R + BZ) * S, fill=(40, 36, 36, 255))
    d.rounded_rectangle([3 * S, 3 * S, PW * S - 3 * S - 1, PH * S - 3 * S - 1], radius=(R + BZ - 3) * S, fill=(12, 11, 11, 255))
    d.rounded_rectangle([BZ * S, BZ * S, (BZ + SW) * S - 1, (BZ + SH_) * S - 1], radius=R * S, fill=(0, 0, 0, 0))
    fr = fr.resize((PW, PH), Image.LANCZOS)
    mk = Image.new('L', (SW * S, SH_ * S), 0); ImageDraw.Draw(mk).rounded_rectangle([0, 0, SW * S - 1, SH_ * S - 1], radius=R * S, fill=255); mk = mk.resize((SW, SH_), Image.LANCZOS)
    st = Image.new('RGBA', (SW * S, BAR * S), BG + (255,)); d = ImageDraw.Draw(st)
    d.text((46 * S, 22 * S), '9:41', font=F5(22 * S), fill=INK)
    d.rounded_rectangle([(SW / 2 - 62) * S, 14 * S, (SW / 2 + 62) * S, 50 * S], radius=18 * S, fill=(8, 8, 8))
    bx = SW - 46
    d.rounded_rectangle([(bx - 34) * S, 25 * S, bx * S, 41 * S], radius=5 * S, outline=INK, width=int(1.6 * S)); d.rounded_rectangle([(bx - 31) * S, 28 * S, (bx - 9) * S, 38 * S], radius=2 * S, fill=INK)
    for i in range(4): d.rounded_rectangle([(bx - 78 + i * 8) * S, (36 - i * 3.4) * S, (bx - 73 + i * 8) * S, 40 * S], radius=1 * S, fill=INK)
    st = st.resize((SW, BAR), Image.LANCZOS)
    shd = Image.new('RGBA', (PW + 240, PH + 240), (0, 0, 0, 0)); ImageDraw.Draw(shd).rounded_rectangle([120, 150, 120 + PW, 150 + PH], radius=R + BZ, fill=(0, 0, 0, 165)); shd = shd.filter(ImageFilter.GaussianBlur(48))
    return fr, mk, st, shd
PH_FRAME, PH_MASK, PH_STATUS, PH_SHADOW = build_phone()
KS = SW / 390.0

def web_frame(t):
    """Cuadro de la web (con indicador de toque) para el tiempo absoluto t."""
    seg = 'a' if t < SEG_START['b'] else 'b' if t < SEG_START['c'] else 'c'
    fi = max(0, min(len(SEG[seg]) - 1, int((t - SEG_START[seg]) * FPS)))
    im = Image.open(SEG[seg][fi]).convert('RGB').resize((SW, int(SW * 1688 / 780)), Image.LANCZOS).crop((0, 0, SW, SH_ - BAR))
    for tp in taps['taps'][seg]:
        k = (fi - tp['frame']) / (0.5 * FPS)
        if -0.25 <= k <= 1:
            ov = Image.new('RGBA', im.size, (0, 0, 0, 0)); d = ImageDraw.Draw(ov)
            x, y = tp['x'] * KS, tp['y'] * KS
            if k < 0: r, a = 30 - 8 * (k + 0.25) / 0.25, int(150 * (k + 0.25) / 0.25)
            else: r, a = 22 + 34 * ease(k), int(150 * (1 - k))
            d.ellipse([x - r, y - r, x + r, y + r], fill=(255, 253, 251, int(a * 0.55)), outline=(28, 26, 26, a), width=3)
            im = Image.alpha_composite(im.convert('RGBA'), ov).convert('RGB')
    # fundido corto entre secciones de la web
    return im

def phone_img(t):
    scr = Image.new('RGBA', (SW, SH_), BG + (255,)); scr.paste(PH_STATUS, (0, 0)); scr.paste(web_frame(t), (0, BAR))
    p = Image.new('RGBA', (PW, PH), (0, 0, 0, 0)); p.paste(scr, (BZ, BZ), PH_MASK); p.alpha_composite(PH_FRAME); return p

# ——— etiqueta colgante (elemento firma)
def build_tag(size=400):
    S = 3; c = Image.new('RGBA', (size * S, size * S), (0, 0, 0, 0)); d = ImageDraw.Draw(c)
    d.ellipse([0, 0, size * S - 1, size * S - 1], fill=BG + (255,))
    n, rr = 46, size * S * 0.455
    for i in range(n):
        a0, a1 = 360 / n * i, 360 / n * i + 360 / n * 0.52
        d.arc([size * S / 2 - rr, size * S / 2 - rr, size * S / 2 + rr, size * S / 2 + rr], a0, a1, fill=ACCENT + (255,), width=int(1.2 * S * size / 130))
    hr = size * S * 0.034
    d.ellipse([size * S / 2 - hr, size * S * 0.105 - hr, size * S / 2 + hr, size * S * 0.105 + hr], fill=SURF + (255,), outline=ACCENT + (255,), width=int(1.6 * S))
    c = c.resize((size, size), Image.LANCZOS)
    lg = Image.open(P('logo-word.png')).convert('L'); lw = int(size * 0.74); lg = lg.resize((lw, int(lg.height * lw / lg.width)), Image.LANCZOS)
    ink = Image.new('RGBA', lg.size, INK + (0,)); ink.putalpha(lg.point(lambda v: 255 - v))
    c.alpha_composite(ink, ((size - lw) // 2, int(size * 0.5 - lg.height * 0.46)))
    return c
TAG = build_tag(400)
def tag_layer(angle, thread=520, drop=0.0):
    """Etiqueta colgando de un hilo desde el borde superior; gira alrededor del punto de anclaje."""
    L = Image.new('RGBA', (W, 1200), (0, 0, 0, 0)); d = ImageDraw.Draw(L)
    top = -int(drop)
    d.line([W / 2, top - 50, W / 2, top + thread], fill=(255, 253, 251, 235), width=3)
    sh_ = Image.new('RGBA', (W, 1200), (0, 0, 0, 0)); ImageDraw.Draw(sh_).ellipse([W / 2 - 205, top + thread - 20, W / 2 + 205, top + thread + 395], fill=(0, 0, 0, 120)); sh_ = sh_.filter(ImageFilter.GaussianBlur(34))
    L = Image.alpha_composite(sh_, L); L.alpha_composite(TAG, (W // 2 - 200, top + thread - 42))
    return L.rotate(angle, resample=Image.BICUBIC, center=(W / 2, top - 50))

# ——— textos
WHITE = BG
def T(lines, **k): return shadow(text_layer(lines, **k))
TX = {
  'hook1': T([('DESDE HOY', F5(34), PINK, 12, 0)]),
  'hook2': T([('Under no cierra', F3(132), WHITE, -1, 0)]),
  'hook3': T([('nunca.', F3(132), WHITE, -1, 0)]),
  'open': T([('TIENDA ONLINE', F5(32), PINK, 12, 0), ('Abrimos nuestra', F3(112), WHITE, -1, 22), ('tienda online', F3(112), WHITE, -1, -22)]),
  'p1': T([('TODO EL SHOWROOM', F5(30), PINK, 10, 0), ('Ahora, en tu celular', F3(86), WHITE, 0, 18)]),
  'p2': T([('MÁS DE 70 PRENDAS', F5(30), PINK, 10, 0), ('Mirá tranquila,', F3(86), WHITE, 0, 18), ('a la hora que quieras', F3(86), WHITE, 0, -16)]),
  's1': T([('ASÍ DE FÁCIL · 1 DE 3', F5(30), PINK, 10, 0), ('Elegí la prenda', F3(86), WHITE, 0, 18), ('y el color', F3(86), WHITE, 0, -16)]),
  's2': T([('ASÍ DE FÁCIL · 2 DE 3', F5(30), PINK, 10, 0), ('Sumala', F3(86), WHITE, 0, 18), ('al pedido', F3(86), WHITE, 0, -16)]),
  's3': T([('ASÍ DE FÁCIL · 3 DE 3', F5(30), PINK, 10, 0), ('Mandalo', F3(86), WHITE, 0, 18), ('en un mensaje', F3(86), WHITE, 0, -16)]),
  'ship': T([('ENVÍOS', F5(34), PINK, 14, 0), ('A todo el país', F3(128), WHITE, -1, 20)]),
  'show': T([('SHOWROOM · VILLA GESELL', F5(32), PINK, 10, 0), ('Paseo 104', F3(128), WHITE, -1, 20), ('entre 3 y 4', F3(128), WHITE, -1, -26), ('Lunes a sábado · 11 a 13 y 17:30 a 20 h', F3(42), WHITE, 0.5, 26)]),
  'end': T([('Tu próximo', F3(96), WHITE, 0, 0), ('“me lo merezco”', F3(96), WHITE, 0, -18), ('está a un toque', F3(96), WHITE, 0, -18)]),
  'ig': T([('@under.clothing7', F3(44), WHITE, 1, 0)]),
}
PILL_FREE = pill('GRATIS EN VILLA GESELL', size=30)
PILL_BIO = pill('LINK EN LA BIO', size=32, h=92)

# ——— escenas
def scene_hook():
    clip = tour_shot(0, 'hook', slow=0.5) if TOUR else None
    bnd = band(1040, 400, 0.72)
    def draw(i):
        t = i / FPS
        bg = clip.at(t) if clip else still_move('1-fachada', t, T_HOOK, 1.0, 1.12, cy=(0.45, 0.4))
        f = bg.convert('RGBA'); f.alpha_composite(bnd)
        put(f, TX['hook1'], 880, ease(ramp(t, 0.12, 0.5)), 20 * (1 - ease(ramp(t, 0.12, 0.5))))
        put(f, TX['hook2'], 950, ease(ramp(t, 0.5, 0.95)), 34 * (1 - ease(ramp(t, 0.5, 0.95))))
        put(f, TX['hook3'], 1098, ease(ramp(t, 1.35, 1.8)), 34 * (1 - ease(ramp(t, 1.35, 1.8))))
        return f
    encode('1-hook', int(T_HOOK * FPS), draw)

def scene_phone():
    s2 = tour_shot(1, 'int') if TOUR else None
    s3 = tour_shot(2, 'per') if TOUR else None
    bnd = band(1000, 380, 0.6)
    loop = ['3-percheros', '2-interior', '4-cintos', '6-rincon']
    add_t = SEG_START['c'] + taps['taps']['c'][1]['frame'] / FPS - 0.15
    send_t = SEG_START['c'] + taps['taps']['c'][2]['frame'] / FPS - 0.15
    def backdrop(t):
        tt = t - T_HOOK
        if tt < 1.5: return (s2.at(tt) if s2 else still_move('2-interior', tt, 1.5, 1.02, 1.08))
        if s3 and tt < 1.5 + s3.dur: base = s3.at(tt - 1.5)
        else:
            u = (t - 6.0) / 4.6; k = int(max(0, u)); a = still_move(loop[k % 4], (u - k) * 4.6 + 0.8, 5.4, 1.06, 1.2)
            x = ramp(u - k, 0.86, 1.0)
            base = Image.blend(a, still_move(loop[(k + 1) % 4], (u - k - 1) * 4.6 + 0.8, 5.4, 1.06, 1.2), ease(x)) if x > 0 else a
        return base
    def draw(i):
        t = T_HOOK + i / FPS
        k = ease(ramp(t, T_PHONE_IN - 0.1, T_PHONE_IN + 0.6))
        bg = fast_blur(backdrop(t), 15 * k)
        f = bg.convert('RGBA')
        if k > 0: f.alpha_composite(Image.new('RGBA', (W, H), (22, 17, 17, int(255 * 0.46 * k))))
        a0 = io(t, T_HOOK + 0.05, T_PHONE_IN + 0.15, 0.4, 0.3)
        if a0 > 0:
            b = bnd.copy(); b.putalpha(b.getchannel('A').point(lambda v: int(v * a0))); f.alpha_composite(b)
            put(f, TX['open'], 820, a0, 30 * (1 - ease(ramp(t, T_HOOK + 0.05, T_HOOK + 0.45))))
        pin, pout = ease(ramp(t, T_PHONE_IN, T_PHONE_IN + 0.8)), ease(ramp(t, T_PHONE_OUT - 0.05, T_PHONE_OUT + 0.5))
        if pin > 0:
            py = PY + (H - PY + 60) * (1 - pin) + (H - PY + 60) * pout
            if py < H:
                f.alpha_composite(PH_SHADOW, (PX - 120, int(py - 120)))
                f.alpha_composite(phone_img(t), (PX, int(py)))
        y0 = 236
        for key, a, b in [('p1', T_PHONE_IN + 0.5, SEG_START['a'] + 2.75), ('p2', SEG_START['a'] + 2.8, SEG_START['c'] - 0.05), ('s1', SEG_START['c'], add_t), ('s2', add_t + 0.05, send_t), ('s3', send_t + 0.05, T_PHONE_OUT + 0.1)]:
            al = io(t, a, b, 0.4, 0.3)
            put(f, TX[key], y0 + (44 if key == 'p1' else 0), al, 24 * (1 - ease(ramp(t, a, a + 0.4))))
        return f
    encode('2-phone', int(round((T_PHONE_OUT + 0.5 - T_HOOK) * FPS)), draw)
    return T_PHONE_OUT + 0.5

def scene_ship(dur=3.5):
    files = [os.path.normpath(P(l.strip())) if not os.path.isabs(l.strip()) else l.strip() for l in open(P('mosaico.txt')) if l.strip()]
    CW, CH, GAP = 330, 412, 22
    cols = []
    for c in range(3):
        strip = Image.new('RGB', (CW, (CH + GAP) * 8), SURF)
        for r in range(8):
            im = cover(Image.open(files[(c * 8 + r) % len(files)]).convert('RGB'), CW, CH, cy=0.25)
            m = Image.new('L', (CW, CH), 0); ImageDraw.Draw(m).rounded_rectangle([0, 0, CW - 1, CH - 1], radius=30, fill=255)
            strip.paste(im, (0, r * (CH + GAP)), m)
        cols.append(strip)
    bnd = band(980, 330, 0.78)
    def draw(i):
        t = i / FPS
        f = Image.new('RGB', (W, H), SURF)
        for c, strip in enumerate(cols):
            speed = [150, -190, 170][c]; off = int((900 + c * 210 + speed * t)) % (strip.height - H - 10)
            f.paste(strip.crop((0, off, CW, off + H)), (23 + c * (CW + 22), 0))
        f = f.convert('RGBA'); f.alpha_composite(Image.new('RGBA', (W, H), (22, 17, 17, 70))); f.alpha_composite(bnd)
        put(f, TX['ship'], 840, ease(ramp(t, 0.1, 0.55)), 30 * (1 - ease(ramp(t, 0.1, 0.55))))
        put(f, PILL_FREE, 1110, ease(ramp(t, 1.25, 1.7)), 22 * (1 - ease(ramp(t, 1.25, 1.7))))
        return f
    encode('3-envios', int(round(dur * FPS)), draw)

def scene_showroom(dur=5.0):
    shots = [tour_shot(i, n) for i, n in [(3, 'cin'), (4, 'pue'), (5, 'rin')]] if TOUR else None
    keys = ['4-cintos', '5-puerta', '6-rincon']
    bnd = band(1010, 400, 0.66)
    def draw(i):
        t = i / FPS
        if shots:
            acc = 0
            for s in shots:
                if t < acc + s.dur or s is shots[-1]: bg = s.at(min(t - acc, s.dur - 1 / FPS)); break
                acc += s.dur
        else:
            k = min(2, int(t / (dur / 3))); bg = still_move(keys[k], t - k * dur / 3, dur / 3, 1.02, 1.1)
        f = bg.convert('RGBA'); f.alpha_composite(bnd)
        put(f, TX['show'], 770, ease(ramp(t, 0.15, 0.6)), 30 * (1 - ease(ramp(t, 0.15, 0.6))))
        return f
    encode('4-showroom', int(round(dur * FPS)), draw)

def scene_end(dur=4.6):
    clip = Clip(P('kling.mp4'), 'tag', ss=6.72, dur=3.28)
    def draw(i):
        t = i / FPS
        bg = clip.at(min(t, clip.dur - 1 / FPS))
        if t > clip.dur: bg = cover(bg, zoom=1 + 0.05 * (t - clip.dur) / (dur - clip.dur))
        k = ease(ramp(t, 0.35, 1.2))
        f = fast_blur(bg, 10 * k).convert('RGBA'); f.alpha_composite(Image.new('RGBA', (W, H), (22, 17, 17, int(255 * 0.5 * k))))
        tt = t - 0.45
        if tt > 0:
            ang = 15 * math.exp(-1.5 * tt) * math.cos(5.2 * tt)
            f.alpha_composite(tag_layer(ang, thread=500, drop=900 * (1 - ease(ramp(tt, 0, 0.6)))), (0, 0))
        put(f, TX['end'], 905, ease(ramp(t, 1.15, 1.65)), 30 * (1 - ease(ramp(t, 1.15, 1.65))))
        put(f, PILL_BIO, 1318, ease(ramp(t, 1.9, 2.35)), 22 * (1 - ease(ramp(t, 1.9, 2.35))))
        put(f, TX['ig'], 1436, ease(ramp(t, 2.25, 2.7)))
        return f
    encode('5-cierre', int(round(dur * FPS)), draw)

if __name__ == '__main__':
    args = sys.argv[1:]
    if args == ['preview']:
        os.makedirs(P('preview'), exist_ok=True)
        import builtins
        shots = {}
        real_encode = encode
        def grab(name, n, draw, want):
            for sec in want:
                i = min(n - 1, int(sec * FPS)); draw(i).convert('RGB').save(P('preview', f'{name}-{sec:05.2f}.jpg'), quality=88)
        globals()['encode'] = lambda name, n, draw: grab(name, n, draw, {'1-hook': [1.0, 2.6], '2-phone': [0.9, 3.4, 6.3, 10.2, 13.0, 15.2], '3-envios': [2.4], '4-showroom': [1.2, 4.2], '5-cierre': [0.9, 3.6]}[name])
        scene_hook(); scene_phone(); scene_ship(); scene_showroom(); scene_end()
    else:
        todo = args or ['hook', 'phone', 'ship', 'showroom', 'end']
        end_phone = T_PHONE_OUT + 0.5
        if 'hook' in todo: scene_hook()
        if 'phone' in todo: scene_phone()
        if 'ship' in todo: scene_ship()
        if 'showroom' in todo: scene_showroom()
        if 'end' in todo: scene_end()
        names = ['1-hook', '2-phone', '3-envios', '4-showroom', '5-cierre']
        if not all(os.path.exists(P('scenes', n + '.mp4')) for n in names): print('faltan escenas: no se une todavía'); sys.exit(0)
        open(P('scenes', 'list.txt'), 'w').write(''.join(f"file '{n}.mp4'\n" for n in names))
        sh('ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', P('scenes', 'list.txt'), '-c', 'copy', '-movflags', '+faststart', P('under-clothing-tienda-online.mp4'))
        print('listo')
