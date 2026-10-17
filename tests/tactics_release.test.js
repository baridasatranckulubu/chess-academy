'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const {ChessEngine}=require('../engine.js');
const manifest=JSON.parse(fs.readFileSync('puzzle-data/manifest.json','utf8'));
assert(Array.isArray(manifest.shards)&&manifest.shards.length>0);
const ids=new Set();let count=0,beginner=0;
for(const shard of manifest.shards){
 const rows=JSON.parse(fs.readFileSync('puzzle-data/'+shard,'utf8'));
 assert(Array.isArray(rows));
 for(const p of rows){
  assert(Array.isArray(p)&&p.length===5&&Array.isArray(p[2])&&p[2].length>=2);
  assert(!ids.has(p[0]),'duplicate '+p[0]);ids.add(p[0]);
  const e=new ChessEngine(p[1]);
  for(const u of p[2])assert(e.move(u.slice(0,2),u.slice(2,4),u[4]||'q'),'illegal '+p[0]+' '+u);
  if(p[0].startsWith('CA-MATE-')){assert(e.isCheckmate(),'not mate '+p[0]);assert(p[3]<=950,'not beginner '+p[0]);beginner++}
  count++;
 }
}
assert.equal(count,manifest.count);assert.equal(beginner,28);
const js=fs.readFileSync('puzzles.js','utf8');
assert(!js.includes('return next()'),'unbounded puzzle recursion');
assert(js.includes('replyToken!==token'),'stale reply guard missing');
assert(js.includes('chess-academy-tactics-v1:'),'student tactic record missing');
assert(fs.readFileSync('academy.js','utf8').includes("searchParams.set('student'"));
console.log('PASS '+count+' legal tactical lines, '+beginner+' beginner mates, filtering, race guard, student bridge');
