#!/usr/bin/env python3
"""Stream EVERY official CC0 puzzle into bounded, indexed static shards.
No rating/theme/popularity sampling. Dataset stays out of Git and the browser heap.
Run: python scripts/build_full_lichess.py --out /tmp/barida-full
"""
import argparse,collections,csv,gzip,hashlib,io,json,re,time,urllib.request
from pathlib import Path
import zstandard
URL='https://database.lichess.org/lichess_db_puzzle.csv.zst'
TIERS={'all':(400,3000),'easy':(400,1400),'medium':(1200,1900),'hard':(1800,3000)}
def write(path,value):
 path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(value,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
def build(out,source=None,minimum=6_000_000,compress=False):
 out=Path(out);out.mkdir(parents=True,exist_ok=True);parts=out/'full';parts.mkdir(exist_ok=True)
 indexes={'themes':{},'openings':{}};handles=collections.OrderedDict();count=0;started=time.monotonic()
 def add(kind,key,shard,rating):
  e=indexes[kind].setdefault(key,{'counts':dict.fromkeys(TIERS,0),'shards':{}})
  for tier,(lo,hi) in TIERS.items():
   if lo<=rating<=hi:e['counts'][tier]+=1
  buckets=e['shards'].setdefault(shard,collections.Counter());buckets[rating//200]+=1
 response=open(source,'rb') if source else urllib.request.urlopen(urllib.request.Request(URL,headers={'User-Agent':'BaridaChessFullArchive/1.0'}),timeout=180)
 with response:
  with zstandard.ZstdDecompressor().stream_reader(response) as stream:
   for row in csv.DictReader(io.TextIOWrapper(stream,encoding='utf-8',newline='')):
    pid=row['PuzzleId'];assert re.fullmatch(r'[A-Za-z0-9]{5}',pid),pid
    moves=row['Moves'].split();assert len(moves)>=2,pid
    rating=int(row['Rating']);tags=row['Themes'].split();openings=row.get('OpeningTags','').split();record=[pid,row['FEN'],moves,rating,tags,openings]
    shard='full/'+pid[:2]+('.json.gz' if compress else '.json');name=parts/(pid[:2]+'.jsonl')
    if name not in handles:
     if len(handles)>=32:handles.popitem(last=False)[1].close()
     handles[name]=name.open('a',encoding='utf-8')
    handles.move_to_end(name);handles[name].write(json.dumps(record,separators=(',',':'))+'\n')
    add('themes','all',shard,rating)
    for key in tags:add('themes',key,shard,rating)
    for key in openings:add('openings',key,shard,rating)
    count+=1
    if count%500000==0:print('Imported',count,'rows;',round(time.monotonic()-started),'seconds',flush=True)
 for f in handles.values():f.close()
 assert count>=minimum,f'Incomplete source: {count} < {minimum}'
 shards=[]
 for name in sorted(parts.glob('*.jsonl')):
  target=name.with_suffix('.json')
  # Keep peak memory to one ~1600-row shard.
  rows=[json.loads(s) for s in name.read_text().splitlines()];write(target,rows);name.unlink()
  if compress:
   packed=target.with_suffix('.json.gz');packed.write_bytes(gzip.compress(target.read_bytes(),compresslevel=6,mtime=0));target.unlink();target=packed
  shards.append('full/'+target.name)
 summary={'source':URL,'count':count,'themes':{},'openings':{}}
 for kind,index in indexes.items():
  for key,entry in index.items():
   file='topics/'+kind+'-'+hashlib.sha256(key.encode()).hexdigest()[:16]+'.json'
   entries=[[name,sorted(buckets.items())] for name,buckets in entry['shards'].items()]
   write(out/file,{'shards':entries})
   item={'counts':entry['counts'],'file':file}
   if kind=='openings':
    candidates=[x for x in index if key.startswith(x+'_')];item['family']=min(candidates,key=len) if candidates else key;item['name']=key.replace('_',' ')
   summary[kind][key]=item
 write(out/'topic-summary.json',summary)
 write(out/'manifest.json',{'source':'Lichess Open Database (CC0)','source_url':URL,'count':count,'complete':True,'idPrefixLength':2,'shardSuffix':'.json.gz' if compress else '.json','summary':'topic-summary.json','shards':shards,'built_at':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime())})
 size=sum(p.stat().st_size for p in out.rglob('*') if p.is_file());print('COMPLETE:',count,'puzzles;',len(shards),'shards;',size,'bytes',flush=True)
 return count
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--out',required=True);p.add_argument('--source');p.add_argument('--minimum',type=int,default=6_000_000);p.add_argument('--gzip',action='store_true');a=p.parse_args();build(a.out,a.source,a.minimum,a.gzip)
