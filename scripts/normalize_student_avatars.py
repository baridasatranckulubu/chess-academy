"""Build 300 clean, consistent student portraits from the ORIGINAL ZIP.

The final collage block contains characters sliced through neighboring tiles.
Never reuse those damaged tiles: use the first two cleaner blocks and generate
distinct mirrored / colorway variants for the remainder. Pillow only.
"""
from io import BytesIO
from pathlib import Path
from zipfile import ZipFile
from PIL import Image, ImageOps, ImageEnhance

ROOT = Path("assets/avatars")
ARCHIVE = Path("BARIDA_300_Piyon_Avatari.zip")
ROOT.mkdir(parents=True, exist_ok=True)

def base_image(source, source_index):
    im = ImageOps.fit(source.convert("RGB"), (256, 256), method=Image.Resampling.LANCZOS)
    # First collage: square portraits; second: narrow gutters on both sides.
    inset = 7 if source_index < 90 else 13
    return im.crop((inset, 9, 256-inset, 245)).resize((256, 256), Image.Resampling.LANCZOS)

def variation(im, variant):
    if variant % 2:
        im = ImageOps.mirror(im)
    # Each variation uses a different subtle, consistent color grade.
    colors = [(1.08, 1.04, 1.0), (0.94, 1.10, 1.02),
              (1.02, 0.97, 1.12), (1.08, 1.0, 1.09)]
    r,g,b = colors[(variant // 2) % len(colors)]
    red, green, blue = im.split()
    red = red.point(lambda p: min(255, int(p*r)))
    green = green.point(lambda p: min(255, int(p*g)))
    blue = blue.point(lambda p: min(255, int(p*b)))
    return Image.merge("RGB", (red, green, blue))

with ZipFile(ARCHIVE) as archive:
    names = sorted(n for n in archive.namelist()
                   if n.startswith("assets/avatars/piyon-") and n.endswith(".webp"))
    if len(names) != 300:
        raise SystemExit(f"Expected 300 images, found {len(names)}")
    # Source collage 1: indices 0..89 (last row contains clipped tiles).
    # Source collage 2: indices 102..185 (all 84 portraits).
    clean_indices = list(range(90)) + list(range(102, 186))
    clean = []
    for i in clean_indices:
        with Image.open(BytesIO(archive.read(names[i]))) as source:
            clean.append(base_image(source, i))
    for i in range(300):
        if i < len(clean):
            im = clean[i]
        else:
            j = (i - len(clean)) % len(clean)
            variant = 1 + (i - len(clean)) // len(clean)
            im = variation(clean[j], variant)
        im.save(ROOT / f"piyon-{i+1:03d}.webp", "WEBP", quality=92, method=6)
print("Generated 300 full-square pawn portraits from clean source tiles.")
