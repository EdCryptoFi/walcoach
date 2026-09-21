import sys, os, numpy as np
from PIL import Image, ImageFilter
from collections import deque
src, dst = sys.argv[1], sys.argv[2]
THRESH = 28          # "near black" = max(r,g,b) below this
for name in sorted(os.listdir(src)):
    im = Image.open(os.path.join(src, name)).convert("RGB")
    a = np.asarray(im).astype(np.int16)
    dark = (a.max(axis=2) < THRESH)
    h, w = dark.shape
    # flood fill from the frame border over dark pixels: that is the background
    bg = np.zeros_like(dark, dtype=bool)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if dark[y, x] and not bg[y, x]: bg[y, x] = True; q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if dark[y, x] and not bg[y, x]: bg[y, x] = True; q.append((y, x))
    while q:
        y, x = q.popleft()
        for ny, nx in ((y-1, x), (y+1, x), (y, x-1), (y, x+1)):
            if 0 <= ny < h and 0 <= nx < w and dark[ny, nx] and not bg[ny, nx]:
                bg[ny, nx] = True; q.append((ny, nx))
    alpha = Image.fromarray(np.where(bg, 0, 255).astype(np.uint8))
    # soften the edge: erode 1px then blur 1px so compression halo disappears
    alpha = alpha.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
    al = np.asarray(alpha).astype(np.float32) / 255.0
    # un-premultiply edge pixels (they were blended with black in the source)
    rgb = a.astype(np.float32)
    edge = (al > 0.02) & (al < 0.98)
    rgb[edge] = np.clip(rgb[edge] / al[edge][:, None], 0, 255)
    out = np.dstack([rgb.astype(np.uint8), (al * 255).astype(np.uint8)])
    Image.fromarray(out, "RGBA").save(os.path.join(dst, name))
print("done", len(os.listdir(dst)))
