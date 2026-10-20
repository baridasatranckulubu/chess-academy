"""Uniform, reproducible 300-avatar crop from the original source archive.

Use the same centered square for every portrait. This removes collage
neighbors at the outer edges and the dark strip below some tiles.
"""
from io import BytesIO
from pathlib import Path
from zipfile import ZipFile
from PIL import Image, ImageOps

ROOT = Path("assets/avatars")
ARCHIVE = Path("BARIDA_300_Piyon_Avatari.zip")
ROOT.mkdir(parents=True, exist_ok=True)

def repair(source):
    image = ImageOps.fit(source.convert("RGB"), (256, 256), method=Image.Resampling.LANCZOS)
    # Identical 184 x 184 central crop on every source portrait.
    # Trim slightly more at the bottom to hide the original grid separator.
    return image.crop((36, 30, 220, 214)).resize(
        (256, 256), resample=Image.Resampling.LANCZOS
    )

with ZipFile(ARCHIVE) as archive:
    names = sorted(
        n for n in archive.namelist()
        if n.startswith("assets/avatars/piyon-") and n.endswith(".webp")
    )
    if len(names) != 300:
        raise SystemExit(f"Expected 300 avatars, found {len(names)}")
    for name in names:
        with Image.open(BytesIO(archive.read(name))) as source:
            repair(source).save(ROOT / Path(name).name, "WEBP", quality=92, method=6)
print("Rebuilt 300 avatars with identical centered square crops.")
