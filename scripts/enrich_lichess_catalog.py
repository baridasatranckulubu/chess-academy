#!/usr/bin/env python3
"""Enrich the existing CC0 bank with official opening tags and balanced rare themes.
Existing IDs and source solutions are preserved; supplemental questions are real
rows from the official export. Writes occur only after the complete source scan.
"""
import csv,io,json,collections,urllib.request,time
from pathlib import Path
import zstandard
ROOT=Path(__file__).resolve().parents[1]/'puzzle-data'
URL='https://database.lichess.org/lichess_db_puzzle.csv.zst'
def tiers(r):
 return [k for k,a,b in [('easy',400,1400),('medium',1200,1900),('hard',1800,3000)] if a<=r<=b]
def main():
 manifest=json.loads((ROOT/'manifest.json').read_text());old={};counts=collections.Counter();openings=collections.Counter();extra={}
 for name in manifest['shards']:
  if name.startswith(('part-','lichess-catalog-')):continue
  for p in json.loads((ROOT/name).read_text()):
   old[p[0]]=p
   for tag in p[4]:
    for tier in tiers(p[3]):counts[tag,tier]+=1
 start=time.monotonic();scanned=0;matched=0
 req=urllib.request.Request(URL,headers={'User-Agent':'BaridaChessPuzzleCatalog/1.0'})
 with urllib.request.urlopen(req,timeout=60) as response:
  with zstandard.ZstdDecompressor().stream_reader(response) as stream:
   for row in csv.DictReader(io.TextIOWrapper(stream,encoding='utf-8',newline='')):
    scanned+=1;pid=row['PuzzleId'];rating=int(row['Rating'])
    if not 400<=rating<=3000:continue
    tags=row['Themes'].split();opening_tags=row.get('OpeningTags','').split()
    if pid in old:
     p=old[pid];p[:5]=[pid,row['FEN'],row['Moves'].split(),rating,tags];p[5:]=[opening_tags];matched+=1
     openings.update(opening_tags)
    elif pid not in extra and (any(counts[t,tier]<50 for t in tags for tier in tiers(rating)) or any(openings[o]<20 for o in opening_tags)):
     p=[pid,row['FEN'],row['Moves'].split(),rating,tags,opening_tags]
     if len(p[2])<2:continue
     extra[pid]=p;openings.update(opening_tags)
     for t in tags:
      for tier in tiers(rating):counts[t,tier]+=1
    if scanned%500000==0:print('Scanned',scanned,'matched',matched,'extra',len(extra),'openings',len(openings),'seconds',round(time.monotonic()-start),flush=True)
 # Re-count against the complete existing bank, then keep only necessary extras.
 metadata={p[0]:p[5] for p in old.values() if len(p)>5 and p[5]}
 counts=collections.Counter();openings=collections.Counter();selected=[]
 for p in old.values():
  openings.update(p[5] if len(p)>5 else [])
  for tag in p[4]:
   for tier in tiers(p[3]):counts[tag,tier]+=1
 for p in extra.values():
  if any(counts[t,tier]<50 for t in p[4] for tier in tiers(p[3])) or any(openings[o]<5 for o in p[5]):
   selected.append(p);openings.update(p[5])
   for tag in p[4]:
    for tier in tiers(p[3]):counts[tag,tier]+=1
 names=[]
 for i in range(0,len(selected),1000):
  name=f'lichess-catalog-{i//1000:04d}.json';(ROOT/name).write_text(json.dumps(selected[i:i+1000],separators=(',',':'),ensure_ascii=False));names.append(name)
 for path in ROOT.glob('lichess-catalog-*.json'):
  if path.name not in names:path.unlink()
 (ROOT/'opening-tags.json').write_text(json.dumps(metadata,ensure_ascii=False,separators=(',',':'))+'\n')
 manifest['shards']=[n for n in manifest['shards'] if not n.startswith('lichess-catalog-')]+names
 manifest['opening_metadata']='opening-tags.json'
 manifest['schema']=['id','fen_before_opponent_move','uci_moves','rating','themes','opening_tags'];manifest['catalog_source']=URL;manifest['catalog_rows_scanned']=scanned;manifest['count']=sum(len(json.loads((ROOT/n).read_text())) for n in manifest['shards'])
 (ROOT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
 print('DONE',scanned,'rows,',matched,'enriched,',len(extra),'added,',len(openings),'opening labels',flush=True)
if __name__=='__main__':main()
