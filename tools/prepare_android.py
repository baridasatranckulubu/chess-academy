"""The Android shell opens the live website; no second application UI is bundled."""
from pathlib import Path
import shutil,json,os
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'android-web'
config=json.loads((ROOT/'capacitor.config.json').read_text())
assert config['server']['url']=='https://baridasatranc.pages.dev' and config['server']['cleartext'] is False
if OUT.exists():shutil.rmtree(OUT)
OUT.mkdir()
shutil.copy2(ROOT/'native/android/native-offline.html',OUT/'native-offline.html')
(OUT/'index.html').write_text('<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=https://baridasatranc.pages.dev/"><title>Barida Satranç</title></head><body><a href="https://baridasatranc.pages.dev/">Kulübü aç</a></body></html>')
(OUT/'app-build.json').write_text(json.dumps({'revision':os.environ.get('GITHUB_SHA','local'),'mode':'live-site','site':config['server']['url']},separators=(',',':')))
print('Prepared live-site Android shell with local connection recovery')
