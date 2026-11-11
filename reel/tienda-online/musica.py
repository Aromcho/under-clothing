"""Música original para el reel (generada por código, sin derechos de terceros).
House minimal tipo pasarela, 120 BPM, La menor. Uso: python3 musica.py [segundos] → audio/musica.wav"""
import sys, os, numpy as np, scipy.io.wavfile as wav
SR, BPM = 44100, 120
DUR = float(sys.argv[1]) if len(sys.argv) > 1 else 33.0
beat = 60 / BPM; N = int(SR * DUR); L = np.zeros(N); R = np.zeros(N)
rng = np.random.default_rng(7)
t_ = lambda d: np.arange(int(SR * d)) / SR
def add(buf, x, t, g=1.0):
    i = int(t * SR); j = min(N, i + len(x))
    if i < N: buf[i:j] += x[:j - i] * g
def both(x, t, g=1.0, pan=0.0):
    add(L, x, t, g * (1 - max(0, pan))); add(R, x, t, g * (1 + min(0, pan)))
def kick():
    t = t_(0.45); f = 48 + 110 * np.exp(-t * 32)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7.5) + 0.25 * np.sin(2*np.pi*np.cumsum(f)/SR*2) * np.exp(-t * 40)
def hat(open_=False):
    t = t_(0.22 if open_ else 0.05); n = rng.standard_normal(len(t))
    n = np.diff(np.concatenate([[0], n]))           # agudos
    return n * np.exp(-t * (14 if open_ else 70)) * 0.35
def clap():
    t = t_(0.25); n = rng.standard_normal(len(t)); env = np.zeros(len(t))
    for d in (0, 0.011, 0.022): env += (t >= d) * np.exp(-(t - d).clip(0) * 38)
    return np.convolve(n, [1, -0.6], 'same') * env * 0.28
def note(f, d, kind='bass'):
    t = t_(d)
    if kind == 'bass':
        x = np.sin(2*np.pi*f*t) + 0.35*np.sin(2*np.pi*2*f*t) + 0.12*np.sign(np.sin(2*np.pi*f*t))
        return x * np.minimum(1, t / 0.008) * np.exp(-t * 3.2) * 0.55
    # pad / stab: tres osciladores levemente desafinados con filtro suave
    x = sum(np.sin(2*np.pi*f*(1+dt)*t + p) for dt, p in ((0, 0), (0.004, 1), (-0.004, 2))) / 3
    x += 0.2 * np.sin(2*np.pi*f*2*t)
    att = 0.01 if kind == 'stab' else 0.4
    rel = np.exp(-t * (7 if kind == 'stab' else 0.6))
    return x * np.minimum(1, t / att) * rel
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
CH = [[57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 65], [52, 55, 59, 62]]   # Am7 Fmaj7 G7(sus) Em7
BASS = [45, 41, 43, 40]
bars = int(DUR / (4 * beat)) + 1
for b in range(bars):
    t0 = b * 4 * beat; ch = CH[b % 4]; intro = b < 1; outro = t0 > DUR - 4 * beat * 1.0
    for k in range(4):
        tb = t0 + k * beat
        if not intro: both(kick(), tb, 0.9)
        both(hat(True), tb + beat / 2, 0.55 if not intro else 0.3, pan=0.25)
        for s in (0.25, 0.75): both(hat(), tb + s * beat, 0.4, pan=-0.3)
        if k in (1, 3) and not intro: both(clap(), tb, 0.8)
    # bajo sincopado
    if not intro:
        for s, oct_ in ((0.5, 0), (1.5, 0), (2.5, 12), (3.25, 0), (3.5, 0)):
            both(note(hz(BASS[b % 4] + oct_ - 12 + 12), beat * 0.45), t0 + s * beat, 0.8)
    # pad de fondo + stabs
    for m in ch: both(note(hz(m), 4 * beat * 1.05, 'pad'), t0, 0.07)
    for s in (0.75, 2.25, 3.0):
        for i, m in enumerate(ch): both(note(hz(m + 12), 0.3, 'stab'), t0 + s * beat, 0.05, pan=(i - 1.5) * 0.3)
# reverb simple (eco corto) para aire
for buf, d in ((L, 0.083), (R, 0.097)):
    k = int(SR * d); tmp = buf.copy()
    for g in (0.35, 0.18, 0.09): buf[k:] += tmp[:-k] * g; k += int(SR * d)
mix = np.stack([L, R], 1)
fade = np.ones(N); fi, fo = int(SR * 0.3), int(SR * 2.5)
fade[:fi] = np.linspace(0, 1, fi); fade[-fo:] = np.linspace(1, 0, fo)
mix *= fade[:, None]; mix = np.tanh(mix / np.abs(mix).max() * 1.4) * 0.89
os.makedirs('audio', exist_ok=True)
wav.write('audio/musica.wav', SR, (mix * 32767).astype(np.int16)); print('audio/musica.wav', DUR, 's')
