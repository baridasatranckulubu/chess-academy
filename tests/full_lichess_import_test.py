"""Full import retains every source row, including ratings outside UI filters."""
import csv,io,json,sys,tempfile
from pathlib import Path
import zstandard
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from build_full_lichess import build
with tempfile.TemporaryDirectory() as temp:
 root=Path(temp);buf=io.StringIO();writer=csv.writer(buf);writer.writerow(['PuzzleId','FEN','Moves','Rating','Themes','OpeningTags'])
 for pid,rating in [('ab001',100),('ab002',1300),('zz003',3400)]:writer.writerow([pid,'8/8/8/8/8/8/8/K6k w - - 0 1','a1a2 h1h2',rating,'fork short','Italian_Game'])
 source=root/'source.zst';source.write_bytes(zstandard.ZstdCompressor().compress(buf.getvalue().encode()));out=root/'out';assert build(out,source,minimum=3)==3
 m=json.loads((out/'manifest.json').read_text());rows=[p for shard in m['shards'] for p in json.loads((out/shard).read_text())];assert len(rows)==3;assert {p[3] for p in rows}=={100,1300,3400};assert all(p[0][:2] in shard for shard in m['shards'] for p in json.loads((out/shard).read_text()));summary=json.loads((out/'topic-summary.json').read_text());assert summary['count']==3;assert summary['themes']['fork']['counts']['all']==1
 print('PASS complete import, exact counts, ID-addressable shards and topic indexes')
