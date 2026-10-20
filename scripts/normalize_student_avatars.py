"""Repair the 300 original pawn avatar files using Pillow only.

The original ZIP is always the input, so repeated runs do not zoom or
progressively crop images.  Strip likely neighboring collage tiles from edges.
"""
from io import BytesIO
from pathlib import Path
from zipfile import ZipFile
from PIL import Image, ImageFilter, ImageOps
from statistics import median

ROOT = Path("assets/avatars")
ARCHIVE = Path("BARIDA_300_Piyon_Avatari.zip")
if not ARCHIVE.exists():
    raise SystemExit("Missing BARIDA_300_Piyon_Avatari.zip")
ROOT.mkdir(parents=True, exist_ok=True)

def repair(source):
    im = ImageOps.fit(source.convert("RGB"), (256, 256), method=Image.Resampling.LANCZOS)
    # Calculate boundary contrast across each row/column, without NumPy.
    gray = im.convert("L").resize((128, 128))
    p = gray.load()
    vertical = []
    horizontal = []
    for x in range(2, 126):
        vals = [abs(p[x+1,y]-p[x-1,y]) for y in range(15,113,3)]
        vertical.append((x, sorted(vals)[int(len(vals)*.7)]))
    for y in range(2, 126):
        vals = [abs(p[x,y+1]-p[x,y-1]) for x in range(15,113,3)]
        horizontal.append((y, sorted(vals)[int(len(vals)*.7)]))
    def edge(scores, side):
        typical=median(v for _,v in scores)
        candidates=[(v,i) for i,v in scores if (7<=i<=35 if side=='start' else 92<=i<=120)]
        if not candidates:return 0 if side=='start' else 256
        strength,at=max(candidates)
        if strength<max(48,typical*3):
            return 0 if side=='start' else 256
        return min(70,(at+2)*2) if side=='start' else max(186,(at-2)*2)
    left,right=edge(vertical,'start'),edge(vertical,'end')
    top,bottom=edge(horizontal,'start'),edge(horizontal,'end')
    if right-left<186:left,right=0,256
    if bottom-top<186:top,bottom=0,256
    if (left,right,top,bottom)==(0,256,0,256):return im
    center=im.crop((left,top,right,bottom))
    output=Image.new("RGB",(256,256))
    output.paste(center,(left,top))
    if left:
        output.paste(center.crop((0,0,1,center.height)).resize((left,center.height)),(0,top))
    if right<256:
        output.paste(center.crop((center.width-1,0,center.width,center.height)).resize((256-right,center.height)),(right,top))
    if top:
        output.paste(output.crop((0,top,256,top+1)).resize((256,top)),(0,0))
    if bottom<256:
        output.paste(output.crop((0,bottom-1,256,bottom)).resize((256,256-bottom)),(0,bottom))
    return output

with ZipFile(ARCHIVE) as archive:
    names=sorted(n for n in archive.namelist() if n.startswith("assets/avatars/piyon-") and n.endswith(".webp"))
    if len(names)!=300:
        raise SystemExit(f"Expected 300 source portraits; got {len(names)}")
    for name in names:
        with Image.open(BytesIO(archive.read(name))) as source:
            repair(source).save(ROOT/Path(name).name,"WEBP",quality=90,method=6)
print("Successfully rebuilt 300 avatar images.")
