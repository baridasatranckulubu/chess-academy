#!/usr/bin/env python3
"""Import high-confidence CC0 Lichess puzzles, preserving existing shard IDs.
Usage: python scripts/expand_puzzle_bank.py lichess_db_puzzle.csv.zst
Requires: pip install zstandard
"""
import csv, io, json, pathlib, sys, collections
ROOT=pathlib.Path(__file__).resolve().parents[1]/'puzzle-data'
TARGET=100_000
def main(source):
    import zstandard as zstd
    manifest_path=ROOT/'manifest.json'
    manifest=json.loads(manifest_path.read_text(encoding='utf-8'))
    seen=set()
    for name in manifest['shards']:
        for row in json.loads((ROOT/name).read_text(encoding='utf-8')):
            seen.add(row[0])
    print('Existing unique IDs:',len(seen))
    needed=max(0,TARGET-len(seen))
    if not needed:
        print('Target already met');return
    selected=[];buckets=collections.Counter()
    with open(source,'rb') as fh:
        with zstd.ZstdDecompressor().stream_reader(fh) as reader:
            rows=csv.DictReader(io.TextIOWrapper(reader,encoding='utf-8',newline=''))
            for row in rows:
                if len(selected)>=needed:break
                try:
                    pid=row['PuzzleId'];rating=int(row['Rating']);dev=int(row['RatingDeviation']);plays=int(row['NbPlays']);pop=int(row['Popularity'])
                    moves=row['Moves'].split();themes=row['Themes'].split()
                    if pid in seen or not 450<=rating<=2600 or dev>95 or plays<150 or pop<75 or len(moves)<2 or not themes:continue
                    if not all(len(m) in (4,5) and m[:4].isalnum() for m in moves):continue
                    group='mate' if any(t.startswith('mate') for t in themes) else 'other'
                    tier='beginner' if rating<1200 else 'intermediate' if rating<1800 else 'advanced'
                    bucket=group+'-'+tier
                    # Balance checkmate practice with general tactical training.
                    cap=needed//6+needed%6
                    if buckets[bucket]>=cap:continue
                    selected.append([pid,row['FEN'],' '.join(moves),rating,themes])
                    buckets[bucket]+=1;seen.add(pid)
                except (KeyError,ValueError):continue
    if len(selected)<needed:raise SystemExit(f'Only {len(selected)} qualified new puzzles; required {needed}. No files changed.')
    names=[]
    for offset in range(0,len(selected),1000):
        name=f'barida-quality-{offset//1000:04d}.json'
        (ROOT/name).write_text(json.dumps(selected[offset:offset+1000],ensure_ascii=False,separators=(',',':')),encoding='utf-8')
        names.append(name)
    manifest['shards']=[x for x in manifest['shards'] if not x.startswith('barida-quality-')]+names
    manifest['count']=len(seen)
    manifest['selection']='rating 450-2600; rating deviation <=95; >=150 plays; popularity >=75; unique IDs; mate/tactical difficulty balancing'
    manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('Imported',len(selected),'total',manifest['count'],'buckets',dict(buckets))
if __name__=='__main__':
    if len(sys.argv)!=2:raise SystemExit('Provide the official Lichess puzzle .csv.zst archive path')
    main(sys.argv[1])
