"""Re-creates public/audio/madinah-{full,short}.ogg from the Commons original.

Source: https://commons.wikimedia.org/wiki/File:33937_ejaz215_call-to-prayer-from-the-prophet-s-mo.ogg
(ejaz215 via Freesound, CC BY 3.0). Needs numpy + soundfile (libsndfile >= 1.1 for Opus).
Usage: python scripts/encode-azan.py <original.ogg> public/audio 0.8
The short version is cut inside the pause after the opening takbir (~34 s).
"""
import sys, numpy as np, soundfile as sf
src, outdir = sys.argv[1], sys.argv[2]
x, sr = sf.read(src, always_2d=True)
print('src', sr, x.shape, x.shape[0]/sr)
m = x.mean(axis=1)
# trim leading/trailing near-silence
env = np.abs(m)
thr = 10**(-50/20)
idx = np.where(env > thr)[0]
a, b = max(0, idx[0]-int(0.05*sr)), min(len(m), idx[-1]+int(0.3*sr))
m = m[a:b]
peak = np.max(np.abs(m)); m = m / peak * 10**(-1/20)   # normalize to -1 dBFS
def up(y):
    t = np.arange(int(len(y)*48000/sr))*sr/48000
    return np.interp(t, np.arange(len(y)), y)
def fade(y, fin=0.05, fout=1.0):
    y = y.copy(); n=int(fin*sr); y[:n]*=np.linspace(0,1,n); n=int(fout*sr); y[-n:]*=np.linspace(1,0,n); return y
full = fade(m, fout=0.5)
# short: cut inside the pause 33.7-38.4s (times relative to original start)
cut = int((35.0 - a/sr)*sr)
short = fade(m[:cut], fout=1.0)
for name, y in (('madinah-full', full), ('madinah-short', short)):
    p = f'{outdir}/{name}.ogg'
    sf.write(p, up(y).astype(np.float32), 48000, format='OGG', subtype='OPUS', compression_level=float(sys.argv[3]))
    print(name, len(y)/sr, 's')
