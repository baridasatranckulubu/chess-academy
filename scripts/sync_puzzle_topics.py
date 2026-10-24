#!/usr/bin/env python3
"""Sync only player-visible categories from Lichess's authoritative taxonomy."""
import json,re,urllib.request,xml.etree.ElementTree as ET,datetime
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SCALA='https://raw.githubusercontent.com/lichess-org/lila/master/modules/puzzle/src/main/PuzzleTheme.scala'
TR='https://raw.githubusercontent.com/lichess-org/lila/master/translation/dest/puzzleTheme/tr-TR.xml'
def main():
 current=json.loads((ROOT/'data/lichess-themes.json').read_text());existing={t['sourceId']:t['name'] for g in current['groups'] for t in g['themes']};names={g['id']:g['name'] for g in current['groups']}
 source=urllib.request.urlopen(SCALA,timeout=30).read().decode();source=source[source.index('val categorized'):source.index('val visible:')]
 labels={e.attrib['name']:e.text for e in ET.fromstring(urllib.request.urlopen(TR,timeout=30).read())};groups=[]
 for group,body in re.findall(r'I18nKey\.puzzle\.(\w+)\s*->\s*List\(([\s\S]*?)\n    \)',source):
  ids=[x.strip() for x in body.split(',') if x.strip()]
  groups.append({'id':group,'name':names.get(group,group),'themes':[{'id':'all' if k=='mix' else k,'sourceId':k,'name':existing.get(k,labels.get(k,k))} for k in ids]})
 if len(groups)<10:raise SystemExit('Unexpected upstream taxonomy; no files changed')
 current['groups']=groups;current['checkedAt']=datetime.date.today().isoformat()
 (ROOT/'data/lichess-themes.json').write_text(json.dumps(current,ensure_ascii=False,indent=2)+'\n')
 snapshot={'source':SCALA,'keys':sorted({t['sourceId'] for g in groups for t in g['themes']})}
 (ROOT/'tests/fixtures/lichess-visible-themes.json').write_text(json.dumps(snapshot,ensure_ascii=False,indent=2)+'\n')
 print('Synchronized',len(snapshot['keys']),'visible themes')
if __name__=='__main__':main()
