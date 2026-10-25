"""Bundle only public application files; never ship SQL, workflows or credentials."""
from pathlib import Path
import shutil
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'android-web'
if OUT.exists():shutil.rmtree(OUT)
OUT.mkdir()
for p in ROOT.iterdir():
 if p.is_file() and p.suffix in {'.html','.css','.js','.webp','.png','.ico','.svg'}:shutil.copy2(p,OUT/p.name)
for name in ['assets','data','puzzle-data','engines','i18n']:shutil.copytree(ROOT/name,OUT/name)
sdk=ROOT/'node_modules/@supabase/supabase-js/dist/umd/supabase.js'
if not sdk.is_file():raise SystemExit('Pinned Supabase browser SDK missing; run npm ci')
(OUT/'assets/vendor').mkdir(exist_ok=True);shutil.copy2(sdk,OUT/'assets/vendor/supabase-2.57.0.js')
p=OUT/'academy.html';p.write_text(p.read_text().replace('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.0/dist/umd/supabase.min.js','assets/vendor/supabase-2.57.0.js'))
# Every bundled board can use the same locally installed native plugin bridge.
assert (OUT/'index.html').is_file() and (OUT/'academy.html').is_file()
assert not list(OUT.rglob('*.sql'))
print('Prepared bundled Android UI:',len(list(OUT.rglob('*'))),'entries')

# The large archive is fetched selectively from the working public mirror.
p=OUT/'assignment-bank.js'
p.write_text(p.read_text().replace('const r=await fetch(url);',"const r=await fetch(url.startsWith('puzzle-full/')?'https://baridasatranckulubu.github.io/chess-academy/'+url:url);"))


# Public landing opens first. Native enhancements remain native-only.
p=OUT/'index.html';p.write_text(p.read_text().replace('</head>','<link rel="stylesheet" href="mobile.css"><script defer src="mobile.js"></script></head>'))
# Asset hashes make every bundled UI file traceable to the same source revision.
import hashlib,json,os
manifest={"revision":os.environ.get("GITHUB_SHA","local"),"files":{str(p.relative_to(OUT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in OUT.rglob('*') if p.is_file() and p.suffix in {'.js','.css','.html'}}}
(OUT/'app-build.json').write_text(json.dumps(manifest,separators=(',',':')))
