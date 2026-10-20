"""Rebuild the 300 student avatars from the ORIGINAL archive.

Crop collage gutters on all four sides, keeping the pawn's original scale.
The script is idempotent: it always starts from the archived source.
"""
from io import BytesIO
from pathlib import Path
from zipfile import ZipFile
from PIL import Image, ImageFilter, ImageOps
import numpy as np

ROOT = Path("assets/avatars")
ARCHIVE = Path("BARIDA_300_Piyon_Avatari.zip")
if not ARCHIVE.is_file():
    raise SystemExit("Original avatar archive not found; cannot safely repair.")
ROOT.mkdir(parents=True, exist_ok=True)

def fix(source):
    image = ImageOps.fit(source.convert("RGB"), (256, 256), Image.Resampling.LANCZOS)
    a = np.asarray(image, dtype=np.float32)
    h, w = a.shape[:2]
    gray = a @ np.array([.299,.587,.114], dtype=np.float32)
    # Look for unusually strong row/column boundaries separating collage tiles.
    # A boundary is significant only if it extends across much of the image.
    def boundary_scores(axis):
        if axis == 0:
            delta = np.abs(gray[2:,:] - gray[:-2,:])
            return np.quantile(delta, .72, axis=1)
        delta = np.abs(gray[:,2:] - gray[:,:-2])
        return np.quantile(delta, .72, axis=0)
    rows, cols = boundary_scores(0), boundary_scores(1)
    def crop_edge(scores, length, side):
        # Restrict to the outer 28%; never cut through the center of a pawn.
        low = 5 if side == 'start' else int(length*.72)
        high = int(length*.28) if side == 'start' else length-5
        candidates = [(float(scores[i-1]), i) for i in range(low,high)]
        if not candidates:return 0 if side=='start' else length
        strength, pos = max(candidates)
        typical = float(np.median(scores))+1
        if strength < max(36,typical*2.8):return 0 if side=='start' else length
        return pos+2 if side=='start' else pos-2
    left=crop_edge(cols,w,'start')
    right=crop_edge(cols,w,'end')
    top=crop_edge(rows,h,'start')
    bottom=crop_edge(rows,h,'end')
    if right-left < 175: left,right=0,w
    if bottom-top < 175: top,bottom=0,h
    # Preserve size, replace collage fragments with softly extended background.
    if (left,right,top,bottom)==(0,w,0,h):return image
    inner=image.crop((left,top,right,bottom))
    result=Image.new('RGB',(w,h))
    # Extend the nearest valid edge pixel, not another character or black gutter.
    result.paste(inner,(left,top))
    if left:result.paste(inner.crop((0,0,1,inner.height)).resize((left,inner.height)),(0,top))
    if right<w:result.paste(inner.crop((inner.width-1,0,inner.width,inner.height)).resize((w-right,inner.height)),(right,top))
    band=result.crop((0,top,w,top+1))
    if top:result.paste(band.resize((w,top)),(0,0))
    band=result.crop((0,bottom-1,w,bottom))
    if bottom<h:result.paste(band.resize((w,h-bottom)),(0,bottom))
    return result.filter(ImageFilter.GaussianBlur(.35))

with ZipFile(ARCHIVE) as z:
    names=sorted(n for n in z.namelist() if n.startswith('assets/avatars/piyon-') and n.endswith('.webp'))
    if len(names)!=300:raise SystemExit(f'Expected 300 images, got {len(names)}')
    for name in names:
        with Image.open(BytesIO(z.read(name))) as source:
            fix(source).save(ROOT/Path(name).name,'WEBP',quality=90,method=6)
print('Rebuilt 300 source images, trimming detected collage boundaries on four edges.')
