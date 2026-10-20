"""Rebuild all pawn avatars from the original ZIP, removing collage neighbors.

Never zoom portraits: preserve the original subject scale and extend the
background into trimmed edge regions instead of enlarging the subject.
"""
from pathlib import Path
from zipfile import ZipFile
from io import BytesIO
from PIL import Image, ImageFilter, ImageOps
import statistics

ROOT = Path("assets/avatars")
ZIP = Path("BARIDA_300_Piyon_Avatari.zip")
if not ZIP.exists():
    raise SystemExit("Original ZIP missing: refusing to modify avatar images")
ROOT.mkdir(parents=True, exist_ok=True)

def repair(image):
    image = ImageOps.fit(image.convert("RGB"), (256, 256), method=Image.Resampling.LANCZOS)
    w, h = image.size
    # Detect dark vertical gutters in the outer 35% of a collage tile.
    # A dark seam with colorful content beyond it indicates a neighboring tile.
    sample = image.resize((128, 128))
    brightness = []
    for x in range(128):
        vals = []
        for y in range(13, 116, 4):
            r, g, b = sample.getpixel((x, y))
            vals.append((max(r,g,b)+min(r,g,b))/2)
        brightness.append(statistics.median(vals))
    seams = []
    for x in range(7, 121):
        if brightness[x] < 39 and statistics.median(brightness[max(0,x-4):x+5]) < 58:
            seams.append(x)
    # Remove adjacent image strips only if there is a strong internal separator.
    left, right = 0, w
    for x in seams:
        if 12 <= x <= 42 and statistics.mean(brightness[:max(1,x-4)]) > 52 and statistics.mean(brightness[min(127,x+5):min(128,x+22)]) > 52:
            left = max(left, (x+2)*2)
        if 86 <= x <= 116 and statistics.mean(brightness[max(0,x-22):max(1,x-5)]) > 52 and statistics.mean(brightness[min(127,x+5):]) > 52:
            right = min(right, (x-2)*2)
    # Avoid aggressive cropping of normal portraits.
    if right-left < 166:
        left, right = 0, w
    # Build an edge-extended backdrop, then paste the unscaled portrait in place.
    # This prevents black strips and neighboring images without enlarging faces.
    background = image.filter(ImageFilter.GaussianBlur(19))
    if left > 0 or right < w:
        central = image.crop((left, 0, right, h))
        background.paste(central, (left, 0))
        # Blend the immediate boundaries to avoid a hard black line.
        if left:
            edge = central.crop((0,0,1,h)).resize((left,h))
            background.paste(edge.filter(ImageFilter.GaussianBlur(7)),(0,0))
        if right < w:
            edge = central.crop((central.width-1,0,central.width,h)).resize((w-right,h))
            background.paste(edge.filter(ImageFilter.GaussianBlur(7)),(right,0))
    return background

with ZipFile(ZIP) as archive:
    names = sorted(n for n in archive.namelist() if n.startswith("assets/avatars/piyon-") and n.endswith(".webp"))
    if len(names) != 300:
        raise SystemExit(f"Expected 300 original images, got {len(names)}")
    for name in names:
        with Image.open(BytesIO(archive.read(name))) as original:
            repair(original).save(ROOT / Path(name).name, "WEBP", quality=90, method=6)
print("Rebuilt 300 portraits from originals, preserving subject size and correcting edge gutters.")
