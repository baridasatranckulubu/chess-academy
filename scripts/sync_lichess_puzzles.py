#!/usr/bin/env python3
"""Refresh curated CC0 Lichess puzzles from official database (streaming)."""
import csv,json,os,random,urllib.request
import zstandard as zstd
from collections import defaultdict
from pathlib import Path
URL="https://database.lichess.org/lichess_db_puzzle.csv.zst"
THEMES={t['id'] for g in json.loads((Path(__file__).resolve().parents[1]/'data/lichess-themes.json').read_text())['groups'] for t in g['themes'] if t['id']!='all'}
LIMIT=int(os.environ.get("CHESS_PUZZLES_PER_THEME","2000"))
ROOT=Path(__file__).resolve().parents[1]/"puzzle-data"
ROOT.mkdir(exist_ok=True)
buckets=defaultdict(list)
random.seed(2027)
with urllib.request.urlopen(urllib.request.Request(URL,headers={"User-Agent":"ChessAcademyPuzzleImporter/1.0"}),timeout=180) as response:
    with zstd.ZstdDecompressor().stream_reader(response) as stream:
        import io
        reader=csv.DictReader(io.TextIOWrapper(stream,encoding="utf-8",newline=""))
        seen=defaultdict(int)
        for row in reader:
            themes=set(row["Themes"].split()) & THEMES
            if not themes:continue
            rating=int(row["Rating"])
            if rating<400 or rating>3000:continue
            record=[row["PuzzleId"],row["FEN"],row["Moves"].split(),rating,row["Themes"].split(),row.get("OpeningTags", "").split()]
            if len(record[2])<2:continue
            for theme in themes:
                seen[theme]+=1
                bucket=buckets[theme]
                if len(bucket)<LIMIT:bucket.append(record)
                else:
                    k=random.randrange(seen[theme])
                    if k<LIMIT:bucket[k]=record
unique={p[0]:p for bucket in buckets.values() for p in bucket}
records=list(unique.values())
files=[]
for start in range(0,len(records),1000):
    filename=f"lichess-auto-{start//1000:04d}.json"
    (ROOT/filename).write_text(json.dumps(records[start:start+1000],ensure_ascii=False,separators=(",",":")),encoding="utf-8")
    files.append(filename)
for old in ROOT.glob("lichess-auto-*.json"):
    if old.name not in files:old.unlink()
manifest={"source":"Lichess Open Database (CC0)","source_url":"https://database.lichess.org/#puzzles","count":len(records)+32,"scanned":"Lichess full source stream","shards":["part-beginner.json","part-0000.json"]+files,"schema":["id","fen_before_opponent_move","uci_moves","rating","themes"]}
(ROOT/"manifest.json").write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
print("Imported",len(records),"Lichess puzzles into",len(files),"shards")
