"""Reframe existing student avatar assets to remove neighboring collage tiles."""
from pathlib import Path
from PIL import Image, ImageOps

directory = Path("assets/avatars")
paths = sorted(directory.glob("piyon-???.webp"))
if len(paths) != 300:
    raise RuntimeError(f"Expected 300 avatar files, found {len(paths)}")

for path in paths:
    with Image.open(path) as source:
        image = source.convert("RGB")
        width, height = image.size
        # The original collage tiles have neighboring characters near the edges.
        # Keep the full original width and center it, without side cropping.
        edge = 0
        centered = image.crop((edge, 0, width - edge, height))
        framed = ImageOps.fit(centered, (256, 256), method=Image.Resampling.LANCZOS, centering=(0.5, 0.5))
        framed.save(path, "WEBP", quality=91, method=6)

print(f"Recentered and saved {len(paths)} WebP pawn portraits")
