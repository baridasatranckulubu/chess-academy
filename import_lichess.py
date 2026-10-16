#!/usr/bin/env python3
"""Stream official Lichess CSV(.zst), validate/dedupe and write up to 100k compact shards.
Requires `zstd` CLI for .zst input; Python standard library otherwise.
Usage: python import_lichess.py lichess_db_puzzle.csv.zst --limit 100000
"""
import argparse,csv,json,subprocess,os,sys,hashlib
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('source');p.add_argument('--limit',type=int,default=100000);p.add_argument('--out',default='puzzle-data');p.add_argument('--min-popularity',type=int,default=75);p.add_argument('--min-plays',type=int,default=100);a=p.parse_args()
if not 1<=a.limit<=1000000:p.error('limit must be between 1 and 1,000,000')
out=Path(a.out);out.mkdir(parents=True,exist_ok=True)
proc=None
if a.source.endswith('.zst'):
 proc=subprocess.Popen(['zstd','-dc','--',a.source],stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,encoding='utf-8',errors='replace');stream=proc.stdout
else:stream=open(a.source,encoding='utf-8',newline='')
seen=set();batch=[];shards=[];scanned=0;accepted=0
try:
 for row in csv.DictReader(stream):
  scanned+=1
  try:
   pid=row['PuzzleId'];fen=row['FEN'];moves=row['Moves'].split();rating=int(row['Rating']);pop=int(row['Popularity']);plays=int(row['NbPlays']);themes=row['Themes'].split()
   if not (4<=len(pid)<=12 and len(fen.split())==6 and len(moves)>=3 and all(len(m) in (4,5) and m[:4][0] in 'abcdefgh' and m[:4][1] in '12345678' and m[:4][2] in 'abcdefgh' and m[:4][3] in '12345678' for m in moves)):continue
   if not (400<=rating<=3000 and pop>=a.min_popularity and plays>=a.min_plays):continue
   key=hashlib.sha1((fen+'|'+ ' '.join(moves)).encode()).digest()
   if key in seen:continue
   seen.add(key)
   batch.append([pid,fen,moves,rating,themes]);accepted+=1
   if len(batch)==1000:
    name=f'part-{len(shards):04d}.json';(out/name).write_text(json.dumps(batch,separators=(',',':')),encoding='utf-8');shards.append(name);batch=[]
   if accepted>=a.limit:break
  except (ValueError,KeyError,TypeError):continue
 if batch:
  name=f'part-{len(shards):04d}.json';(out/name).write_text(json.dumps(batch,separators=(',',':')),encoding='utf-8');shards.append(name)
 manifest={'source':'Lichess Open Database (CC0)','source_url':'https://database.lichess.org/#puzzles','count':accepted,'scanned':scanned,'shards':shards,'schema':['id','fen_before_opponent_move','uci_moves','rating','themes']}
 (out/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
 print(f'Imported {accepted} distinct puzzles from {scanned} records into {len(shards)} shards')
finally:
 stream.close()
 if proc and proc.poll() is None:proc.terminate()
