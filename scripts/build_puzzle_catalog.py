#!/usr/bin/env python3
"""Rebuild compact exact availability and shard indexes for all Lichess topics."""
import json,collections
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
TIERS={'all':(400,3000),'easy':(400,1400),'medium':(1200,1900),'hard':(1800,3000)}
def main():
 manifest=json.loads((ROOT/'puzzle-data/manifest.json').read_text());themes={};openings={};seen=set();metadata=json.loads((ROOT/'puzzle-data/opening-tags.json').read_text()) if (ROOT/'puzzle-data/opening-tags.json').exists() else {}
 def add(index,key,p,shard):
  entry=index.setdefault(key,{'counts':dict.fromkeys(TIERS,0),'shards':set()});entry['shards'].add(shard)
  for tier,(a,b) in TIERS.items():
   if a<=p[3]<=b:entry['counts'][tier]+=1
 for shard in manifest['shards']:
  if not shard.startswith('lichess-'):continue
  for p in json.loads((ROOT/'puzzle-data'/shard).read_text()):
   if p[0] in seen:continue
   seen.add(p[0]);add(themes,'all',p,shard)
   for tag in p[4]:add(themes,tag,p,shard)
   for opening in p[5] if len(p)>5 else metadata.get(p[0],[]):
    add(openings,opening,p,shard);openings[opening].setdefault('ids',[]).append(p[0])
 for index in [themes,openings]:
  for entry in index.values():entry['shards']=sorted(entry['shards'])
 # OpeningTags uses family first, then complete family_variation identifiers.
 for key,e in openings.items():
  candidates=[x for x in openings if key.startswith(x+'_')]
  e['family']=min(candidates,key=len) if candidates else key
  e['name']=key.replace('_',' ')
 catalog=json.loads((ROOT/'data/lichess-themes.json').read_text())
 missing=[t['sourceId'] for g in catalog['groups'] for t in g['themes'] if t['id'] not in themes]
 if missing:raise SystemExit('Missing official themes: '+','.join(sorted(set(missing))))
 out={'source':manifest['source_url'],'count':len(seen),'themes':themes,'openings':openings}
 (ROOT/'puzzle-data/topic-index.json').write_text(json.dumps(out,ensure_ascii=False,separators=(',',':'))+'\n')
 print('Catalog:',len(themes),'themes,',len(openings),'opening labels,',len(seen),'puzzles')
if __name__=='__main__':main()
